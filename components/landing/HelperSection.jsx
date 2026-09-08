"use client";

import React from "react";
import Link from "next/link";
import { Star, ShieldCheck, MapPin, CheckCircle2, Users, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";

export default function HelperSection() {
  const { activeKabupaten } = useApp();

  const helpers = [
    {
      id: "hlp-andi",
      name: "Bagus Wicaksono",
      verified: true,
      ratingAvg: 4.95,
      completedHelps: 34,
      distance: `500 m dari posisi Anda`,
      role: `Helper Terverifikasi · ${activeKabupaten}`,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      skills: ["Antar Barang", "Titip Dokumen", "Errand Cepat"],
    },
    {
      id: "hlp-sinta",
      name: "Dwi Prasetyo",
      verified: true,
      ratingAvg: 4.9,
      completedHelps: 28,
      distance: `800 m dari posisi Anda`,
      role: `Top Helper · ${activeKabupaten}`,
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80",
      skills: ["Bantu Angkat", "Pindahan Kos", "Belanja"],
    },
    {
      id: "hlp-rizky",
      name: "Rina Astuti",
      verified: true,
      ratingAvg: 4.92,
      completedHelps: 19,
      distance: `1.1 km dari posisi Anda`,
      role: `Helper Mahasiswa · ${activeKabupaten}`,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      skills: ["Print Tugas", "Ambil Paket", "Jaga Stand"],
    },
    {
      id: "hlp-dimas",
      name: "Ahmad Rizky",
      verified: true,
      ratingAvg: 4.88,
      completedHelps: 22,
      distance: `1.4 km dari posisi Anda`,
      role: `Helper Aktif · ${activeKabupaten}`,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      skills: ["Jemput Berkas", "Bantu Acara", "Errand Kilat"],
    },
  ];

  return (
    <section className="py-14 md:py-20 bg-[#F8FBFF] border-b border-slate-100">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>KOMUNITAS HELPER {activeKabupaten.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Orang yang Siap Membantu di <span className="text-[#1683FF]">{activeKabupaten}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Helper terverifikasi identitas di sekitar wilayah {activeKabupaten} yang siap membantu kapan saja.
            </p>
          </div>

          <Link
            href="/bantuan"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 px-4 py-2.5 rounded-xl transition self-start sm:self-auto shrink-0"
          >
            <span>Semua Helper</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Exact Requested Helper Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {helpers.map((helper) => (
            <div
              key={helper.id}
              className="bg-white rounded-[22px] border border-slate-200/90 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(22,131,255,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center justify-between"
            >
              <div className="flex flex-col items-center w-full">
                {/* Avatar with Verified Badge */}
                <div className="relative mb-3.5">
                  <img
                    src={helper.avatarUrl}
                    alt={helper.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white ring-2 ring-blue-100 shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs" title="Terverifikasi KTP">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Name with verified icon */}
                <h3 className="font-bold text-base text-slate-900 flex items-center justify-center gap-1">
                  <span>{helper.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                </h3>
                
                <p className="text-[11px] text-slate-500 mb-3">
                  {helper.role}
                </p>

                {/* Rating & Metric */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full mb-4">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{helper.ratingAvg}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-bold">{helper.completedHelps} selesai</span>
                </div>

                {/* Distance */}
                <div className="flex items-center gap-1 text-xs text-slate-600 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                  <span className="font-medium">{helper.distance}</span>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap justify-center gap-1 mb-4 w-full">
                  {helper.skills.map((skill) => (
                    <span key={skill} className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#1683FF] rounded-md font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={`/bantuan/create?helper=${encodeURIComponent(helper.name)}`}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-[#1683FF] text-white font-bold text-xs shadow-xs transition text-center active:scale-95"
              >
                Minta Bantuan
              </Link>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
