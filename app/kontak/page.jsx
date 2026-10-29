"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  HelpCircle,
  FileText,
  AlertCircle
} from "lucide-react";

export default function KontakPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Transaksi & Pembayaran",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: "Transaksi & Pembayaran",
        message: "",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 md:px-6 py-10 sm:py-14 space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[#1683FF] text-xs font-bold mb-1">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Pusat Bantuan &amp; Kontak Resmi</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#102A43] tracking-tight">
            Hubungi Tim Bantuin
          </h1>
          <p className="text-xs sm:text-sm text-[#61758A] leading-relaxed">
            Punya pertanyaan seputar transaksi, kendala pesanan, kebijakan pengembalian dana (refund), atau kemitraan? Tim kami siap membantu Anda.
          </p>
        </div>

        {/* 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Official Business Information (Midtrans Verification Compliance) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white border border-[#DCEAF7] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-[#102A43] border-b border-slate-100 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1683FF]" />
                Informasi Kontak Bisnis Resmi
              </h2>

              <div className="space-y-5 text-xs sm:text-sm">
                
                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center shrink-0 border border-blue-100">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs font-semibold">Email Resmi Bisnis &amp; Bantuan</div>
                    <a 
                      href="mailto:hellobantuinaja@gmail.com" 
                      className="font-bold text-slate-800 hover:text-[#1683FF] transition block mt-0.5"
                    >
                      hellobantuinaja@gmail.com
                    </a>
                    <span className="text-[11px] text-slate-500">Untuk pertanyaan umum, pengaduan, &amp; dokumen verifikasi</span>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs font-semibold">WhatsApp Layanan Pelanggan</div>
                    <a 
                      href="https://wa.me/6283843653251" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-bold text-slate-800 hover:text-emerald-600 transition block mt-0.5"
                    >
                      +62 838-4365-3251 (083843653251)
                    </a>
                    <span className="text-[11px] text-emerald-700 font-medium">Layanan chat responsif &amp; investigasi sengketa</span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs font-semibold">Alamat Kantor Operasional</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      Purwokerto, Jawa Tengah, Indonesia
                    </div>
                    <span className="text-[11px] text-slate-500">Pusat operasional ekosistem layanan kampus Bantuin.id</span>
                  </div>
                </div>

                {/* Operational Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs font-semibold">Jam Operasional Layanan</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      Senin – Minggu: 08.00 – 22.00 WIB
                    </div>
                    <span className="text-[11px] text-slate-500">Permintaan di luar jam operasional diproses di sesi berikutnya</span>
                  </div>
                </div>

              </div>

              {/* Direct WhatsApp CTA Button */}
              <div className="pt-2">
                <a
                  href="https://wa.me/6283843653251?text=Halo%20Admin%20Bantuin,%20saya%20butuh%20bantuan%20terkait%20pesanan/layanan."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-[0.98]"
                >
                  <Phone className="w-4 h-4" />
                  <span>Chat WhatsApp Langsung ke Tim CS</span>
                </a>
              </div>
            </div>

            {/* Quick Policies Links Card */}
            <div className="p-5 bg-blue-50/80 border border-blue-200/90 rounded-3xl space-y-3">
              <div className="font-bold text-xs text-[#102A43] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1683FF]" />
                <span>Dokumen Kebijakan &amp; Kepatuhan</span>
              </div>
              <ul className="space-y-2 text-xs text-[#486581]">
                <li>
                  <Link href="/syarat-ketentuan" className="hover:text-[#1683FF] font-medium flex items-center gap-1.5">
                    <span>→ Syarat &amp; Ketentuan Layanan (TOS)</span>
                  </Link>
                </li>
                <li>
                  <Link href="/syarat-ketentuan#kebijakan-refund" className="hover:text-[#1683FF] font-medium flex items-center gap-1.5 text-blue-700 font-bold">
                    <span>→ Kebijakan Pembatalan &amp; Pengembalian Dana (Refund)</span>
                  </Link>
                </li>
                <li>
                  <Link href="/kebijakan-privasi" className="hover:text-[#1683FF] font-medium flex items-center gap-1.5">
                    <span>→ Kebijakan Pelindungan Data Pribadi (UU PDP)</span>
                  </Link>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-[#DCEAF7] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              
              <div>
                <h2 className="text-xl font-bold text-[#102A43]">Kirim Pesan / Pengaduan</h2>
                <p className="text-xs sm:text-sm text-[#61758A] mt-1">
                  Isi formulir berikut dan tim kami akan merespons melalui email atau WhatsApp dalam 1x24 jam kerja.
                </p>
              </div>

              {isSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-emerald-900">
                    <strong className="block font-bold">Pesan Anda Berhasil Terkirim!</strong>
                    Tiket pengaduan telah dicatat. Tim kami akan menghubungi Anda melalui email <strong>hellobantuinaja@gmail.com</strong> atau WhatsApp resmi.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] transition"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Email Aktif</label>
                    <input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nomor WhatsApp</label>
                    <input
                      type="tel"
                      required
                      placeholder="08xxxxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] transition"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Kategori Topik</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] transition bg-white"
                    >
                      <option value="Transaksi & Pembayaran">Transaksi &amp; Pembayaran Midtrans</option>
                      <option value="Klaim Refund & Sengketa">Klaim Refund &amp; Sengketa Pesanan</option>
                      <option value="Pengembalian Uang Jaminan Sewa">Pengembalian Uang Jaminan (Deposit)</option>
                      <option value="Kendala Akun & Verifikasi">Kendala Akun &amp; Verifikasi KYC</option>
                      <option value="Kemitraan Toko / Jasa">Pendaftaran Kemitraan Toko / Jasa</option>
                      <option value="Lainnya">Pertanyaan Lainnya</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Detail Pesan / Pengaduan</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Jelaskan kebutuhan, kendala transaksi, atau nomor invoice pesanan Anda..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] transition"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[#1683FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? "Mengirim Pesan..." : "Kirimkan Pesan"}</span>
                </button>

                <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Data Anda terlindungi oleh UU No. 27/2022 tentang Pelindungan Data Pribadi</span>
                </div>

              </form>

            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
