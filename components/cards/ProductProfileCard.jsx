import React from "react";
import Link from "next/link";
import { Star, ShieldCheck, MapPin } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";

export default function ProductProfileCard({ item, type = "rental" }) {
  const isRental = type === "rental";
  const { getDistanceToUser } = useApp() || {};

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(item.latitude, item.longitude, item.distanceMeters)
    : null;

  const isVerified = isRental ? item.isVerifiedPartner : item.isVerified;
  const ownerOrProviderName = isRental 
    ? (item.ownerName || item.owner?.name || "Mitra Rental") 
    : item.providerName;

  return (
    <div className="w-full h-full bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#1683FF]/30 transition-all duration-200 group">
      
      {/* 16:10 Aspect Ratio Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={isRental ? item.photoUrl : (item.coverImage || item.avatarUrl)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Subtle Top Category Pill */}
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-slate-800 shadow-2xs border border-white/80">
            {item.category}
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Title - Fixed height so multi-line titles don't disrupt grid layout */}
          <Link href={isRental ? `/sewa/${item.id}` : `/jasa/${item.id}`} className="block group">
            <h3 className="font-bold text-sm sm:text-[14px] text-slate-900 line-clamp-2 h-10 leading-snug group-hover:text-[#1683FF] transition mb-1.5">
              {item.title}
            </h3>
          </Link>

          {/* Provider / Owner name + Distance info */}
          <div className="flex items-center justify-between gap-1.5 text-xs text-slate-500 mb-2">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="truncate font-medium text-slate-700">{ownerOrProviderName}</span>
              {isVerified && (
                <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" title="Terverifikasi" />
              )}
            </div>

            {distanceInfo?.text && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                <MapPin className="w-3 h-3 text-[#1683FF]" />
                <span>{distanceInfo.text}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom: Rating & Pricing */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{item.ratingAvg || item.rating || 4.9}</span>
            <span className="text-slate-400 font-normal text-[11px]">
              ({isRental ? `${item.ratingCount || 12} sewa` : `${item.completedJobs || 24} order`})
            </span>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {isRental ? "Sewa / hari" : "Mulai"}
            </div>
            <div className="font-black text-sm sm:text-[15px] text-slate-900">
              {formatIDR(isRental ? item.dailyPrice : item.startingPrice)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

