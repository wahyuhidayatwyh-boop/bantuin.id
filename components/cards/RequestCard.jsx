"use client";

import React from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Star 
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
    ? "Online" 
    : (distanceInfo?.text || (request.distanceMeters ? `${request.distanceMeters} m` : "Lokasi"));

  const shortDeadline = formatShortDeadline(request.deadline, request.deadlineText);

  return (
    <div className={`w-full rounded-2xl border p-3.5 sm:p-4 transition duration-200 flex flex-col justify-between group ${
      isMine 
        ? "bg-white border-blue-300 shadow-2xs ring-1 ring-blue-500/10" 
        : "bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#1683FF]/40"
    }`}>
      
      {/* Top Section */}
      <div>
        {/* Requester Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={requester.avatar}
              alt={requester.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-100 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                <span className="truncate">{isMine ? "Saya" : requester.name}</span>
                {requester.verified && (
                  <CheckCircle2 className="w-3 h-3 text-[#1683FF] shrink-0" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {request.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] border border-blue-100">
                {request.category}
              </span>
            )}
            {isMine ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <Star className="w-2.5 h-2.5 fill-emerald-600" /> Milik Saya
              </span>
            ) : (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
                request.mode === "online" 
                  ? "bg-purple-50 text-purple-700 border-purple-200/70" 
                  : "bg-slate-50 text-slate-600 border-slate-200/80"
              }`}>
                {request.mode === "online" ? "Online" : "Tatap Muka"}
              </span>
            )}
          </div>
        </div>

        {/* Title - Clean & Crisp */}
        <Link href={`/bantuan/${request.id}`} className="block group-hover:text-[#1683FF] transition mb-2">
          <h3 className="font-bold text-xs sm:text-[13px] text-slate-900 line-clamp-2 h-8 sm:h-9 leading-snug">
            {request.title}
          </h3>
        </Link>
      </div>

      {/* Bottom Section */}
      <div className="mt-1">
        {/* Meta Row: Distance & Deadline in 1 line */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 mb-2 gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 text-[#1683FF] shrink-0" />
            <span className="truncate font-medium text-slate-600">{distanceText}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-slate-500 font-medium">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{shortDeadline}</span>
          </div>
        </div>

        {/* Price & Action Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">
              {isMine ? "Budget" : "Imbalan"}
            </div>
            <div className="font-black text-xs sm:text-[14px] text-slate-900 truncate">
              {request.isVoluntary ? "Sukarela" : formatIDR(request.rewardAmount)}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {offersCount > 0 && !isMine && (
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                {offersCount} pelamar
              </span>
            )}
            {isMine ? (
              <Link
                href={`/bantuan/${request.id}`}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] shadow-xs transition active:scale-95"
              >
                Kelola ({offersCount})
              </Link>
            ) : (
              <Link
                href={`/bantuan/${request.id}/ajukan`}
                className="px-3.5 py-1.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-[11px] shadow-xs transition active:scale-95"
              >
                Bantu
              </Link>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

