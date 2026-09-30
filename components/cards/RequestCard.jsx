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

  const requesterId = request.requesterId || request.requester?.id || request.userId;
  const requesterName = request.requester?.fullName || request.requester?.name || request.userName || "Pengguna Bantuin";
  const requesterAvatar = request.requester?.avatarUrl || request.requester?.avatar || request.userAvatar || null;
  const requesterRole = request.requester?.campusName || request.userRole || "Pengguna Terverifikasi";
  const isVerified = request.requester?.verificationStatus === "verified" || request.userVerified !== false;

  const isRequester = Boolean(
    (currentUser?.id && requesterId && currentUser.id === requesterId) ||
    (currentUser?.email && (request.requester?.email === currentUser.email || request.userEmail === currentUser.email)) ||
    (currentUser?.fullName && (requesterName === currentUser.fullName || request.userName === currentUser.fullName))
  );

  const isSelectedHelper = Boolean(
    currentUser && (
      (currentUser.id && (request.selectedHelperId === currentUser.id || request.selectedHelper?.id === currentUser.id)) ||
      (currentUser.fullName && request.selectedHelper?.fullName === currentUser.fullName) ||
      (Array.isArray(request.offers) && request.offers.some((o) => 
        ((currentUser.id && (o.helperId === currentUser.id || o.helper?.id === currentUser.id)) || (currentUser.fullName && o.helper?.fullName === currentUser.fullName)) &&
        o.status === "accepted"
      ))
    )
  );

  const hasApplied = Boolean(
    currentUser && Array.isArray(request.offers) && request.offers.some((o) => 
      (currentUser.id && (o.helperId === currentUser.id || o.helper?.id === currentUser.id)) ||
      (currentUser.fullName && o.helper?.fullName === currentUser.fullName)
    )
  );

  const isMine = isRequester || isSelectedHelper || hasApplied;

  const offersCount = request.offers?.length || 0;

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(request.latitude, request.longitude)
    : null;

  const distanceText = request.mode === "online" 
    ? "Online / Remote" 
    : (distanceInfo?.isRealtime && distanceInfo?.text
        ? distanceInfo.text
        : (request.location || request.locationName || request.city || "Atur lokasi untuk melihat jarak"));

  const shortDeadline = formatShortDeadline(request.deadline, request.deadlineText);
  const hasPhotos = Array.isArray(request.photos) && request.photos.length > 0;

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-all duration-200 bg-white group flex flex-col justify-between gap-3 sm:gap-4 ${
        isSelectedHelper
          ? "border-emerald-300 bg-emerald-50/20 shadow-2xs ring-1 ring-emerald-500/20"
          : isMine 
          ? "border-blue-200 bg-blue-50/15 shadow-2xs ring-1 ring-blue-500/10" 
          : "border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#1683FF]/40"
      }`}
    >
      {/* 1. HEADER: Requester Identity + Category Badge on Left, Budget on Right */}
      <div className="flex items-center justify-between gap-3">
        {/* Requester Identity & Category */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative shrink-0">
            {requesterAvatar && !requesterAvatar.includes("images.unsplash.com") ? (
              <img
                src={requesterAvatar}
                alt={requesterName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-100 shadow-2xs bg-white"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-[#1683FF] flex items-center justify-center font-black text-xs border border-blue-200 shadow-2xs">
                {(requesterName || "U")[0].toUpperCase()}
              </div>
            )}
            {isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-2xs">
                <CheckCircle2 className="w-3 h-3 text-[#1683FF]" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                {isRequester ? "Saya (Pembuat)" : requesterName}
              </span>
              {requesterRole && (
                <span className="hidden sm:inline text-[11px] text-slate-400">
                  • {requesterRole}
                </span>
              )}
            </div>

            <div className="mt-0.5 flex items-center gap-1.5">
              {isSelectedHelper ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Helper Diterima
                </span>
              ) : isRequester ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] border border-blue-200">
                  <Star className="w-3 h-3 fill-[#1683FF]" /> Tugas Saya
                </span>
              ) : hasApplied ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" /> Lamaran Terkirim
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
            {isRequester ? "Budget" : "Imbalan"}
          </div>
          <div className="font-black text-sm sm:text-base text-slate-900 mt-0.5">
            {request.isVoluntary ? "Sukarela" : formatIDR(request.rewardAmount || request.reward || 0)}
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
          {isSelectedHelper ? (
            <Link
              href={`/bantuan/${request.id}`}
              className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition active:scale-95 inline-flex items-center justify-center min-w-[70px]"
            >
              <span>Kerjakan</span>
            </Link>
          ) : isRequester ? (
            <Link
              href={`/bantuan/${request.id}`}
              className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition active:scale-95 inline-flex items-center justify-center min-w-[70px]"
            >
              <span>Lihat</span>
            </Link>
          ) : hasApplied ? (
            <Link
              href={`/bantuan/${request.id}`}
              className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-blue-50 border border-blue-200 text-[#1683FF] hover:bg-blue-100 font-bold text-xs shadow-2xs transition active:scale-95 inline-flex items-center justify-center min-w-[70px]"
            >
              <span>Detail</span>
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
