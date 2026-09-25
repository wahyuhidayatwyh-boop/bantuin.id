"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ChevronRight as BreadcrumbSeparator
} from "lucide-react";
import { getNavigationUrl } from "@/lib/services/gpsService";
import { getMitraStoreById, getAllMitraStores } from "@/lib/mock/mitraData";
import CategoryIcon from "@/components/common/CategoryIcon";

export default function RentalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    rentals, 
    startRentalInquiry,
    getDistanceToUser, 
    userCoordinates 
  } = useApp();

  const todayStr = new Date().toISOString().split("T")[0];
  const nextTwoDaysStr = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(nextTwoDaysStr);
  const [totalDays, setTotalDays] = useState(2);

  // Recalculate duration automatically whenever startDate or endDate changes
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end.getTime() - start.getTime();
      const calculatedDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      setTotalDays(calculatedDays);
    }
  }, [startDate, endDate]);

  // Cari unit dari AppContext rentals atau dari katalog seluruh toko mitra
  const rental = useMemo(() => {
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
          dailyPrice: catItem.price,
          depositAmount: catItem.depositAmount || 200000,
          photoUrl: catItem.image,
          photos: (catItem.photos && catItem.photos.length > 0) ? catItem.photos : [catItem.image],
          stock: catItem.stockCount || 3,
          description: catItem.desc,
          ratingAvg: catItem.rating || 4.95,
          ratingCount: catItem.reviews || 38,
          totalRentedCount: 52,
          isVerifiedPartner: true,
          isSafeEscrow: true,
          storeId: st.id,
          ownerName: st.name,
          owner: {
            id: st.id,
            name: st.name,
            avatar: st.avatar,
            rating: st.rating,
            completedOrders: st.completedOrders,
          },
          location: st.address,
          address: st.address,
        };
      }
    }
    return rentals[0];
  }, [rentals, id]);

  // Resolve store data from mock mitra
  const storeId = rental?.storeId || 
    (rental?.owner?.id?.startsWith("mitra-") ? rental.owner.id : "mitra-kamera");
  const storeData = getMitraStoreById(storeId);

  // Photos gallery (mendukung multi-foto dari form katalog mitra)
  const productPhotos = (rental?.photos && rental.photos.length > 0)
    ? rental.photos
    : [
        rental?.photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80"
      ];
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Reset active photo index if it exceeds available photos
  useEffect(() => {
    if (activePhotoIndex >= productPhotos.length) {
      setActivePhotoIndex(0);
    }
  }, [productPhotos.length, activePhotoIndex]);

  const availableStock = typeof rental?.stock === "number" ? rental.stock : 3;
  const isOutOfStock = availableStock <= 0;

  // Dynamic social proof numbers calculated from app state
  const totalRentedCount = rental?.totalRentedCount ?? rental?.owner?.completedOrders ?? 86;
  const ratingAvg = rental?.ratingAvg ? Number(rental.ratingAvg) : 4.95;
  const reviewCount = rental?.ratingCount ? Number(rental.ratingCount) : (rental?.reviews?.length ?? 38);

  // Related rental items (other than current item)
  const relatedRentals = rentals
    .filter((r) => r.id !== rental?.id)
    .slice(0, 4);

  // Dynamic reviews list: Prioritize dynamic reviews from rental item state, then store, then defaults
  const reviewsList = (rental?.reviews && rental.reviews.length > 0)
    ? rental.reviews
    : (storeData?.reviews && storeData.reviews.length > 0
        ? storeData.reviews
        : [
            {
              id: "rev-1",
              userName: "Dimas Anggoro",
              avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
              rating: 5,
              date: "2 hari yang lalu",
              item: rental?.title || "Unit Kamera & Lensa",
              comment: "Kamera bersih banget, sensor kinclong no debu. Baterai dikasih 2 buah awet seharian buat hunting wisuda. Pelayanan ramah dan tempatnya gampang dicari!",
            },
            {
              id: "rev-2",
              userName: "Natasha Caroline",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
              rating: 5,
              date: "1 minggu yang lalu",
              item: rental?.title || "Unit Kamera & Lensa",
              comment: "Sangat terbantu buat sewa kamera wisuda teman seangkatan. Sistem pembayaran Bantuin bikin tenang gak takut uang hilang. Tokonya amanah dan tepat waktu!",
            },
            {
              id: "rev-3",
              userName: "Rifky Fauzi",
              avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
              rating: 5,
              date: "2 minggu yang lalu",
              item: rental?.title || "Unit Kamera & Lensa",
              comment: "Unit dalam kondisi sangat prima. Dipandu cara penggunaan dan pengecekan fisik bersama mas-mas tokonya. Top rekomen buat vendor sewa di sini.",
            }
          ]
      );

  const handleStartInquiry = () => {
    if (startRentalInquiry && rental) {
      const inqRoom = startRentalInquiry({
        rentalId: rental.id,
        rentalTitle: rental.title,
        photoUrl: rental.photoUrl,
        storeId: storeId,
        storeName: rental.owner?.name || storeData?.name || "Mitra Rental Resmi",
        storeAvatar: rental.owner?.avatar || storeData?.avatar || rental.photoUrl,
        storePhone: rental.owner?.phone || storeData?.phone || "081234567890",
        startDate,
        endDate,
        totalDays,
        dailyPrice: rental.dailyPrice,
        depositFee: rental.depositAmount,
        pickupLocation: rental.address || rental.location || "Alamat Toko Mitra",
        initialQuestion: `Halo ${rental.owner?.name || storeData?.name || "Toko Mitra"}, saya ingin menanyakan ketersediaan ${rental.title} untuk tanggal ${startDate} s/d ${endDate} (${totalDays} hari). Apakah unit ready?`
      });
      router.push(`/chat?room=${inqRoom?.id || "order-room-rental-kamera"}`);
    } else {
      router.push("/chat");
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

  const rentalFee = rental.dailyPrice * totalDays;
  const depositFee = rental.depositAmount;
  const platformFee = Math.round(rentalFee * 0.08); // Potongan platform Bantuin 8% dari biaya sewa
  const storeNetPayout = rentalFee - platformFee;
  const totalAmount = rentalFee + depositFee;

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
                {/* Badges Bar: Konsisten Slate & Brand Blue */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                      <CategoryIcon category={rental.category} className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                      <span>{rental.category}</span>
                    </span>
                    {rental.isVerifiedPartner && (
                      <span className="text-xs font-semibold text-[#1683FF] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
                        Mitra Resmi
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-400">
                      ID #{rental.id}
                    </span>
                  </div>

                  {/* Status Ketersediaan Stok */}
                  {isOutOfStock ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                      Stok Habis
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      Tersedia {availableStock} Unit Ready
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

                {/* Kelengkapan unit - Senada dengan brand blue #1683FF, tanpa warna-warni */}
                <div className="space-y-2 pt-1">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                    Kelengkapan unit saat serah terima:
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                      <span>Unit utama ({rental.title}) siap pakai</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                      <span>2x Baterai original sehat + Dual Slot Charger</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                      <span>1x SD Card 64GB High Speed + Hard Case</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                      <span>Tas pelindung empuk &amp; neck strap</span>
                    </li>
                  </ul>
                </div>

                {/* Kondisi Fisik Unit */}
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Laporan Kondisi Fisik Unit
                  </h3>
                  <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                    {rental.condition || "Body 98% sangat mulus terawat, optik & sensor bersih bebas jamur/debu, semua tombol dan fungsi responsif normal, baterai sehat siap pakai."}
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
                  href={`/mitra/${storeId}`}
                  className="group flex items-center gap-3.5 min-w-0"
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

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/mitra/${storeId}`}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-[#1683FF] hover:bg-blue-50/50 text-slate-700 hover:text-[#1683FF] font-semibold text-xs transition flex items-center gap-1.5"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Kunjungi Toko</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleStartInquiry}
                    className="px-3.5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-semibold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Toko</span>
                  </button>
                </div>
              </div>

              {/* 4 Statistik Toko dalam 1 Baris Bersih & Konsisten */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="py-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Penyelesaian</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">100%</div>
                </div>
                <div className="py-1 sm:border-l border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Tersewa</span>
                  <div className="text-sm font-bold text-[#1683FF] mt-0.5">{totalRentedCount} kali</div>
                </div>
                <div className="py-1 border-t sm:border-t-0 sm:border-l border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Balas Chat</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">&lt; 15 mnt</div>
                </div>
                <div className="py-1 border-t sm:border-t-0 sm:border-l border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">Rating Toko</span>
                  <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{storeData?.rating || ratingAvg}</span>
                  </div>
                </div>
              </div>

              {/* Lokasi & Titik Pengambilan */}
              <div className="space-y-1 text-xs pt-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1683FF]" />
                  <span>Lokasi Pengambilan &amp; Serah Terima:</span>
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

            {/* CARD 3: Ulasan dari Penyewa */}
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
                {reviewsList.map((rev) => {
                  const starCount = Math.max(1, Math.min(5, Math.round(Number(rev.rating) || 5)));
                  return (
                    <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
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
                })}
              </div>
            </div>

          </div>

          {/* KOLOM KANAN (5 Kolom): Sticky Checkout Panel (1 Card Bersih & Konsisten) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-5">
              
              {/* Tarif & Uang Jaminan */}
              <div className="flex items-baseline justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Tarif Sewa</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#1683FF] tracking-tight mt-0.5">
                    {formatIDR(rental.dailyPrice)}
                    <span className="text-xs font-normal text-slate-500"> / hari</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Deposit Jaminan</span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                    {formatIDR(rental.depositAmount)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 inline-block mt-0.5">
                    100% Kembali Utuh
                  </span>
                </div>
              </div>

              {/* Pemilih Tanggal Sewa */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-800">
                  Tentukan Periode Sewa:
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">
                      Tanggal Mulai:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:border-[#1683FF] focus:ring-2 focus:ring-blue-50 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1.5">
                      Tanggal Selesai:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:border-[#1683FF] focus:ring-2 focus:ring-blue-50 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Durasi Sewa */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-1 px-0.5">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#1683FF]" />
                    Durasi Sewa:
                  </span>
                  <span className="text-[#1683FF] font-black text-sm">{totalDays} Hari</span>
                </div>
              </div>

              {/* Rincian Transparansi Biaya */}
              <div className="space-y-2 pt-3 text-xs border-t border-slate-100">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Biaya Sewa ({totalDays} hari × {formatIDR(rental.dailyPrice)})</span>
                  <span className="text-slate-900 font-semibold">{formatIDR(rentalFee)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Uang Jaminan (Deposit)</span>
                  <span className="text-slate-900 font-semibold">{formatIDR(depositFee)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-0.5">
                  <span>Potongan Platform Bantuin (8%)</span>
                  <span className="text-slate-700 font-medium">-{formatIDR(platformFee)} (ditanggung toko)</span>
                </div>

                {/* Total Tagihan */}
                <div className="pt-3.5 border-t border-slate-200/90 flex items-baseline justify-between mt-1">
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 block">Total Tagihan</span>
                    <span className="text-[11px] text-slate-500">Deposit otomatis kembali saat unit beres</span>
                  </div>
                  <span className="text-[#1683FF] text-2xl font-black tracking-tight">{formatIDR(totalAmount)}</span>
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
                    <Lock className="w-4 h-4" />
                    <span>Stok Unit Sedang Habis</span>
                  </button>
                ) : (
                  <Link
                    href={`/sewa/${rental.id}/pembayaran?start=${startDate}&end=${endDate}&days=${totalDays}`}
                    className="w-full py-3.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-sm sm:text-base shadow-2xs hover:shadow-xs transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Sewa Sekarang (Lanjut Pembayaran)</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleStartInquiry}
                  className="w-full py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#1683FF] hover:bg-blue-50/60 text-slate-700 hover:text-[#1683FF] font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#1683FF]" />
                  <span>Chat Toko Dulu (Tanya Ketersediaan)</span>
                </button>
              </div>

              {/* Integrated Trust Guarantee */}
              <div className="pt-3 border-t border-slate-100 space-y-1 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-[#1683FF]" />
                  <span>Sistem Pembayaran Terverifikasi</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500">
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
              <Link
                key={item.id}
                href={`/sewa/${item.id}`}
                className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 overflow-hidden hover:shadow-md hover:border-blue-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.photoUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 px-2 sm:px-2.5 py-0.5 sm:py-1 bg-white/95 backdrop-blur-md text-[9px] sm:text-[10px] font-bold rounded-md sm:rounded-full text-slate-800 border border-slate-200/60 shadow-2xs">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-[#1683FF] transition leading-tight sm:leading-snug min-h-[32px] sm:min-h-[40px]">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 pt-1">
                      <span className="truncate max-w-[80px] xs:max-w-[110px] sm:max-w-[130px] font-medium">{item.ownerName || "Mitra Resmi"}</span>
                      <span className="font-bold text-slate-700 flex items-center gap-1 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{item.ratingAvg}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 sm:p-4 pt-0 border-t border-slate-50 flex items-center justify-between mt-1 sm:mt-2">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 block">Tarif</span>
                    <span className="text-xs sm:text-sm font-black text-[#1683FF]">
                      {formatIDR(item.dailyPrice)}
                      <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">/hari</span>
                    </span>
                  </div>

                  <span className="text-[10px] sm:text-xs font-bold text-[#1683FF] group-hover:translate-x-0.5 transition-transform">
                    Detail &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
