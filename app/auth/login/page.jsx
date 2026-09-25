"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { authService, ROLE_LABELS } from "@/lib/services/authService";
import GoogleIcon from "@/components/common/GoogleIcon";
import bgLoginImg from "@/components/image/bgroundlogin.png";
import logoImg from "@/components/image/logo.png";

export default function LoginPage() {
  const router = useRouter();
  const { addToast, setCurrentUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Harap masukkan alamat email Anda.");
      return;
    }
    if (!password) {
      setErrorMsg("Harap masukkan kata sandi akun Anda.");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    try {
      const { user } = await authService.login({
        email,
        password,
      });

      if (setCurrentUser) {
        setCurrentUser(user);
      }

      addToast?.(
        "Login Berhasil",
        `Selamat datang kembali, ${user.fullName || ROLE_LABELS[user.role] || "Pengguna"}!`
      );

      const targetPath = authService.getRedirectPathByRole(user.role);
      router.push(targetPath);
    } catch (err) {
      setErrorMsg(err.message || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
      addToast?.("Login Gagal", err.message || "Terjadi kesalahan saat masuk.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;
    setErrorMsg("");
    setGoogleLoading(true);

    try {
      const { user } = await authService.loginWithGoogle();

      if (setCurrentUser) {
        setCurrentUser(user);
      }

      addToast?.(
        "Login Google Berhasil",
        `Selamat datang, ${user.fullName || "Pengguna"}!`
      );

      const targetPath = authService.getRedirectPathByRole(user.role);
      router.push(targetPath);
    } catch (err) {
      setErrorMsg(err.message || "Login dengan Google gagal. Silakan coba lagi.");
      addToast?.("Google Auth Gagal", err.message || "Terjadi kesalahan saat otentikasi Google.", "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between p-4 sm:p-8 lg:p-12 overflow-x-hidden font-sans">
      {/* Background Image */}
      <Image
        src={bgLoginImg}
        alt="Bantuin Login Background"
        fill
        priority
        className="object-cover object-center -z-10"
      />
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-slate-900/5 -z-10" />

      {/* Main Content Area */}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row items-start justify-between gap-8 py-2 sm:py-6">
        
        {/* ============================================================ */}
        {/* TOP-LEFT: LOGO & SHORT PERSUASIVE TEXT (CLEAN & UNOBSTRUCTED) */}
        {/* ============================================================ */}
        <div className="space-y-3 max-w-md pt-1 sm:pt-4">
          <Link href="/" className="inline-block">
            <Image
              src={logoImg}
              alt="Bantuin.id"
              height={42}
              className="h-9 sm:h-10 w-auto object-contain mix-blend-multiply"
            />
          </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            Solusi Cepat untuk Segala <br className="hidden sm:inline" />
            <span className="text-[#1683FF]">Urusan &amp; Kebutuhanmu</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-sm">
            Bantuan tugas harian, jasa freelance terverifikasi, dan rental perlengkapan resmi dengan jaminan transaksi 100% aman.
          </p>

          <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-slate-700 pt-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1683FF]" />
              <span>Rekening Bersama</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1683FF]" />
              <span>Mitra Terverifikasi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1683FF]" />
              <span>Bebas Admin Awal</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT: CLEAN & ELEVATED LOGIN CARD                           */}
        {/* ============================================================ */}
        <div className="w-full max-w-md mx-auto lg:ml-auto lg:mr-0">
          <div className="bg-white/95 backdrop-blur-md py-7 sm:py-9 px-6 sm:px-8 shadow-[0_20px_50px_rgba(16,42,67,0.12)] border border-white/80 rounded-3xl space-y-5">
            
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Masuk ke Akun
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Masukkan email terdaftar atau lanjutkan dengan akun Google Anda
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium animate-in fade-in duration-150">
                {errorMsg}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 bg-white transition"
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
                    placeholder="••••••••"
                    className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 bg-white transition"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded text-[#1683FF]" />
                  <span>Ingat saya</span>
                </label>
                <a href="#" className="font-bold text-[#1683FF] hover:underline">
                  Lupa kata sandi?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
              >
                <span>{loading ? "Memproses Verifikasi..." : "Masuk Sekarang"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white/90 px-3 text-slate-400 font-medium">
                  atau masuk dengan
                </span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              disabled={loading || googleLoading}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
            >
              {googleLoading ? (
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

            <div className="pt-2 text-center text-xs text-slate-500">
              Belum punya akun?{" "}
              <Link href="/auth/register" className="font-bold text-[#1683FF] hover:underline">
                Daftar akun baru
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Subtle Bottom Footer */}
      <div className="w-full max-w-7xl mx-auto text-left text-[11px] text-slate-500 font-medium pt-4 pointer-events-none">
        &copy; {new Date().getFullYear()} Bantuin.id &middot; Platform Bantuan, Jasa &amp; Sewa Komunitas
      </div>
    </div>
  );
}

