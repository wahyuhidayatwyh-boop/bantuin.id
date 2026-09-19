"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock, Mail } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useApp();
  const [email, setEmail] = useState("pengguna@bantuin.id");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      addToast("Login Berhasil", "Selamat datang kembali di Bantuin!");
      router.push("/bantuan");
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#F5FAFF] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#1683FF] flex items-center justify-center text-white font-bold text-2xl shadow-md">
            B
          </div>
          <span className="font-bold text-2xl tracking-tight text-[#102A43]">
            Bantuin<span className="text-[#1683FF]">.</span>
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-bold text-[#102A43]">
          Masuk ke Akun Bantuin
        </h2>
        <p className="text-xs sm:text-sm text-[#61758A] mt-1">
          Satu akun untuk request bantuan, membantu, dan rental barang.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-[0_8px_30px_rgba(16,42,67,0.06)] border border-[#DCEAF7] rounded-3xl sm:px-10">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-[#102A43] mb-1">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#61758A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-[#DCEAF7] focus:outline-none focus:border-[#1683FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102A43] mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#61758A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-xl border border-[#DCEAF7] focus:outline-none focus:border-[#1683FF]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-1.5 text-[#61758A] cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                <span>Ingat saya</span>
              </label>
              <a href="#" className="font-semibold text-[#1683FF] hover:underline">
                Lupa sandi?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1683FF] text-white text-xs sm:text-sm font-semibold hover:bg-[#0F6FE5] shadow transition flex items-center justify-center gap-2"
            >
              <span>{loading ? "Memproses..." : "Masuk Sekarang"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#61758A]">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="font-bold text-[#1683FF] hover:underline">
              Daftar akun baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
