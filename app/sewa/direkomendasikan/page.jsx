"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PromotedCard from "@/components/promotion/PromotedCard";
import { useApp } from "@/lib/context/AppContext";
import { promotionService } from "@/lib/services/promotionService";
import { SEWA_CATEGORIES } from "@/lib/categories";
import {
  Search,
  X,
  ChevronLeft,
  Award,
  Star,
} from "lucide-react";

export default function SewaDirekomendasikanPage() {
  const { rentals, activeKabupaten } = useApp();
  const [promotedRentals, setPromotedRentals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  // ─── Fetch promoted rentals ───────────────────────────────────────────────────
  useEffect(() => {
    const active = promotionService.getActivePromotionsSync({
      targetType: "rental",
      placement: "sewa",
    });

    const mapped = active.map((promo) => {
      const rentalItem = (rentals || []).find(
        (r) =>
          String(r.id) === String(promo.targetId) ||
          (r.title || r.name)?.toLowerCase() === (promo.targetTitle || "").toLowerCase()
      );
      return {
        promoId: promo.id,
        id: rentalItem?.id || promo.targetId || promo.id,
        targetId: rentalItem?.id || promo.targetId || promo.id,
        title: promo.targetTitle || rentalItem?.title || rentalItem?.name || "Unit Sewa",
        targetTitle: promo.targetTitle || rentalItem?.title || "Unit Sewa",
        category: promo.targetCategory || promo.category || rentalItem?.category || "Rental",
        targetCategory: promo.targetCategory || promo.category || rentalItem?.category || "Rental",
        price: promo.targetPrice || promo.price || rentalItem?.dailyPrice || rentalItem?.price || null,
        targetPrice: promo.targetPrice || promo.price || rentalItem?.dailyPrice || rentalItem?.price || null,
        image:
          promo.targetImage ||
          promo.image ||
          rentalItem?.photoUrl ||
          rentalItem?.image ||
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
        targetImage: promo.targetImage || promo.image || rentalItem?.photoUrl || rentalItem?.image,
        targetLocation: promo.targetLocation || rentalItem?.address || rentalItem?.location || "Banyumas",
        ownerName: promo.ownerName || rentalItem?.ownerName || rentalItem?.owner?.name || "Mitra Rental",
        rating: 5.0,
        ratingAvg: 5.0,
        ratingCount: 16,
        isVerifiedPartner: true,
        targetType: "rental",
      };
    });

    setPromotedRentals(mapped);
    active.forEach((p) => promotionService.recordImpression(p.id));
  }, [rentals, activeKabupaten]);

  // ─── Filter ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return promotedRentals.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.title?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.ownerName?.toLowerCase().includes(q);

      const matchCat =
        selectedCategory === "Semua" ||
        (item.category || "").toLowerCase().includes(selectedCategory.toLowerCase());

      return matchQuery && matchCat;
    });
  }, [promotedRentals, searchQuery, selectedCategory]);

  // ─── Category chips with count ────────────────────────────────────────────────
  const categoryOptions = useMemo(() => {
    return SEWA_CATEGORIES.map((cat) => ({
      ...cat,
      count:
        cat.id === "Semua"
          ? promotedRentals.length
          : promotedRentals.filter((item) =>
              (item.category || "").toLowerCase().includes(cat.id.toLowerCase())
            ).length,
    })).filter((cat) => cat.id === "Semua" || cat.count > 0);
  }, [promotedRentals]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">

        {/* ─── Page Header ──────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <Link
            href="/sewa"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#1683FF] transition-colors font-medium mb-3 group"
          >
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Sewa
          </Link>

          <div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1683FF] text-white text-[10px] font-black uppercase tracking-wider mb-2">
              <Award className="w-2.5 h-2.5" />
              Direkomendasikan
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Sewa Direkomendasikan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Unit rental pilihan mitra terverifikasi di{" "}
              <span className="font-semibold text-slate-700">
                {activeKabupaten || "Kab. Banyumas"}
              </span>
            </p>
          </div>
        </div>

        {/* ─── Search ───────────────────────────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            id="sewa-direk-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari unit sewa yang direkomendasikan..."
            className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-sm rounded-2xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center transition cursor-pointer"
              aria-label="Hapus pencarian"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* ─── Category Filter ──────────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          {categoryOptions.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                id={`sewa-direk-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border
                  ${isActive
                    ? "bg-[#1683FF] text-white border-[#1683FF] shadow-sm shadow-blue-400/25"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#1683FF]/60 hover:text-[#1683FF]"
                  }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── Active filter info ───────────────────────────────────────────────── */}
        {(searchQuery || selectedCategory !== "Semua") && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-slate-500">Menampilkan {filtered.length} hasil untuk:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700">
                &quot;{searchQuery}&quot;
                <button type="button" onClick={() => setSearchQuery("")} className="hover:text-slate-900 cursor-pointer ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategory !== "Semua" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-[#1683FF]">
                {selectedCategory}
                <button type="button" onClick={() => setSelectedCategory("Semua")} className="hover:text-blue-800 cursor-pointer ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setSelectedCategory("Semua"); }}
              className="text-xs text-slate-400 hover:text-rose-500 font-semibold underline transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}

        {/* ─── Grid List ────────────────────────────────────────────────────────── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filtered.map((item) => (
              <PromotedCard
                key={`direk-sewa-${item.promoId || item.id}`}
                item={item}
                href={`/sewa/${item.id}`}
                onCardClick={() => {
                  if (item.promoId) promotionService.recordClick(item.promoId);
                }}
                variant="rental"
                layout="list"
              />
            ))}
          </div>
        ) : (
          /* ─── Empty State ─────────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
              <Star className="w-7 h-7 text-[#1683FF] opacity-50" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-1">
              {searchQuery || selectedCategory !== "Semua"
                ? "Hasil Tidak Ditemukan"
                : "Belum Ada Sewa Direkomendasikan"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
              {searchQuery || selectedCategory !== "Semua"
                ? "Coba kata kunci lain atau ubah filter kategori."
                : "Belum ada unit sewa yang sedang tampil di slot rekomendasi."}
            </p>
            {(searchQuery || selectedCategory !== "Semua") && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSelectedCategory("Semua"); }}
                className="mt-4 text-xs font-bold text-[#1683FF] hover:underline cursor-pointer"
              >
                Lihat Semua Rekomendasi
              </button>
            )}
          </div>
        )}

        {/* ─── Footer CTA ───────────────────────────────────────────────────────── */}
        {promotedRentals.length > 0 && (
          <div className="mt-8 p-4 rounded-2xl bg-white border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">Tidak menemukan unit yang kamu cari?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Jelajahi seluruh katalog unit sewa di Bantuin
              </p>
            </div>
            <Link
              href="/sewa"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shrink-0"
            >
              Lihat Semua Sewa
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

