-- Migration: Fix Goal Achieved Status and Milestone Trigger on Withdrawal
-- Memperbaiki sinkronisasi status goal: jika saldo ditarik hingga di bawah target,
-- status goal otomatis kembali ke 'active' dan achieved_at di-reset ke NULL.
-- Tanggal: 2026-09-16

CREATE OR REPLACE FUNCTION public.sync_goal_balance()
RETURNS TRIGGER AS $$
DECLARE
    target_goal_id UUID;
    total_balance NUMERIC(15, 2);
    g_target NUMERIC(15, 2);
    g_status goal_status;
    g_achieved_at TIMESTAMPTZ;
    g_name TEXT;
    g_group_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_goal_id := OLD.goal_id;
    ELSE
        target_goal_id := NEW.goal_id;
    END IF;

    -- Hitung Saldo: SUM(deposit) - SUM(withdrawal)
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'deposit' THEN amount 
            WHEN type = 'withdrawal' THEN -amount 
            ELSE 0 
        END
    ), 0.00)
    INTO total_balance
    FROM public.transactions
    WHERE goal_id = target_goal_id;

    -- Validasi Tidak Boleh Negatif (BR-009)
    IF total_balance < 0 THEN
        RAISE EXCEPTION 'Saldo tidak mencukupi untuk penarikan ini. Saldo akhir tidak boleh negatif.';
    END IF;

    -- Ambil Data Goal
    SELECT target_amount, status, achieved_at, name, group_id
    INTO g_target, g_status, g_achieved_at, g_name, g_group_id
    FROM public.goals
    WHERE id = target_goal_id;

    -- 1. Evaluasi Status & Milestone Capaian
    IF total_balance >= g_target AND g_target > 0 THEN
        IF g_achieved_at IS NULL OR g_status <> 'achieved' THEN
            UPDATE public.goals
            SET current_amount = total_balance,
                status = 'achieved',
                achieved_at = NOW(),
                updated_at = NOW()
            WHERE id = target_goal_id;

            -- Notifikasi ke seluruh anggota grup
            INSERT INTO public.notifications (user_id, title, message, type, link)
            SELECT gm.user_id,
                   'Target Tercapai! 🎉',
                   'Goal "' || g_name || '" telah berhasil mencapai target 100%!',
                   'goal_reached',
                   '/groups/' || g_group_id || '/goals/' || target_goal_id
            FROM public.group_members gm
            WHERE gm.group_id = g_group_id;
        ELSE
            UPDATE public.goals
            SET current_amount = total_balance,
                updated_at = NOW()
            WHERE id = target_goal_id;
        END IF;
    ELSE
        -- Saldo berada di bawah target (misal karena penarikan dana)
        -- Revert status ke 'active' dan bersihkan achieved_at jika sebelumnya tercapai
        IF g_status = 'achieved' OR g_achieved_at IS NOT NULL THEN
            UPDATE public.goals
            SET current_amount = total_balance,
                status = 'active',
                achieved_at = NULL,
                updated_at = NOW()
            WHERE id = target_goal_id;
        ELSE
            -- Update saldo reguler
            UPDATE public.goals
            SET current_amount = total_balance,
                updated_at = NOW()
            WHERE id = target_goal_id;
        END IF;
    END IF;

    -- 2. Jika terjadi perpindahan goal (Reallocate pada transaksi UPDATE)
    IF TG_OP = 'UPDATE' AND OLD.goal_id IS DISTINCT FROM NEW.goal_id AND OLD.goal_id IS NOT NULL THEN
        SELECT COALESCE(SUM(
            CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END
        ), 0.00)
        INTO total_balance
        FROM public.transactions
        WHERE goal_id = OLD.goal_id;

        SELECT target_amount, status, achieved_at
        INTO g_target, g_status, g_achieved_at
        FROM public.goals
        WHERE id = OLD.goal_id;

        IF total_balance >= g_target AND g_target > 0 THEN
            IF g_achieved_at IS NULL OR g_status <> 'achieved' THEN
                UPDATE public.goals
                SET current_amount = total_balance,
                    status = 'achieved',
                    achieved_at = NOW(),
                    updated_at = NOW()
                WHERE id = OLD.goal_id;
            ELSE
                UPDATE public.goals
                SET current_amount = total_balance,
                    updated_at = NOW()
                WHERE id = OLD.goal_id;
            END IF;
        ELSE
            IF g_status = 'achieved' OR g_achieved_at IS NOT NULL THEN
                UPDATE public.goals
                SET current_amount = total_balance,
                    status = 'active',
                    achieved_at = NULL,
                    updated_at = NOW()
                WHERE id = OLD.goal_id;
            ELSE
                UPDATE public.goals
                SET current_amount = total_balance,
                    updated_at = NOW()
                WHERE id = OLD.goal_id;
            END IF;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill data yang sudah ada:
-- Jika ada goal dengan saldo current_amount < target_amount namun status masih 'achieved',
-- kembalikan ke status 'active' dan NULL-kan achieved_at.
UPDATE public.goals
SET status = 'active',
    achieved_at = NULL,
    updated_at = NOW()
WHERE (current_amount < target_amount OR target_amount <= 0)
  AND status = 'achieved';
