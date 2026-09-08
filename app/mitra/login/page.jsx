"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoImg from "@/components/image/logo.png";
import { Store, ShieldCheck, ArrowRight, Lock, Mail, ArrowLeft } from "lucide-react";

export default function MitraLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("mitra@bantuin.id");
  const [password, setPassword] = useState("password123");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/mitra/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1528] via-[#102444] to-[#0A1120] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#1683FF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-white px-2.5 py-1 rounded-xl">
            <Image
              src={logoImg}
              alt="Bantuin"
              height={28}
              className="h-6 w-auto object-contain"
            />
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-md transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Center Login Card */}
      <div className="max-w-md w-full mx-auto my-auto z-10 py-8">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[32px] p-6 sm:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
          
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-[0_8px_20px_rgba(16,185,129,0.3)]">
              <Store className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Portal Mitra Merchant
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Masuk ke dashboard pengelolaan rental kamera, percetakan, sound & vendor event.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Email Mitra Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                  placeholder="nama@toko-mitra.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-400 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
                <span>Ingat akun saya</span>
              </label>
              <a href="#" className="hover:text-emerald-400 transition">Lupa sandi?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? "Memverifikasi Akun..." : "Masuk ke Dashboard Mitra"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Escrow Guarantee Badge */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-[11px] text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Escrow & Rekening Merchant Terverifikasi</span>
          </div>

        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-[1200px] w-full mx-auto text-center text-xs text-slate-500 z-10">
        © 2026 Bantuin Mitra Hub. All rights reserved.
      </div>

    </div>
  );
}
