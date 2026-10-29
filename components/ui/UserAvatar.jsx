"use client";

import React, { useState } from "react";
import { User } from "lucide-react";

/**
 * Memeriksa apakah URL foto valid dan bukan placeholder/dummy Unsplash/Dicebear
 */
export function isCleanAvatar(url) {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return false;
  if (trimmed.includes("images.unsplash.com")) return false;
  if (trimmed.includes("dicebear.com")) return false;
  if (trimmed.includes("placeholder")) return false;
  return true;
}

/**
 * Menghasilkan warna background & text konsisten berdasarkan nama pengguna
 */
export function getAvatarColor(name = "") {
  const colors = [
    { bg: "bg-blue-50", text: "text-[#0F6FE5]", border: "border-blue-200" },
    { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
    { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
    { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Mengambil huruf inisial kapital pertama dari nama pengguna
 */
export function getInitial(name = "") {
  if (!name || typeof name !== "string") return "U";
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : "U";
}

/**
 * Komponen Universal Avatar:
 * 1. Menggunakan foto asli (Google profile / custom upload) jika tersedia.
 * 2. Jika tidak ada / dummy, menampilkan inisial nama dengan warna pastel elegan (Zero stock photo dummy).
 */
export default function UserAvatar({
  src,
  name = "Pengguna",
  size = "md",
  rounded = "rounded-xl",
  className = "",
  showBadge = false,
  badgeIcon = null,
}) {
  const [imgError, setImgError] = useState(false);
  const hasValidAvatar = isCleanAvatar(src) && !imgError;
  const initial = getInitial(name);
  const color = getAvatarColor(name);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-xs sm:text-sm",
    lg: "w-10 h-10 text-sm sm:text-base",
    xl: "w-12 h-12 text-base sm:text-lg",
    "2xl": "w-16 h-16 text-xl sm:text-2xl",
  };

  const containerSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`relative shrink-0 select-none ${className}`}>
      {hasValidAvatar ? (
        <img
          src={src}
          alt={name || "Foto Profil"}
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
          className={`${containerSize} ${rounded} object-cover border border-slate-200/80 shadow-2xs bg-white`}
          loading="lazy"
        />
      ) : (
        <div
          className={`${containerSize} ${rounded} ${color.bg} ${color.text} ${color.border} border flex items-center justify-center font-black shadow-2xs uppercase tracking-tight`}
        >
          {initial || <User className="w-1/2 h-1/2 opacity-70" />}
        </div>
      )}
      {showBadge && badgeIcon && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-2xs">
          {badgeIcon}
        </div>
      )}
    </div>
  );
}
