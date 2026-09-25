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
    <div className="bg-white border border-[#DCEAF7] hover:border-[#1683FF]/50 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md group overflow-hidden">
      <div className="flex flex-col sm:flex-row">

        {/* Thumbnail */}
        <div className="relative sm:w-44 h-36 sm:h-auto shrink-0">
          <img
            src={item.image}
            alt={item.requestTitle}
            className="w-full h-full object-cover"
          />
          {/* Kategori overlay */}
          <span
            className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryStyle(item.categoryPill)}`}
          >
            {item.categoryPill}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-0">

          {/* Top row: title + status */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <h3 className="font-bold text-sm sm:text-[15px] text-[#102A43] leading-snug group-hover:text-[#1683FF] transition line-clamp-2">
                {item.requestTitle || item.rentalDetails?.unitName || "Transaksi"}
              </h3>

              <span
                className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${item.statusMeta.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${item.statusMeta.dot}`} />
                {item.statusMeta.label}
              </span>
            </div>

            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#61758A]">
              {item.partner?.name && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 shrink-0" />
                  <span className="font-semibold text-[#102A43]">{item.partner.name}</span>
                </span>
              )}
              {item.isRental && item.rentalDetails && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  <span>{item.rentalDetails.startDate} – {item.rentalDetails.endDate}</span>
                  <span className="text-[#DCEAF7]">·</span>
                  <span className="font-semibold text-[#1683FF]">{item.rentalDetails.durationDays} hari</span>
                </span>
              )}
              {item.isBantuan && item.pickupPoint && (
                <span className="flex items-center gap-1 max-w-[200px]">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.pickupPoint}</span>
                </span>
              )}
            </div>

            {/* Payment badge */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#1683FF] mt-2">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium">Pembayaran Terverifikasi Resmi</span>
            </div>
          </div>

          {/* Bottom row: price + CTA */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#DCEAF7]">
            <div>
              <div className="text-[10px] text-[#61758A] font-semibold uppercase tracking-wide flex items-center gap-1">
                <Banknote className="w-3 h-3" />
                Total Pembayaran
              </div>
              <div className="font-black text-base text-[#1683FF] mt-0.5 leading-none">
                {formatIDR(item.lockedAmount || 0)}
              </div>
              {item.isRental && item.depositAmount > 0 && (
                <div className="text-[10px] text-[#61758A] mt-0.5">
                  incl. Deposit {formatIDR(item.depositAmount)}
                </div>
              )}
            </div>

            <Link
              href={`/chat?room=${item.id}`}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] active:scale-95 text-white text-xs font-bold transition shadow-sm shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{item.isCompleted ? "Lihat Chat" : "Chat & Lacak"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Summary Stats Bar ────────────────────────────────────────────────────────
function StatPill({ label, value, highlight }) {
  return (
    <div className={`flex-1 min-w-[90px] rounded-xl px-4 py-3 border text-center ${highlight ? "bg-[#EAF4FF] border-[#DCEAF7]" : "bg-white border-[#DCEAF7]"}`}>
      <div className={`text-lg font-black leading-none ${highlight ? "text-[#1683FF]" : "text-[#102A43]"}`}>{value}</div>
      <div className="text-[10px] font-semibold text-[#61758A] mt-0.5">{label}</div>
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

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">

        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="mb-7">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1683FF] uppercase tracking-widest mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Aktivitas &amp; Status Transaksi</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight leading-tight">
                Aktivitas Saya
              </h1>
              <p className="text-sm text-[#61758A] mt-1">
                Pantau semua transaksi sewa, bantuan, dan jasa yang sedang berjalan atau sudah selesai.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/sewa"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-[#DCEAF7] hover:border-[#1683FF] text-[#61758A] hover:text-[#1683FF] transition"
              >
                + Sewa Baru
              </Link>
              <Link
                href="/bantuan"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-[#DCEAF7] hover:border-[#1683FF] text-[#61758A] hover:text-[#1683FF] transition"
              >
                + Minta Bantuan
              </Link>
              <Link
                href="/jasa"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1683FF] hover:bg-[#0F6FE5] text-white transition shadow-sm"
              >
                + Pesan Jasa
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats Pills ──────────────────────────────────────────────── */}
        <div className="flex items-stretch gap-2.5 mb-7 overflow-x-auto pb-1 scrollbar-none">
          <StatPill label="Total Aktif" value={ongoingItems.length} highlight />
          <StatPill label="Sewa Barang" value={sewaCount} />
          <StatPill label="Bantuan Tugas" value={bantuanCount} />
          <StatPill label="Layanan Jasa" value={jasaCount} />
          <StatPill label="Selesai" value={completedItems.length} />
        </div>

        {/* ── Main Tabs ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-[#DCEAF7] pb-3 mb-5">
          {[
            { id: "ongoing", label: "Sedang Berlangsung", count: ongoingItems.length },
            { id: "completed", label: "Riwayat Selesai", count: completedItems.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMainTab(tab.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                mainTab === tab.id
                  ? "bg-[#1683FF] text-white shadow-sm"
                  : "bg-white text-[#61758A] hover:text-[#102A43] border border-[#DCEAF7] hover:border-[#1683FF]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  mainTab === tab.id
                    ? "bg-white text-[#1683FF]"
                    : "bg-[#EAF4FF] text-[#1683FF]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Category Filter Chips ─────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-5 scrollbar-none">
          {FILTERS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategoryFilter(chip.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer border ${
                categoryFilter === chip.id
                  ? "bg-[#1683FF] text-white border-[#1683FF] font-bold shadow-sm"
                  : "bg-white text-[#61758A] border-[#DCEAF7] hover:text-[#102A43] hover:border-[#1683FF]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── Items List ────────────────────────────────────────────────── */}
        {displayedItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#DCEAF7] p-14 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF4FF] text-[#1683FF] flex items-center justify-center mx-auto border border-[#DCEAF7]">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#102A43]">
                {mainTab === "ongoing"
                  ? "Tidak Ada Pesanan Aktif"
                  : "Belum Ada Riwayat Selesai"}
              </h3>
              <p className="text-xs text-[#61758A] max-w-xs mx-auto mt-1.5">
                {mainTab === "ongoing"
                  ? "Semua transaksimu sudah selesai atau belum ada pesanan baru yang aktif."
                  : "Transaksi yang sudah rampung akan tercatat di sini secara otomatis."}
              </p>
            </div>
            {mainTab === "ongoing" && (
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <Link
                  href="/sewa"
                  className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-sm"
                >
                  Sewa Alat
                </Link>
                <Link
                  href="/bantuan"
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#EAF4FF] text-[#102A43] hover:text-[#1683FF] border border-[#DCEAF7] text-xs font-bold transition"
                >
                  Minta Bantuan
                </Link>
                <Link
                  href="/jasa"
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#EAF4FF] text-[#102A43] hover:text-[#1683FF] border border-[#DCEAF7] text-xs font-bold transition"
                >
                  Pesan Jasa
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
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
