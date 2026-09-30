"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { authService } from "@/lib/services/authService";
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
  Plus,
  ChevronDown,
  Camera,
  HandHeart,
  Briefcase,
  AlertCircle,
  LogIn,
  RotateCw,
} from "lucide-react";

// ─── Status Badge Logic ──────────────────────────────────────────────────────
function getStatusBadge(order) {
  const status = (order.orderStatus || order.status || "").toLowerCase();
  const orderType = (order.orderType || order.categoryType || "").toLowerCase();

  if (status === "completed" || status === "verified_settled") {
    return {
      label: "Selesai",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      icon: CheckCircle2,
    };
  }

  if (status === "cancelled" || status === "batal") {
    return {
      label: "Dibatalkan",
      color: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500",
      icon: AlertCircle,
    };
  }

  if (status === "disputed") {
    return {
      label: "Dalam Sengketa",
      color: "bg-rose-50 text-rose-700 border-rose-200",
      dot: "bg-rose-500 animate-pulse",
      icon: AlertCircle,
    };
  }

  if (orderType === "rental" || orderType === "sewa") {
    if (status === "returned") {
      return {
        label: "Unit Kembali · Refund Selesai",
        color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
        dot: "bg-[#1683FF]",
        icon: Clock,
      };
    }
    if (status === "item_handed_over" || status === "handed_over" || status === "in_use") {
      return {
        label: "Masa Sewa Berlangsung",
        color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
        dot: "bg-[#1683FF] animate-pulse",
        icon: Loader2,
      };
    }
    if (status === "confirmed_by_owner") {
      return {
        label: "Dikonfirmasi · Siap Diambil",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        dot: "bg-amber-500 animate-pulse",
        icon: Clock,
      };
    }
    return {
      label: "Dana Terverifikasi · Siap Diambil",
      color: "bg-amber-50 text-amber-800 border-amber-200",
      dot: "bg-amber-500 animate-pulse",
      icon: Clock,
    };
  }

  if (orderType === "task" || orderType === "bantuan" || orderType === "service" || orderType === "jasa") {
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
    if (status === "task_delivered" || status === "proof_submitted") {
      return {
        label: "Tugas Selesai · Menunggu Konfirmasi",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        dot: "bg-indigo-500 animate-pulse",
        icon: Clock,
      };
    }
    if (status === "helper_selected" || status === "room_created") {
      return {
        label: "Helper Terpilih · Proses Pengerjaan",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500 animate-pulse",
        icon: Loader2,
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
    if (status === "awaiting_confirmation") {
      return {
        label: "Menunggu Konfirmasi Selesai",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        dot: "bg-amber-500 animate-pulse",
        icon: Clock,
      };
    }
    if (status === "has_offers") {
      return {
        label: "Tawaran Masuk · Pilih Helper",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500 animate-pulse",
        icon: User,
      };
    }
    if (status === "submitted") {
      return {
        label: "Lamaran Terkirim · Menunggu Review",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500 animate-pulse",
        icon: Clock,
      };
    }
    if (status === "published") {
      return {
        label: "Mencari Helper · Terpublikasi",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        dot: "bg-amber-500 animate-pulse",
        icon: Clock,
      };
    }
    return {
      label: "Dalam Proses Pengerjaan",
      color: "bg-[#EAF4FF] text-[#1683FF] border-[#DCEAF7]",
      dot: "bg-[#1683FF] animate-pulse",
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
  const isStandaloneRequest = !item.orderRoomId && item.orderType !== "rental";
  const targetLink = isStandaloneRequest
    ? `/bantuan/${item.requestId || item.id}`
    : `/chat?room=${item.chatRoomId || item.id}`;

  const ctaLabel = item.isCancelled
    ? "Detail Batal"
    : isStandaloneRequest
    ? "Lihat Detail"
    : item.isCompleted
    ? "Chat Selesai"
    : "Chat & Lacak";

  return (
    <div className="bg-white border border-[#DCEAF7] hover:border-[#1683FF]/50 rounded-xl sm:rounded-2xl transition-all duration-200 shadow-2xs hover:shadow-md group overflow-hidden flex flex-col sm:flex-row min-w-0">
      {/* Thumbnail */}
      <div className="relative w-full sm:w-44 aspect-[4/3] sm:aspect-auto sm:h-auto shrink-0 bg-slate-100 overflow-hidden">
        <img
          src={item.image}
          alt={item.requestTitle || item.title || "Foto transaksi"}
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
              {item.requestTitle || item.title || item.rentalDetails?.unitName || "Transaksi"}
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

            {item.pickupPoint && (
              <div className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0 text-[#1683FF]" />
                <span className="truncate">{item.pickupPoint}</span>
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
            href={targetLink}
            className="w-full sm:w-auto flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] active:scale-95 text-white text-[11px] sm:text-xs font-bold transition shadow-2xs shrink-0"
          >
            {isStandaloneRequest ? (
              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            ) : (
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            )}
            <span>{ctaLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 hidden sm:inline" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function ActivityContent() {
  const { currentUser, isAuthReady, isAuthenticated } = useApp();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get("tab");

  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [mainTab, setMainTab] = useState(
    tabParam === "selesai" ? "completed" : "ongoing"
  );
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const newOrderRef = useRef(null);

  // Fetch real activities from database via secure API route
  const loadUserActivities = async () => {
    setIsLoading(true);
    setFetchError(null);

    let token = await authService.getValidAccessToken();
    if (!token) {
      setActivities([]);
      setIsLoading(false);
      return;
    }

    try {
      let response = await fetch("/api/user/activities", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // If 401 (token expired), auto refresh and retry once
      if (response.status === 401) {
        try {
          const refreshed = await authService.refreshSession();
          if (refreshed?.accessToken) {
            token = refreshed.accessToken;
            response = await fetch("/api/user/activities", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
          }
        } catch {}
      }

      const result = await response.json();

      if (response.ok && result.success) {
        setActivities(result.data || []);
      } else {
        if (response.status === 401) {
          setActivities([]);
        } else {
          setFetchError(result.error || "Gagal memuat daftar aktivitas.");
        }
      }
    } catch (err) {
      console.error("Gagal mengambil aktivitas user:", err);
      setFetchError("Terjadi kendala koneksi ke server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserActivities();
    const handleAuthChange = () => {
      loadUserActivities();
    };
    window.addEventListener("bantuin_auth_changed", handleAuthChange);
    return () => window.removeEventListener("bantuin_auth_changed", handleAuthChange);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (newOrderRef.current && !newOrderRef.current.contains(e.target)) {
        setIsNewOrderOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (tabParam === "selesai") setMainTab("completed");
    else if (tabParam === "sewa") setCategoryFilter("sewa");
    else if (tabParam === "bantuan") setCategoryFilter("bantuan");
    else if (tabParam === "jasa") setCategoryFilter("jasa");
  }, [tabParam]);

  const allActivities = useMemo(() => {
    return activities.map((item) => {
      const status = (item.orderStatus || item.status || "").toLowerCase();
      const isCancelled = status === "cancelled" || status === "batal" || Boolean(item.isCancelled);
      const isCompleted = isCancelled || item.isCompleted || status === "completed" || status === "verified_settled" || status === "returned";
      const isOngoing = !isCompleted && !isCancelled;

      return {
        ...item,
        isCancelled,
        isCompleted,
        isOngoing,
        statusMeta: getStatusBadge(item),
      };
    });
  }, [activities]);

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
        <div className="mb-3.5 sm:mb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#1683FF] uppercase tracking-wider mb-0.5">
                <Activity className="w-3.5 h-3.5" />
                <span>Aktivitas &amp; Status Transaksi</span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#102A43] tracking-tight leading-tight">
                Aktivitas Saya
              </h1>
              <p className="text-xs sm:text-sm text-[#61758A] mt-0.5">
                Pantau seluruh transaksi sewa alat, bantuan tugas, dan layanan jasa secara terpusat.
              </p>
            </div>

            {/* Quick Action: + Pesanan Baru */}
            <div ref={newOrderRef} className="relative shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={loadUserActivities}
                title="Muat Ulang Data"
                className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-[#1683FF] shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? "animate-spin text-[#1683FF]" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsNewOrderOpen(!isNewOrderOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden xs:inline">Pesanan Baru</span>
                <span className="xs:hidden">Pesan</span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${isNewOrderOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isNewOrderOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Pilih Layanan
                  </div>
                  <Link
                    href="/sewa"
                    onClick={() => setIsNewOrderOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition text-[#102A43] hover:text-[#1683FF] group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center shrink-0">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Sewa Barang</div>
                      <div className="text-[10px] text-slate-400">Kamera, drone, outdoor gear</div>
                    </div>
                  </Link>

                  <Link
                    href="/bantuan"
                    onClick={() => setIsNewOrderOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50/70 transition text-[#102A43] hover:text-emerald-700 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <HandHeart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Bantuan Tugas</div>
                      <div className="text-[10px] text-slate-400">Titip belanja, print, antri</div>
                    </div>
                  </Link>

                  <Link
                    href="/jasa"
                    onClick={() => setIsNewOrderOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-purple-50/70 transition text-[#102A43] hover:text-purple-700 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Pesan Jasa</div>
                      <div className="text-[10px] text-slate-400">Desain, servis, bimbingan</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BAGIAN 1: STATUS PESANAN (SEGMENTED CONTROL TABS) ────────── */}
        <div className="flex items-center p-1 bg-slate-200/70 rounded-2xl mb-3 sm:mb-4 w-full sm:w-auto sm:inline-flex">
          <button
            type="button"
            onClick={() => setMainTab("ongoing")}
            className={`flex-1 sm:flex-initial py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mainTab === "ongoing"
                ? "bg-white text-[#1683FF] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Pesanan Aktif</span>
            <span className={`text-[10px] sm:text-xs font-extrabold px-1.5 py-0.2 rounded-full ${
              mainTab === "ongoing" ? "bg-blue-100 text-[#1683FF]" : "bg-slate-300 text-slate-700"
            }`}>
              {ongoingItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab("completed")}
            className={`flex-1 sm:flex-initial py-2 sm:py-2.5 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mainTab === "completed"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Riwayat Selesai</span>
            <span className={`text-[10px] sm:text-xs font-extrabold px-1.5 py-0.2 rounded-full ${
              mainTab === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-slate-300 text-slate-700"
            }`}>
              {completedItems.length}
            </span>
          </button>
        </div>

        {/* ── BAGIAN 2: FILTER KATEGORI (HORIZONTAL SCROLL PILLS) ───────── */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 mb-3.5 sm:mb-4">
          {FILTERS.map((chip) => {
            const isSelected = categoryFilter === chip.id;
            const count =
              chip.id === "all"
                ? (mainTab === "ongoing" ? ongoingItems.length : completedItems.length)
                : chip.id === "sewa"
                ? (mainTab === "ongoing" ? sewaCount : completedItems.filter(i => i.isRental).length)
                : chip.id === "bantuan"
                ? (mainTab === "ongoing" ? bantuanCount : completedItems.filter(i => i.isBantuan).length)
                : (mainTab === "ongoing" ? jasaCount : completedItems.filter(i => i.isJasa).length);

            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCategoryFilter(chip.id)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border whitespace-nowrap ${
                  isSelected
                    ? "bg-[#1683FF] text-white border-[#1683FF] shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <span>{chip.label}</span>
                {count > 0 && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? "bg-white/20 text-white font-extrabold" : "bg-slate-100 text-slate-500 font-semibold"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Loading State ── */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-[#DCEAF7] p-12 text-center space-y-3 shadow-xs">
            <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin mx-auto" />
            <div className="text-xs sm:text-sm font-bold text-[#102A43]">
              Sinkronisasi data aktivitas dari database...
            </div>
            <p className="text-[11px] text-[#61758A]">
              Memeriksa transaksi terverifikasi akun Anda.
            </p>
          </div>
        ) : !isAuthenticated && isAuthReady ? (
          /* ── Unauthenticated State ── */
          <div className="bg-white rounded-2xl border border-[#DCEAF7] p-10 sm:p-14 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto border border-[#DCEAF7]">
              <LogIn className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#102A43]">
                Masuk untuk Melihat Aktivitas Anda
              </h3>
              <p className="text-xs text-[#61758A] max-w-xs mx-auto mt-1">
                Seluruh riwayat sewa alat, pesanan bantuan tugas, dan transaksi jasa tersimpan aman di akun Anda.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/auth/login?redirect=/activity"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold transition shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Akun Saya</span>
              </Link>
            </div>
          </div>
        ) : fetchError ? (
          /* ── Error State ── */
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-3 shadow-xs">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <div className="text-xs sm:text-sm font-bold text-red-800">
              {fetchError}
            </div>
            <button
              onClick={loadUserActivities}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : displayedItems.length === 0 ? (
          /* ── Empty State ── */
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
                  ? "Semua transaksimu sudah selesai atau belum ada pesanan baru yang aktif di akun ini."
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
          /* ── Items Grid ── */
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
