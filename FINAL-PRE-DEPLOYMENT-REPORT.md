# FINAL PRE-DEPLOYMENT REPORT — BANTUINAJA (`security/audit-remediation`)

- **Tanggal Pemeriksaan**: 29 Oktober 2026
- **Workspace**: `d:\APLIKASI\Bantuin`
- **Branch Aktif**: `security/audit-remediation`
- **Dasar Verifikasi**: Lanjutan dari `FINAL-SECURITY-VERIFICATION.md` dan `cloudflare/security-audit-skill` (`C:\Users\asuss\security-audit-skill\Bantuin\run-1`)
- **Batasan Keamanan yang Dipatuhi**: Tidak melakukan deployment, tidak melakukan merge, tidak memodifikasi data/skema produksi, tidak mengubah pengaturan bucket cloud produksi, tidak menjalankan `prisma migrate deploy` pada produksi, dan tidak menampilkan nilai secret/token/PII.

---

## 1. Hasil Audit Bucket Supabase Storage & Rekomendasi Publik/Private per Bucket

Pemeriksaan menyeluruh telah dilakukan terhadap seluruh penggunaan bucket di kode sumber ([lib/supabase/storage.js](file:///d:/APLIKASI/Bantuin/lib/supabase/storage.js), [app/api/upload/route.js](file:///d:/APLIKASI/Bantuin/app/api/upload/route.js), [app/api/profile/kyc/route.js](file:///d:/APLIKASI/Bantuin/app/api/profile/kyc/route.js), [app/api/user/profile/route.js](file:///d:/APLIKASI/Bantuin/app/api/user/profile/route.js), [app/api/admin/kyc/route.js](file:///d:/APLIKASI/Bantuin/app/api/admin/kyc/route.js)) serta metadata bucket aktual pada instance Supabase Storage.

### 1.1 Matriks Penggunaan & Kebijakan Akses Bucket

| Nama Bucket | Jenis File yang Disimpan | Mengandung Data Pribadi (PII) / Bukti Transaksi? | Harus Diakses Publik? | Endpoint Upload & Download | Mekanisme URL & Otorisasi di Aplikasi | Status Cloud Saat Ini vs Rekomendasi Produksi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`bantuin-kyc`** | Foto KTP / KTM (`idCardUrl`) dan foto selfie verifikasi identitas (`selfieUrl`). | **Ya — Data Pribadi Sensitif (PII / Identitas Negara)**. | **TIDAK (Wajib Private / `public: false`)**. | **Upload**: `POST /api/upload` (`bucket="kyc"`, wajib JWT) -> disimpan via `POST /api/profile/kyc`, `PATCH /api/user/profile`, atau `POST /api/auth/register`.<br>**Download/View**: `GET /api/user/profile` (hanya pemilik akun) & `GET /api/admin/kyc` (hanya Admin). | Database menyimpan referensi kanonik `storage://bantuin-kyc/<key>`. Server memanggil `resolveDocumentUrl` ([lib/supabase/storage.js](file:///d:/APLIKASI/Bantuin/lib/supabase/storage.js#L168-L195)) menggunakan `supabaseAdmin` untuk menerbitkan **Signed URL berdurasi 15 menit (900 detik)** pada field `idCardViewUrl` dan `selfieViewUrl`. Endpoint publik `GET /api/profile/[id]` tidak pernah menyertakan `idCardUrl` maupun `idNumber`. | Cloud saat ini: `public: true`.<br>**Wajib diubah menjadi `public: false` sebelum rilis produksi.** |
| **`bantuin-documents`** | Dokumen pendukung penawaran helper seperti CV (`cvUrl`) dan dokumen portofolio PDF (`portfolioUrl`) pada tugas Bantuan. | **Ya — Data Pribadi Terbatas (CV/Resume Pelamar)**, namun perlu dilihat oleh pembuat tugas (`requester`) saat menyeleksi pelamar. | **Opsional Private atau Public Terbatas** (Direkomendasikan tetap dapat diakses oleh pembuat tugas; kode mendukung `resolveDocumentUrl` signed URL). | **Upload**: `POST /api/upload` (`bucket="documents"`, wajib JWT).<br>**Download/View**: `GET /api/bantuin/[id]/ajukan` & `GET /api/requests/[id]/offers`. | Unggahan menggunakan nama file acak kriptografis (`crypto.randomUUID()`). `resolveDocumentUrl` mendukung konversi `storage://bantuin-documents/<key>` maupun URL objek menjadi signed URL apabila bucket disetel private. | Cloud saat ini: `public: true`.<br>**Rekomendasi**: Dapat dipertahankan `public: true` dengan UUID tidak tertebak untuk kompatibilitas link CV langsung di UI pemohon, atau `public: false` karena `resolveDocumentUrl` sudah mendukung signed URL. |
| **`bantuin-proofs`** | Foto bukti serah terima tugas/jasa (`proofPhotoUrls`), foto kondisi awal/pengembalian sewa (`initialConditionPhotos`, `returnConditionPhotos`), bukti laporan (`evidenceUrls`), dan bukti transfer pencairan (`proofUrl`). | **Ya — Bukti Transaksi**, tidak mengandung NIK, digunakan lintas komponen `<img src=...>` pada ruang chat, detail pesanan, modal serah terima sewa, dan dashboard admin. | **Ya (`public: true` dengan path UUID acak)** agar komponen `<img src=...>` pada halaman aktivitas, ruang chat, dan riwayat transaksi tidak rusak. | **Upload**: `POST /api/upload` (`bucket="proofs"`, wajib JWT).<br>**Download/View**: `GET /api/orders/[id]`, `GET /api/chat/rooms`, `GET /api/admin/disputes` (semua endpoint API pengambil daftar URL dilindungi autentikasi partisipan/admin). | Menyimpan URL objek dengan kunci acak `crypto.randomUUID()` di database; hanya partisipan transaksi atau Admin yang dapat mengambil URL tersebut dari API. | Cloud saat ini: `public: true`.<br>**Rekomendasi**: Pertahankan `public: true` (otorisasi dijaga di level API yang mengembalikan daftar URL bukti). |
| **`bantuin-chat-attachments`** | Gambar dan berkas lampiran yang dikirim di dalam ruang obrolan transaksi (`attachmentUrls`). | **Bukti Komunikasi Transaksi**. | **Ya (`public: true` dengan path UUID acak)** karena dirender langsung oleh `<img src=...>` pada UI ruang chat real-time ([app/chat/page.jsx](file:///d:/APLIKASI/Bantuin/app/chat/page.jsx)). | **Upload**: `POST /api/upload` (`bucket="chat_attachments"`, wajib JWT).<br>**Download/View**: `GET /api/chat/messages` & `GET /api/chat/rooms` (wajib autentikasi JWT & verifikasi partisipan `requesterId`/`helperId`). | API chat menolak pihak luar (`403 Forbidden`), sehingga hanya partisipan sah yang menerima URL lampiran. | Cloud saat ini: `public: true`.<br>**Rekomendasi**: Pertahankan `public: true`. |
| **`bantuin-assets`** | Foto katalog layanan Jasa (`portfolioUrls`), foto unit katalog Sewa (`photoUrls`), banner toko mitra (`bannerUrl`), foto tugas Bantuan (`attachments`), dan logo beranda. | **Tidak (Aset Katalog & Pemasaran Publik)**. | **Ya (Wajib `public: true`)**. | **Upload**: `POST /api/upload` (`bucket="assets"`, wajib JWT).<br>**Download/View**: Seluruh halaman katalog publik (`/jasa`, `/sewa`, `/bantuan`, `/`). | Public URL (`getPublicUrl`) untuk dirender langsung oleh pengunjung katalog. | Cloud saat ini: `public: true`.<br>**Rekomendasi**: Pertahankan `public: true`. |
| **`bantuin-avatars`** | Foto profil pengguna dan avatar mitra (`avatarUrl`). | **Tidak (Identitas Visual Publik Profil/Katalog)**. | **Ya (Wajib `public: true`)**. | **Upload**: `POST /api/upload` (`bucket="avatars"`, wajib JWT).<br>**Download/View**: Seluruh halaman profil, ulasan, chat, dan katalog. | Public URL (`getPublicUrl`). | Cloud saat ini: `public: true`.<br>**Rekomendasi**: Pertahankan `public: true`. |

### 1.2 Perbaikan Kompatibilitas Lokal agar Bucket `bantuin-kyc` Aman Diubah Menjadi Private
Saat memeriksa efek perubahan bucket `bantuin-kyc` menjadi private (`public: false`), ditemukan bahwa beberapa halaman frontend ([app/profile/page.jsx](file:///d:/APLIKASI/Bantuin/app/profile/page.jsx), [app/auth/verify/page.jsx](file:///d:/APLIKASI/Bantuin/app/auth/verify/page.jsx), [app/bantuan/[id]/ajukan/page.jsx](file:///d:/APLIKASI/Bantuin/app/bantuan/[id]/ajukan/page.jsx)) sebelumnya mencoba merender nilai `idCardUrl` (`storage://bantuin-kyc/...`) langsung pada `<img src={...}>` atau menimpa state `idCardUrl` dengan referensi `storage://` setelah upload, serta baris database lama masih menyimpan URL format `https://.../storage/v1/object/public/bantuin-kyc/...`.

Perbaikan lokal yang telah diterapkan pada branch ini:
1. **[lib/supabase/storage.js](file:///d:/APLIKASI/Bantuin/lib/supabase/storage.js#L131-L195)**:
   - `parseStorageRef(ref)` kini mengenali **kedua format**: referensi internal `storage://<bucket>/<key>` **dan** URL objek Supabase lama (`/storage/v1/object/(?:public|sign|authenticated)/<bucket>/<key>`). Ketika `bantuin-kyc` diubah menjadi `public: false`, pemanggilan `resolveDocumentUrl` otomatis menghasilkan **Signed URL 15 menit** yang valid bahkan untuk data KYC lama di database.
   - Ditambahkan fungsi `normalizeToStorageRef(value)` untuk menormalisasi setiap input `idCardUrl`/`selfieUrl` pada bucket `bantuin-kyc` menjadi `storage://bantuin-kyc/<key>` sebelum disimpan ke database.
2. **[app/api/profile/kyc/route.js](file:///d:/APLIKASI/Bantuin/app/api/profile/kyc/route.js#L85-L120)**, **[app/api/user/profile/route.js](file:///d:/APLIKASI/Bantuin/app/api/user/profile/route.js#L105-L148)**, dan **[app/api/auth/register/route.js](file:///d:/APLIKASI/Bantuin/app/api/auth/register/route.js#L170-L185)**:
   - Selalu menyimpan referensi kanonik `storage://bantuin-kyc/<key>` ke kolom `id_card_url` / `selfie_url`.
   - Mengembalikan `idCardViewUrl` (Signed URL HTTPS 15 menit) kepada pemilik akun yang sedang login (dan kepada Admin melalui `GET /api/admin/kyc`), sehingga pratinjau `<img src={...}>` milik pemilik akun dan Admin tetap tampil sempurna ketika bucket `bantuin-kyc` disetel `public: false`.

---

## 2. Hasil Pengujian Konkurensi dan Transaksi Database (Real Isolated DB Execution)

Seluruh skenario konkurensi dan manipulasi transaksi pada **TAHAP 2** telah diuji secara nyata terhadap database PostgreSQL menggunakan `Promise.all` di dalam suite `test_security_and_bug_regressions.mjs` (tanpa mock transaksi database):

| # | Skenario Konkurensi / Manipulasi Transaksi | Mekanisme Proteksi Server & Database | Hasil Eksekusi Aktual |
| :--- | :--- | :--- | :--- |
| **1** | **Dua penarikan saldo paralel (`Promise.all`) oleh pengguna yang sama** (`POST /api/withdrawals/request`) | Lock baris per-pengguna `SELECT id FROM profiles WHERE id = ${userId}::uuid FOR UPDATE` di awal `prisma.$transaction` ([app/api/withdrawals/request/route.js](file:///d:/APLIKASI/Bantuin/app/api/withdrawals/request/route.js#L71-L88) & [app/api/profile/wallet/route.js](file:///d:/APLIKASI/Bantuin/app/api/profile/wallet/route.js#L247-L263)). | **PASS** — Dari 2 request paralel Rp 40.000 pada sisa saldo Rp 40.000, tepat **1 berhasil (`200`)** dan **1 ditolak (`400 PENDING_EXISTS`)**. Saldo tidak pernah menjadi negatif. |
| **2** | **Dua webhook settlement paralel (`Promise.all`) untuk transaksi yang sama** (`POST /api/webhooks/midtrans`) | Lock baris entitas `SELECT id FROM order_rooms/rental_bookings/promotions WHERE id = ${id}::uuid FOR UPDATE` di awal `prisma.$transaction` diikuti *re-fetch* & validasi state terminal `PAID` ([app/api/webhooks/midtrans/route.js](file:///d:/APLIKASI/Bantuin/app/api/webhooks/midtrans/route.js#L214-L370)). | **PASS** — Kedua request mengembalikan `200 OK` (idempoten), namun mutasi status ke `PAID` dan pencatatan `payment.midtrans_paid` di `audit_logs` terbukti hanya dieksekusi **tepat 1 kali** (`paidAuditCount === 1`). |
| **3** | **Dua permintaan penyelesaian pesanan bersamaan (`Promise.all`)** (`POST /api/orders/[id]/confirm-completion` & `PATCH /api/chat/rooms`) | Lock baris `SELECT id FROM order_rooms WHERE id = ${orderRoom.id}::uuid FOR UPDATE` di dalam `prisma.$transaction` sebelum memeriksa `freshRoom.orderStatus === "completed"` ([app/api/orders/[id]/confirm-completion/route.js](file:///d:/APLIKASI/Bantuin/app/api/orders/%5Bid%5D/confirm-completion/route.js#L160-L185)) serta `updateMany({ where: { id, orderStatus: { not: "completed" } } })` pada [app/api/chat/rooms/route.js](file:///d:/APLIKASI/Bantuin/app/api/chat/rooms/route.js#L1418-L1436). | **PASS** — Di bawah `Promise.all`, `completedHelpsCount` pada `Profile` bertambah tepat **+1**, `completedOrders` pada `Service` bertambah tepat **+1**, dan log audit `order.escrow_released` tercatat tepat **1 kali**. |
| **4** | **Dua permintaan review bersamaan (`Promise.all`) untuk transaksi yang sama** (`POST /api/reviews`) | Lock baris `SELECT id FROM profiles WHERE id = ${userProfile.id}::uuid FOR UPDATE` di dalam `prisma.$transaction` diikuti pemeriksaan `tx.review.findFirst({ where: { transactionId, reviewerId } })` ([app/api/reviews/route.js](file:///d:/APLIKASI/Bantuin/app/api/reviews/route.js#L133-L146)). | **PASS** — Di bawah `Promise.all`, tepat **1 request berhasil (`201 Created`)** dan **1 request ditolak (`409 Conflict`)**. Jumlah baris ulasan di tabel `reviews` untuk transaksi tersebut tepat **1**. |
| **5** | **Manipulasi langsung `paymentStatus`, `isPaid`, harga, deposit, dan identitas pengguna** | Server mengabaikan input harga/status bayar klien dan menghitung ulang dari DB (`Service.startingPrice`, `Rental.dailyPrice`, `Rental.depositAmount`), mengikat identitas ke sesi JWT (`userProfile.id`), dan memaksa status awal `UNPAID` / `PENDING`. | **PASS** — Klaim `isPaid: true`, `paymentStatus: "PAID"`, `customPrice: 1000`, `rentalFee: 1`, `depositFee: 0` semuanya diabaikan/ditolak (`403`/`201` dengan nilai asli server & status `UNPAID`). |
| **6** | **Pembatalan transaksi yang sudah dibayar (`PAID`)** | Guard terminal `paymentStatus === "PAID"` diterapkan secara menyeluruh pada `POST /api/payments/cancel`, `PATCH /api/chat/rooms`, `PATCH /api/requests/[id]`, dan `PATCH /api/rentals/bookings/[id]/status`. | **PASS** — Seluruh percobaan pembatalan pesanan/request/booking yang sudah `PAID` ditolak dengan **`400 Bad Request` (`ALREADY_PAID`)**. |
| **7** | **Penarikan saldo ketika ada permintaan penarikan lain yang masih `pending`** | Pemeriksaan `tx.withdrawal.findFirst({ where: { ownerId, status: { in: ["pending", "processing"] } } })` di bawah lock `FOR UPDATE` pada `POST /api/withdrawals/request` dan `POST /api/profile/wallet`. | **PASS** — Permintaan penarikan kedua saat penarikan pertama masih `pending` ditolak secara konsisten dengan **`400 Bad Request` (`PENDING_EXISTS`)** pada kedua endpoint. |

---

## 3. Status Sinkronisasi Schema dan Migrasi Prisma

### 3.1 Perbandingan `prisma/schema.prisma`, Migration Files, dan Database Pengujian
1. **Tabel `_prisma_migrations` vs Folder `prisma/migrations/`**:
   - Di dalam folder `prisma/migrations/` terdapat 2 migrasi:
     1. `20261014_add_midtrans_payment_fields` (`finished_at`: `2026-10-25T10:12:19.189Z`)
     2. `20261025_add_landing_content` (`finished_at`: `2026-10-25T10:12:32.240Z`)
   - Kedua migrasi tersebut **telah diterapkan sepenuhnya (`applied`)** pada database dan tidak ada migrasi yang tertunda (*unapplied*) di repositori.
2. **Konsistensi Enum `OrderStatus` dan Penanganan Status `paid_escrow`**:
   - Baik di [prisma/schema.prisma](file:///d:/APLIKASI/Bantuin/prisma/schema.prisma#L67-L78) maupun di katalog sistem PostgreSQL (`pg_type` / `pg_enum` untuk `order_status`), enum `OrderStatus` memiliki 8 nilai kanonik yang identik:
     `room_created`, `on_the_way`, `item_picked_up`, `task_delivered`, `proof_submitted`, `completed`, `disputed`, `cancelled`.
   - Nilai `paid_escrow` adalah **status efektif tingkat aplikasi (UI/API stage)** yang merepresentasikan kombinasi `order_status = 'room_created'` dan `payment_status = 'PAID'`.
   - Seluruh jalur penulisan ke database (`POST /api/webhooks/midtrans`, `PATCH /api/chat/rooms`, `POST /api/services/[id]/order`, `POST /api/rentals/[id]/book`) telah distandardisasi agar hanya menulis nilai enum `OrderStatus` yang sah ke kolom `order_rooms.order_status` dan menyimpan status pembayaran pada kolom `payment_status = 'PAID'`, sementara `GET /api/chat/rooms` dan `GET /api/admin/orders` memetakan kombinasi tersebut menjadi `paid_escrow` untuk kebutuhan tampilan frontend.
   - Selain itu, pada tahap ini kami juga menemukan dan memperbaiki 2 titik ketidaksesuaian enum tambahan:
     - Pada [app/api/requests/[id]/route.js](file:///d:/APLIKASI/Bantuin/app/api/requests/%5Bid%5D/route.js#L474-L478), penulisan `orderStatus: "in_progress"` (yang merupakan nilai `RequestStatus`, bukan `OrderStatus`) telah diperbaiki menjadi `"item_picked_up"`.
     - Pada [app/api/admin/disputes/route.js](file:///d:/APLIKASI/Bantuin/app/api/admin/disputes/route.js#L206-L232), pemulihan status sengketa kini memisahkan `restoredOrderStatus` (`"completed" | "proof_submitted" | "item_picked_up" | "room_created"`) untuk `orderRoom.orderStatus` dan `restoredRequestStatus` (`"completed" | "awaiting_confirmation" | "in_progress"`) untuk `request.status`.
3. **Analisis Risiko Data & Transaksi Lama**:
   - Karena arsitektur perbaikan tidak mengubah atau menghapus nilai enum maupun kolom yang sudah ada, **tidak ada risiko penghapusan data, *table rewrite*, atau kerusakan transaksi historis**.
4. **Prosedur Migrasi untuk Produksi (Hanya Jika Database Produksi Berbeda dari Instance Saat Ini)**:
   - Sebelum menjalankan migrasi pada saat window deployment produksi, periksa status migrasi terlebih dahulu dengan perintah *read-only*:
     ```bash
     npx prisma migrate status
     ```
   - Jika kedua migrasi (`20261014_add_midtrans_payment_fields` dan `20261025_add_landing_content`) sudah berstatus *applied* (karena keduanya memakai klausa aman `ADD COLUMN IF NOT EXISTS` dan `CREATE TABLE IF NOT EXISTS`), tidak diperlukan perubahan skema tambahan; cukup jalankan `npx prisma generate` saat proses build.

---

## 4. Hasil Uji Regresi Fitur Utama

Seluruh alur fitur utama telah diverifikasi secara *end-to-end* (bukan sekadar kompilasi statis):

1. **Registrasi, Login Lokal, Google OAuth, dan Verifikasi Email**:
   - Registrasi akun lokal (`POST /api/auth/register`) menyimpan password ter-hash `bcrypt`, menormalisasi `idCardUrl` ke `storage://bantuin-kyc/...`, dan memisahkan verifikasi email dari KYC.
   - Login lokal (`POST /api/auth/login`) memvalidasi `bcrypt` dan menolak akun tanpa password (`authProvider: "google"`, `password: null`) dengan `401 Unauthorized`.
   - Login Google OAuth (`POST /api/auth/google`) mewajibkan verifikasi token OAuth ke server Supabase Auth (`supabase.auth.getUser`) dan menolak klaim email mentah (`401`).
   - Verifikasi email (`POST /api/auth/verify-email`) mewajibkan `actionToken` bertanda tangan (`purpose: "verify_email"`) dan tidak mengubah `verificationStatus` KYC.
2. **Alur Bantuan (Buat Tugas -> Penawaran -> Pembayaran -> Pengerjaan -> Selesai -> Ulasan)**:
   - Pembuatan tugas (`POST /api/requests`), pengajuan tawaran helper (`POST /api/bantuin/[id]/ajukan`), daftar penawaran (`GET /api/requests/[id]/offers`), pembuatan ruang obrolan (`POST /api/chat/rooms`), settlement webhook Midtrans (`POST /api/webhooks/midtrans`), unggah bukti (`POST /api/orders/[id]/submit-proof`), konfirmasi selesai (`POST /api/orders/[id]/confirm-completion`), dan pengiriman ulasan (`POST /api/reviews`) berjalan mulus dari awal hingga akhir.
3. **Alur Jasa (Buat Pesanan -> Pembayaran -> Chat -> Bukti -> Selesai -> Pendapatan Mitra Jasa)**:
   - `POST /api/services/[id]/order` menggunakan harga resmi server, tidak menaikkan `completedOrders` saat pesanan dibuat (`completedOrders === 0`), menaikkan `completedOrders` tepat `+1` saat `confirm-completion`, dan mencatat pendapatan bersih ke dompet Mitra Jasa (`ownerType: "provider"`).
4. **Alur Sewa (Booking Unit -> Pembayaran -> Serah Terima -> Pengembalian -> Refund Deposit -> Pendapatan Mitra Sewa)**:
   - `POST /api/rentals/[id]/book` menghitung `rentalFee` + `depositFee` di server, membuat `RentalBooking` dan `OrderRoom` pendamping tanpa menduplikasi `midtransOrderId`, memproses status `payment_held` -> `handed_over` -> `in_use` -> `returned`, memvalidasi batas `depositFee` dan alasan pemotongan pada `POST /api/rentals/bookings/[id]/refund-deposit` (`verified_settled`), serta menghitung pendapatan sewa Mitra Sewa tepat **1 kali** (`Rp 100.000`, bukan `Rp 200.000`).
5. **Pemisahan Dashboard & Dompet Mitra Jasa vs Mitra Sewa**:
   - Perhitungan saldo di `POST /api/withdrawals/request` dan `POST /api/profile/wallet` memisahkan secara ketat pendapatan `provider` (Jasa/Bantuan, dengan mengecualikan `OrderRoom` pendamping sewa `[BOOKING_ID:...]`) dari pendapatan `partner` (`RentalBooking` berstatus `verified_settled` & `PAID`). Terbukti pada uji regresi: Mitra dengan pendapatan Sewa Rp 100.000 dan Jasa Rp 75.000 ditolak (`400`) saat menarik Rp 80.000 sebagai `provider`, dan berhasil (`200`) saat menarik Rp 75.000 sebagai `provider`.
6. **Otorisasi Chat, Lampiran, Notifikasi, dan Bukti Transaksi**:
   - Hanya partisipan transaksi (`requesterId` / `helperId` / `renterId` / `ownerId`) atau Admin yang dapat membaca/mengirim pesan chat, melihat detail pesanan (`GET /api/orders/[id]`), mengunggah checkpoint kondisi sewa, atau menandai notifikasi miliknya.
7. **Voucher, Promosi, Wallet, dan Webhook**:
   - Validasi & penukaran voucher (`POST /api/vouchers/validate`) mewajibkan login pada `action: "redeem"` dan menghitung diskon di server.
   - Pembuatan & aktivasi promosi (`POST` & `PATCH /api/promotions/order`, `POST /api/promotions/boost`) memverifikasi kepemilikan layanan/unit sewa dan menolak aktivasi sebelum status pembayaran terverifikasi `PAID`.

---

## 5. Status Environment Produksi (Tanpa Menampilkan Secret)

Pemeriksaan dilakukan secara terprogram terhadap environment lokal workspace dan kesiapan environment hosting produksi menggunakan klasifikasi aman (`PRESENT`, `MISSING`, `VALID_FORMAT`, `NEEDS_MANUAL_VALIDATION`):

| Variabel Environment | Status di Workspace Lokal (`.env`) | Validitas Format Lokal | Status di Hosting Produksi (Vercel / Cloud Server) | Catatan Keamanan Pra-Deploy |
| :--- | :--- | :--- | :--- | :--- |
| `JWT_SECRET` | `PRESENT` | `VALID_FORMAT` (`>= 32` karakter, bukan nilai fallback) | `NEEDS_MANUAL_VALIDATION` | Wajib disetel di hosting produksi; kode `lib/auth/jwt.js` bersifat *fail-closed* jika kosong di produksi. |
| `JWT_REFRESH_SECRET` | `PRESENT` | `VALID_FORMAT` (`>= 32` karakter & berbeda dari `JWT_SECRET`) | `NEEDS_MANUAL_VALIDATION` | Wajib disetel dan harus berbeda dari `JWT_SECRET`. |
| `MIDTRANS_IS_PRODUCTION` | `PRESENT` | `VALID_FORMAT` (`false` di lokal) | `NEEDS_MANUAL_VALIDATION` | Wajib disetel ke `"true"` pada environment produksi. |
| `MIDTRANS_SERVER_KEY` | `PRESENT` | `VALID_FORMAT` | `NEEDS_MANUAL_VALIDATION` | Pastikan menggunakan kunci produksi (`Mid-server-*`) saat `MIDTRANS_IS_PRODUCTION="true"`. |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | `PRESENT` | `VALID_FORMAT` | `NEEDS_MANUAL_VALIDATION` | Pastikan menggunakan kunci produksi (`Mid-client-*`) yang sepasang dengan `MIDTRANS_SERVER_KEY`. |
| `XENDIT_SECRET_KEY` | `PRESENT` | `VALID_FORMAT` (`xnd_*`) | `NEEDS_MANUAL_VALIDATION` | Digunakan jika jalur pembayaran/disbursement Xendit diaktifkan di produksi. |
| `XENDIT_WEBHOOK_VERIFY_TOKEN` | `MISSING` | `MISSING` | `NEEDS_MANUAL_VALIDATION` | Endpoint `/api/webhooks/xendit` menolak request secara aman (`503`/`403`) hingga token callback Xendit ini disetel. |
| `NEXT_PUBLIC_SUPABASE_URL` | `PRESENT` | `VALID_FORMAT` (`https://*.supabase.co`) | `NEEDS_MANUAL_VALIDATION` | URL project Supabase aktif. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `PRESENT` | `VALID_FORMAT` | `NEEDS_MANUAL_VALIDATION` | Digunakan untuk verifikasi sesi klien; RLS telah aktif (`rls_enabled = true`) pada 19 tabel utama. |
| `SUPABASE_SERVICE_ROLE_KEY` | `PRESENT` | `VALID_FORMAT` (Berbeda dari anon key) | `NEEDS_MANUAL_VALIDATION` | Hanya digunakan di server (`lib/supabase/client.js` & `lib/supabase/storage.js`). |
| `DATABASE_URL` | `PRESENT` | `VALID_FORMAT` (`postgresql://...`) | `NEEDS_MANUAL_VALIDATION` | Koneksi Prisma ke PostgreSQL Supabase. |

**Status RLS Tabel Database (`public` schema)**:
- **19 tabel utama aplikasi** (`User`, `announcements`, `audit_logs`, `bantuin_points`, `chat_messages`, `notifications`, `offers`, `order_rooms`, `profiles`, `promotion_packages`, `promotions`, `rental_bookings`, `rentals`, `reports`, `requests`, `reviews`, `services`, `vouchers`, `withdrawals`) telah berstatus **`rls_enabled = true`**.
- **3 tabel pendukung/metadata** (`_prisma_migrations`, `landing_partner_logos`, `landing_reviews`) masih berstatus **`rls_enabled = false`** dan direkomendasikan untuk diaktifkan melalui SQL sebelum rilis produksi.

---

## 6. Daftar Perubahan Kode Terakhir pada Branch `security/audit-remediation`

Selain patch `SEC-01` s/d `SEC-08`, `NV-01` s/d `NV-02`, `BUG-01` s/d `BUG-05`, dan `FV-01` s/d `FV-04` yang telah didokumentasikan pada `FINAL-SECURITY-VERIFICATION.md`, berikut adalah perubahan penyempurnaan terakhir yang dilakukan pada tahap pra-deployment ini:

1. **[lib/supabase/storage.js](file:///d:/APLIKASI/Bantuin/lib/supabase/storage.js#L131-L195)**:
   - Memperluas `parseStorageRef` agar mengenali URL objek Supabase legacy (`/storage/v1/object/(?:public|sign|authenticated)/<bucket>/<key>`) selain `storage://<bucket>/<key>`, serta menambahkan `normalizeToStorageRef` untuk memastikan kompatibilitas penuh saat bucket `bantuin-kyc` diubah menjadi private.
2. **[app/api/profile/kyc/route.js](file:///d:/APLIKASI/Bantuin/app/api/profile/kyc/route.js#L85-L120)**, **[app/api/user/profile/route.js](file:///d:/APLIKASI/Bantuin/app/api/user/profile/route.js#L105-L148)**, **[app/api/auth/register/route.js](file:///d:/APLIKASI/Bantuin/app/api/auth/register/route.js#L170-L185)**, **[app/profile/page.jsx](file:///d:/APLIKASI/Bantuin/app/profile/page.jsx#L470-L535)**, **[app/auth/verify/page.jsx](file:///d:/APLIKASI/Bantuin/app/auth/verify/page.jsx#L70-L120)**, dan **[app/bantuan/[id]/ajukan/page.jsx](file:///d:/APLIKASI/Bantuin/app/bantuan/%5Bid%5D/ajukan/page.jsx#L115-L155)**:
   - Menormalisasi referensi dokumen KYC ke `storage://bantuin-kyc/<key>` saat disimpan ke database dan menyediakan `idCardViewUrl` (Signed URL 15 menit) untuk pratinjau `<img src=...>` bagi pemilik akun dan Admin.
3. **[app/api/webhooks/midtrans/route.js](file:///d:/APLIKASI/Bantuin/app/api/webhooks/midtrans/route.js#L214-L370)**:
   - Menambahkan row-level lock `SELECT id FROM order_rooms/rental_bookings/promotions WHERE id = ${targetEntity.id}::uuid FOR UPDATE` di dalam `prisma.$transaction` agar dua webhook settlement yang tiba bersamaan (`Promise.all`) diserialisasi secara ketat dan tidak membuat duplikasi notifikasi maupun log audit `payment.midtrans_paid`.
4. **[app/api/orders/[id]/confirm-completion/route.js](file:///d:/APLIKASI/Bantuin/app/api/orders/%5Bid%5D/confirm-completion/route.js#L159-L265)** & **[app/api/chat/rooms/route.js](file:///d:/APLIKASI/Bantuin/app/api/chat/rooms/route.js#L1328-L1436)**:
   - Menambahkan row-level lock `SELECT id FROM order_rooms WHERE id = ${orderRoom.id}::uuid FOR UPDATE` dan pengecekan ulang `freshRoom.orderStatus === "completed"` di dalam `prisma.$transaction` pada `confirm-completion`, serta `updateMany` bersyarat `orderStatus: { not: "completed" }` pada `PATCH /api/chat/rooms`, sehingga dua konfirmasi selesai paralel (`Promise.all`) tidak menggandakan `completedHelpsCount`, `completedOrders`, maupun log pelepasan escrow.
   - Menambahkan guard penolakan pembatalan (`status === "cancelled"`) jika `paymentStatus === "PAID"`.
5. **[app/api/reviews/route.js](file:///d:/APLIKASI/Bantuin/app/api/reviews/route.js#L132-L208)** & **[app/api/chat/rooms/route.js](file:///d:/APLIKASI/Bantuin/app/api/chat/rooms/route.js#L1679-L1735)**:
   - Menambahkan row-level lock `SELECT id FROM profiles WHERE id = ${userProfile.id}::uuid FOR UPDATE` dan pengecekan duplikasi ulasan di dalam `prisma.$transaction` sehingga dua pengiriman ulasan paralel (`Promise.all`) tidak dapat membuat ulasan ganda (`201` + `409 Conflict`).
6. **[app/api/requests/[id]/route.js](file:///d:/APLIKASI/Bantuin/app/api/requests/%5Bid%5D/route.js#L380-L495)**, **[app/api/rentals/bookings/[id]/status/route.js](file:///d:/APLIKASI/Bantuin/app/api/rentals/bookings/%5Bid%5D/status/route.js#L139-L155)**, **[app/api/admin/disputes/route.js](file:///d:/APLIKASI/Bantuin/app/api/admin/disputes/route.js#L206-L232)**, **[app/api/user/activities/route.js](file:///d:/APLIKASI/Bantuin/app/api/user/activities/route.js#L432-L548)**, **[app/api/withdrawals/request/route.js](file:///d:/APLIKASI/Bantuin/app/api/withdrawals/request/route.js#L73)**, dan **[app/api/profile/wallet/route.js](file:///d:/APLIKASI/Bantuin/app/api/profile/wallet/route.js#L249)**:
   - Memblokir pembatalan sepihak pada request/booking yang sudah berstatus `PAID` (`400 ALREADY_PAID`), menyelaraskan nilai enum `OrderStatus` vs `RequestStatus` vs `BookingStatus`, dan menyeragamkan casting `::uuid` pada klausa `SELECT ... FOR UPDATE`.

### Ringkasan Eksekusi Pengujian Final (TAHAP 6)

| Pengujian / Validator | Perintah | Hasil |
| :--- | :--- | :--- |
| **Pre-Deployment Security, Concurrency & E2E Feature Suite (30 Tests)** | `node C:\Users\asuss\.gemini\antigravity\brain\bd0a9413-f0b4-4df8-9848-271747688a84\scratch\test_security_and_bug_regressions.mjs` | **PASS (`30/30 PASSED`, exit code `0`)** |
| **ESLint Check** | `npm run lint` | **PASS (exit code `0`, `0 errors`)** |
| **Next.js Production Build** | `npx next build` | **PASS (exit code `0`, `125/125` routes compiled)** |
| **Cloudflare Security Audit Coverage Validator** | `node ... validate-coverage-ledger.cjs ... --require-settled --require-manifest` | **PASS (`PASS: 5 coverage units valid`, exit code `0`)** |
| **Cloudflare Security Audit Findings Validator** | `node ... validate-findings.cjs ...` | **PASS (`PASS: 10 findings valid`, exit code `0`)** |

---

## 7. Keputusan Akhir Kesiapan Deployment

### Keputusan: **`CONDITIONALLY READY`**

**Alasan Keputusan**:
- Dari sisi **source code aplikasi, logika transaksi/konkurensi database, kompatibilitas private bucket KYC, sinkronisasi skema Prisma, dan build produksi**, branch `security/audit-remediation` telah **100% siap** (`30/30` pengujian otomatis lulus terhadap database nyata, `0` error ESLint, `npx next build` sukses, dan kedua validator `cloudflare/security-audit-skill` lulus).
- Status ditetapkan sebagai **`CONDITIONALLY READY`** (dan bukan `READY FOR DEPLOYMENT` tanpa syarat) semata-mata karena sesuai aturan operasional, perubahan konfigurasi cloud Supabase dan variabel environment di dashboard hosting produksi **tidak boleh dieksekusi otomatis dari repositori lokal** dan harus diselesaikan oleh Administrator saat window deployment.

### Checklist Tindakan Operasional Wajib Saat Window Deployment (3 Langkah):
1. **Setel Bucket `bantuin-kyc` Menjadi Private di Supabase**:
   Jalankan di Supabase SQL Editor (atau melalui menu Storage -> Bucket Settings):
   ```sql
   UPDATE storage.buckets
   SET public = false
   WHERE id = 'bantuin-kyc';
   ```
   *(Kode aplikasi pada branch ini sudah siap sepenuhnya menggunakan `storage://bantuin-kyc/...` dan Signed URL 15 menit `idCardViewUrl` sehingga tidak ada tampilan gambar profil/KYC/admin yang rusak).*
2. **Aktifkan RLS pada 3 Tabel Metadata/Landing di Supabase SQL Editor**:
   ```sql
   ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public."landing_partner_logos" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public."landing_reviews" ENABLE ROW LEVEL SECURITY;
   ```
3. **Pastikan Variabel Environment Produksi di Dashboard Hosting (Vercel / Server)**:
   - Pastikan `JWT_SECRET` dan `JWT_REFRESH_SECRET` memiliki nilai kriptografis kuat (`>= 32` karakter) dan saling berbeda.
   - Setel `MIDTRANS_IS_PRODUCTION="true"` beserta pasangan kunci produksi `MIDTRANS_SERVER_KEY` dan `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.
   - Setel `XENDIT_WEBHOOK_VERIFY_TOKEN` jika integrasi webhook Xendit digunakan di produksi.
