"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[Bantuin Root Global Error]:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F5FAFF] flex items-center justify-center p-4 font-sans text-slate-800 antialiased">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Aplikasi Mengalami Kendala
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Terjadi kesalahan tak terduga. Silakan muat ulang aplikasi untuk melanjutkan.
            </p>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Ke Beranda</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
