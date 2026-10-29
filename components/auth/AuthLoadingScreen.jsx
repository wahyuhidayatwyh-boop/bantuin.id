"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import logoImg from "@/components/image/logo.png";
import logoTab from "@/components/image/logotab.png";

/**
 * AuthLoadingScreen
 * Layar transisi fullscreen modern yang dirender via React Portal langsung ke document.body.
 * Menghindari terperangkap di dalam containing block kartu (seperti card dengan backdrop-filter).
 * Memastikan tampilan 100% fullscreen bersih langsung di atas background utama tanpa kartu ganda,
 * tanpa logo ganda, dan tanpa footer ganda.
 */
export default function AuthLoadingScreen({
  title = "Menghubungkan ke Google...",
  subtitle = "Mengarahkan ke halaman masuk resmi Google yang aman, mohon tunggu sebentar...",
  status = "loading", // "loading" | "success"
}) {
  const [mounted, setMounted] = useState(false);
  const isSuccess = status === "success";

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const content = (
    <div
      id="auth-loading-overlay"
      className="fixed inset-0 z-[9999999] w-full h-full min-h-[100dvh] flex flex-col items-center justify-between p-6 sm:p-8 bg-gradient-to-br from-[#EBF3FE] via-[#F0F6FF] to-[#DEEEFC] font-sans animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* 1. Subtle Dot Matrix Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(#1683FF 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 2. Soft Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-300/25 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Anchor: Satu Logo Tunggal Bersih */}
      <div className="relative z-10 pt-4 sm:pt-6">
        <Image
          src={logoImg}
          alt="BantuinAja.id"
          height={38}
          className="h-8 sm:h-9 w-auto object-contain mix-blend-multiply opacity-90"
          priority
        />
      </div>

      {/* Center Floating Icon & Status: Langsung di atas Background Tanpa Card/Box Bertingkat */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto my-auto space-y-6">
        {/* Animated Brand Badge with Breathing Rings */}
        <div className="relative flex items-center justify-center">
          {isSuccess ? (
            <div className="relative w-20 h-20 rounded-2xl bg-white shadow-xl shadow-emerald-500/15 flex items-center justify-center border border-emerald-100 p-2 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
            </div>
          ) : (
            <>
              <div className="absolute -inset-3 rounded-3xl bg-blue-400/20 animate-ping opacity-60" />
              <div className="absolute -inset-2 rounded-3xl bg-blue-500/15 animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-white shadow-xl shadow-blue-500/10 flex items-center justify-center border border-white/90 p-2">
                <Image
                  src={logoTab}
                  alt="Bantuin"
                  width={56}
                  height={56}
                  className="w-14 h-14 object-contain rounded-xl"
                  priority
                />
              </div>
            </>
          )}
        </div>

        {/* Status Text & Modern Slim Progress Bar */}
        <div className="space-y-3 w-full">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            {subtitle}
          </p>

          {/* Slim Animated Gradient Progress Line (Hanya tampil saat status loading) */}
          {!isSuccess && (
            <div className="w-48 mx-auto h-1.5 bg-blue-100/80 rounded-full overflow-hidden mt-4 shadow-inner relative">
              <div
                className="h-full bg-gradient-to-r from-[#1683FF] via-[#00B4D8] to-[#1683FF] rounded-full"
                style={{
                  width: "45%",
                  animation: "authLoadingSlide 1.4s infinite ease-in-out",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer with Security Seal: Satu Footer Tunggal Bersih */}
      <div className="relative z-10 pb-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
        <span>&copy; {new Date().getFullYear()} BantuinAja.id &middot; Autentikasi Terenkripsi &amp; Aman</span>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
