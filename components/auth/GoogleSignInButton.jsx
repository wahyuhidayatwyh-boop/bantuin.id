"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import GoogleIcon from "@/components/common/GoogleIcon";
import { authService } from "@/lib/services/authService";
import { useApp } from "@/lib/context/AppContext";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";

/**
 * GoogleSignInButton
 * Tombol Autentikasi Google yang aman, responsif, dan bebas error origin_mismatch.
 * Menggunakan direct authentication flow dengan loading screen immersive modern.
 */
export default function GoogleSignInButton({
  role = "user",
  mode = "login", // 'login' | 'register'
  label = "Lanjutkan dengan Google",
  onSuccess = null,
  onError = null,
  disabled = false,
  className = "",
}) {
  const { addToast } = useApp() || {};
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    let timer;
    if (isProcessing) {
      timer = setTimeout(() => {
        setIsProcessing(false);
      }, 20000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isProcessing]);

  const handleClick = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      await authService.loginWithGoogle(role, mode);
    } catch (err) {
      console.error("Google Auth Error:", err);
      addToast?.("Gagal Masuk via Google", err.message || "Terjadi kesalahan saat otentikasi Google.", "error");
      setIsProcessing(false);
      onError?.(err);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled || isProcessing}
        onClick={handleClick}
        className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200/90 hover:bg-slate-50/80 bg-white text-slate-700 font-bold text-xs sm:text-sm shadow-2xs hover:border-slate-300 transition cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
            <span>Mengarahkan ke Google...</span>
          </>
        ) : (
          <>
            <GoogleIcon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Modern Immersive Full-screen Loading Screen */}
      {isProcessing && (
        <AuthLoadingScreen
          title="Menghubungkan ke Google..."
          subtitle="Mengarahkan ke halaman masuk resmi Google yang aman, mohon tunggu sebentar..."
        />
      )}
    </>
  );
}
