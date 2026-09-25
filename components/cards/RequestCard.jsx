"use client";

import React from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import CategoryIcon from "@/components/common/CategoryIcon";
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Star,
  Globe
} from "lucide-react";

function formatShortDeadline(deadline, deadlineText) {
  if (deadlineText) {
    const timeMatch = String(deadlineText).match(/(\d{1,2}[.:]\d{2})/);
    if (timeMatch) {
      return `Batas: ${timeMatch[1]} WIB`;
    }
    return String(deadlineText).replace(/^Hari ini\s*[•·]\s*/i, "Hari ini, ");
  }
  if (!deadline) return "Hari ini";
  try {
    const d = new Date(deadline);
    if (!d || isNaN(d.getTime())) return "Hari ini";
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `Batas: ${h}.${m} WIB`;
  } catch {
    return "Hari ini";
  }
}

export default function RequestCard({ request }) {
  const { currentUser, getDistanceToUser } = useApp();

  const requester = request.requester || {
    id: request.userId || "user-1",
    name: request.userName || "Sarah Kusuma",
    role: "Wirausaha",
    avatar: request.userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    verified: true,
  };

  const isMine = currentUser?.id === requester.id;
  const offersCount = request.offers?.length || 0;

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(request.latitude, request.longitude)
    : null;

  const distanceText = request.mode === "online" 
    ? "Online / Remote" 
    : (distanceInfo?.isRealtime && distanceInfo?.text
        ? distanceInfo.text
        : (request.location || request.city || "Atur lokasi untuk melihat jarak"));

  const shortDeadline = formatShortDeadline(request.deadline, request.deadlineText);
  const hasPhotos = Array.isArray(request.photos) && request.photos.length > 0;

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-all duration-200 bg-white group flex flex-col justify-between gap-3 sm:gap-4 ${
        isMine 
          ? "border-blue-200 bg-blue-50/15 shadow-2xs ring-1 ring-blue-500/10" 
          : "border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#1683FF]/40"
      }`}
    >
      {/* 1. HEADER: Requester Identity + Category Badge on Left, Budget on Right */}
      <div className="flex items-center justify-between gap-3">
        {/* Requester Identity & Category */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative shrink-0">
            <img
              src={requester.avatar}
              alt={requester.name}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-100 shadow-2xs"
            />
            {requester.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-[#1683FF]" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {isMine ? "Saya" : requester.name}
              </span>
              {requester.role && (
                <span className="hidden sm:inline text-[11px] text-slate-400">
                  • {requester.role}
                </span>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-1.5">
              {isMine ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Star className="w-3 h-3 fill-emerald-600" /> Milik Saya
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] border border-blue-100">
                  <CategoryIcon category={request.category} className="w-3 h-3 text-[#1683FF] shrink-0" />
                  <span>{request.category || "Bantuan"}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Budget with clear hierarchy on Right */}
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {isMine ? "Budget" : "Imbalan"}
          </div>
          <div className="font-black text-sm sm:text-base text-slate-900 mt-0.5">
            {request.isVoluntary ? "Sukarela" : formatIDR(request.rewardAmount)}
          </div>
        </div>
      </div>

      {/* 2. BODY: Title, Description, and Proportional Photo Thumbnail */}
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/bantuan/${request.id}`}
            className="block group-hover:text-[#1683FF] transition"
          >
            <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">
              {request.title}
            </h3>
          </Link>

          {request.description && (
            <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed break-words">
              {request.description}
            </p>
          )}
        </div>

        {/* Proportional Photo Thumbnail */}
        {hasPhotos && (
          <Link
            href={`/bantuan/${request.id}`}
            className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group-hover:border-[#1683FF]/40 transition block"
            title="Lihat foto barang"
          >
            <img
              src={request.photos[0]}
              alt={request.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
            />
            {request.photos.length > 1 && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-bold">
                +{request.photos.length - 1}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* 3. FOOTER: Meta Badges (Location, Deadline, Pelamar) + Action Button */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 flex-wrap min-w-0">
          {/* Mode / Distance */}
          <div className="flex items-center gap-1 min-w-0 truncate max-w-[160px] sm:max-w-[220px]">
            {request.mode === "online" ? (
              <>
                <Globe className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="font-semibold text-purple-700 truncate">Online</span>
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                <span className="font-medium text-slate-600 truncate">{distanceText}</span>
              </>
            )}
          </div>

          <span className="text-slate-300">•</span>

          {/* Deadline */}
          <div className="flex items-center gap-1 shrink-0 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{shortDeadline}</span>
          </div>

          {/* Pelamar count (if any) */}
          {offersCount > 0 && (
            <>
              <span className="text-slate-300">•</span>
              <Link
                href={`/bantuan/${request.id}`}
                className="flex items-center gap-1 font-medium text-slate-600 hover:text-[#1683FF] shrink-0"
              >
                <span className="font-bold text-[#1683FF]">{offersCount}</span>
                <span>pelamar</span>
              </Link>
            </>
          )}
        </div>

        {/* Action Button CTA */}
        <div className="shrink-0 ml-auto sm:ml-0">
          {isMine ? (
            <Link
              href={`/bantuan/${request.id}`}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition active:scale-95 inline-flex items-center gap-1"
            >
              Kelola ({offersCount})
            </Link>
          ) : (
            <Link
              href={`/bantuan/${request.id}/ajukan`}
              className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition active:scale-95 inline-flex items-center justify-center min-w-[70px]"
            >
              <span>Bantu</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
