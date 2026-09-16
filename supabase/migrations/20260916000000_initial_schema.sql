-- ============================================================================
-- NABUNGIN INITIAL DATABASE SCHEMA MIGRATION
-- Versi: 1.0.0
-- Database: PostgreSQL 15 (Supabase)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE group_type AS ENUM ('personal', 'shared');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('owner', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE goal_status AS ENUM ('active', 'achieved', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES DEFINITIONS

-- PROFILES (Terhubung langsung ke auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GROUPS (Wadah Tabungan / Workspace)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    type group_type NOT NULL DEFAULT 'personal',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GROUP MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);

-- GROUP INVITES (Sistem Undangan Berbasis Token)
CREATE TABLE IF NOT EXISTS public.group_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    max_uses INT NOT NULL DEFAULT 1 CHECK (max_uses > 0),
    used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CATEGORIES (Scoped per group)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    icon TEXT DEFAULT 'tag',
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_group_category UNIQUE (group_id, name)
);

-- GOALS (Target Finansial)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    deadline DATE,
    status goal_status NOT NULL DEFAULT 'active',
    achieved_at TIMESTAMPTZ,
    icon TEXT DEFAULT 'target',
    color TEXT DEFAULT '#10B981',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TRANSACTIONS (Mutasi Finansial)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Audit preserved
    type transaction_type NOT NULL DEFAULT 'deposit',
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ACTIVITY LOGS (Lini Masa Aktivitas)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS (In-App Lonceng)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_group_member(lookup_group_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = lookup_group_id AND user_id = lookup_user_id
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_group_owner(lookup_group_id UUID, lookup_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.group_members
        WHERE group_id = lookup_group_id AND user_id = lookup_user_id AND role = 'owner'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- 5. BUSINESS LOGIC & TRIGGERS
-- ============================================================================

-- Trigger Auto-Setup User Baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_group_id UUID;
    user_name TEXT;
BEGIN
    user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    
    -- 1. Buat Record Profil
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (new.id, user_name, new.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Buat Default Personal Group
    INSERT INTO public.groups (name, description, type, created_by)
    VALUES ('Tabungan Pribadi', 'Ruang tabungan personal utama', 'personal', new.id)
    RETURNING id INTO new_group_id;

    -- 3. Daftarkan sebagai Owner
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (new_group_id, new.id, 'owner');

    -- 4. Kategori Bawaan untuk Personal Group
    INSERT INTO public.categories (group_id, name, icon, color) VALUES
    (new_group_id, 'Alokasi Bulanan', 'wallet', '#3B82F6'),
    (new_group_id, 'Bonus & THR', 'gift', '#10B981'),
    (new_group_id, 'Sisa Belanja', 'piggy-bank', '#F59E0B');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger Sinkronisasi Saldo Goal & Cek Milestone
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

    -- Cek Milestone Pencapaian (BR-005)
    IF total_balance >= g_target AND g_achieved_at IS NULL THEN
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
        -- Update Saldo Reguler
        UPDATE public.goals
        SET current_amount = total_balance,
            updated_at = NOW()
        WHERE id = target_goal_id;
    END IF;

    -- Jika terjadi perpindahan goal (Reallocate)
    IF TG_OP = 'UPDATE' AND OLD.goal_id <> NEW.goal_id THEN
        SELECT COALESCE(SUM(
            CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END
        ), 0.00)
        INTO total_balance
        FROM public.transactions
        WHERE goal_id = OLD.goal_id;

        UPDATE public.goals
        SET current_amount = total_balance,
            updated_at = NOW()
        WHERE id = OLD.goal_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_after_transaction_mutation ON public.transactions;
CREATE TRIGGER trg_after_transaction_mutation
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.sync_goal_balance();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
    ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- GROUPS
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
    ON public.groups FOR SELECT TO authenticated
    USING (public.is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
CREATE POLICY "Users can create groups"
    ON public.groups FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Owners can update their groups" ON public.groups;
CREATE POLICY "Owners can update their groups"
    ON public.groups FOR UPDATE TO authenticated
    USING (public.is_group_owner(id, auth.uid()));

DROP POLICY IF EXISTS "Owners can delete their groups" ON public.groups;
CREATE POLICY "Owners can delete their groups"
    ON public.groups FOR DELETE TO authenticated
    USING (public.is_group_owner(id, auth.uid()));

-- GROUP MEMBERS
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;
CREATE POLICY "Members can view group membership"
    ON public.group_members FOR SELECT TO authenticated
    USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Owners or self can manage membership" ON public.group_members;
CREATE POLICY "Owners or self can manage membership"
    ON public.group_members FOR INSERT TO authenticated
    WITH CHECK (public.is_group_owner(group_id, auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can remove members or self leave" ON public.group_members;
CREATE POLICY "Owners can remove members or self leave"
    ON public.group_members FOR DELETE TO authenticated
    USING (public.is_group_owner(group_id, auth.uid()) OR auth.uid() = user_id);

-- GROUP INVITES
DROP POLICY IF EXISTS "Members can view group invites" ON public.group_invites;
CREATE POLICY "Members can view group invites"
    ON public.group_invites FOR SELECT TO authenticated
    USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can create invites" ON public.group_invites;
CREATE POLICY "Owners can create invites"
    ON public.group_invites FOR INSERT TO authenticated
    WITH CHECK (public.is_group_owner(group_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can modify invites" ON public.group_invites;
CREATE POLICY "Owners can modify invites"
    ON public.group_invites FOR UPDATE TO authenticated
    USING (public.is_group_owner(group_id, auth.uid()));

-- CATEGORIES
DROP POLICY IF EXISTS "Members can view group categories" ON public.categories;
CREATE POLICY "Members can view group categories"
    ON public.categories FOR SELECT TO authenticated
    USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can insert categories" ON public.categories;
CREATE POLICY "Members can insert categories"
    ON public.categories FOR INSERT TO authenticated
    WITH CHECK (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Owners can update categories" ON public.categories;
CREATE POLICY "Owners can update categories"
    ON public.categories FOR UPDATE TO authenticated
    USING (public.is_group_owner(group_id, auth.uid()));

-- GOALS
DROP POLICY IF EXISTS "Members can view group goals" ON public.goals;
CREATE POLICY "Members can view group goals"
    ON public.goals FOR SELECT TO authenticated
    USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can insert goals" ON public.goals;
CREATE POLICY "Members can insert goals"
    ON public.goals FOR INSERT TO authenticated
    WITH CHECK (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can update goals" ON public.goals;
CREATE POLICY "Members can update goals"
    ON public.goals FOR UPDATE TO authenticated
    USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Owners or creators can delete goals" ON public.goals;
CREATE POLICY "Owners or creators can delete goals"
    ON public.goals FOR DELETE TO authenticated
    USING (public.is_group_owner(group_id, auth.uid()) OR auth.uid() = created_by);

-- TRANSACTIONS
DROP POLICY IF EXISTS "Members can view transactions" ON public.transactions;
CREATE POLICY "Members can view transactions"
    ON public.transactions FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = transactions.goal_id
            AND public.is_group_member(g.group_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Members can insert transactions" ON public.transactions;
CREATE POLICY "Members can insert transactions"
    ON public.transactions FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = transactions.goal_id
            AND public.is_group_member(g.group_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Owners or creators can update transactions" ON public.transactions;
CREATE POLICY "Owners or creators can update transactions"
    ON public.transactions FOR UPDATE TO authenticated
    USING (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = transactions.goal_id
            AND public.is_group_owner(g.group_id, auth.uid())
        )
    );

DROP POLICY IF EXISTS "Owners or creators can delete transactions" ON public.transactions;
CREATE POLICY "Owners or creators can delete transactions"
    ON public.transactions FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id OR EXISTS (
            SELECT 1 FROM public.goals g
            WHERE g.id = transactions.goal_id
            AND public.is_group_owner(g.group_id, auth.uid())
        )
    );

-- ACTIVITY LOGS
DROP POLICY IF EXISTS "Members can view activity logs" ON public.activity_logs;
CREATE POLICY "Members can view activity logs"
    ON public.activity_logs FOR SELECT TO authenticated
    USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can insert activity logs" ON public.activity_logs;
CREATE POLICY "Members can insert activity logs"
    ON public.activity_logs FOR INSERT TO authenticated
    WITH CHECK (public.is_group_member(group_id, auth.uid()));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view and edit their own notifications" ON public.notifications;
CREATE POLICY "Users can view and edit their own notifications"
    ON public.notifications FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. ENABLE REALTIME PUBLICATION
-- ============================================================================

-- Aktifkan Realtime untuk tabel notifikasi dan activity logs
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
