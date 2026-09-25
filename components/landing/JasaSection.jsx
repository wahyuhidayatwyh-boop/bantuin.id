"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, ShieldCheck, ArrowRight, Palette, MapPin, Rocket } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { promotionService } from "@/lib/services/promotionService";

export default function JasaSection() {
  const { services, activeKabupaten = "Indonesia", isItemInCurrentKabupaten } = useApp();

  const [activePromos, setActivePromos] = useState(() => promotionService.getActivePromotionsSync({ targetType: "service" }));

  useEffect(() => {
    const handleUpdate = () => {
      setActivePromos(promotionService.getActivePromotionsSync({ targetType: "service" }));
    };
    window.addEventListener("bantuin_promotions_updated", handleUpdate);
    window.addEventListener("bantuin_payments_updated", handleUpdate);
    return () => {
      window.removeEventListener("bantuin_promotions_updated", handleUpdate);
      window.removeEventListener("bantuin_payments_updated", handleUpdate);
    };
  }, []);

  const localServices = (services || []).filter((s) =>
    isItemInCurrentKabupaten ? isItemInCurrentKabupaten(s.location || s.domicile || "") : true
  );
  const baseList = localServices.length > 0 ? localServices : (services || []);

  const promoTargetIds = new Set(activePromos.map((p) => p.targetId));

  // 1. Promoted Services (Verified Paid & Active)
  const promotedList = baseList
    .filter((s) => promoTargetIds.has(s.id))
    .map((s) => ({ ...s, isPromoted: true }));

  // 2. Organic Services
  const organicList = baseList
    .filter((s) => !promoTargetIds.has(s.id))
    .sort((a, b) => {
      const scoreA = (Number(a.ratingAvg || a.rating) || 0) * 10 + (Number(a.completedJobs || a.completedOrders) || 0) + (a.isVerified ? 10 : 0);
      const scoreB = (Number(b.ratingAvg || b.rating) || 0) * 10 + (Number(b.completedJobs || b.completedOrders) || 0) + (b.isVerified ? 10 : 0);
      return scoreB - scoreA;
    })
    .map((s) => ({ ...s, isPromoted: false }));

  const displayedServices = [...promotedList, ...organicList].slice(0, 4);

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
              Pesan keahlian kreatif dan teknisi lokal langsung dari mitra terpercaya di wilayah {activeKabupaten}.
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

        {/* 4 Cards dynamically matching location or empty state */}
        {displayedServices.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {displayedServices.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl sm:rounded-[22px] border border-slate-200/90 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(22,131,255,0.09)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Badge */}
                  <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                    <img
                      src={item.coverImage || item.photoUrl || item.avatarUrl}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    {item.isPromoted ? (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                        <Rocket className="w-2.5 h-2.5" />
                        <span>Unggulan</span>
                      </div>
                    ) : (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-md px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-slate-800 shadow-2xs">
                        {item.badge || item.category}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-blue-50/95 backdrop-blur-md border border-blue-200 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-[#1683FF] flex items-center gap-0.5 sm:gap-1 shadow-2xs">
                      <ShieldCheck className="w-3 h-3 text-[#1683FF]" />
                      <span className="hidden sm:inline">Terverifikasi</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-2.5 sm:p-5">
                    <h3 className="font-bold text-xs sm:text-base text-slate-900 mb-0.5 line-clamp-2 leading-snug min-h-[32px] sm:min-h-0">
                      {item.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-xs text-slate-500 font-semibold mb-1.5 sm:mb-2 gap-0.5">
                      <span className="truncate">Oleh <strong className="text-slate-800">{item.providerName}</strong></span>
                      <span className="flex items-center gap-0.5 text-[10px] sm:text-[11px] text-[#1683FF]">
                        <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                        <span className="truncate max-w-[80px] sm:max-w-[100px]">{item.city || "Lokal"}</span>
                      </span>
                    </div>
                    <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {item.desc || item.description}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-800">
                      {(item.ratingAvg || item.rating) ? (
                        <>
                          <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                          <span>{item.ratingAvg || item.rating}</span>
                          <span className="text-slate-400 font-normal">({item.completedJobs || item.completedOrders || 0})</span>
                        </>
                      ) : (
                        <span className="text-slate-400 font-medium">Belum ada rating</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Price & Button */}
                <div className="p-2.5 sm:p-5 pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 border-t border-slate-100 mt-2">
                  <div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase">Mulai dari</div>
                    <div className="font-black text-xs sm:text-base text-[#1683FF]">
                      {formatIDR(item.startingPrice || item.priceStartFrom || 50000)}
                    </div>
                  </div>

                  <Link
                    href={`/jasa/${item.id}`}
                    className="w-full sm:w-auto text-center justify-center px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-[11px] sm:text-xs shadow-xs transition active:scale-95"
                  >
                    Pesan
                  </Link>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-2xs">
              <Palette className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              Belum Ada Jasa Aktif di {activeKabupaten}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Jadilah penyedia pertama yang menawarkan keahlian fotografi, desain grafis, servis laptop, atau teknisi di wilayah {activeKabupaten}.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/jasa/dashboard"
                className="px-5 py-2.5 rounded-full bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
              >
                + Buka Layanan Jasa
              </Link>
              <Link
                href="/jasa"
                className="px-5 py-2.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
              >
                Jelajahi Semua Wilayah
              </Link>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
