"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import { LogOut, ArrowRight, ShieldCheck } from "lucide-react";

import { authService } from "@/lib/services/authService";

export default function LogoutPage() {
  const { setCurrentUser } = useApp();

  useEffect(() => {
    // Clear user session using centralized authService
    authService.logout();
    if (setCurrentUser) {
      setCurrentUser(null);
    }
  }, [setCurrentUser]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Top Header */}
      <div className="max-w-md w-full mx-auto flex items-center justify-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoImg}
            alt="Bantuin"
            height={36}
            className="h-8 w-auto object-contain mix-blend-multiply"
          />
        </Link>
      </div>

      {/* Center Logout Card */}
      <div className="max-w-md w-full mx-auto my-auto">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 text-center shadow-[0_12px_36px_rgba(22,131,255,0.08)] animate-in fade-in zoom-in-95 duration-200">
          
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
            <LogOut className="w-8 h-8 ml-0.5" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Anda Telah Berhasil Keluar
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
            Sesi akun Anda telah diakhiri dengan aman. Terima kasih telah menggunakan layanan Bantuin.
          </p>

          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <Link
              href="/auth/login"
              className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Masuk Kembali</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition block"
            >
              Kembali ke Beranda
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Proteksi & Data Transaksi Tersimpan Aman</span>
          </div>

        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-md w-full mx-auto text-center text-xs text-slate-400">
        © 2026 Bantuin. Aman, Transparan & Terpercaya.
      </div>

    </div>
  );
}
