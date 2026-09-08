import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl font-bold text-[#102A43] mb-2">
          Syarat & Ketentuan Penggunaan
        </h1>
        <p className="text-xs text-[#61758A] mb-8">Terakhir diperbarui: 2 September 2026</p>

        <div className="bg-white border border-[#DCEAF7] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-xs sm:text-sm text-[#61758A] leading-relaxed">
          <section>
            <h2 className="font-bold text-sm text-[#102A43] mb-2">1. Kedudukan Bantuin</h2>
            <p>
              Bantuin bertindak sebagai platform perantara teknologi (marketplace) yang mempertemukan pihak yang membutuhkan bantuan atau sewa barang dengan penyedia bantuan/pemilik barang. Bantuin bukan pihak langsung dalam perjanjian kerja atau sewa-menyewa antar pengguna.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-sm text-[#102A43] mb-2">2. Sistem Pembayaran & Escrow</h2>
            <p>
              Seluruh transaksi moneter diproses melalui fasilitas escrow resmi pihak ketiga (Xendit). Bantuin tidak menyelenggarakan sistem dompet digital (e-wallet) bebas tarik mandiri guna mematuhi regulasi Bank Indonesia.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-sm text-[#102A43] mb-2">3. Larangan Disintermediasi</h2>
            <p>
              Pengguna dilarang melakukan ajakan pertukaran kontak pribadi (WhatsApp/Telepon) dan pengalihan transaksi ke luar sistem sebelum Order Room resmi terbentuk. Pelanggaran terhadap ketentuan ini akan mengakibatkan sanksi penurunan reliabilitas hingga penutupan akun permanen.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-sm text-[#102A43] mb-2">4. Verifikasi Identitas (KYC)</h2>
            <p>
              Untuk menjaga integritas dan keamanan komunitas kampus, fitur transaksi tatap muka dan rental barang mewajibkan verifikasi identitas resmi (KTM/KTP) yang divalidasi oleh tim moderator.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
