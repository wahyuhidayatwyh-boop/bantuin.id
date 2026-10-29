-- ============================================================================
-- BANTUIN.ID — SUPABASE SECURITY HARDENING & RLS ENFORCEMENT SCRIPT
-- Mengatasi temuan 'UNRESTRICTED' pada Supabase Studio dan mengamankan PostgREST API
-- ============================================================================

-- 1. AKTIFKAN ROW LEVEL SECURITY (RLS) PADA SEMUA TABEL YANG MASIH UNRESTRICTED
-- Ini menghilangkan badge merah 'UNRESTRICTED' pada Supabase Studio.
ALTER TABLE IF EXISTS public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.landing_partner_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.landing_reviews ENABLE ROW LEVEL SECURITY;

-- Pastikan seluruh 22 tabel di schema public memiliki RLS aktif
ALTER TABLE IF EXISTS public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bantuin_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promotion_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawals ENABLE ROW LEVEL SECURITY;

-- 2. AMANKAN TABEL INTERNAL PRISMA DARI POSTGREST DATA API
-- _prisma_migrations adalah riwayat internal skema database, tidak boleh diakses via PostgREST
REVOKE ALL ON TABLE public."_prisma_migrations" FROM anon, authenticated;

-- 3. AMANKAN TABEL KONTEN LANDING PAGE
-- Hanya izinkan SELECT untuk publik (anon, authenticated)
-- Blokir mutasi (INSERT/UPDATE/DELETE) via anon key untuk mencegah defacement landing page
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public read landing partner logos" ON public.landing_partner_logos;
    DROP POLICY IF EXISTS "Public read landing reviews" ON public.landing_reviews;
END $$;

CREATE POLICY "Public read landing partner logos" 
ON public.landing_partner_logos 
FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Public read landing reviews" 
ON public.landing_reviews 
FOR SELECT 
TO anon, authenticated 
USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.landing_partner_logos FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.landing_reviews FROM anon, authenticated;

-- 4. AMANKAN TABEL SENSITIF DARI AKSES LANGSUNG POSTGREST
-- Aplikasi BantuinAja sepenuhnya memproses data ini via Next.js Route Handlers + Prisma ORM (role 'postgres')
-- Role anon dan authenticated dari browser dilarang membaca atau memodifikasi tabel-tabel ini secara langsung
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;
REVOKE ALL ON TABLE public.withdrawals FROM anon, authenticated;
REVOKE ALL ON TABLE public.bantuin_points FROM anon, authenticated;
REVOKE ALL ON TABLE public."User" FROM anon, authenticated;
REVOKE ALL ON TABLE public.reports FROM anon, authenticated;

-- 5. BLOKIR MUTASI LANGSUNG DARI POSTGREST PADA TABEL TRANSAKSI
-- Seluruh mutasi chat, penawaran, pesanan, dan ulasan wajib melalui endpoint API backend terproteksi
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.chat_messages FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.order_rooms FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.offers FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.requests FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.reviews FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.rental_bookings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.promotions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.vouchers FROM anon, authenticated;

-- 6. AMANKAN SUPABASE STORAGE (BUCKET KYC PRIVAT)
-- Dokumen KYC (KTP, NIK, selfie) wajib berstatus private agar tidak dapat diakses via public URL
UPDATE storage.buckets 
SET public = false 
WHERE id = 'bantuin-kyc';

-- 7. NOTIFIKASI RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';

