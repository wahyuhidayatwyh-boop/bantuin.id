"use client";

import React from "react";
import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-[#F5FAFF]">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto shadow-2xs">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-black text-[#1683FF] uppercase tracking-wider">Error 404</span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Halaman atau tautan yang Anda tuju tidak tersedia atau telah dipindahkan.
          </p>
        </div>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ke Beranda</span>
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Jelajahi Layanan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
