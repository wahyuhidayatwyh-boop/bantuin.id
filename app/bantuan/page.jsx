"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequestCard from "@/components/cards/RequestCard";
import MapComponent from "@/components/map/MapComponent";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDeadlineWithHour } from "@/lib/utils";
import { 
  Search, 
  Map, 
  Plus, 
  X, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Printer, 
  Package, 
  Calendar, 
  Layers, 
  Truck, 
  ShoppingCart, 
  Clock, 
  AlertTriangle, 
  Zap, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  Send,
  MoreHorizontal,
  ChevronDown,
  Check,
  Star,
  Navigation,
  Loader2
} from "lucide-react";

function BantuanContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { 
    requests, 
    currentUser, 
    bantuinPoints, 
    selectedLocation, 
    submitOffer,
    getDistanceToUser,
    userCoordinates,
    detectUserLocation,
    isDetectingLocation,
    activeKabupaten,
    filterByKabupaten,
    setFilterByKabupaten,
    isItemInCurrentKabupaten
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [scopeFilter, setScopeFilter] = useState("others"); // 'others' | 'my_requests' | 'all'
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [viewMode, setViewMode] = useState("card"); // 'card' | 'list'
  const [showMap, setShowMap] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);

  // Modal offer state for list view
  const [selectedTask, setSelectedTask] = useState(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState(15000);
  const [submitted, setSubmitted] = useState(false);

  // Counts for scope tabs
  const countOthers = useMemo(() => {
    return requests.filter((r) => r.requester?.id !== currentUser?.id && r.status !== "closed" && r.status !== "completed").length;
  }, [requests, currentUser]);

  const countMyRequests = useMemo(() => {
    return requests.filter((r) => r.requester?.id === currentUser?.id).length;
  }, [requests, currentUser]);

  // Primary top category cards (Clean & not crowded)
  const primaryCategoryCards = [
    { id: "Semua", name: "Semua Kategori", desc: "Semua kebutuhan", icon: Layers },
    { id: "Ambil Dokumen", name: "Ambil Dokumen", desc: "Notaris & Kantor", icon: FileText },
    { id: "Print & Fotokopi", name: "Print & Jilid", desc: "Proposal & Berkas", icon: Printer },
    { id: "Antar Barang", name: "Antar Barang", desc: "Paket & Titipan", icon: Package },
  ];

  // Extended subcategories accessible via "Lainnya..."
  const moreCategories = [
    { id: "Bantu Pindahan", name: "Bantu Pindahan & Angkat", desc: "Tenaga & Kos", icon: Truck },
    { id: "Titip Belanja", name: "Titip Belanja & Apotek", desc: "Obat & Supermarket", icon: ShoppingCart },
    { id: "Bantu Event", name: "Bantu Setup Event & Bazar", desc: "Tenda & Meja", icon: Calendar },
    { id: "Bantu Antri", name: "Bantu Antri Layanan Publik", desc: "Samsat & Loket", icon: Clock },
    { id: "Bantuan Darurat", name: "Bantuan Darurat & Jumper", desc: "Aki & Mogok", icon: AlertTriangle },
  ];

  const isSelectedInMore = moreCategories.some((c) => c.id === selectedCategory);

  // Filtered requests (pure active Bantuan only)
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // Scope Filter: Bantuan Orang Lain vs Permintaan Saya
      const isMine = item.requester?.id === currentUser?.id;
      if (scopeFilter === "others" && isMine) return false;
      if (scopeFilter === "my_requests" && !isMine) return false;

      // Exclude requests where a helper has already finished/closed unless viewing my own requests
      if (!isMine) {
        const isAcceptedOrFinished =
          item.status === "completed" ||
          item.status === "closed";
        if (isAcceptedOrFinished) return false;
      }

      // Filter Kabupaten: Hanya muncul di kabupaten yang sama jika filter aktif
      if (filterByKabupaten && !isMine && !isItemInCurrentKabupaten(item)) {
        return false;
      }

      const matchQuery =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === "Semua" || 
        item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === "Print & Fotokopi" && (item.category.includes("Print") || item.title.includes("Print"))) ||
        (selectedCategory === "Bantu Pindahan" && (item.category.includes("Pindah") || item.title.includes("Pindah"))) ||
        (selectedCategory === "Titip Belanja" && (item.category.includes("Belanja") || item.title.includes("Obat"))) ||
        (selectedCategory === "Bantu Antri" && (item.category.includes("Antri") || item.title.includes("Antri"))) ||
        (selectedCategory === "Bantuan Darurat" && (item.category.includes("Darurat") || item.title.includes("Aki") || item.title.includes("Mogok"))) ||
        (selectedCategory === "Bantu Event" && (item.category.includes("Event") || item.title.includes("Acara") || item.title.includes("Bazar")));

      return matchQuery && matchCategory;
    });
  }, [requests, currentUser, scopeFilter, searchQuery, selectedCategory, filterByKabupaten, isItemInCurrentKabupaten]);

  const handleOpenOfferModal = (task) => {
    setSelectedTask(task);
    setProposedPrice(task.rewardAmount || 15000);
    setPitchMessage("");
    setSubmitted(false);
  };

  const handleSendOffer = (e) => {
    e.preventDefault();
    if (!pitchMessage.trim()) return;
    submitOffer(selectedTask.id, pitchMessage, Number(proposedPrice));
    setSubmitted(true);
    setTimeout(() => {
      setSelectedTask(null);
      setSubmitted(false);
      setPitchMessage("");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 md:px-6 lg:px-8 py-4 sm:py-5">
        
        {/* Compact Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Bantuan di <span className="text-[#1683FF]">{activeKabupaten}</span>
            </h1>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#1683FF] border border-blue-100">
              {filteredRequests.length} tugas aktif
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Wilayah Toggle Switch */}
            <div className="flex items-center p-0.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => { setFilterByKabupaten(true); setVisibleCount(4); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterByKabupaten
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hanya {activeKabupaten}
              </button>
              <button
                type="button"
                onClick={() => { setFilterByKabupaten(false); setVisibleCount(4); }}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  !filterByKabupaten
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua Wilayah
              </button>
            </div>

            <Link
              href="/bantuan/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Permintaan</span>
            </Link>
          </div>
        </div>

        {/* Prominent Category Pills Bar (Visible, clickable, single sleek row) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-3 text-xs">
          {primaryCategoryCards.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setVisibleCount(4);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 border ${
                  isSelected
                    ? "bg-[#1683FF] text-white border-[#1683FF] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}

          {/* Kategori Lainnya Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 border ${
                isSelectedInMore || isMoreOpen
                  ? "bg-[#1683FF] text-white border-[#1683FF] shadow-xs"
                  : "bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50"
              }`}
            >
              <span>{isSelectedInMore ? selectedCategory : "Kategori Lainnya"}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
            </button>

            {isMoreOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {moreCategories.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setIsMoreOpen(false);
                          setVisibleCount(4);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition ${
                          isSelected ? "bg-blue-50 text-[#1683FF]" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cat.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#1683FF]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Integrated Search Bar & Scope Switcher */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2 shadow-2xs mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(4); }}
              placeholder="Cari tugas (ambil berkas, print dokumen, angkat lemari, tebus obat)..."
              className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl border-none focus:outline-none bg-slate-50/70 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setVisibleCount(4); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Scope Tabs + Map + View Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
            {/* Scope Filter Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => { setScopeFilter("others"); setVisibleCount(4); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  scopeFilter === "others"
                    ? "bg-white text-[#1683FF] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Orang Lain</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  scopeFilter === "others" ? "bg-blue-50 text-[#1683FF]" : "bg-slate-200 text-slate-600"
                }`}>
                  {countOthers}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setScopeFilter("my_requests"); setVisibleCount(4); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  scopeFilter === "my_requests"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Milik Saya</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  scopeFilter === "my_requests" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}>
                  {countMyRequests}
                </span>
              </button>
            </div>

            {/* Map Toggle */}
            <button
              onClick={() => setShowMap(!showMap)}
              className={`p-2 rounded-xl border text-xs font-semibold transition shrink-0 ${
                showMap
                  ? "bg-[#1683FF] text-white border-[#1683FF]"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              title={showMap ? "Tutup Peta" : "Lihat Peta"}
            >
              <Map className="w-3.5 h-3.5" />
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                  viewMode === "card" ? "bg-white text-[#1683FF] shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Tampilan Card Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center ${
                  viewMode === "list" ? "bg-white text-[#1683FF] shadow-2xs" : "text-slate-500 hover:text-slate-900"
                }`}
                title="Tampilan List Baris"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

        {/* Interactive Map View (Collapsible) */}
        {showMap && (
          <div className="mb-6 animate-fade-in bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1683FF]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Peta Titik Aman & Lokasi Permintaan Sekitar
                </h3>
              </div>
              <div className="flex items-center gap-2.5">
                {userCoordinates && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] animate-ping"></span>
                    <span>Posisi Anda Terpantau</span>
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {bantuinPoints.length} Titik Aman &bull; {filteredRequests.filter(r => r.latitude && r.longitude).length} Tugas Terpetakan
                </span>
              </div>
            </div>
            <MapComponent 
              points={[
                ...bantuinPoints,
                ...filteredRequests
                  .filter((r) => r.latitude && r.longitude)
                  .map((r) => ({
                    ...r,
                    type: "request",
                    name: r.title,
                    address: r.locationName,
                  }))
              ]}
              userLocation={userCoordinates}
              height="360px" 
            />
          </div>
        )}

        {/* Dynamic Display: Card Grid View VS Horizontal List View */}
        {filteredRequests.length > 0 ? (
          <div>
            {viewMode === "card" ? (
              /* 1. CARD GRID VIEW (4-Columns) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredRequests.slice(0, visibleCount).map((req) => (
                  <RequestCard key={req.id} request={req} />
                ))}
              </div>
            ) : (
              /* 2. COMPACT LIST ROW VIEW */
              <div className="space-y-2.5">
                {filteredRequests.slice(0, visibleCount).map((req) => {
                  const requester = req.requester || {
                    name: req.userName || "Sarah K.",
                    role: "Pengguna Terverifikasi",
                    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
                    verified: true,
                  };
                  const isMine = req.requester?.id === currentUser?.id;
                  const offersCount = req.offers?.length || 0;
                  const distanceInfo = getDistanceToUser
                    ? getDistanceToUser(req.latitude, req.longitude, req.distanceMeters)
                    : null;
                  const distanceText = req.mode === "online" 
                    ? "Online" 
                    : (distanceInfo?.text || (req.distanceMeters ? `${req.distanceMeters} m` : "Online"));
                  const timeText = formatDeadlineWithHour(req.deadline, req.deadlineText);

                  return (
                    <div
                      key={req.id}
                      className={`rounded-2xl border p-4 sm:p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isMine 
                          ? "bg-white border-blue-200/90 shadow-xs ring-1 ring-blue-500/10" 
                          : "bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#1683FF]/40"
                      }`}
                    >
                      {/* Left: Requester + Task Info */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <img
                          src={requester.avatar}
                          alt={requester.name}
                          className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-100 shrink-0 mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                              <span>{isMine ? "Saya (Peminta)" : requester.name}</span>
                              {requester.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              · {isMine ? "Permintaan Anda" : requester.role}
                            </span>
                            {isMine ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] border border-blue-200/80">
                                <Star className="w-2.5 h-2.5 fill-[#1683FF] text-[#1683FF]" /> Milik Saya
                              </span>
                            ) : (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                req.mode === "online" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                              }`}>
                                {req.mode === "online" ? "Online" : "Offline"}
                              </span>
                            )}
                          </div>

                          <Link href={`/bantuan/${req.id}`} className="group">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#1683FF] transition mb-1 leading-snug">
                              {req.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                            {req.description}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Distance & Deadline Meta */}
                      <div className="flex md:flex-col items-center md:items-start justify-between md:justify-center gap-1.5 md:min-w-[130px] pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                          <span>{distanceText}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{timeText.split("·")[0]}</span>
                        </span>
                      </div>

                      {/* Right: Reward Price & Action Button */}
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="text-left md:text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">
                            {isMine ? "Budget Anda" : "Imbalan"}
                          </div>
                          <div className="font-black text-base text-slate-900">
                            {req.isVoluntary ? "Sukarela" : formatIDR(req.rewardAmount)}
                          </div>
                        </div>

                        {isMine ? (
                          <Link
                            href={`/bantuan/${req.id}`}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition active:scale-95 shrink-0 flex items-center gap-1"
                          >
                            <span>Kelola ({offersCount})</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/bantuan/${req.id}/ajukan`}
                            className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition active:scale-95 shrink-0 flex items-center gap-1"
                          >
                            <span>Bantu</span>
                          </Link>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Button */}
            {filteredRequests.length > visibleCount && (
              <div className="flex justify-center mt-6">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-2xs hover:shadow-xs transition flex items-center gap-2"
                >
                  <span>Tampilkan Lebih Banyak</span>
                  <span className="text-[11px] text-slate-400 font-medium">({filteredRequests.length - visibleCount} tersisa)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-bold text-slate-800">
              {filterByKabupaten 
                ? `Belum ada permintaan bantuan di ${activeKabupaten} untuk filter saat ini.`
                : "Tidak ada permintaan bantuan yang cocok dengan filter pencarian."}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {filterByKabupaten
                ? `Anda dapat beralih ke "Semua Wilayah" untuk melihat bantuan di kota lain, atau jadilah yang pertama membuat permintaan di ${activeKabupaten}.`
                : "Coba ubah kata kunci pencarian atau pilih kategori bantuan lainnya."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {filterByKabupaten && (
                <button
                  type="button"
                  onClick={() => setFilterByKabupaten(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Lihat Semua Wilayah
                </button>
              )}
              <Link
                href="/bantuan/create"
                className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs"
              >
                Buat Permintaan Baru
              </Link>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function BantuanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat permintaan bantuan...</div>}>
      <BantuanContent />
    </Suspense>
  );
}
