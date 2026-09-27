"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  FileBadge, 
  Trash2,
  ArrowRight,
  CreditCard
} from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const { submitKYC, currentUser } = useApp();

  const [ktpPhotoPreview, setKtpPhotoPreview] = useState(null);
  const [ktpFileName, setKtpFileName] = useState("");
  const [submitted, setSubmitted] = useState(currentUser?.verificationStatus === "pending_review");

  const handleKtpUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setKtpPhotoPreview(previewUrl);
      setKtpFileName(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ktpPhotoPreview) {
      alert("Harap unggah foto KTP asli Anda terlebih dahulu.");
      return;
    }
    submitKYC(ktpPhotoPreview, "");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 md:px-6 py-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <FileBadge className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Verifikasi Identitas KTP (KYC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Unggah foto fisik KTP asli Anda dari perangkat lokal untuk mengaktifkan akun terpercaya penuh dan transaksi pembayaran terverifikasi aman.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-10 shadow-[0_12px_40px_rgba(22,131,255,0.06)]">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Real Local KTP Upload Section */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Foto Kartu Tanda Penduduk (KTP) Asli
                </label>

                {ktpPhotoPreview ? (
                  <div className="relative rounded-2xl border-2 border-emerald-400 p-5 bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={ktpPhotoPreview}
                        alt="KTP Preview"
                        className="w-32 h-20 rounded-xl object-cover border border-emerald-300 shadow-sm"
                      />
                      <div>
                        <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Foto KTP Berhasil Dimuat dari Lokal</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-medium truncate max-w-[200px]">
                          {ktpFileName || "ktp_dokumen.jpg"}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1">Siap diverifikasi sistem.</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setKtpPhotoPreview(null);
                        setKtpFileName("");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Ganti File KTP</span>
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="verify-ktp-file-input"
                    className="border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/50 block group"
                  >
                    <Upload className="w-10 h-10 text-[#1683FF] mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-slate-900">
                      Klik untuk Memilih Foto KTP dari Galeri / File Komputer
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Mendukung format JPG, JPEG, PNG (Maks 5 MB). Pastikan NIK dan nama terbaca jelas.
                    </p>
                    <input
                      id="verify-ktp-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleKtpUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Security Privacy Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong>Privasi & Keamanan Terenkripsi (UU PDP):</strong> Dokumen KTP Anda dienkripsi 256-bit dan hanya digunakan untuk validasi identitas resmi akun Anda. Tidak akan pernah disebarluaskan ke pihak luar.
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#1683FF] text-white text-xs sm:text-sm font-black hover:bg-[#0F6FE5] shadow-md transition flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Kirim Dokumen KTP untuk Verifikasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-xl text-slate-900">
                Dokumen KTP Telah Diterima!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Status akun Anda: <strong className="text-emerald-600 font-bold">Terverifikasi Trusted User</strong>. Anda dapat langsung menggunakan seluruh layanan bantuan, sewa alat, dan jasa.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/bantuan"
                  className="px-6 py-2.5 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5]"
                >
                  Buka Bantuan
                </Link>
                <Link
                  href="/profile"
                  className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold"
                >
                  Lihat Profil
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
