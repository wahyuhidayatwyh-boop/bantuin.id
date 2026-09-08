"use client";

import React from "react";
import Link from "next/link";
import { Star, ShieldCheck, ArrowRight, Palette, MapPin } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";

export default function JasaSection() {
  const { services, activeKabupaten, isItemInCurrentKabupaten } = useApp();

  const localServices = services.filter((item) => isItemInCurrentKabupaten(item));
  const displayedServices = (localServices.length > 0 ? localServices : services).slice(0, 4);

  return (
    <section className="py-16 md:py-20 bg-[#F4F7FB] border-b border-slate-200/60">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-2">
              <Palette className="w-3.5 h-3.5" />
              <span>KEAHLIAN DI {activeKabupaten.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Jasa Profesional di <span className="text-[#1683FF]">{activeKabupaten}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pesan keahlian kreatif dan teknisi lokal langsung dari mitra terpercaya di {activeKabupaten}.
            </p>
          </div>

          <Link
            href="/jasa"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-white border border-slate-200/80 hover:border-[#1683FF]/40 px-4 py-2 rounded-xl transition shadow-2xs self-start sm:self-auto shrink-0"
          >
            <span>Semua Katalog Jasa</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Cards dynamically matching location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayedServices.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[22px] border border-slate-200/90 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(22,131,255,0.09)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Photo & Badge */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={item.coverImage || item.photoUrl || item.avatarUrl}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800 shadow-2xs">
                    {item.badge || item.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-blue-50/95 backdrop-blur-md border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#1683FF] flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3 h-3 text-[#1683FF]" />
                    <span>Terverifikasi</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-base text-slate-900 mb-0.5 line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
                    <span>Oleh <strong className="text-slate-800">{item.providerName}</strong></span>
                    <span className="flex items-center gap-0.5 text-[11px] text-[#1683FF]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[100px]">{item.city || "Lokal"}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {item.desc || item.description}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{item.ratingAvg || item.rating || 4.9}</span>
                    <span className="text-slate-400 font-normal">({item.completedJobs || 24} order)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Price & Button */}
              <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Mulai dari</div>
                  <div className="font-black text-base text-[#1683FF]">
                    {formatIDR(item.startingPrice || item.priceStartFrom || 50000)}
                  </div>
                </div>

                <Link
                  href={`/jasa/${item.id}`}
                  className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition active:scale-95"
                >
                  Pesan
                </Link>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
