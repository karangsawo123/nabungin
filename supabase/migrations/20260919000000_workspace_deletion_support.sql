-- ============================================================================
-- NABUNGIN WORKSPACE DELETION & CATEGORY DELETE POLICY SUPPORT
-- Tanggal: 2026-09-19
-- ============================================================================

-- 1. Tambahkan Policy DELETE pada tabel categories untuk Group Owner
-- Memungkinkan penghapusan kategori atau pembersihan sebelum penghapusan grup
DROP POLICY IF EXISTS "Owners can delete categories" ON public.categories;
CREATE POLICY "Owners can delete categories"
    ON public.categories FOR DELETE TO authenticated
    USING (public.is_group_owner(group_id, auth.uid()));
