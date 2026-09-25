"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Star, MapPin, ArrowRight, Zap, Layers, Camera } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";

export default function BestOffers() {
  const { rentals = [], services = [], getDistanceToUser } = useApp();

  // Combine top rentals and top services dynamically based on organic ranking
  const items = useMemo(() => {
    const topRentals = [...rentals]
      .filter((r) => r.status === "available" || !r.status)
      .slice(0, 2)
      .map((r) => {
        const distInfo = getDistanceToUser ? getDistanceToUser(r.latitude, r.longitude) : null;
        return {
          id: r.id,
          title: r.title,
          category: r.category || "Rental",
          image: r.photoUrl || r.photos?.[0] || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
          rating: r.ratingAvg || r.rating || null,
          price: r.dailyPrice || r.price || 150000,
          location: distInfo?.isRealtime && distInfo?.text ? distInfo.text : (r.city || "Tersedia Sewa"),
          actionText: "Sewa Sekarang",
          href: `/sewa/${r.id}`,
          isRental: true,
        };
      });

    const topServices = [...services]
      .slice(0, 2)
      .map((s) => {
        const distInfo = getDistanceToUser ? getDistanceToUser(s.latitude, s.longitude) : null;
        return {
          id: s.id,
          title: s.title,
          category: s.category || "Jasa",
          image: s.coverImage || s.photoUrl || "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=400&q=80",
          rating: s.ratingAvg || s.rating || null,
          price: s.startingPrice || s.price || 100000,
          location: distInfo?.isRealtime && distInfo?.text ? distInfo.text : (s.city || (s.isOnline ? "Online" : "Tersedia Jasa")),
          actionText: "Pesan Jasa",
          href: `/jasa/${s.id}`,
          isRental: false,
        };
      });

    return [...topRentals, ...topServices];
  }, [rentals, services, getDistanceToUser]);

  if (!items || items.length === 0) return null;

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm sm:text-base font-extrabold tracking-wider text-slate-800 uppercase">
          PILIHAN TERPOPULER HARI INI
        </h2>
        <Link
          href="/explore"
          className="text-xs font-bold text-[#1683FF] hover:underline flex items-center gap-1"
        >
          <span>Jelajahi Semua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Column Clean Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl sm:rounded-[24px] border border-slate-100 p-2.5 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_34px_rgba(22,131,255,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Product / Service Container */}
              <div className="relative aspect-[4/3] w-full rounded-lg sm:rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/40 p-2 sm:p-4 mb-2 sm:mb-4 flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-md sm:rounded-xl"
                />
                <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-white/90 backdrop-blur-md text-slate-800 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                  {item.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug min-h-[32px] sm:min-h-0 mb-1 sm:mb-1.5">
                {item.title}
              </h3>

              {/* Rating & Price Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 sm:mb-2 gap-0.5 sm:gap-1">
                <div className="flex items-center gap-1">
                  {item.rating ? (
                    <>
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] sm:text-xs font-bold text-slate-700">{item.rating}</span>
                    </>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] text-slate-400">Belum ada rating</span>
                  )}
                </div>

                <div className="font-black text-xs sm:text-sm text-[#1683FF] sm:text-slate-900">
                  {formatIDR(item.price)}
                </div>
              </div>

              {/* Location Tag */}
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 mb-2.5 sm:mb-4">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1683FF] shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>
            </div>

            {/* Action Button */}
            <Link
              href={item.href}
              className="w-full py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-[11px] sm:text-xs shadow-[0_4px_14px_rgba(22,131,255,0.25)] transition text-center block active:scale-98"
            >
              {item.actionText}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
