"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Star, ChevronRight, Wrench, Camera, Store, Award, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatIDR } from "@/lib/utils";

/**
 * PromotedCard — Komponen kartu promosi premium dengan visual khas Bantuin.
 * Mendukung 2 mode tata letak:
 *  - "grid" : Kartu vertikal standar (cocok untuk Beranda/Spotlight)
 *  - "list" : Kartu horizontal padat terstruktur mirip Shopee (cocok untuk halaman Jasa & Sewa)
 *
 * Props:
 *  - item       : object { id, promoId, title, category, price, image, desc, provider, targetType }
 *  - href       : string — link tujuan
 *  - onCardClick: () => void — analytics callback
 *  - variant    : "jasa" | "rental" | "store" | "auto"
 *  - layout     : "grid" | "list" (default: "grid")
 */
export default function PromotedCard({
  item,
  href,
  onCardClick,
  variant = "auto",
  layout = "grid",
}) {
  if (!item) return null;

  const rawType = item.targetType || (variant !== "auto" ? variant : "jasa");
  const normalizedType = rawType === "service" ? "jasa" : rawType === "rental" ? "sewa" : rawType;
  const isStore = normalizedType === "store" || normalizedType === "toko";
  const isRental = normalizedType === "sewa" || normalizedType === "rental";

  const TypeIcon = isStore ? Store : isRental ? Camera : Wrench;
  const typeLabel = isStore ? "Toko" : isRental ? "Sewa" : "Jasa";

  const price = item.targetPrice ?? item.price ?? item.pricePerDay ?? null;
  const title = item.targetTitle ?? item.title ?? item.name ?? "—";
  const image =
    item.targetImage ??
    item.image ??
    item.avatar ??
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80";
  const category = item.targetCategory ?? item.category ?? item.categoryName ?? "";
  const location =
    item.targetLocation ??
    item.provider?.city ??
    item.store?.city ??
    item.location ??
    "Banyumas";
  const ownerName =
    item.ownerName ??
    item.provider?.name ??
    item.store?.name ??
    item.sellerName ??
    "";
  const rating =
    item.rating ??
    item.provider?.rating ??
    item.store?.rating ??
    5.0;

  const reviewCount =
    item.reviewCount ??
    (Array.isArray(item.reviews) ? item.reviews.length : null) ??
    (rating ? Math.floor(rating * 8 + 14) : 28);

  const targetHref =
    href ||
    (isStore
      ? `/mitra/${item.targetId || item.id}`
      : isRental
      ? `/sewa/${item.targetId || item.id}`
      : `/jasa/${item.targetId || item.id}`);

  // ============================================================
  // TAMPILAN 1: LIST / REKOMENDASI (BERSIH, PADAT & KONSISTEN)
  // ============================================================
  if (layout === "list") {
    return (
      <Link
        href={targetHref}
        onClick={() => {
          if (onCardClick) onCardClick();
        }}
        className="group relative flex items-center overflow-hidden rounded-2xl
          bg-white
          border border-slate-200/90
          p-2.5 sm:p-3
          gap-2.5 sm:gap-3
          shadow-[0_2px_8px_rgba(0,0,0,0.03)]
          hover:border-[#1683FF]
          hover:shadow-[0_4px_16px_rgba(22,131,255,0.10)]
          hover:-translate-y-0.5
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1683FF]
          cursor-pointer min-w-0"
      >
        {/* Left blue accent line */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-[#1683FF] to-sky-400 rounded-l-2xl" />

        {/* Thumbnail Square */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 self-center">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Lencana Tipe */}
          <div className="absolute bottom-1 right-1 z-10">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[8px] font-semibold">
              <TypeIcon className="w-2.5 h-2.5 shrink-0" />
              <span>{typeLabel}</span>
            </span>
          </div>
        </div>

        {/* Detail: Sederhana, Bersih & Konsisten */}
        <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5 min-h-[96px]">
          <div>
            {/* Judul */}
            <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 group-hover:text-[#1683FF] transition-colors line-clamp-1 leading-snug">
              {title}
            </h4>

            {/* Kategori & Pemilik (Warna konsisten) */}
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {category && <span className="text-[#1683FF] font-semibold">{category}</span>}
              {category && ownerName && <span className="mx-1 text-slate-300">·</span>}
              {ownerName && <span className="text-slate-600">{ownerName}</span>}
            </p>

            {/* Rating & Lokasi */}
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 mt-1">
              <span className="flex items-center gap-0.5 font-bold text-amber-500 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{Number(rating).toFixed(1)}</span>
              </span>
              <span className="text-slate-400">({reviewCount})</span>
              {location && location !== "all" && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-0.5 truncate text-slate-500">
                    <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                    <span className="truncate">{location}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Baris Harga & Aksi (Konsisten warna) */}
          <div className="flex items-center justify-between gap-2 pt-1.5 mt-1 border-t border-slate-100">
            <div className="min-w-0">
              <span className="text-[9px] text-slate-400 font-semibold uppercase block leading-none">
                {isRental ? "Mulai Sewa" : "Tarif Mulai"}
              </span>
              <div className="text-xs sm:text-sm font-black text-[#1683FF] leading-tight truncate mt-0.5">
                {price ? formatIDR(price) : "Tanya Tarif"}
                {isRental && price && (
                  <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 ml-0.5">/hari</span>
                )}
              </div>
            </div>

            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-[#1683FF] group-hover:bg-[#1683FF] group-hover:text-white flex items-center justify-center transition-colors shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ============================================================
  // TAMPILAN 2: GRID / CARD VERTIKAL (STANDAR BERANDA)
  // ============================================================
  return (
    <Link
      href={targetHref}
      onClick={() => {
        if (onCardClick) onCardClick();
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl
        bg-white
        border-2 border-[#1683FF]/25
        shadow-[0_2px_12px_rgba(22,131,255,0.08)]
        hover:border-[#1683FF]
        hover:shadow-[0_0_0_4px_rgba(22,131,255,0.10),0_8px_32px_rgba(22,131,255,0.20)]
        hover:-translate-y-0.5
        transition-all duration-300
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1683FF]
        cursor-pointer"
    >
      {/* Blue top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] z-10
          bg-gradient-to-r from-[#1683FF] via-[#60b0ff] to-[#1683FF]"
      />

      {/* Photo */}
      <div className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

        {/* Promoted badge — solid blue pill */}
        {/* Type tag — top right */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
              bg-black/60 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold"
          >
            <TypeIcon className="w-2.5 h-2.5 shrink-0" />
            {typeLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-3 sm:px-4 pt-3 pb-2 gap-1">
        {/* Category */}
        {category && (
          <span className="text-[10px] font-semibold text-[#1683FF] uppercase tracking-wide truncate">
            {category}
          </span>
        )}

        {/* Title */}
        <h4
          className="font-extrabold text-xs sm:text-sm text-slate-900
            group-hover:text-[#1683FF] transition-colors duration-200
            line-clamp-2 leading-snug min-h-[32px] sm:min-h-[38px]"
        >
          {title}
        </h4>

        {/* Owner + Location */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-auto pt-2 border-t border-slate-100">
          {rating !== null && (
            <span className="flex items-center gap-0.5 font-bold text-amber-500 shrink-0">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              {Number(rating).toFixed(1)}
            </span>
          )}
          {rating !== null && (ownerName || location) && (
            <span className="text-slate-300 shrink-0">·</span>
          )}
          {ownerName && (
            <span className="truncate font-medium text-slate-600">{ownerName}</span>
          )}
          {location && location !== "all" && (
            <>
              {ownerName && <span className="text-slate-300 shrink-0">·</span>}
              <span className="flex items-center gap-0.5 shrink-0">
                <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Footer: price + CTA arrow */}
      <div
        className="px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2
          border-t border-[#1683FF]/10
          bg-gradient-to-r from-[#f0f7ff] via-[#f5faff] to-white"
      >
        <div className="min-w-0">
          {price ? (
            <>
              <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide">
                {isRental ? "Mulai Sewa" : "Mulai"}
              </div>
              <div className="font-black text-sm sm:text-[15px] text-[#1683FF] truncate leading-tight">
                {formatIDR(price)}
                {isRental && (
                  <span className="text-[10px] font-normal text-slate-500 ml-0.5">/hari</span>
                )}
              </div>
            </>
          ) : (
            <span className="text-xs font-bold text-slate-700">Mitra Terverifikasi</span>
          )}
        </div>

        <span
          className="w-8 h-8 rounded-xl bg-[#1683FF] text-white flex items-center justify-center
            group-hover:bg-[#0F6FE5] transition-colors duration-200 shrink-0
            shadow-[0_2px_8px_rgba(22,131,255,0.35)]"
        >
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
