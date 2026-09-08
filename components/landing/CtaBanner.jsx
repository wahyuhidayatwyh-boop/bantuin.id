"use client";

import React from "react";
import Link from "next/link";
import { Search, PlusCircle, ShieldCheck } from "lucide-react";

export default function CtaBanner() {
  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dark Navy Clean Banner matching closing spec */}
        <div className="relative rounded-[32px] sm:rounded-[40px] bg-gradient-to-br from-[#0B192C] via-[#102A43] to-[#0A1626] p-8 sm:p-12 md:p-16 text-center text-white overflow-hidden shadow-xl border border-slate-800">
          
          {/* Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#1683FF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-sky-300 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GARANSI ESCROW & VERIFIKASI RESMI</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              Punya kebutuhan? <br className="hidden sm:inline" />
              Jangan bingung. <span className="text-[#38BDF8]">Bantuin aja.</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-normal max-w-lg mb-8 leading-relaxed">
              Bergabunglah dengan ribuan warga, mahasiswa, dan pemilik usaha lokal yang saling bantu setiap hari.
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/bantuan"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-slate-900 font-bold text-xs sm:text-sm hover:bg-slate-100 transition shadow-md active:scale-95"
              >
                <Search className="w-4 h-4 text-[#1683FF]" />
                <span>Mulai Cari</span>
              </Link>

              <Link
                href="/bantuan/create"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-[0_8px_20px_rgba(22,131,255,0.4)] transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Request</span>
              </Link>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
