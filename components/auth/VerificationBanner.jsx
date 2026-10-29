"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ShieldCheck, Clock, AlertTriangle, ArrowRight } from "lucide-react";

/**
 * VerificationBanner
 * Menampilkan status KYC pengguna di dashboard:
 * - 'unverified'
 * - 'pending_review'
 * - 'rejected' (disertai alasan penolakan)
 * - 'suspended'
 */
export default function VerificationBanner({ user, className = "" }) {
  if (!user) return null;

  const status = user.verificationStatus || "unverified";
  const notes = user.verificationNotes || "";

  if (status === "verified") {
    return null;
  }

  if (status === "pending_review") {
    return (
      <div
        className={`bg-blue-50/90 border border-blue-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 shadow-xs ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Dokumen KYC Sedang Ditinjau Admin</span>
              <span className="text-[10px] bg-blue-100 text-[#1683FF] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Menunggu Persetujuan
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Foto KTP dan data legalitas Anda sedang dalam antrean verifikasi tim admin. Anda tetap dapat menerima pesanan dan beroperasi secara normal. Fitur penarikan saldo akan otomatis terbuka setelah dokumen disetujui.
            </p>
          </div>
        </div>

        <Link
          href="/profile?tab=kyc"
          className="shrink-0 text-xs font-bold text-[#1683FF] hover:text-[#0F6FE5] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-50/50 transition cursor-pointer"
        >
          <span>Cek Status KYC</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        className={`bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 shadow-xs ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-rose-900 flex items-center gap-1.5">
              <span>Pengajuan Verifikasi Identitas Ditolak</span>
              <span className="text-[10px] bg-rose-100 text-rose-700 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Ditolak
              </span>
            </div>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              {notes ? (
                <span>
                  <strong>Alasan Penolakan:</strong> {notes}
                </span>
              ) : (
                "Dokumen KTP yang Anda unggah tidak terbaca atau tidak sesuai ketentuan. Harap unggah ulang dokumen asli yang jelas."
              )}
            </p>
          </div>
        </div>

        <Link
          href="/profile?tab=kyc"
          className="shrink-0 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5 px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
        >
          <span>Unggah Ulang KTP</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div
        className={`bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 border border-rose-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Akun Ditangguhkan (Suspended)</span>
              <span className="text-[10px] bg-rose-500/30 text-rose-300 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Blokir
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {notes ? (
                <span>Alasan: {notes}</span>
              ) : (
                "Akun Anda dibekukan sementara karena terindikasi melanggar pedoman platform Bantuin."
              )}
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/6281234567890?text=Halo%20Admin%20Bantuin%2C%20saya%20ingin%20mengajukan%20banding%20akun%20saya"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 flex items-center gap-1.5 px-4 py-2 rounded-xl transition cursor-pointer"
        >
          <span>Hubungi Bantuan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // Default: unverified
  return (
    <div
      className={`bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-800 shadow-xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
            <span>Verifikasi Identitas (KYC) Belum Lengkap</span>
            <span className="text-[10px] bg-amber-200 text-amber-800 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Belum Verifikasi
            </span>
          </div>
          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
            Akun Anda belum terverifikasi resmi oleh Admin Bantuin. Untuk mengaktifkan fitur <strong>penarikan saldo (withdrawal)</strong> dan meningkatkan kepercayaan pelanggan, silakan lengkapi verifikasi KTP Anda.
          </p>
        </div>
      </div>

      <Link
        href="/profile?tab=kyc"
        className="shrink-0 text-xs font-bold text-white bg-[#1683FF] hover:bg-[#0F6FE5] flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
      >
        <span>Verifikasi Sekarang</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
