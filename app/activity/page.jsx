"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  Package,
  MessageSquare,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Loader2,
  CalendarDays,
  MapPin,
  ChevronRight,
  Banknote,
  User,
} from "lucide-react";

// ─── Status Badge Logic ──────────────────────────────────────────────────────
function getStatusBadge(order) {
  const status = (order.orderStatus || order.status || "").toLowerCase();
  const orderType = (order.orderType || order.categoryType || "").toLowerCase();

  if (status === "completed") {
    return {
      label: "Selesai",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    };
  }

  if (orderType === "rental" || orderType === "sewa") {
    if (status === "returned") {
      return {
        label: "Unit Kembali · Refund Deposit",
        color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
        dot: "bg-[#1683FF]",
        icon: Clock,
      };
    }
    if (status === "item_handed_over" || status === "handed_over") {
      return {
        label: "Masa Sewa Berlangsung",
        color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
        dot: "bg-[#1683FF] animate-pulse",
        icon: Loader2,
      };
    }
    return {
      label: "Dana Terverifikasi · Siap Diambil",
      color: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500 animate-pulse",
      icon: Clock,
    };
  }

  if (orderType === "task" || orderType === "bantuan") {
    if (status === "item_picked_up") {
      return {
        label: "Barang Diambil · Menuju Lokasi",
        color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
        dot: "bg-[#1683FF] animate-pulse",
        icon: Loader2,
      };
    }
    if (status === "on_the_way") {
      return {
        label: "Helper Menuju Lokasi",
        color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
        dot: "bg-[#1683FF] animate-pulse",
        icon: Loader2,
      };
    }
    return {
      label: "Dana Terverifikasi · Cari Helper",
      color: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500 animate-pulse",
      icon: Clock,
    };
  }

  if (status === "in_progress") {
    return {
      label: "Sedang Dikerjakan",
      color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
      dot: "bg-[#1683FF] animate-pulse",
      icon: Loader2,
    };
  }

  return {
    label: "Pembayaran Terverifikasi Aman",
    color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
    dot: "bg-[#1683FF]",
    icon: ShieldCheck,
  };
}

