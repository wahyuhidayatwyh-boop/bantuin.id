"use client";

import React from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Star,
  Globe
} from "lucide-react";

function formatShortDeadline(deadline, deadlineText) {
  if (deadlineText) {
    const timeMatch = deadlineText.match(/(\d{1,2}[.:]\d{2})/);
    if (timeMatch) {
      return `Batas: ${timeMatch[1]} WIB`;
    }
    return deadlineText.replace(/^Hari ini\s*[•·]\s*/i, "Hari ini, ");
  }
  if (!deadline) return "Hari ini";
  try {
    const d = new Date(deadline);
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
    ? getDistanceToUser(request.latitude, request.longitude, request.distanceMeters)
    : null;

  const distanceText = request.mode === "online" 
    ? "Online / Remote" 
    : (distanceInfo?.text || (request.distanceMeters ? `${request.distanceMeters} m` : "Lokasi"));

  const shortDeadline = formatShortDeadline(request.deadline, request.deadlineText);
  const hasPhotos = Array.isArray(request.photos) && request.photos.length > 0;

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 transition-all duration-200 bg-white group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isMine 
          ? "border-blue-200 bg-blue-50/15 shadow-2xs ring-1 ring-blue-500/10" 
          : "border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#1683FF]/40"
      }`}
    >
      {/* Main Info: Requester Avatar + Content Details */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Avatar */}
        <div className="relative shrink-0 mt-0.5">
          <img
            src={requester.avatar}
            alt={requester.name}
            className="w-11 h-11 rounded-full object-cover border border-slate-100 shadow-2xs"
          />
          {requester.verified && (
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="min-w-0 flex-1">
          {/* Top meta tags */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {isMine ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Star className="w-3 h-3 fill-emerald-600" /> Milik Saya
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1683FF] border border-blue-100">
                {request.category || "Bantuan"}
              </span>
            )}

            {/* Requester name & role */}
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px] sm:max-w-[200px]">
              {isMine ? "Saya" : requester.name}
            </span>
            {requester.role && (
              <span className="hidden md:inline text-[11px] text-slate-400">
                • {requester.role}
              </span>
            )}
          </div>

          {/* Title */}
          <Link
            href={`/bantuan/${request.id}`}
            className="block group-hover:text-[#1683FF] transition"
          >
            <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-1">
              {request.title}
            </h3>
          </Link>

          {/* Description Snippet */}
          {request.description && (
            <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed mt-1">
              {request.description}
            </p>
          )}

          {/* Bottom inline badges: Location, Deadline, Applicants */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 mt-2.5">
            {/* Mode / Distance */}
            <div className="flex items-center gap-1 shrink-0">
              {request.mode === "online" ? (
                <>
                  <Globe className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="font-semibold text-purple-700">Online</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                  <span className="font-medium text-slate-600">{distanceText}</span>
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
                  <span className="font-semibold text-[#1683FF]">{offersCount}</span>
                  <span>pelamar</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Photo Thumbnail if Available */}
        {hasPhotos && (
          <Link
            href={`/bantuan/${request.id}`}
            className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group-hover:border-[#1683FF]/40 transition hidden sm:block"
            title="Lihat foto barang"
          >
            <img
              src={request.photos[0]}
              alt={request.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
            />
            {request.photos.length > 1 && (
              <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-slate-900/80 text-white text-[9px] font-bold">
                +{request.photos.length - 1}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Right Side: Price & Action CTA */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 sm:pl-5 sm:border-l border-slate-100 shrink-0">
        <div className="text-left sm:text-right min-w-[90px]">
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            {isMine ? "Budget" : "Imbalan"}
          </div>
          <div className="font-black text-sm sm:text-base text-slate-900 truncate">
            {request.isVoluntary ? "Sukarela" : formatIDR(request.rewardAmount)}
          </div>
        </div>

        <div className="shrink-0">
          {isMine ? (
            <Link
              href={`/bantuan/${request.id}`}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition active:scale-95 inline-flex items-center gap-1"
            >
              Kelola ({offersCount})
            </Link>
          ) : (
            <Link
              href={`/bantuan/${request.id}/ajukan`}
              className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition active:scale-95 inline-flex items-center gap-1"
            >
              <span>Bantu</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
