"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalErrorBoundary({ error, reset }) {
  useEffect(() => {
    // Log error cleanly for client diagnostics
    console.error("[Bantuin Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#F5FAFF]">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Terjadi Kesalahan Saat Memuat Halaman
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Sistem kami mendeteksi kendala pada proses perenderan. Silakan coba muat ulang komponen atau kembali ke halaman utama.
          </p>
          {error?.message && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-left text-[11px] text-rose-700 font-mono break-words max-h-28 overflow-y-auto">
              <span className="font-bold block text-[10px] uppercase tracking-wider text-rose-500 mb-0.5">Detail Kendala:</span>
              {error.message}
            </div>
          )}
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ke Beranda</span>
          </Link>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={async () => {
              if (typeof window !== "undefined") {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                  if ("caches" in window) {
                    const keys = await window.caches.keys();
                    await Promise.all(keys.map((k) => window.caches.delete(k)));
                  }
                  if ("serviceWorker" in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const reg of registrations) {
                      await reg.unregister();
                    }
                  }
                } catch (_) {}
                // Force hard reload with cache bust
                window.location.href = window.location.pathname + "?_cb=" + Date.now();
              }
            }}
            className="text-xs text-[#1683FF] hover:text-[#0F6FE5] font-semibold underline cursor-pointer transition py-1"
          >
            Bersihkan Cache &amp; Muat Ulang Bersih (Hard Reload)
          </button>
          <span className="text-[10px] text-slate-400">
            Atau tekan tombol <strong>Ctrl + Shift + R</strong> di keyboard Anda
          </span>
        </div>
      </div>
    </div>
  );
}
