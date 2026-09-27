"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PlusCircle } from "lucide-react";
import tutorialImg from "@/components/image/tutorial.png";

export default function ProcessTimeline() {
  return (
    <section className="py-12 md:py-18 bg-[#F8FBFF] border-b border-slate-100">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Visual 4-Step Infographic Illustration */}
        <div className="relative w-full rounded-3xl overflow-hidden shadow-[0_12px_36px_rgba(22,131,255,0.08)] border border-blue-100/70 bg-white">
          <Image
            src={tutorialImg}
            alt="Transparan & Praktis - Sesimpel itu. Dari butuh bantuan sampai selesai aman dalam 4 langkah mudah"
            className="w-full h-auto object-contain block select-none"
            priority
          />
        </div>

        {/* Action Button: Buat Request */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/bantuan/create"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-extrabold text-sm sm:text-base shadow-[0_10px_25px_rgba(22,131,255,0.28)] hover:shadow-[0_14px_30px_rgba(22,131,255,0.35)] transition-all active:scale-95 group"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Buat Request Sekarang</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/bantuan"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm border border-slate-200 shadow-2xs transition"
          >
            <span>Jelajahi Permintaan Bantuan</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
