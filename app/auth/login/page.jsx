"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { authService, ROLE_LABELS } from "@/lib/services/authService";
import GoogleIcon from "@/components/common/GoogleIcon";
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
    <div className="min-h-screen relative flex flex-col justify-between p-4 sm:p-6 lg:p-8 overflow-x-hidden font-sans bg-gradient-to-br from-[#EBF3FE] via-[#F0F6FF] to-[#DEEEFC]">
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

      {/* ============================================================ */}
      {/* CENTERED MAIN CONTAINER: LOGO & LOGIN CARD                   */}
      {/* ============================================================ */}
      <div className="w-full max-w-md mx-auto my-auto space-y-4 z-10 py-6">
        
        {/* Brand Logo Centered */}
        <div className="flex justify-center">
          <Link href="/" className="inline-block transition hover:opacity-90">
            <Image
              src={logoImg}
              alt="Bantuin.id"
              height={48}
              className="h-10 sm:h-12 w-auto object-contain mix-blend-multiply"
            />
          </Link>
        </div>

        {/* Clean & Elevated Login Card */}
        <div className="bg-white/95 backdrop-blur-md py-7 sm:py-8 px-6 sm:px-8 shadow-[0_20px_50px_rgba(16,42,67,0.12)] border border-white/80 rounded-3xl space-y-5">
          <div className="text-center sm:text-left">
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

            <div className="flex items-center justify-between text-xs pt-0.5">
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
              className="w-full py-2.5 sm:py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              <span>{loading ? "Memproses Verifikasi..." : "Masuk Sekarang"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-3 sm:my-4">
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

          <div className="pt-1 text-center text-xs text-slate-500">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="font-bold text-[#1683FF] hover:underline">
              Daftar akun baru
            </Link>
          </div>
        </div>

      </div>

      {/* Subtle Bottom Footer */}
      <footer className="w-full max-w-md mx-auto text-center text-[11px] text-slate-500 font-medium pt-2 pointer-events-none z-10">
        &copy; {new Date().getFullYear()} Bantuin.id &middot; Platform Bantuan, Jasa &amp; Sewa Komunitas
      </footer>
    </div>
  );
}

