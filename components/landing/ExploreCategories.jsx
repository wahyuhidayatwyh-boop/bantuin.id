"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Zap, 
  Camera, 
  Palette, 
  Package, 
  MoreHorizontal,
  ChevronDown,
  Wrench,
  Printer,
  Sparkles,
  ShoppingBag,
  Clock,
  Laptop,
  Truck,
  FileText,
  X
} from "lucide-react";

export default function ExploreCategories() {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // 4 Primary Consumer Categories
  const primaryCategories = [
    {
      name: "Bantuan Harian",
      desc: "Titip, Errand & Antar",
      icon: Zap,
      href: "/bantuan",
    },
    {
      name: "Sewa Kamera & Alat",
      desc: "Mirrorless, Mic & Sound",
      icon: Camera,
      href: "/sewa",
    },
    {
      name: "Jasa Desain & IT",
      desc: "Desain, Web & Video",
      icon: Palette,
      href: "/jasa",
    },
    {
      name: "Angkat & Pindahan",
      desc: "Bantuan Tenaga & Kos",
      icon: Package,
      href: "/bantuan",
    },
  ];

  // Extended Categories in Popover
  const allOtherCategories = [
    { name: "Teknisi & Servis Laptop", desc: "Cuci AC, Servis PC & Hardware", icon: Wrench, href: "/jasa" },
    { name: "Print & Jilid Kilat", desc: "Dokumen, Skripsi & Proposal", icon: Printer, href: "/bantuan" },
    { name: "Fotografer & Video Event", desc: "Wedding, Wisuda & Profil", icon: Sparkles, href: "/jasa" },
    { name: "Titip Belanja & Apotek", desc: "Tebus Obat & Supermarket", icon: ShoppingBag, href: "/bantuan" },
    { name: "Bantu Antri Layanan", desc: "Samsat, Tiket & Loket", icon: Clock, href: "/bantuan" },
    { name: "Penerjemah & Copywriter", desc: "Translate Dokumen & Artikel", icon: FileText, href: "/jasa" },
  ];

  return (
    <section className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 relative">
      
      {/* Section Header */}
      <h2 className="text-xs font-black tracking-wider text-slate-800 uppercase mb-4">
        KATEGORI LAYANAN
      </h2>

      {/* Row of 4 Primary Cards + 1 Dedicated "Lainnya..." Card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {primaryCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.name}
              href={cat.href}
              className="group relative rounded-2xl bg-gradient-to-b from-white/95 via-[#F6FAFF]/90 to-[#EBF4FD]/80 p-4 sm:p-5 border border-white/90 shadow-[0_6px_20px_rgba(180,205,235,0.28),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_12px_28px_rgba(22,131,255,0.18)] hover:-translate-y-1 transition-all duration-200 flex flex-col items-center justify-center text-center backdrop-blur-md"
            >
              {/* 3D Convex Dome */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-white via-[#F0F6FD] to-[#DCEAF9] shadow-[0_4px_12px_rgba(160,195,230,0.4),inset_0_2px_4px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(180,210,240,0.35)] border border-white/80 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform duration-200">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 sm:w-7 h-2 bg-gradient-to-b from-white to-transparent rounded-full opacity-80 pointer-events-none" />
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 group-hover:text-[#1683FF] transition-colors stroke-[1.75]" />
              </div>

              <h3 className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight group-hover:text-[#1683FF] transition mb-0.5">
                {cat.name}
              </h3>

              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                {cat.desc}
              </p>
            </Link>
          );
        })}

        {/* 5th Card: Dedicated "Lainnya..." 3D Glass Card */}
        <button
          onClick={() => setIsMoreOpen(!isMoreOpen)}
          className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-200 flex flex-col items-center justify-center text-center backdrop-blur-md ${
            isMoreOpen
              ? "bg-white border-[#1683FF] shadow-[0_12px_28px_rgba(22,131,255,0.2),inset_0_1px_2px_rgba(255,255,255,1)] ring-2 ring-[#1683FF]/30 -translate-y-1"
              : "bg-gradient-to-b from-white/95 via-[#F6FAFF]/90 to-[#EBF4FD]/80 border-white/90 shadow-[0_6px_20px_rgba(180,205,235,0.28),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_12px_28px_rgba(22,131,255,0.18)] hover:-translate-y-1"
          }`}
        >
          {/* 3D Convex Dome */}
          <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 ${
            isMoreOpen
              ? "bg-gradient-to-b from-[#1683FF] to-[#0F6FE5] text-white shadow-[0_4px_12px_rgba(22,131,255,0.4),inset_0_2px_4px_rgba(255,255,255,0.6)]"
              : "bg-gradient-to-b from-white via-[#F0F6FD] to-[#DCEAF9] text-slate-700 shadow-[0_4px_12px_rgba(160,195,230,0.4),inset_0_2px_4px_rgba(255,255,255,0.95)] border border-white/80"
          }`}>
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 sm:w-7 h-2 bg-gradient-to-b from-white to-transparent rounded-full opacity-80 pointer-events-none" />
            <MoreHorizontal className={`w-5 h-5 sm:w-6 sm:h-6 ${isMoreOpen ? "text-white" : "text-slate-700 group-hover:text-[#1683FF]"} stroke-[2]`} />
          </div>

          <h3 className={`font-bold text-xs sm:text-sm tracking-tight mb-0.5 flex items-center gap-1 ${
            isMoreOpen ? "text-[#1683FF]" : "text-slate-900 group-hover:text-[#1683FF]"
          }`}>
            <span>Lainnya...</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
          </h3>

          <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
            +6 Kategori Layanan
          </p>
        </button>
      </div>

      {/* Popover Dropdown for Homepage "Lainnya" */}
      {isMoreOpen && (
        <div className="absolute right-4 sm:right-8 top-full mt-2 w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200 shadow-[0_24px_60px_rgba(0,0,0,0.18)] p-4 z-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-900">Pilih Kategori Lainnya</span>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {allOtherCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  href={cat.href}
                  onClick={() => setIsMoreOpen(false)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/80 border border-slate-100 hover:border-blue-200 transition group flex items-start gap-2.5"
                >
                  <div className="w-8 h-8 rounded-xl bg-white text-slate-700 group-hover:text-[#1683FF] shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-[#1683FF] leading-tight">
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-snug mt-0.5">
                      {cat.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </section>
  );
}
