"use client";

import React from "react";
import Link from "next/link";
import { Star, ShieldCheck, ArrowRight, Camera, MapPin } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";

export default function SewaSection() {
  const { rentals, activeKabupaten, isItemInCurrentKabupaten } = useApp();

  const localRentals = rentals.filter((item) => isItemInCurrentKabupaten(item));
  const displayedRentals = (localRentals.length > 0 ? localRentals : rentals).slice(0, 4);

  return (
    <section className="py-14 md:py-20 bg-white border-b border-slate-100">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-2">
              <Camera className="w-3.5 h-3.5" />
              <span>RENTAL DI {activeKabupaten.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Cari & Sewa Barang di <span className="text-[#1683FF]">{activeKabupaten}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sewa kamera, alat presentasi, hingga audio harian langsung di wilayah {activeKabupaten}.
            </p>
          </div>

          <Link
            href="/sewa"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 px-4 py-2.5 rounded-xl transition self-start sm:self-auto shrink-0"
          >
            <span>Lihat Semua Katalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Cards dynamically matching location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayedRentals.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[22px] border border-slate-200/90 overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(22,131,255,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Photo & Category Badge */}
                <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                  <img
                    src={item.photoUrl}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800 shadow-2xs">
                    {item.category}
                  </div>
                  {item.isVerifiedPartner && (
                    <div className="absolute top-3 right-3 bg-emerald-50/95 backdrop-blur-md border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 flex items-center gap-1 shadow-2xs">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Mitra Terverifikasi</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-base text-slate-900 mb-1 line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
                    <MapPin className="w-3 h-3 text-[#1683FF] shrink-0" />
                    <span className="truncate">{item.city || item.location}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                    {item.desc || item.description}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{item.ratingAvg || item.rating || 4.9}</span>
                    <span className="text-slate-400 font-normal">({item.ratingCount || 15})</span>
                  </div>
                </div>
              </div>

              {/* Bottom Price & Button */}
              <div className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 mt-2">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium uppercase">Harga sewa</div>
                  <div className="font-black text-base text-[#1683FF]">
                    {formatIDR(item.dailyPrice)}
                    <span className="text-xs font-normal text-slate-500">/hari</span>
                  </div>
                </div>

                <Link
                  href={`/sewa/${item.id}`}
                  className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition active:scale-95"
                >
                  Sewa
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
