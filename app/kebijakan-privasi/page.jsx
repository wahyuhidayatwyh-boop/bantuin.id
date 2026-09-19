import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Server, 
  FileText, 
  Clock, 
  UserCheck, 
  Mail,
  AlertCircle
} from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[960px] w-full mx-auto px-4 md:px-6 py-10 sm:py-14 space-y-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1683FF] text-xs font-bold mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Kepatuhan UU No. 27 Tahun 2022 (UU PDP)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
            Kebijakan Pelindungan Data Pribadi
          </h1>
          <p className="text-xs sm:text-sm text-[#61758A] leading-relaxed">
            Komitmen transparansi mengenai pengumpulan, pemrosesan, penyimpanan, dan perlindungan data pribadi Anda di Bantuin.id.
          </p>
          <div className="text-[11px] text-slate-400 font-medium pt-1">
            Terakhir diperbarui: September 2026 • Kerangka Pengendali Data Pribadi Indonesia
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-white border border-[#DCEAF7] rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-[#486581] leading-relaxed">
          
          {/* 1. Data yang Dikumpulkan */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-[#1683FF]" />
              <h2>1. Jenis Data Pribadi yang Dikumpulkan</h2>
            </div>
            <p>
              Bantuin.id mengumpulkan data yang diberikan secara langsung oleh pengguna untuk keperluan fungsionalitas aplikasi:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] sm:text-xs">
              <li><strong>Data Identitas &amp; Akun:</strong> Nama lengkap, alamat email institusi kampus (@ac.id) atau email pribadi, nomor telepon WhatsApp, dan foto profil.</li>
              <li><strong>Data Verifikasi Keamanan (KYC):</strong> Foto Kartu Tanda Mahasiswa (KTM), foto Kartu Tanda Penduduk (KTP/NIK), dan swafoto (selfie) verifikasi untuk akun penyewa barang bernilai atau helper tugas tatap muka.</li>
              <li><strong>Data Finansial &amp; Pencairan:</strong> Nomor rekening bank mitra, nama pemilik rekening, dan riwayat transaksi escrow untuk kebutuhan pencairan dana melalui payment gateway.</li>
              <li><strong>Data Transaksi &amp; Bukti Fisik:</strong> Nomor seri (Serial Number) gadget sewa, foto kondisi barang sebelum/sesudah serah terima, foto paket tampak luar, dan rekaman percakapan dalam ruang transaksi.</li>
              <li><strong>Data Lokasi &amp; Teknis:</strong> Titik koordinat GPS saat menggunakan fitur pencarian terdekat atau tombol darurat, log alamat IP, dan waktu akses sistem.</li>
            </ul>
          </section>

          {/* 2. Tujuan Pemrosesan Data */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Eye className="w-4 h-4 text-[#1683FF]" />
              <h2>2. Tujuan Pemrosesan Data Pribadi</h2>
            </div>
            <p>Kami memproses data pribadi semata-mata atas dasar persetujuan pengguna dan pelaksanaan kewajiban transaksi:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] sm:text-xs">
              <li>Memverifikasi identitas pengguna guna mencegah akun palsu, penipuan, dan tindak penggelapan rental.</li>
              <li>Memfasilitasi pencocokan tugas (*matching*) antara pemohon dan penyedia bantuan di sekitar lokasi kampus.</li>
              <li>Memproses pembayaran rekening bersama (Escrow) dan pencairan dana ke rekening mitra melalui mitra berizin resmi (Xendit).</li>
              <li>Menyediakan rekam jejak audit (*Audit Trail*) untuk investigasi laporan pelanggaran atau penyelesaian sengketa (Dispute).</li>
            </ul>
          </section>

          {/* 3. Retensi & Penyimpanan Data */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Clock className="w-4 h-4 text-[#1683FF]" />
              <h2>3. Masa Retensi &amp; Keamanan Penyimpanan</h2>
            </div>
            <p>
              Dokumen identitas (KTP/KTM) disimpan dalam ruang penyimpanan privat terenkripsi (AES-256) dan tidak dapat diakses publik. Sesuai dengan <strong>PP No. 71 Tahun 2019</strong> serta regulasi pembukuan keuangan, rekam jejak transaksi elektronik dan audit log disimpan selama <strong>5 (lima) tahun</strong> sebelum dihapus atau di-anonimkan secara permanen.
            </p>
          </section>

          {/* 4. Pengungkapan kepada Pihak Ketiga */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Server className="w-4 h-4 text-[#1683FF]" />
              <h2>4. Pembagian Data kepada Pihak Ketiga</h2>
            </div>
            <p>
              Bantuin.id <strong>tidak pernah memperjualbelikan</strong> data pribadi kepada pihak mana pun. Data hanya dibagikan dalam kondisi terbatas berikut:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] sm:text-xs">
              <li><strong>Penyelenggara Gateway Pembayaran:</strong> Data nomor rekening dan nominal transaksi dibagikan ke Xendit untuk pemrosesan settlement resmi berizin Bank Indonesia.</li>
              <li><strong>Aparat Penegak Hukum:</strong> Data identitas dan log transaksi dapat dibuka kepada Kepolisian Republik Indonesia atau instansi kejaksaan hanya berdasarkan surat perintah penyidikan resmi terkait tindak pidana.</li>
              <li><strong>Institusi Kampus Terkait:</strong> Dalam kasus penipuan atau penggelapan yang melibatkan mahasiswa terverifikasi, data dapat diteruskan ke dekanat/rektorat untuk penegakan kode etik akademik.</li>
            </ul>
          </section>

          {/* 5. Hak Subjek Data Pribadi (UU PDP) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <UserCheck className="w-4 h-4 text-[#1683FF]" />
              <h2>5. Hak Anda sebagai Subjek Data</h2>
            </div>
            <p>Sesuai Bab VI UU PDP No. 27 Tahun 2022, Anda memiliki hak-hak berikut:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 text-xs block">Hak Akses &amp; Informasi</span>
                <span className="text-[11px] text-slate-600 block">Berhak meminta salinan data pribadi yang kami simpan mengenai akun Anda.</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 text-xs block">Hak Pembaruan &amp; Ralat</span>
                <span className="text-[11px] text-slate-600 block">Berhak memperbaiki data yang tidak akurat, tidak lengkap, atau sudah kadaluwarsa.</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 text-xs block">Hak Penghapusan (Erasure)</span>
                <span className="text-[11px] text-slate-600 block">Berhak meminta penghapusan akun dan data pribadi setelah seluruh kewajiban transaksi selesai.</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 text-xs block">Hak Penarikan Persetujuan</span>
                <span className="text-[11px] text-slate-600 block">Berhak mencabut persetujuan pemrosesan data tertentu melalui pengaturan profil.</span>
              </div>
            </div>
          </section>

          {/* 6. Kontak Pengaduan Privasi */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Mail className="w-4 h-4 text-[#1683FF]" />
              <h2>6. Pejabat Pelindungan Data Pribadi (DPO) &amp; Pengaduan</h2>
            </div>
            <p>
              Untuk mengajukan pertanyaan, permintaan akses data, atau keluhan terkait privasi, hubungi petugas kepatuhan kami melalui:
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800 text-xs">Unit Pelindungan Data Pribadi Bantuin.id</div>
                <div className="text-[11px] text-slate-500">Email: privasi@bantuin.id • Subjek: [Pengaduan PDP]</div>
              </div>
              <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                Respon 3x24 Jam Kerja
              </span>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
