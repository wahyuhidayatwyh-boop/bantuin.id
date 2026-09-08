"use client";

import React from "react";
import Link from "next/link";
import { Star, MapPin, ShieldCheck, ArrowRight, Zap } from "lucide-react";
import { formatIDR } from "@/lib/utils";

export default function BestOffers() {
  const items = [
    {
      id: "req-1",
      title: "Titip Print Laporan & Antar",
      category: "Bantuan Kilat",
      image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=400&q=80",
      rating: "5.0",
      price: 35000,
      priceLabel: "Imbalan",
      location: "Gedung Rektorat · 350m",
      actionText: "Saya Bisa Bantu",
      href: "/bantuan/req-1",
      isUrgent: true,
    },
    {
      id: "rent-1",
      title: "Sony Alpha A7 III + 24-70 GM",
      category: "Sewa Kamera",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
      rating: "4.9",
      price: 220000,
      priceLabel: "/hari",
      location: "Kukusan, Depok",
      actionText: "Sewa Sekarang",
      href: "/sewa/rent-1",
      isUrgent: false,
    },
    {
      id: "srv-1",
      title: "Jasa Desain Logo & Pitch Deck",
      category: "Jasa & Skill",
      image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=400&q=80",
      rating: "5.0",
      price: 150000,
      priceLabel: "Mulai dari",
      location: "Online / Sekitar Kampus",
      actionText: "Pesan Jasa",
      href: "/jasa/srv-1",
      isUrgent: false,
    },
    {
      id: "rent-2",
      title: "DJI Ronin SC Stabilizer",
      category: "Rental Alat",
      image: "https://images.unsplash.com/photo-1589872766857-2110abb95a08?auto=format&fit=crop&w=400&q=80",
      rating: "4.8",
      price: 85000,
      priceLabel: "/hari",
      location: "Margonda Raya",
      actionText: "Sewa Sekarang",
      href: "/sewa/rent-2",
      isUrgent: false,
    },
  ];

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm sm:text-base font-extrabold tracking-wider text-slate-800 uppercase">
          PERMINTAAN & SEWA TERPOPULER
        </h2>
        <Link
          href="/bantuan"
          className="text-xs font-bold text-[#1683FF] hover:underline flex items-center gap-1"
        >
          <span>Lihat Semua</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4-Column Clean Cards matching Arctic "Best Sellers" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[24px] border border-slate-100 p-4 sm:p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_14px_34px_rgba(22,131,255,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              {/* Product / Task Clean Image Container */}
              <div className="relative aspect-[4/3] w-full rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/40 p-4 mb-4 flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-xl"
                />
                {item.isUrgent && (
                  <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-white" />
                    Mendesak
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1.5">
                {item.title}
              </h3>

              {/* Rating & Price Row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                  </div>
                </div>

                <div className="font-black text-sm text-slate-900">
                  {formatIDR(item.price)}
                </div>
              </div>

              {/* Location Tag */}
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-4">
                <MapPin className="w-3 h-3 text-[#1683FF] shrink-0" />
                <span className="truncate">{item.location}</span>
              </div>
            </div>

            {/* Blue Pill Button matching Arctic "Add to Cart" */}
            <Link
              href={item.href}
              className="w-full py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-[0_4px_14px_rgba(22,131,255,0.25)] transition text-center block active:scale-98"
            >
              {item.actionText}
            </Link>

          </div>
        ))}
      </div>

    </section>
  );
}
