import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl font-bold text-[#102A43] mb-2">
          Kebijakan Privasi
        </h1>
        <p className="text-xs text-[#61758A] mb-8">
          Sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)
        </p>

        <div className="bg-white border border-[#DCEAF7] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-xs sm:text-sm text-[#61758A] leading-relaxed">
          <section>
            <h2 className="font-bold text-sm text-[#102A43] mb-2">1. Data Pribadi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan data nama lengkap, alamat email institusi kampus, nomor telepon, data lokasi umum (radius), serta foto dokumen identitas (KTM/KTP) yang diserahkan secara sukarela untuk keperluan verifikasi akun.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-sm text-[#102A43] mb-2">2. Penggunaan Data Pribadi</h2>
            <p>
              Data identitas hanya digunakan untuk memvalidasi keabsahan status mahasiswa dan menjaga keamanan transaksi di platform Bantuin. Kami tidak pernah memperjualbelikan atau mendistribusikan data pribadi pengguna kepada pihak ketiga tanpa persetujuan eksplisit.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-sm text-[#102A43] mb-2">3. Perlindungan & Kerahasiaan</h2>
            <p>
              Nomor telepon pribadi dan lokasi presisi pengguna dilindungi secara teknis di database dan tidak akan ditampilkan secara publik kepada pengguna umum sebelum terjadi kesepakatan transaksi resmi di Order Room.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-sm text-[#102A43] mb-2">4. Hak Pengguna</h2>
            <p>
              Pengguna berhak untuk meminta salinan, pembaruan, maupun penghapusan permanen atas data pribadi yang tersimpan di sistem Bantuin dengan menghubungi tim dukungan kami.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