// ─── Category Pill Styling ────────────────────────────────────────────────────
function getCategoryStyle(cat) {
  if (cat === "Sewa")
    return "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]";
  if (cat === "Jasa")
    return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

// ─── Activity Card ────────────────────────────────────────────────────────────
function ActivityCard({ item }) {
  return (
    <div className="bg-white border border-[#DCEAF7] hover:border-[#1683FF]/50 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md group overflow-hidden flex flex-col sm:flex-row min-w-0">
      {/* Thumbnail */}
      <div className="relative w-full sm:w-44 aspect-[4/3] sm:aspect-auto sm:h-auto shrink-0 bg-slate-100 overflow-hidden">
        <img
          src={item.image}
          alt={item.requestTitle || "Foto transaksi"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Kategori overlay on photo */}
        <span
          className={`absolute top-2 left-2 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border shadow-2xs backdrop-blur-xs ${getCategoryStyle(item.categoryPill)}`}
        >
          {item.categoryPill}
        </span>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-5 flex flex-col justify-between flex-1 gap-1.5 sm:gap-2.5 min-w-0">
        <div>
          {/* Title + Status */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 sm:gap-3 mb-1 min-w-0">
            <h3 className="font-bold text-xs sm:text-[15px] text-[#102A43] leading-snug group-hover:text-[#1683FF] transition line-clamp-2 min-h-[30px] sm:min-h-0 break-words flex-1">
              {item.requestTitle || item.rentalDetails?.unitName || "Transaksi"}
            </h3>

            {/* Status badge */}
            <div className="sm:self-auto shrink-0 my-0.5 sm:my-0">
              <span
                className={`inline-flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border max-w-full truncate ${item.statusMeta.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.statusMeta.dot}`} />
                <span className="truncate">{item.statusMeta.label}</span>
              </span>
            </div>
          </div>

          {/* Primary date/partner info */}
          <div className="text-[10px] sm:text-[11px] text-[#61758A] mt-1 space-y-1">
            {item.isRental && item.rentalDetails && (
              <div className="flex items-center gap-1 truncate">
                <CalendarDays className="w-3 h-3 shrink-0 text-[#1683FF]" />
                <span className="sm:hidden font-medium text-[#102A43] truncate">
                  {item.rentalDetails.startDate}
                </span>
                <span className="hidden sm:inline truncate">
                  {item.rentalDetails.startDate} – {item.rentalDetails.endDate}
                </span>
                <span className="text-[#DCEAF7]">·</span>
                <span className="font-bold text-[#1683FF] shrink-0">
                  {item.rentalDetails.durationDays} hari
                </span>
              </div>
            )}

            {item.isBantuan && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0 text-[#1683FF]" />
                <span className="truncate">{item.pickupPoint || "Banyumas"}</span>
              </div>
            )}

            {item.partner?.name && (
              <div className="flex items-center gap-1 truncate">
                <User className="w-3 h-3 shrink-0 text-[#1683FF]" />
                <span className="font-semibold text-[#102A43] truncate">
                  {item.partner.name}
                </span>
              </div>
            )}

            {/* Desktop-only payment guarantee */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#1683FF] pt-1">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">Pembayaran Terverifikasi Resmi</span>
            </div>
          </div>
        </div>

        {/* Bottom row: Price + CTA */}
        <div className="pt-2 border-t border-[#DCEAF7] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2.5">
          <div className="min-w-0">
            <div className="text-[8px] sm:text-[10px] text-[#61758A] font-semibold uppercase tracking-wide flex items-center gap-1">
              <Banknote className="w-3 h-3 hidden sm:inline" />
              <span>Total</span>
            </div>
            <div className="font-black text-xs sm:text-base text-[#1683FF] leading-tight truncate">
              {formatIDR(item.lockedAmount || 0)}
            </div>
          </div>

          <Link
            href={`/chat?room=${item.id}`}
            className="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] active:scale-95 text-white text-[11px] sm:text-xs font-bold transition shadow-2xs shrink-0"
          >
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Chat</span>
            <span className="hidden sm:inline">{item.isCompleted ? " Selesai" : " & Lacak"}</span>
            <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function ActivityContent() {
  const { orderRooms = [], currentUser } = useApp();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");

  const [mainTab, setMainTab] = useState(
    tabParam === "selesai" ? "completed" : "ongoing"
  );
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    if (tabParam === "selesai") setMainTab("completed");
    else if (tabParam === "sewa") setCategoryFilter("sewa");
    else if (tabParam === "bantuan") setCategoryFilter("bantuan");
    else if (tabParam === "jasa") setCategoryFilter("jasa");
  }, [tabParam]);

  const allActivities = useMemo(() => {
    return (orderRooms || []).map((room) => {
      const isRental = room.orderType === "rental" || room.categoryType === "sewa";
      const isJasa = room.orderType === "service" || room.categoryType === "jasa";
      const isBantuan = room.orderType === "task" || room.categoryType === "bantuan";
      const categoryPill = isRental ? "Sewa" : isJasa ? "Jasa" : "Bantuan";
      const isCompleted = room.orderStatus === "completed";
      const isOngoing = !isCompleted && room.orderStatus !== "cancelled";

      const image =
        room.rentalDetails?.photoUrl ||
        room.serviceDetails?.serviceImage ||
        room.proofPhotos?.[0] ||
        room.helper?.avatar ||
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80";
      const partner =
        room.requester?.id === currentUser?.id ? room.helper : room.requester;

      return {
        ...room,
        isRental,
        isJasa,
        isBantuan,
        categoryPill,
        isCompleted,
        isOngoing,
        image,
        partner,
        statusMeta: getStatusBadge(room),
      };
    });
  }, [orderRooms, currentUser]);

  const ongoingItems = useMemo(() => allActivities.filter((i) => i.isOngoing), [allActivities]);
  const completedItems = useMemo(() => allActivities.filter((i) => i.isCompleted), [allActivities]);

  const sewaCount = ongoingItems.filter((i) => i.isRental).length;
  const bantuanCount = ongoingItems.filter((i) => i.isBantuan).length;
  const jasaCount = ongoingItems.filter((i) => i.isJasa).length;

  const displayedItems = useMemo(() => {
    const list = mainTab === "ongoing" ? ongoingItems : completedItems;
    if (categoryFilter === "sewa") return list.filter((i) => i.isRental);
    if (categoryFilter === "bantuan") return list.filter((i) => i.isBantuan);
    if (categoryFilter === "jasa") return list.filter((i) => i.isJasa);
    return list;
  }, [mainTab, ongoingItems, completedItems, categoryFilter]);

  const FILTERS = [
    { id: "all", label: "Semua" },
    { id: "sewa", label: "Sewa Barang" },
    { id: "bantuan", label: "Bantuan Tugas" },
    { id: "jasa", label: "Layanan Jasa" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-10">

        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#1683FF] uppercase tracking-wider mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Aktivitas &amp; Status Transaksi</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#102A43] tracking-tight leading-tight">
                Aktivitas Saya
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-[#61758A] mt-0.5">
                Pantau seluruh transaksi sewa alat, bantuan tugas, dan layanan jasa secara terpusat.
              </p>
            </div>

            {/* Action buttons row: [ + Sewa ] [ + Bantuan ] [ + Pesan Jasa ] */}
            <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/sewa"
                className="text-center px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-white border border-[#DCEAF7] hover:border-[#1683FF] text-[#102A43] hover:text-[#1683FF] transition shadow-2xs"
              >
                + Sewa
              </Link>
              <Link
                href="/bantuan"
                className="text-center px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-white border border-[#DCEAF7] hover:border-[#1683FF] text-[#102A43] hover:text-[#1683FF] transition shadow-2xs"
              >
                + Bantuan
              </Link>
              <Link
                href="/jasa"
                className="text-center px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-[#1683FF] hover:bg-[#0F6FE5] text-white transition shadow-2xs"
              >
                + Pesan Jasa
              </Link>
            </div>
          </div>
        </div>

        {/* ── BAGIAN 1: RINGKASAN TRANSAKSI AKTIF & RIWAYAT (2-Card Compact) ── */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
          {/* Card 1: Pesanan Aktif */}
          <button
            type="button"
            onClick={() => setMainTab("ongoing")}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              mainTab === "ongoing"
                ? "bg-[#EAF4FF] border-[#1683FF] shadow-xs ring-1 ring-[#1683FF]/30"
                : "bg-white border-[#DCEAF7] hover:border-[#1683FF]/40 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-bold text-[#102A43] truncate">
                Pesanan Aktif
              </span>
              <span className="w-2 h-2 rounded-full bg-[#1683FF] shrink-0" />
            </div>

            <div className="my-2 sm:my-3">
              <span className="text-2xl sm:text-3xl font-black text-[#1683FF] tracking-tight leading-none">
                {ongoingItems.length}
              </span>
            </div>

            {/* Desktop breakdown, hidden on mobile */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold text-[#61758A] mb-2">
              <span>Sewa: {sewaCount}</span>
              <span>·</span>
              <span>Bantuan: {bantuanCount}</span>
              <span>·</span>
              <span>Jasa: {jasaCount}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#1683FF] pt-2 border-t border-[#DCEAF7]">
              <span>Lihat Pesanan</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </button>

          {/* Card 2: Riwayat Selesai */}
          <button
            type="button"
            onClick={() => setMainTab("completed")}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
              mainTab === "completed"
                ? "bg-[#EAF4FF] border-[#1683FF] shadow-xs ring-1 ring-[#1683FF]/30"
                : "bg-white border-[#DCEAF7] hover:border-[#1683FF]/40 hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs sm:text-sm font-bold text-[#102A43] truncate">
                Riwayat Selesai
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>

            <div className="my-2 sm:my-3">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none">
                {completedItems.length}
              </span>
            </div>

            {/* Desktop breakdown, hidden on mobile */}
            <div className="hidden sm:block text-[10px] font-semibold text-[#61758A] mb-2 truncate">
              Transaksi selesai &amp; tercatat
            </div>

            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-emerald-600 pt-2 border-t border-[#DCEAF7]">
              <span>Lihat Riwayat</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
          </button>
        </div>

        {/* ── BAGIAN 2: DAFTAR PESANAN & FILTER ── */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#102A43]">
            {mainTab === "ongoing" ? "Daftar Pesanan Berlangsung" : "Daftar Riwayat Selesai"}
          </h2>
          <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-[#EAF4FF] text-[#1683FF] border border-[#DCEAF7]">
            {displayedItems.length} transaksi
          </span>
        </div>

        {/* ── Category Filter Chips (Smooth scroll, compact) ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 sm:mx-0 sm:px-0 pb-2 mb-3.5">
          {FILTERS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategoryFilter(chip.id)}
              className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition shrink-0 cursor-pointer border ${
                categoryFilter === chip.id
                  ? "bg-[#1683FF] text-white border-[#1683FF] shadow-xs"
                  : "bg-white text-[#61758A] border-[#DCEAF7] hover:text-[#102A43] hover:border-[#1683FF]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── Items Grid (2 cols on mobile, 1 col on desktop) ── */}
        {displayedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DCEAF7] p-10 sm:p-14 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#EAF4FF] text-[#1683FF] flex items-center justify-center mx-auto border border-[#DCEAF7]">
              <Package className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#102A43]">
                {mainTab === "ongoing"
                  ? "Tidak Ada Pesanan Aktif"
                  : "Belum Ada Riwayat Selesai"}
              </h3>
              <p className="text-xs text-[#61758A] max-w-xs mx-auto mt-1">
                {mainTab === "ongoing"
                  ? "Semua transaksimu sudah selesai atau belum ada pesanan baru yang aktif."
                  : "Transaksi yang sudah rampung akan tercatat di sini secara otomatis."}
              </p>
            </div>
            {mainTab === "ongoing" && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Link
                  href="/sewa"
                  className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs"
                >
                  Sewa Alat
                </Link>
                <Link
                  href="/bantuan"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#EAF4FF] text-[#102A43] hover:text-[#1683FF] border border-[#DCEAF7] text-xs font-bold transition"
                >
                  Minta Bantuan
                </Link>
                <Link
                  href="/jasa"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-[#EAF4FF] text-[#102A43] hover:text-[#1683FF] border border-[#DCEAF7] text-xs font-bold transition"
                >
                  Pesan Jasa
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 sm:gap-3.5">
            {displayedItems.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

// ─── Page Export ─────────────────────────────────────────────────────────────
export default function ActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F5FAFF]">
          <div className="text-[#61758A] font-bold text-xs flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1683FF] animate-spin" />
            <span>Memuat aktivitas...</span>
          </div>
        </div>
      }
    >
      <ActivityContent />
    </Suspense>
  );
}
