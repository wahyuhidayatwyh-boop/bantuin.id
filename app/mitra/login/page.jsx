"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoImg from "@/components/image/logo.png";
import { Store, ShieldCheck, ArrowRight, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import GoogleIcon from "@/components/common/GoogleIcon";
import { authService, CANONICAL_ROLES } from "@/lib/services/authService";

export default function MitraLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("mitra@bantuin.id");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/mitra/dashboard");
    }, 800);
  };

  const handleGoogleLogin = async () => {
    if (isLoading || isGoogleLoading) return;
    setIsGoogleLoading(true);
    try {
      await authService.loginWithGoogle();
      router.push("/mitra/dashboard");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-x-hidden font-sans bg-gradient-to-br from-[#EBF3FE] via-[#F0F6FF] to-[#DEEEFC] text-slate-800">
      
      {/* 1. Subtle Dot Grid Matrix Motif Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(#1683FF 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 2. Ambient Soft Glow Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-300/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between z-10 py-2">
        <Link href="/" className="inline-block transition hover:opacity-90">
          <Image
            src={logoImg}
            alt="Bantuin"
            height={40}
            className="h-9 sm:h-10 w-auto object-contain mix-blend-multiply"
          />
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#1683FF] bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-2xs backdrop-blur-md transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Center Login Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-6 sm:py-8 space-y-4">
        
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md py-7 sm:py-8 px-6 sm:px-8 shadow-[0_20px_50px_rgba(16,42,67,0.12)] border border-white/80 rounded-3xl space-y-5">
          
          {/* Header */}
          <div className="text-center">
            <div className="w-13 h-13 rounded-2xl bg-blue-50 text-[#1683FF] border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Portal Mitra Merchant
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola etalase rental kamera, percetakan, sound &amp; vendor event di ekosistem Bantuin
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Mitra Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 bg-white text-slate-900 transition"
                  placeholder="nama@toko-mitra.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 bg-white text-slate-900 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded accent-[#1683FF]" />
                <span>Ingat akun saya</span>
              </label>
              <Link href="#" className="hover:text-[#1683FF] font-medium transition">
                Lupa sandi?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1683FF] to-[#0F6FE5] hover:from-[#0F6FE5] hover:to-[#0B56B3] text-white font-bold text-xs sm:text-sm shadow-[0_8px_20px_rgba(22,131,255,0.25)] transition active:scale-95 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
            >
              <span>{isLoading ? "Memverifikasi Akun..." : "Masuk ke Dashboard Mitra"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">
                atau masuk dengan
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            disabled={isLoading || isGoogleLoading}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
                <span>Menghubungkan ke Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>Lanjutkan dengan Google</span>
              </>
            )}
          </button>

          {/* Switch to Mitra Register */}
          <div className="pt-2 text-center text-xs text-slate-600">
            Belum terdaftar sebagai mitra toko?{" "}
            <Link
              href="/mitra/register"
              className="text-[#1683FF] font-bold hover:underline"
            >
              Buka Toko Sekarang
            </Link>
          </div>

          {/* Security Badge */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
            <span>Sistem Terverifikasi &amp; Rekening Merchant Resmi</span>
          </div>

        </div>

      </div>

      {/* Footer Info */}
      <div className="max-w-[1200px] w-full mx-auto text-center text-xs text-slate-400 z-10 py-2">
        © 2026 Bantuin Mitra Hub. Seluruh hak cipta dilindungi.
      </div>

    </div>
  );
}
