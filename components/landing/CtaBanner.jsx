"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlusCircle } from "lucide-react";
import logoImg from "@/components/image/logo.png";
import ctaPhonesImg from "@/components/image/cta-phones.png";

export default function CtaBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-[#EFF6FE]">
      {/* Background Phone Mockup Overlay on Desktop (Timpa di kanan tanpa card foto) */}
      <div 
        className="hidden md:block absolute right-0 top-0 bottom-0 h-full w-1/2 lg:w-[54%] pointer-events-none select-none z-0"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 14%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 14%)",
        }}
      >
        <Image
          src={ctaPhonesImg}
          alt="Aplikasi Bantuin di Smartphone"
          fill
          className="object-contain object-right"
          priority
          sizes="50vw"
        />
      </div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16 relative z-10">
        <div className="max-w-xl lg:max-w-2xl flex flex-col items-start text-left">
          
          {/* Logo */}
          <div className="mb-4 sm:mb-5">
            <Image
              src={logoImg}
              alt="Bantuin Logo"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain select-none"
              priority
            />
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-[48px] font-black text-slate-900 tracking-tight leading-[1.12] mb-4">
            Punya kebutuhan? <br />
            <span className="text-[#1683FF]">Jangan bingung.</span> <br />
            <span className="text-[#1683FF]">Bantuin aja.</span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 font-normal max-w-lg mb-8 leading-relaxed">
            Bergabunglah dengan ribuan warga, mahasiswa, dan pemilik usaha lokal yang saling bantu setiap hari.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3.5">
            <Link
              href="/bantuan"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 sm:py-4 rounded-full bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-extrabold text-sm sm:text-base shadow-[0_10px_25px_rgba(22,131,255,0.35)] hover:shadow-[0_14px_30px_rgba(22,131,255,0.45)] transition-all active:scale-95 group"
            >
              <span>Mulai Sekarang</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/bantuan/create"
              className="inline-flex items-center gap-2 px-6 py-3.5 sm:py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200/90 shadow-2xs hover:shadow-xs transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-[#1683FF]" />
              <span>Buat Request</span>
            </Link>
          </div>

        </div>

        {/* Mobile Phone Mockup Overlay (Tampil langsung di bawah teks pada layar mobile tanpa card foto) */}
        <div className="block md:hidden mt-8 -mx-4 sm:-mx-6 select-none">
          <Image
            src={ctaPhonesImg}
            alt="Aplikasi Bantuin di Smartphone"
            className="w-full h-auto object-contain block select-none"
            priority
            sizes="100vw"
          />
        </div>
      </div>
    </section>
  );
}



