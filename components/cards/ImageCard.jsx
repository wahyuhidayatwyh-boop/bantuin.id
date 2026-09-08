import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function ImageCard({ item }) {
  return (
    <div className="relative group overflow-hidden rounded-[22px] h-[260px] md:h-[280px] w-full border border-[#DCEAF7]/80 shadow-[0_8px_30px_rgba(16,42,67,0.06)] hover:-translate-y-1 transition-all duration-300">
      {/* Background Image */}
      <img
        src={item.imageUrl}
        alt={item.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#102A43]/90 via-[#102A43]/40 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
        <div className="flex justify-end">
          <div className="flex items-center gap-1 text-[11px] font-semibold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Mitra Terverifikasi</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] text-blue-200 font-medium tracking-wide uppercase">
            {item.category}
          </div>
          <h3 className="font-bold text-lg md:text-xl text-white tracking-tight mt-0.5">
            {item.title}
          </h3>
          <p className="text-xs text-white/80 mt-1">
            {item.itemCount}
          </p>
        </div>
      </div>
    </div>
  );
}
