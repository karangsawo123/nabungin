-- Migration: Add Default Withdrawal Categories
-- Menambahkan kategori bawaan untuk penarikan (Pencairan Target, Operasional, Biaya Medis/Darurat, Perbaikan/Servis)
-- Tanggal: 2026-09-16

-- 1. Perbarui fungsi handle_new_user() agar registrasi user baru otomatis mendapatkan kategori setoran & penarikan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_group_id UUID;
    user_name TEXT;
BEGIN
    user_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

    -- 1. Buat Profil
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

    -- 4. Kategori Bawaan Lengkap (Setoran & Penarikan) untuk Personal Group
    INSERT INTO public.categories (group_id, name, icon, color) VALUES
    -- Pos Setoran
    (new_group_id, 'Alokasi Bulanan', 'wallet', '#3B82F6'),
    (new_group_id, 'Bonus & THR', 'gift', '#10B981'),
    (new_group_id, 'Sisa Belanja', 'piggy-bank', '#F59E0B'),
    -- Pos Penarikan & Pengeluaran
    (new_group_id, 'Pencairan / Realisasi Target', 'shopping-bag', '#10B981'),
    (new_group_id, 'Operasional', 'tag', '#3B82F6'),
    (new_group_id, 'Biaya Medis / Darurat', 'heart', '#F43F5E'),
    (new_group_id, 'Perbaikan / Servis', 'car', '#8B5CF6');

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Masukkan kategori penarikan ke seluruh workspace yang sudah ada saat ini (idempotent / tidak duplikat)
INSERT INTO public.categories (group_id, name, icon, color)
SELECT g.id, 'Pencairan / Realisasi Target', 'shopping-bag', '#10B981'
FROM public.groups g
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.group_id = g.id AND c.name = 'Pencairan / Realisasi Target'
);

INSERT INTO public.categories (group_id, name, icon, color)
SELECT g.id, 'Operasional', 'tag', '#3B82F6'
FROM public.groups g
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.group_id = g.id AND c.name = 'Operasional'
);

INSERT INTO public.categories (group_id, name, icon, color)
SELECT g.id, 'Biaya Medis / Darurat', 'heart', '#F43F5E'
FROM public.groups g
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.group_id = g.id AND c.name = 'Biaya Medis / Darurat'
);

INSERT INTO public.categories (group_id, name, icon, color)
SELECT g.id, 'Perbaikan / Servis', 'car', '#8B5CF6'
FROM public.groups g
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories c WHERE c.group_id = g.id AND c.name = 'Perbaikan / Servis'
);
