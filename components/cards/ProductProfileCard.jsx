import React from "react";
import Link from "next/link";
import { Star, ShieldCheck, MapPin } from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";

import CategoryIcon from "@/components/common/CategoryIcon";

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
    <div className="w-full h-full bg-white border border-slate-200/90 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-[#1683FF]/30 transition-all duration-200 group">
      
      {/* 16:10 Aspect Ratio Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={isRental ? item.photoUrl : (item.coverImage || item.avatarUrl)}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Subtle Top Category Pill */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-white/95 backdrop-blur-xs text-slate-800 shadow-2xs border border-white/80">
            <CategoryIcon category={item.category} className="w-3 h-3 text-[#1683FF] shrink-0" />
            <span className="truncate">{item.category}</span>
          </span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-2.5 sm:p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Title - Fixed height so multi-line titles don't disrupt grid layout */}
          <Link href={isRental ? `/sewa/${item.id}` : `/jasa/${item.id}`} className="block group">
            <h3 className="font-bold text-xs sm:text-[14px] text-slate-900 line-clamp-2 min-h-[32px] sm:min-h-[40px] leading-snug group-hover:text-[#1683FF] transition mb-1 sm:mb-1.5 break-words">
              {item.title}
            </h3>
          </Link>

          {/* Provider / Owner name + Distance info */}
          <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-500 mb-1.5 sm:mb-2 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="truncate font-medium text-slate-700">{ownerOrProviderName}</span>
              {isVerified && (
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1683FF] shrink-0" title="Terverifikasi" />
              )}
            </div>

            {distanceInfo?.text && (
              <span className="hidden xs:inline-flex sm:inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] font-medium text-slate-500 bg-slate-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1683FF]" />
                <span className="truncate max-w-[80px]">{distanceInfo.text}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom: Rating & Pricing */}
        <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex flex-col xs:flex-row xs:items-center justify-between gap-1 mt-auto min-w-0 overflow-hidden">
          <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-semibold text-slate-800 min-w-0">
            {(item.ratingAvg || item.rating) ? (
              <>
                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{item.ratingAvg || item.rating}</span>
                <span className="text-slate-400 font-normal text-[10px] sm:text-[11px] truncate">
                  ({isRental ? `${item.ratingCount || 0}` : `${item.completedJobs || item.completedOrders || 0}`})
                </span>
              </>
            ) : (
              <span className="text-slate-400 font-medium text-[10px] sm:text-[11px] truncate">
                Belum ada rating
              </span>
            )}
          </div>

          <div className="text-left xs:text-right min-w-0 overflow-hidden">
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">
              {isRental ? "Sewa / hari" : "Mulai"}
            </div>
            <div className="font-black text-xs sm:text-sm md:text-[15px] text-[#1683FF] sm:text-slate-900 truncate">
              {formatIDR(isRental ? item.dailyPrice : item.startingPrice)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

