import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  ShieldCheck, 
  Scale, 
  Lock, 
  FileText, 
  Eye, 
  Ban, 
  Package, 
  Building2, 
  HelpCircle,
  Clock,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Flag
} from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[960px] w-full mx-auto px-4 md:px-6 py-10 sm:py-14 space-y-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1683FF] text-xs font-bold mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Tata Kelola Platform &amp; Kepatuhan Hukum</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
            Syarat &amp; Ketentuan Layanan (TOS)
          </h1>
          <p className="text-xs sm:text-sm text-[#61758A] leading-relaxed">
            Pedoman hak, kewajiban, dan batasan tanggung jawab pengguna, penyedia bantuan, dan mitra sewa di platform Bantuin.id.
          </p>
          <div className="text-[11px] text-slate-400 font-medium pt-1">
            Terakhir diperbarui: September 2026 • Kerangka Kepatuhan PP No. 71/2019, Permenkominfo No. 5/2020, &amp; UU PDP No. 27/2022
          </div>
        </div>

        {/* Highlight Summary Card */}
        <div className="p-5 sm:p-6 bg-blue-50/80 border border-blue-200 rounded-3xl space-y-3">
          <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-[#1683FF] shrink-0" />
            <span>Prinsip Utama Tata Kelola Sistem Elektronik Bantuin</span>
          </div>
          <p className="text-xs sm:text-sm text-[#486581] leading-relaxed">
            Bantuin.id beroperasi sebagai Penyelenggara Sistem Elektronik (PSE) Lingkup Privat yang memfasilitasi interaksi dan transaksi antar pengguna. Berdasarkan <strong>PP No. 71 Tahun 2019</strong> dan <strong>Permenkominfo No. 5 Tahun 2020</strong>, Bantuin.id menyelenggarakan sistem elektronik yang andal, aman, dan bertanggung jawab, menyediakan mekanisme pelaporan pelanggaran (<em>Notice and Takedown</em>), serta memfasilitasi perlindungan hak pengguna melalui Sistem Pembayaran Terverifikasi Payment Gateway resmi berizin Bank Indonesia.
          </p>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white border border-[#DCEAF7] rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-[#486581] leading-relaxed">
          
          {/* Section 1: Kedudukan Hukum Platform & Batasan Tanggung Jawab */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Scale className="w-4 h-4 text-[#1683FF]" />
              <h2>1. Kedudukan Hukum Platform</h2>
            </div>
            <p>
              Bantuin.id bertindak sebagai platform perantara teknologi digital yang mempertemukan pihak yang membutuhkan bantuan tugas, pengguna jasa lepas (freelance), dan pemilik persewaan barang dalam komunitas kampus.
            </p>
            <p>
              Sesuai dengan ketentuan <strong>UU ITE (UU No. 11/2008 jo UU No. 1/2024)</strong> serta <strong>PP No. 71 Tahun 2019</strong>, Bantuin.id menyelenggarakan sistem transaksi elektronik yang aman dan memfasilitasi moderasi konten. Bantuin.id bukan merupakan pihak yang mempekerjakan langsung, bukan penyedia logistik kurir mandiri, dan bukan pemilik aset barang sewa. Hubungan perikatan yang timbul dalam pelaksanaan tugas atau persewaan merupakan kesepakatan langsung antar pihak pengguna.
            </p>
          </section>

          {/* Section 2: Matriks Pembagian Tanggung Jawab Pengguna & Platform */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-[#1683FF]" />
              <h2>2. Matriks Tanggung Jawab Para Pihak (Model 4 Pilar)</h2>
            </div>
            <p>Untuk memastikan kejelasan hak dan kewajiban, tanggung jawab dibagi secara tegas menurut model layanan:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Package className="w-4 h-4 text-[#1683FF]" />
                  <span>A. Layanan Bantuan &amp; Titip (Errand)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>Pengirim</strong> bertanggung jawab mutlak atas legalitas dan kebenaran isi muatan barang yang dideklarasikan. <strong>Helper</strong> bertanggung jawab mengantarkan paket sesuai instruksi dan mengambil dokumentasi kondisi luar paket saat penjemputan dan penyerahan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Wrench className="w-4 h-4 text-[#1683FF]" />
                  <span>B. Layanan Jasa Keahlian</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>Mitra Penyedia Jasa</strong> bertanggung jawab atas orisinalitas dan kualitas hasil pekerjaan sesuai brief kesepakatan. <strong>Pemesan Jasa</strong> bertanggung jawab memberikan arahan yang jelas dan melunasi pembayaran melalui sistem pembayaran resmi Bantuin.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <FileText className="w-4 h-4 text-[#1683FF]" />
                  <span>C. Layanan Sewa Barang (Rental)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <strong>Pemilik</strong> bertanggung jawab atas fungsi normal dan keaslian unit saat diserahkan. <strong>Penyewa</strong> bertanggung jawab memelihara barang selama masa sewa dan mengembalikan unit sesuai waktu kesepakatan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#1683FF]" />
                  <span>D. Tanggung Jawab Platform Bantuin</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Menyediakan sistem aplikasi yang andal, mengelola verifikasi penerimaan pembayaran resmi melalui Payment Gateway resmi, memfasilitasi pelaporan pelanggaran (<em>Notice and Takedown</em>), mencatat audit log transaksi, dan memediasi sengketa antar pihak.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Hak Mitra Menolak Pesanan & Pengiriman Barang */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Package className="w-4 h-4 text-[#1683FF]" />
              <h2>3. Ketentuan Pengiriman &amp; Hak Penolakan Mitra</h2>
            </div>
            <div className="space-y-2">
              <p>
                <strong>3.1 Deklarasi Muatan Wajib:</strong> Pengirim wajib mendeklarasikan jenis isi paket secara jujur pada aplikasi. Pengirim dilarang mengirimkan paket tertutup dengan isi yang disembunyikan jika mencurigakan.
              </p>
              <p>
                <strong>3.2 Hak Penolakan Mitra (*Right of Refusal*):</strong> Helper berhak menolak atau membatalkan pesanan secara sepihak di lokasi penjemputan jika paket menimbulkan kecurigaan wajar (berbau menyengat, cairan tidak dikenal, atau pengirim menolak memberi keterangan mengenai jenis barang). Pembatalan atas dasar perlindungan keselamatan tidak akan mengakibatkan penalti performa pada akun helper.
              </p>
              <p>
                <strong>3.3 Dokumentasi Bukti Luar (*Proof of Handling*):</strong> Helper dianjurkan mengambil foto tampak luar kemasan saat menerima dan menyerahkan barang sebagai bukti integritas rantai penyerahan paket.
              </p>
            </div>
          </section>

          {/* Section 4: Ketentuan Sewa Barang & Wanprestasi/Tindak Pidana */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-[#1683FF]" />
              <h2>4. Ketentuan Sewa Barang, Wanprestasi &amp; Penegakan Hukum</h2>
            </div>
            <div className="space-y-2">
              <p>
                <strong>4.1 Pencatatan Nomor Seri (Serial Number):</strong> Untuk unit sewa bernilai tinggi (kamera, gadget, laptop), kedua pihak wajib mendokumentasikan nomor seri fisik unit pada form serah terima aplikasi guna menghindari penukaran komponen atau unit palsu.
              </p>
              <p>
                <strong>4.2 Keterlambatan dan Unsur Pidana:</strong> Hubungan sewa pada dasarnya merupakan perjanjian keperdataan. Namun, apabila penyewa tidak mengembalikan unit sewa melewati batas waktu yang disepakati, menolak komunikasi, atau terindikasi memindahtangankan/menggadaikan barang sewa, perbuatan tersebut dapat memenuhi unsur tindak pidana berdasarkan peraturan perundang-undangan pidana yang berlaku (termasuk ketentuan hukum pidana materiil KUHP/UU No. 1 Tahun 2023).
              </p>
              <p>
                <strong>4.3 Penyerahan Data kepada Penegak Hukum:</strong> Dalam hal terdapat indikasi tindak pidana atau laporan resmi dari pemilik barang, Bantuin berhak dan berkewajiban menyerahkan data identitas verifikasi (KTM/KTP, log koordinat, dan riwayat chat) kepada aparat penegak hukum yang berwenang dan pihak dekanat/rektorat kampus terkait.
              </p>
            </div>
          </section>

          {/* Section 5: Daftar Barang & Jasa yang Dilarang */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-rose-700 font-bold text-base border-b border-rose-100 pb-2">
              <Ban className="w-4 h-4 text-rose-600" />
              <h2>5. Barang &amp; Aktivitas yang Dilarang Keras</h2>
            </div>
            <p>Pengguna dilarang memanfaatkan platform untuk memfasilitasi:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-1">
                <span className="font-bold text-rose-900 text-xs block">Narkotika &amp; Obat Terlarang</span>
                <span className="text-[11px] text-rose-700 block">Zat narkotika, psikotropika, obat keras daftar G tanpa resep resmi, dan miras oplosan ilegal.</span>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-1">
                <span className="font-bold text-rose-900 text-xs block">Pelanggaran Integritas Akademik</span>
                <span className="text-[11px] text-rose-700 block">Jasa pembuatan skripsi/tesis (joki), pengerjaan ujian resmi, atau pemalsuan tanda tangan akademik (Permendikbudristek No. 39/2021).</span>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-1">
                <span className="font-bold text-rose-900 text-xs block">Senjata &amp; Benda Berbahaya</span>
                <span className="text-[11px] text-rose-700 block">Senjata tajam tanpa izin, senjata api, amunisi, bahan peledak, atau zat kimia beracun.</span>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-1">
                <span className="font-bold text-rose-900 text-xs block">Asusila &amp; Eksploitasi</span>
                <span className="text-[11px] text-rose-700 block">Layanan kencan berbayar, prostitusi terselubung, materi pornografi, atau pelecehan seksual.</span>
              </div>
            </div>
          </section>

          {/* Section 6: Pembayaran Terverifikasi & Anti-Disintermediasi */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Lock className="w-4 h-4 text-[#1683FF]" />
              <h2>6. Pembayaran Terverifikasi &amp; Ketentuan Anti-Disintermediasi</h2>
            </div>
            <p>
              Seluruh pembayaran diproses melalui Payment Gateway berizin resmi Bank Indonesia dan sistem pencatatan hak bayar terverifikasi Bantuin.
            </p>
            <p>
              Pengguna sangat diimbau tidak melakukan transfer langsung ke rekening pribadi di luar sistem sebelum pesanan disepakati secara sah. Segala risiko kerugian atas transaksi di luar sistem menjadi tanggung jawab pribadi pengguna dan tidak tercakup dalam perlindungan dana platform Bantuin.
            </p>
          </section>

          {/* Section 7: Mekanisme Pelaporan (Notice and Takedown) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Flag className="w-4 h-4 text-amber-500" />
              <h2>7. Mekanisme Pelaporan &amp; Moderasi Konten (Notice &amp; Takedown)</h2>
            </div>
            <p>
              Sebagai wujud kepatuhan terhadap <strong>Permenkominfo No. 5 Tahun 2020</strong>, Bantuin menyediakan fitur <strong>Laporkan Masalah</strong> di setiap ruang obrolan dan transaksi. Pengguna dapat melaporkan indikasi penipuan, muatan ilegal, atau pelanggaran etika. Laporan akan ditinjau oleh tim moderasi dengan tahapan status: <em>Diterima (Open)</em> &rarr; <em>Sedang Ditinjau (Under Review)</em> &rarr; <em>Selesai / Ditindak (Resolved)</em>.
            </p>
          </section>

          {/* Section 8: Pelindungan Data Pribadi & Kontak */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#102A43] font-bold text-base border-b border-slate-100 pb-2">
              <Eye className="w-4 h-4 text-[#1683FF]" />
              <h2>8. Pelindungan Data Pribadi (UU PDP) &amp; Pengaduan</h2>
            </div>
            <p>
              Pemrosesan data pribadi tunduk pada <strong>UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi</strong>. Rincian perihal jenis data, tujuan pemrosesan, retensi, dan hak subjek data diatur secara komprehensif pada halaman Kebijakan Privasi terpisah.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-800 text-xs">Pusat Layanan &amp; Pengaduan Komunitas</div>
                <div className="text-[11px] text-slate-500">Email: bantuan@bantuin.id • Jam Kerja: 08.00 - 22.00 WIB</div>
              </div>
              <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 self-start sm:self-auto">
                Merespons dalam 24 Jam
              </span>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
