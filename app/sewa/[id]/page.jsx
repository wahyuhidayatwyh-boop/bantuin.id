"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { 
  ArrowLeft, 
  Lock, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Store, 
  ExternalLink,
  Check,
  Layers,
  Package,
  ChevronRight as BreadcrumbSeparator
} from "lucide-react";
import { getNavigationUrl } from "@/lib/services/gpsService";
import { getMitraStoreById, getAllMitraStores } from "@/lib/mock/mitraData";
import CategoryIcon from "@/components/common/CategoryIcon";
import ProductProfileCard from "@/components/cards/ProductProfileCard";
import { authService } from "@/lib/services/authService";

function parsePackageDurationDays(durationStr) {
  if (!durationStr) return 1;
  const match = String(durationStr).match(/(\d+)\s*hari/i);
  if (match && match[1]) {
    const days = parseInt(match[1], 10);
    return days > 0 ? days : 1;
  }
  const matchNum = String(durationStr).match(/(\d+)/);
  if (matchNum && matchNum[1]) {
    const num = parseInt(matchNum[1], 10);
    return num > 0 ? num : 1;
  }
  return 1;
}

function addDaysToDateStr(dateStr, days) {
  try {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + Number(days));
    const yy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  } catch {
    return dateStr;
  }
}

function RentalDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPkgId = searchParams?.get("pkg") || searchParams?.get("packageId");

  const { 
    rentals, 
    currentUser,
    addToast,
    startRentalInquiry,
    getDistanceToUser, 
    userCoordinates 
  } = useApp() || {};

  const todayStr = useMemo(() => {
    const d = new Date();
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
  }, []);

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => addDaysToDateStr(todayStr, 1));
  const [totalDays, setTotalDays] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const [dbRental, setDbRental] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/rentals/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const r = json.data;
          const photosList = Array.isArray(r.photoUrls) && r.photoUrls.length > 0
            ? r.photoUrls
            : (Array.isArray(r.photos) && r.photos.length > 0 ? r.photos : [r.coverImageUrl || "/logotab.png"]);

          setDbRental({
            id: r.id,
            title: r.title,
            category: r.category,
            dailyPrice: Number(r.dailyPrice),
            depositAmount: Number(r.depositAmount || 0),
            photoUrl: photosList[0] || "/logotab.png",
            photos: photosList,
            stock: r.stockCount !== undefined ? Number(r.stockCount) : 1,
            stockCount: r.stockCount !== undefined ? Number(r.stockCount) : 1,
            stockStatus: r.stockStatus || (r.isAvailable ? "Siap Sewa" : "Sedang Disewa"),
            tag: r.tag,
            includedItems: r.includedItems || "",
            securityDeposit: r.securityDeposit || "",
            description: r.description,
            condition: r.description,
            ratingAvg: Number(r.ratingAvg) || 5.0,
            ratingCount: Number(r.ratingCount) || 0,
            totalRentedCount: 0,
            isVerifiedPartner: r.owner?.verificationStatus === "verified" || r.isVerifiedPartner,
            isSafeEscrow: true,
            storeId: r.ownerId || "mitra-rental",
            ownerName: r.owner?.partnerBusinessName || r.owner?.fullName || "Mitra Sewa Resmi",
            owner: {
              id: r.owner?.id,
              name: r.owner?.partnerBusinessName || r.owner?.fullName || "Mitra Sewa Resmi",
              avatar: r.owner?.avatarUrl || "/logotab.png",
              rating: Number(r.owner?.ratingAvg) || 5.0,
              completedOrders: 0,
            },
            location: r.pickupLocation || r.owner?.campusName || "Indonesia",
            address: r.pickupLocation || r.owner?.campusName || "Indonesia",
            packages: r.packages || [],
            pricingMode: r.pricingMode || "single",
          });
        }
      })
      .catch(() => {});
  }, [id]);

  // Cari unit dari AppContext rentals atau dari katalog seluruh toko mitra
  const rental = useMemo(() => {
    if (dbRental) return dbRental;
    const found = rentals.find((r) => r.id === id);
    if (found) return found;

    const allStores = getAllMitraStores();
    for (const st of allStores) {
      const catItem = st.catalog?.find((c) => c.id === id);
      if (catItem) {
        return {
          id: catItem.id,
          title: catItem.name,
          category: catItem.category,
          dailyPrice: Number(catItem.price),
          depositAmount: Number(catItem.depositAmount || 200000),
          photoUrl: catItem.image || "/logotab.png",
          photos: (catItem.photos && catItem.photos.length > 0) ? catItem.photos : [catItem.image || "/logotab.png"],
          stock: catItem.stockCount ?? catItem.stock ?? 1,
          stockCount: catItem.stockCount ?? catItem.stock ?? 1,
          stockStatus: catItem.stockStatus || "Siap Sewa",
          tag: catItem.tag || undefined,
          includedItems: catItem.includedItems || "",
          securityDeposit: catItem.securityDeposit || st.securityDepositPolicy || "",
          description: catItem.desc,
          ratingAvg: catItem.rating || 5.0,
          ratingCount: catItem.reviews || 0,
          totalRentedCount: 0,
          isVerifiedPartner: true,
          isSafeEscrow: true,
          storeId: st.id,
          ownerName: st.name,
          owner: {
            id: st.id,
            name: st.name,
            avatar: st.avatar || "/logotab.png",
            rating: st.rating || 5.0,
            completedOrders: st.completedOrders || 0,
          },
          location: st.address || "Indonesia",
          address: st.address || "Indonesia",
          packages: catItem.packages || [],
          pricingMode: catItem.pricingMode || "single",
        };
      }
    }
    return rentals[0];
  }, [rentals, id, dbRental]);

  // Resolve store data cleanly
  const storeId = rental?.storeId || rental?.owner?.id || null;
  const storeData = storeId ? getMitraStoreById(storeId) : null;

  // Photos gallery (mendukung multi-foto tanpa gambar dummy unsplash)
  const productPhotos = (rental?.photos && rental.photos.length > 0)
    ? rental.photos
    : [rental?.photoUrl || "/logotab.png"];
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Available packages for this rental unit
  const availablePackages = useMemo(() => {
    if (Array.isArray(rental?.packages) && rental.packages.length > 0) {
      return rental.packages;
    }
    return [];
  }, [rental?.packages]);

  // Pricing Mode: Tiered (Paketan) vs Single (Tarif Harian Biasa)
  // Dipisahkan secara tegas: jika ada paket maka mode paketan aktif
  const isTieredMode = rental?.pricingMode === "tiered" || availablePackages.length > 0;

  // Sinkronisasi paket terpilih (HANYA untuk mode paketan)
  useEffect(() => {
    if (isTieredMode && availablePackages.length > 0) {
      const pkgFromUrl = queryPkgId ? availablePackages.find((p) => p.id === queryPkgId) : null;
      const target = pkgFromUrl || (selectedPackage && availablePackages.some((p) => p.id === selectedPackage.id) ? selectedPackage : availablePackages[0]);
      
      if (!selectedPackage || selectedPackage.id !== target.id) {
        setSelectedPackage(target);
        const pkgDays = parsePackageDurationDays(target.duration);
        setTotalDays(pkgDays);
        setEndDate(addDaysToDateStr(startDate, pkgDays));
      }
    } else if (!isTieredMode && selectedPackage !== null) {
      setSelectedPackage(null);
    }
  }, [isTieredMode, availablePackages, queryPkgId]);

  // Handler memilih paket dari card kiri
  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    const pkgDays = parsePackageDurationDays(pkg.duration);
    setTotalDays(pkgDays);
    setEndDate(addDaysToDateStr(startDate, pkgDays));
  };

  // Handler perubahan tanggal mulai
  const handleStartDateChange = (newStart) => {
    setStartDate(newStart);
    if (isTieredMode && selectedPackage) {
      const pkgDays = parsePackageDurationDays(selectedPackage.duration);
      setEndDate(addDaysToDateStr(newStart, pkgDays));
    } else if (endDate) {
      try {
        const [sy, sm, sd] = newStart.split("-").map(Number);
        const [ey, em, ed] = endDate.split("-").map(Number);
        const s = new Date(sy, sm - 1, sd);
        const e = new Date(ey, em - 1, ed);
        const diff = Math.max(1, Math.round((e - s) / 86400000));
        setTotalDays(diff);
      } catch {
        setTotalDays(1);
      }
    }
  };

  // Handler perubahan tanggal selesai (hanya aktif pada mode harian biasa)
  const handleEndDateChange = (newEnd) => {
    setEndDate(newEnd);
    if (!isTieredMode && startDate) {
      try {
        const [sy, sm, sd] = startDate.split("-").map(Number);
        const [ey, em, ed] = newEnd.split("-").map(Number);
        const s = new Date(sy, sm - 1, sd);
        const e = new Date(ey, em - 1, ed);
        const diff = Math.max(1, Math.round((e - s) / 86400000));
        setTotalDays(diff);
      } catch {
        setTotalDays(1);
      }
    }
  };

  // Recalculate duration & active prices
  const activeDailyPrice = isTieredMode && selectedPackage
    ? Number(selectedPackage.price)
    : Number(rental?.dailyPrice || 0);

  const activeDepositAmount = isTieredMode && selectedPackage?.depositAmount !== undefined && selectedPackage?.depositAmount !== null && Number(selectedPackage.depositAmount) >= 0
    ? Number(selectedPackage.depositAmount)
    : Number(rental?.depositAmount || 200000);

  // KETENTUAN HARGA:
  // - Mode Paketan: Biaya sewa adalah harga paket tetap (fixed package price), BUKAN dikalikan hari!
  // - Mode Harian: Biaya sewa dihitung per hari (dailyPrice * totalDays).
  const rentalFee = isTieredMode && selectedPackage
    ? Number(selectedPackage.price)
    : activeDailyPrice * totalDays;

  const depositFee = activeDepositAmount;
  const platformFee = Math.round(rentalFee * 0.08);
  const totalAmount = rentalFee + depositFee;

  // Reset active photo index if it exceeds available photos
  useEffect(() => {
    if (activePhotoIndex >= productPhotos.length) {
      setActivePhotoIndex(0);
    }
  }, [productPhotos.length, activePhotoIndex]);

  const availableStock = typeof rental?.stockCount === "number" ? rental.stockCount : (typeof rental?.stock === "number" ? rental.stock : 1);
  const isOutOfStock = availableStock <= 0 || (rental?.stockStatus && (rental.stockStatus.toLowerCase().includes("habis") || rental.stockStatus.toLowerCase().includes("perawatan") || rental.stockStatus.toLowerCase().includes("sedang disewa")));

  // Dynamic social proof numbers calculated from app state
  const totalRentedCount = rental?.totalRentedCount ?? rental?.owner?.completedOrders ?? 0;
  const ratingAvg = rental?.ratingAvg ? Number(rental.ratingAvg) : 5.0;
  const reviewCount = rental?.ratingCount ? Number(rental.ratingCount) : (rental?.reviews?.length ?? 0);

  // Related rental items (other than current item)
  const relatedRentals = rentals
    .filter((r) => r.id !== rental?.id)
    .slice(0, 4);

  // Dynamic reviews list: Prioritize dynamic reviews from rental item state, then store, then defaults
  const reviewsList = (rental?.reviews && rental.reviews.length > 0)
    ? rental.reviews
    : (storeData?.reviews && storeData.reviews.length > 0
        ? storeData.reviews
        : []
      );

  const [isInquiring, setIsInquiring] = useState(false);

  const handleStartInquiry = async () => {
    if (!rental) return;

    if (!currentUser) {
      router.push(`/auth/login?redirect=/sewa/${rental.id}`);
      return;
    }

    setIsInquiring(true);
    const initialQuestion = `Halo ${rental.owner?.name || storeData?.name || "Toko Mitra"}, saya ingin menanyakan ketersediaan ${rental.title} untuk tanggal ${startDate} s/d ${endDate} (${totalDays} hari). Apakah unit ready?`;

    try {
      const token = await authService.getValidAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      // Panggil POST /api/chat/rooms agar langsung tersimpan di PostgreSQL & mengirim notifikasi ke pemilik sewa
      const res = await fetch("/api/chat/rooms", {
        method: "POST",
        headers,
        body: JSON.stringify({
          rentalId: rental.id,
          initialMessage: initialQuestion,
        }),
      });

      const json = await res.json();
      if (json.success && json.data?.id) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("bantuin_chat_update"));
          window.dispatchEvent(new Event("bantuin_notification_updated"));
        }
        addToast?.("Obrolan Terhubung", `Pesan telah dikirim ke ${rental.owner?.name || storeData?.name || "pemilik sewa"}.`, "success");
        router.push(`/chat?room=${json.data.id}&role=requester&category=sewa`);
        return;
      } else if (json.error) {
        addToast?.("Tidak Dapat Membuka Chat", json.error, "warning");
        return;
      }
    } catch (err) {
      console.warn("Failed to create rental chat room via API:", err);
    } finally {
      setIsInquiring(false);
    }

    // Fallback darurat jika koneksi API terputus
    if (startRentalInquiry) {
      const inqRoom = startRentalInquiry({
        rentalId: rental.id,
        rentalTitle: rental.title,
        photoUrl: rental.photoUrl,
        storeId: storeId,
        storeName: rental.owner?.name || storeData?.name || "Mitra Rental Resmi",
        storeAvatar: rental.owner?.avatar || storeData?.avatar || rental.photoUrl,
        storePhone: rental.owner?.phone || storeData?.phone || "-",
        startDate,
        endDate,
        totalDays,
        dailyPrice: rental.dailyPrice,
        depositFee: rental.depositAmount,
        pickupLocation: rental.address || rental.location || "Alamat Toko Mitra",
        initialQuestion
      });
      const roomId = inqRoom?.id || `order-room-rental-${Date.now()}`;
      router.push(`/chat?room=${roomId}&role=requester&category=sewa`);
    } else {
      router.push(`/chat?partnerId=${storeId || rental.ownerId}&category=sewa`);
    }
  };

  if (!rental) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Barang Sewa Tidak Ditemukan</h2>
          <Link href="/sewa" className="mt-4 px-4 py-2 bg-[#1683FF] text-white rounded-xl text-xs font-semibold">
            Kembali ke Katalog Sewa
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const storeNetPayout = rentalFee - platformFee;

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(rental.latitude, rental.longitude, rental.distanceMeters)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        
        {/* Breadcrumb Navigasi Khas Marketplace */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-5 overflow-x-auto whitespace-nowrap pb-1">
          <Link href="/" className="hover:text-[#1683FF] transition">Beranda</Link>
          <BreadcrumbSeparator className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link href="/sewa" className="hover:text-[#1683FF] transition">Katalog Sewa</Link>
          <BreadcrumbSeparator className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-600 font-medium">{rental.category}</span>
          <BreadcrumbSeparator className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold truncate max-w-[280px] sm:max-w-md">{rental.title}</span>
        </nav>

        {/* Layout Marketplace: Kiri Konten Rapi Mengalir, Kanan Sticky Checkout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI (7 Kolom): 3 Card Terstruktur, Rapi, dan Konsisten */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CARD 1: Galeri, Informasi Utama & Kelengkapan Produk */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
              {/* Galeri Multi-Foto Produk (Bersih Murni Tanpa Icon di Atas Foto) */}
              <div className="space-y-3">
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/70">
                  <img
                    src={productPhotos[activePhotoIndex]}
                    alt={`${rental.title} - Foto ${activePhotoIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                </div>

                {/* Baris Thumbnail */}
                {productPhotos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {productPhotos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                          activePhotoIndex === idx
                            ? "border-[#1683FF] ring-2 ring-blue-100 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Header Judul, Kategori & Social Proof */}
              <div className="space-y-2.5 pt-1">
                {/* Badges Bar: Bersih, Rapi & Ringkas di Layar Mobile */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 bg-slate-100 text-slate-700 rounded-md">
                      <CategoryIcon category={rental.category} className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1683FF] shrink-0" />
                      <span>{rental.category}</span>
                    </span>
                    {rental.tag && (
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-white bg-amber-500 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md shadow-2xs">
                        {rental.tag}
                      </span>
                    )}
                    {rental.isVerifiedPartner && (
                      <span className="text-[11px] sm:text-xs font-semibold text-[#1683FF] bg-blue-50 border border-blue-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1683FF]" />
                        <span>Mitra Resmi</span>
                      </span>
                    )}
                  </div>

                  {/* Status Ketersediaan Stok */}
                  {isOutOfStock ? (
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                      {rental.stockStatus && rental.stockStatus !== "Siap Sewa" ? rental.stockStatus : "Stok Habis"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 mr-1 shrink-0" />
                      <span>Ready {availableStock} Unit</span>
                    </span>
                  )}
                </div>

                {/* Judul Produk Tegas */}
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {rental.title}
                </h1>

                {/* Social Proof Bar - Konsisten dengan warna brand */}
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 font-medium py-1">
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{ratingAvg}</span>
                    <span className="font-normal text-slate-500">({reviewCount} ulasan)</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div>
                    Tersewa <span className="text-slate-900 font-bold">{totalRentedCount} kali</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <div className="inline-flex items-center gap-1 text-slate-700 font-medium text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>Penyewa Percaya &amp; Sewa Ulang</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 my-4" />

              {/* Deskripsi & Kelengkapan */}
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Deskripsi &amp; Kelengkapan Paket Sewa
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-normal">
                  {rental.description}
                </p>

                {/* Kelengkapan unit */}
                <div className="space-y-2 pt-1">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                    Kelengkapan Bawaan Standar Unit:
                  </span>
                  {rental.includedItems ? (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-700 font-medium flex items-start gap-2">
                      <Package className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                      <span>{rental.includedItems}</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-700 font-medium flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                      <span>1x Unit utama ({rental.title}) beserta kelengkapan bawaan standar pabrikan.</span>
                    </div>
                  )}
                </div>

                {/* Syarat & Jaminan Unit */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm block flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>3. Syarat &amp; Jaminan Unit:</span>
                  </span>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100/90 rounded-xl text-xs sm:text-sm text-emerald-900 font-medium">
                    {rental.securityDeposit || storeData?.securityDepositPolicy || "Wajib menunjukkan identitas fisik asli (KTP/KTM) dan menyelesaikan verifikasi pemesanan Bantuin."}
                  </div>
                </div>

                {/* Kondisi Fisik Unit */}
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Laporan Kondisi Fisik Unit
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                    {rental.description || "Unit dalam kondisi prima, terawat dan telah melewati pengecekan fungsi sebelum disewakan."}
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 2: Toko Penyedia, Lokasi & Alur Sewa */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Profil Toko Penyedia
                </h3>
                <span className="text-xs font-semibold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Toko Terverifikasi
                </span>
              </div>

              {/* Info Mitra & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link 
                  href={`/mitra/${rental.owner?.id || rental.ownerId || storeId}`}
                  className="group flex items-center gap-3.5 min-w-0"
                  title={`Lihat profil ${rental.owner?.name || storeData?.name || "Mitra"}`}
                >
                  <img
                    src={rental.owner?.avatar || storeData?.avatar || rental.photoUrl}
                    alt={rental.owner?.name || storeData?.name}
                    className="w-13 h-13 rounded-full object-cover border border-slate-200 group-hover:border-[#1683FF] transition shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-base text-slate-900 group-hover:text-[#1683FF] transition truncate flex items-center gap-1.5">
                      <span>{rental.owner?.name || storeData?.name || "Depok Cam Hub"}</span>
                      <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {storeData?.category || "Mitra Rental Peralatan & Kreatif Terpercaya"}
                    </div>
                  </div>
                </Link>

                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                  <Link
                    href={`/mitra/${rental.owner?.id || rental.ownerId || storeId}`}
                    className="flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl border border-slate-200 hover:border-[#1683FF] hover:bg-blue-50/50 text-slate-700 hover:text-[#1683FF] font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Kunjungi Toko</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleStartInquiry}
                    disabled={isInquiring}
                    className="flex-1 sm:flex-none justify-center px-3.5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-semibold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isInquiring ? "Menghubungi..." : "Chat Toko"}</span>
                  </button>
                </div>
              </div>

              {/* 4 Statistik Toko dalam 1 Baris Bersih & Konsisten */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="py-1 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Penyelesaian</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">100%</div>
                </div>
                <div className="py-1 sm:border-l border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Tersewa</span>
                  <div className="text-sm font-bold text-[#1683FF] mt-0.5">{totalRentedCount} kali</div>
                </div>
                <div className="py-1 border-t sm:border-t-0 sm:border-l border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Balas Chat</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">&lt; 15 mnt</div>
                </div>
                <div className="py-1 border-t sm:border-t-0 sm:border-l border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-400 block font-medium">Rating Toko</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center justify-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{storeData?.rating || ratingAvg}</span>
                  </div>
                </div>
              </div>

              {/* Lokasi & Titik Pengambilan */}
              <div className="space-y-1 text-xs pt-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1683FF]" />
                  <span>Lokasi:</span>
                </div>
                <p className="text-slate-700 pl-5.5 leading-relaxed">
                  {rental.address || rental.location}
                </p>
                {distanceInfo?.text && (
                  <p className="text-[11px] text-slate-500 pl-5.5">
                    Estimasi jarak: <span className="font-semibold text-slate-700">{distanceInfo.text}</span> dari posisi Anda
                  </p>
                )}
                {rental.latitude && rental.longitude && (
                  <div className="pl-5.5 pt-1">
                    <a
                      href={getNavigationUrl(
                        rental.latitude,
                        rental.longitude,
                        userCoordinates?.latitude,
                        userCoordinates?.longitude
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1683FF] hover:underline font-semibold text-xs inline-flex items-center gap-1"
                    >
                      <span>Buka Rute di Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 my-4" />

              {/* Alur Sewa Mudah */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Alur Sewa Mudah:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Booking &amp; Bayar</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Pilih tanggal sewa. Dana aman terverifikasi.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Cek &amp; Serah Terima</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Ambil di toko mitra. Cek fisik unit bersama.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Balik &amp; Deposit Cair</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Kembalikan unit tepat waktu. Deposit 100% cair.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 3: PILIHAN PAKET SEWA & BORONGAN (KHUSUS MODE PAKETAN) */}
            {isTieredMode && availablePackages.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#1683FF]" />
                      <span>Pilihan Paket Sewa &amp; Borongan</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih salah satu paket sewa di bawah. Rincian durasi dan tarif di panel pemesanan akan otomatis menyesuaikan.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 shrink-0">
                    {availablePackages.length} Paket Tersedia
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  {/* List Paket Tersedia (HANYA PAKET - TIDAK MENGGABUNGKAN TARIF HARIAN STANDAR) */}
                  {availablePackages.map((pkg) => {
                    const isSelected = selectedPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => handleSelectPackage(pkg)}
                        className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? "border-[#1683FF] bg-blue-50/40 shadow-xs ring-1 ring-[#1683FF]/30"
                            : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                  isSelected ? "bg-[#1683FF] text-white" : "bg-slate-100 text-slate-700"
                                } block w-fit`}>
                                  {pkg.tier || "Paket"}
                                </span>
                                {pkg.isPopular && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950">
                                    PALING LARIS
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-sm text-slate-900 leading-snug">
                                {pkg.name}
                              </h4>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? "bg-[#1683FF] text-white"
                                  : "border-2 border-slate-300 text-transparent"
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed mb-2.5">
                            {pkg.description}
                          </p>

                          {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                            <ul className="space-y-1 pt-2 border-t border-slate-100">
                              {pkg.features.map((feat, fIdx) => (
                                <li key={fIdx} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-xs text-slate-400">{pkg.duration || "1 Hari"}</span>
                          <span className="text-base font-black text-[#1683FF]">{formatIDR(pkg.price)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CARD 4: Ulasan dari Penyewa */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  Ulasan dari Penyewa ({reviewCount})
                </h2>
                <div className="text-xs font-medium text-slate-500">
                  Rating Rata-rata: <strong className="text-slate-900 font-bold">{ratingAvg}/5</strong>
                </div>
              </div>

              {/* Ringkasan Skor Ulasan & Breakdown Aspek */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center py-3 border-b border-slate-100">
                <div className="sm:col-span-4 text-center sm:border-r border-slate-100 sm:pr-4">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    {ratingAvg}
                  </div>
                  <div className="flex items-center justify-center gap-1 my-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    Berdasarkan {reviewCount} ulasan terverifikasi
                  </div>
                </div>

                <div className="sm:col-span-8 space-y-2 text-xs">
                  {(() => {
                    const aspect1 = Math.min(5.0, Math.max(4.2, ratingAvg * 1.005)).toFixed(1);
                    const aspect2 = Math.min(5.0, Math.max(4.0, ratingAvg * 0.992)).toFixed(1);
                    const aspect3 = Math.min(5.0, Math.max(4.2, ratingAvg * 1.002)).toFixed(1);
                    const aspect4 = Math.min(5.0, Math.max(4.0, ratingAvg * 0.995)).toFixed(1);
                    return (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-600 font-medium">Kondisi &amp; Kebersihan Unit</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div style={{ width: `${(aspect1 / 5) * 100}%` }} className="h-full bg-[#1683FF] rounded-full transition-all duration-300" />
                            </div>
                            <span className="font-semibold text-slate-800 text-[11px]">{aspect1}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-600 font-medium">Kecepatan Respon Toko</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div style={{ width: `${(aspect2 / 5) * 100}%` }} className="h-full bg-[#1683FF] rounded-full transition-all duration-300" />
                            </div>
                            <span className="font-semibold text-slate-800 text-[11px]">{aspect2}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-600 font-medium">Keramahan &amp; Edukasi</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div style={{ width: `${(aspect3 / 5) * 100}%` }} className="h-full bg-[#1683FF] rounded-full transition-all duration-300" />
                            </div>
                            <span className="font-semibold text-slate-800 text-[11px]">{aspect3}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-600 font-medium">Kesesuaian dengan Deskripsi</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div style={{ width: `${(aspect4 / 5) * 100}%` }} className="h-full bg-[#1683FF] rounded-full transition-all duration-300" />
                            </div>
                            <span className="font-semibold text-slate-800 text-[11px]">{aspect4}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* List Ulasan Riil Penyewa - Konsisten warna & tipografi */}
              <div className="space-y-4 divide-y divide-slate-100">
                {reviewsList.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-50/60 rounded-2xl border border-slate-100">
                    <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Belum Ada Ulasan Pelanggan</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Unit sewa ini belum memiliki ulasan dari penyewa.</p>
                  </div>
                ) : (
                  reviewsList.map((rev) => {
                  const starCount = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
                  return (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.avatar || "/logotab.png"}
                            alt={rev.userName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {rev.userName}
                              </span>
                              {(rev.isVerifiedPurchase || rev.date === "Baru saja") && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1683FF] bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-[#1683FF]" />
                                  Selesai Sewa
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {rev.date} · {rev.item || rental?.title}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {[...Array(starCount)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="text-xs font-bold text-slate-700 ml-1">
                            {Number(rev.rating).toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-11">
                        {rev.comment}
                      </p>
                    </div>
                  );
                }))}
              </div>
            </div>

          </div>

          {/* KOLOM KANAN (5 Kolom): Sticky Checkout Panel (1 Card Bersih & Konsisten) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-5">
              
              {/* Tarif & Uang Jaminan */}
              <div className="flex flex-wrap items-baseline justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-100">
                <div className="min-w-0">
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
                    {isTieredMode && selectedPackage ? `Tarif ${selectedPackage.name}` : "Tarif Sewa"}
                  </span>
                  <div className="text-2xl sm:text-3xl font-black text-[#1683FF] tracking-tight mt-0.5">
                    {formatIDR(activeDailyPrice)}
                    <span className="text-xs font-normal text-slate-500">{isTieredMode ? "" : " / hari"}</span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Deposit Jaminan</span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {formatIDR(depositFee)}
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 inline-block mt-0.5">
                    100% Kembali Utuh
                  </span>
                </div>
              </div>

              {/* Ringkasan Paket Terpilih (Khusus Mode Paketan - HANYA Informasi, Tanpa Dobel Pilihan) */}
              {isTieredMode && selectedPackage && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#1683FF]" />
                      <span>Paket Terpilih</span>
                    </span>
                    <span className="text-[10px] font-extrabold text-[#1683FF] bg-blue-100/90 px-2 py-0.5 rounded-md uppercase">
                      {selectedPackage.tier || "Paket"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 pt-0.5">
                    <h4 className="font-extrabold text-sm text-slate-900 truncate">
                      {selectedPackage.name}
                    </h4>
                    <span className="font-black text-sm text-[#1683FF] shrink-0">
                      {formatIDR(selectedPackage.price)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1.5 border-t border-blue-100/80">
                    <span>Durasi: <strong className="text-slate-700">{selectedPackage.duration || `${totalDays} Hari`}</strong></span>
                    <span className="text-[10px] text-slate-400 italic">Pilih paket di panel kiri</span>
                  </div>
                </div>
              )}

              {/* Pemilih Tanggal Sewa */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-800">
                  Tentukan Periode Sewa:
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Tanggal Mulai:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:border-[#1683FF] focus:ring-2 focus:ring-blue-50 focus:outline-none transition min-w-0"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Tanggal Selesai:
                    </label>
                    {isTieredMode ? (
                      <input
                        type="date"
                        value={endDate}
                        disabled
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-semibold text-slate-500 text-xs cursor-not-allowed min-w-0"
                      />
                    ) : (
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleEndDateChange(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs focus:border-[#1683FF] focus:ring-2 focus:ring-blue-50 focus:outline-none transition min-w-0"
                      />
                    )}
                  </div>
                </div>

                {/* Catatan penguncian durasi otomatis untuk mode paketan */}
                {isTieredMode && selectedPackage && (
                  <p className="text-[11px] text-[#1683FF] font-medium leading-relaxed">
                    Durasi sewa terkunci otomatis {totalDays} hari sesuai spesifikasi paket yang dipilih.
                  </p>
                )}

                {/* Durasi Sewa */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-slate-600 pt-1 px-0.5">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                    <span>Durasi Sewa:</span>
                  </span>
                  <span className="text-[#1683FF] font-black text-sm text-left sm:text-right">
                    {totalDays} Hari {isTieredMode && selectedPackage ? `(${selectedPackage.duration || `${totalDays} Hari`})` : ""}
                  </span>
                </div>
              </div>

              {/* Rincian Transparansi Biaya */}
              <div className="space-y-1.5 pt-3 text-xs border-t border-slate-100">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                  <span className="min-w-0 break-words">
                    {isTieredMode && selectedPackage
                      ? `Biaya Paket (${selectedPackage.name} - ${totalDays} hari)`
                      : `Biaya Sewa (${totalDays} hari × ${formatIDR(rental.dailyPrice)})`}
                  </span>
                  <span className="text-slate-900 font-semibold text-right whitespace-nowrap">{formatIDR(rentalFee)}</span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                  <span className="min-w-0 break-words">Uang Jaminan (Deposit)</span>
                  <span className="text-slate-900 font-semibold text-right whitespace-nowrap">{formatIDR(depositFee)}</span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-500 text-[11px]">
                  <span className="min-w-0 break-words">Potongan Platform Bantuin (8%)</span>
                  <span className="text-slate-700 font-medium text-right">-{formatIDR(platformFee)} (ditanggung toko)</span>
                </div>

                {/* Total Tagihan */}
                <div className="pt-2.5 border-t border-slate-200/90 flex items-center justify-between gap-3 mt-1">
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">Total Tagihan</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 block leading-tight">Deposit otomatis kembali saat unit beres</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[#1683FF] text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap block">{formatIDR(totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi Sewa & Chat */}
              <div className="space-y-2.5 pt-1">
                {isOutOfStock ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2 text-center"
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>{rental.stockStatus && rental.stockStatus !== "Siap Sewa" ? `Unit ${rental.stockStatus}` : "Stok Unit Sedang Habis"}</span>
                  </button>
                ) : (
                  <Link
                    href={`/sewa/${rental.id}/pembayaran?start=${startDate}&end=${endDate}&days=${totalDays}${isTieredMode && selectedPackage ? `&pkg=${encodeURIComponent(selectedPackage.id)}` : ""}`}
                    className="w-full py-3.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm md:text-base shadow-2xs hover:shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Sewa Sekarang (Lanjut Pembayaran)</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleStartInquiry}
                  disabled={isInquiring}
                  className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#1683FF] hover:bg-blue-50/60 text-slate-700 hover:text-[#1683FF] font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer text-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="w-4 h-4 text-[#1683FF] shrink-0" />
                  <span>{isInquiring ? "Menghubungi Toko..." : "Chat Toko Dulu (Tanya Ketersediaan)"}</span>
                </button>
              </div>

              {/* Integrated Trust Guarantee */}
              <div className="pt-3 border-t border-slate-100 space-y-1 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 flex-wrap">
                  <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
                  <span>Sistem Pembayaran Terverifikasi</span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-slate-500">
                  <span>Payment Gateway Resmi</span>
                  <span>•</span>
                  <span>Jaminan Uang Kembali</span>
                  <span>•</span>
                  <span>Deposit 100% Refundable</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 6. BAGIAN BAWAH: Rekomendasi Barang Sewa Terkait (Khas Marketplace / Fastwork "Pekerjaan Serupa") */}
        <section className="mt-14 pt-10 border-t border-slate-200/90 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Barang Sewa Lainnya &amp; Rekomendasi Terkait
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilihan peralatan dan unit sewa terpercaya lainnya dari mitra di sekitar Anda
              </p>
            </div>

            <Link
              href="/sewa"
              className="text-xs font-bold text-[#1683FF] hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Lihat Semua Katalog</span>
              <BreadcrumbSeparator className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
            {relatedRentals.map((item) => (
              <ProductProfileCard key={item.id} item={item} type="rental" />
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

export default function RentalDetailPage() {
  return (
    <Suspense fallback={null}>
      <RentalDetailContent />
    </Suspense>
  );
}
