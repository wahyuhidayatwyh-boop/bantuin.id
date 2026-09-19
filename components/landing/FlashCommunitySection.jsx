"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ShieldCheck, Zap, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export default function FlashCommunitySection() {
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 24, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigits = (n) => String(n).padStart(2, "0");

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-20">
      
      {/* Grid: Flash Urgent Left Card + Right Promos & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Dark Navy Flash Request / Urgent Tasks Card */}
        <div className="lg:col-span-5 rounded-[32px] bg-gradient-to-br from-[#0B192C] via-[#102A43] to-[#0A1626] p-7 text-white shadow-xl flex flex-col justify-between border border-slate-800">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#38BDF8] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-[#38BDF8]" />
                PERMINTAAN MENDESAK HARI INI
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-4">
              BANTUAN KILAT BUTUH CEPAT
            </h3>

            {/* Countdown Clock Display matching Arctic Flash Sale */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 min-w-[50px]">
                <span className="text-lg font-black font-mono text-white">{formatDigits(timeLeft.hours)}</span>
                <span className="text-[9px] text-slate-400 uppercase">Jam</span>
              </div>
              <span className="font-bold text-white">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 min-w-[50px]">
                <span className="text-lg font-black font-mono text-white">{formatDigits(timeLeft.minutes)}</span>
                <span className="text-[9px] text-slate-400 uppercase">Menit</span>
              </div>
              <span className="font-bold text-white">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 min-w-[50px]">
                <span className="text-lg font-black font-mono text-[#38BDF8]">{formatDigits(timeLeft.seconds)}</span>
                <span className="text-[9px] text-slate-400 uppercase">Detik</span>
              </div>
            </div>

            {/* Mini Urgent Task Previews */}
            <div className="space-y-2.5">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Antar Hardcopy Skripsi ke Rektorat</div>
                  <div className="text-[10px] text-slate-400">Deadline 45 menit · Depok</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#38BDF8]">Rp 45.000</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Sewa Sony Lens 85mm f1.4 Dadakan</div>
                  <div className="text-[10px] text-slate-400">Untuk wisuda siang ini · Bandung</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#38BDF8]">Rp 150.000</span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/bantuan"
            className="mt-6 w-full py-3 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-lg transition text-center block"
          >
            LIHAT SEMUA TUGAS KILAT
          </Link>
        </div>

        {/* Right: 2 Modern Promotional Banners & Community Testimonials */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6">
          
          {/* Top 2 Promo Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Banner 1: Escrow */}
            <div className="rounded-[28px] bg-gradient-to-br from-[#EAF4FF] to-[#DCEAF7] p-6 border border-white shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1683FF] block mb-1">
                  PROTEKSI RESMI
                </span>
                <h4 className="font-extrabold text-base text-slate-900 mb-1">
                  100% Escrow Xendit
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Dana tertahan aman sampai tugas selesai & bukti foto terkonfirmasi.
                </p>
              </div>
              <Link
                href="/keamanan"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white font-bold text-xs w-fit hover:bg-[#0F6FE5] transition shadow-xs"
              >
                <span>PELAJARI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Banner 2: Safe Meetup */}
            <div className="rounded-[28px] bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] p-6 border border-white shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                  TITIK TEMU AMAN
                </span>
                <h4 className="font-extrabold text-base text-slate-900 mb-1">
                  Bantuin Point Publik
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Titik temu terverifikasi di lobi kampus, cafe mitra, & area publik.
                </p>
              </div>
              <Link
                href="/cara-kerja"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs w-fit hover:bg-slate-800 transition shadow-xs"
              >
                <span>LOKASI POINT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

          {/* Bottom: "HEARD FROM OUR COMMUNITY" Testimonials */}
          <div>
            <h4 className="text-xs font-extrabold tracking-wider text-slate-800 uppercase mb-3">
              HEARD FROM OUR COMMUNITY
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <span>Nabila Putri</span>
                      <CheckCircle2 className="w-3 h-3 text-[#1683FF]" />
                    </div>
                    <div className="flex text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  &ldquo;Sangat membantu pas butuh sewa kamera Sony H-1 buat liputan wisuda. Pemiliknya ramah & aman pakai escrow.&rdquo;
                </p>
              </div>

              <div className="bg-white rounded-[24px] p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                    alt="User"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <span>Rizky Ramadhan</span>
                      <CheckCircle2 className="w-3 h-3 text-[#1683FF]" />
                    </div>
                    <div className="flex text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  &ldquo;Titip ambil dokumen di rektorat beres dalam 20 menit! Tenaga bantuannya sigap dan komunikatif di chat.&rdquo;
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

    </section>
  );
}
