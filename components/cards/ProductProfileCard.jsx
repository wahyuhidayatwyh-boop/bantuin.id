import React from "react";
import Link from "next/link";
import { 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Store
} from "lucide-react";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import CategoryIcon from "@/components/common/CategoryIcon";

export default function ProductProfileCard({ item, type = "rental" }) {
  const isRental = type === "rental";
  const { getDistanceToUser } = useApp() || {};

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(item.latitude, item.longitude, item.distanceMeters)
    : null;

  const isVerified = isRental ? (item.isVerifiedPartner ?? true) : item.isVerified;
  const ownerOrProviderName = isRental 
    ? (item.owner?.partnerBusinessName || item.owner?.name || item.ownerName || "Mitra Rental") 
    : (item.provider?.partnerBusinessName || item.providerName || item.provider?.name || "Penyedia Jasa");
  const ownerOrProviderId = isRental
    ? (item.ownerId || item.owner?.id || item.storeId || item.ownerName)
    : (item.providerId || item.provider?.id || item.providerName);

  // Field normalization
  const title = item.title || item.name || "Unit Sewa";
  const category = item.category || "Rental";
  const dailyPrice = isRental 
    ? (item.dailyPrice !== undefined ? Number(item.dailyPrice) : (item.price !== undefined ? Number(item.price) : 0))
    : Number(item.startingPrice || 0);

  const photoUrl = isRental
    ? (item.photoUrl || (Array.isArray(item.photos) && item.photos[0]) || item.image || item.coverImage || "/logotab.png")
    : (item.coverImage || item.avatarUrl || "/logotab.png");

  // Status Ketersediaan & Stok
  const stockCount = isRental
    ? (item.stockCount !== undefined ? Number(item.stockCount) : (item.stock !== undefined ? Number(item.stock) : 1))
    : 1;
  const rawStatus = (item.stockStatus || "").toLowerCase();
  const isAvailable = isRental
    ? (stockCount > 0 && !rawStatus.includes("habis") && !rawStatus.includes("perawatan") && !rawStatus.includes("sedang disewa"))
    : true;

  // Lokasi (Ambil Fisik / Jarak)
  const pickupLocation = (distanceInfo?.text && distanceInfo.text !== "Online")
    ? distanceInfo.text
    : (item.pickupLocation || item.location || item.address || item.city || "Banyumas");

  // Rating & Review Calculation
  const reviewCount = Math.max(
    Number(item.ratingCount ?? 0),
    Number(item.reviewCount ?? 0),
    Number(item.reviewsCount ?? 0),
    Number(item.owner?.ratingCount ?? 0),
    Number(item.provider?.ratingCount ?? 0),
    Number(item.provider?.reviewsCount ?? 0),
    Array.isArray(item.reviews) ? item.reviews.length : (typeof item.reviews === "number" ? item.reviews : 0)
  );

  const completedCount = isRental
    ? (item.totalRentedCount ?? item.completedRentals ?? item.rentedCount ?? item.bookingsCount ?? (Array.isArray(item.bookings) ? item.bookings.length : 0))
    : (item.completedOrders ?? item.completedJobs ?? 0);

  const rawRating = item.ratingAvg || item.rating || item.owner?.ratingAvg || item.provider?.ratingAvg || item.provider?.rating;
  const ratingDisplay = rawRating ? Number(rawRating).toFixed(1).replace(/\.0$/, "") : "5.0";

  const targetLink = isRental ? `/sewa/${item.id}` : `/jasa/${item.id}`;

  return (
    <Link 
      href={targetLink}
      className="group flex flex-col justify-between bg-white border border-slate-200/80 hover:border-blue-400/80 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full cursor-pointer"
    >
      {/* Gambar Unit - Bersih & Estetik */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={photoUrl}
          alt={title}
          loading="lazy"
          decoding="async"
          onError={(e) => { e.currentTarget.src = "/logotab.png"; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Kategori Sewa & Badge Tag (Pojok Kiri Atas - Minimalis di Mobile) */}
        <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap max-w-[85%] z-10">
          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md bg-white/95 backdrop-blur-xs text-slate-700 shadow-2xs border border-white/80">
            <CategoryIcon category={category} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1683FF] shrink-0" />
            <span className="truncate max-w-[75px] sm:max-w-[95px]">{category}</span>
          </span>
          {item.tag && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs">
              {item.tag}
            </span>
          )}
        </div>

        {/* Status Ketersediaan (Pojok Kanan Bawah - Ringkas & Rapi) */}
        {isRental && (
          <div className="absolute bottom-2 right-2 z-10">
            <span className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-md backdrop-blur-xs shadow-2xs ${
              isAvailable 
                ? "bg-emerald-600/90 text-white" 
                : "bg-rose-600/90 text-white"
            }`}>
              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
              <span>{isAvailable ? (stockCount > 1 ? `Ready ${stockCount}` : "Ready") : (item.stockStatus || "Habis")}</span>
            </span>
          </div>
        )}
      </div>

      {/* Konten Card Bersih (Spasi Rapi & Anti-Tabrakan di Layar Kecil) */}
      <div className="p-2.5 sm:p-3.5 flex flex-col justify-between flex-1 gap-2">
        <div className="space-y-1 sm:space-y-1.5 min-w-0">
          {/* Nama Unit Barang (2-baris clamp rapi, tidak meluber) */}
          <h3 
            className="font-bold text-xs sm:text-[13px] md:text-sm text-slate-900 group-hover:text-[#1683FF] transition line-clamp-2 leading-snug break-words min-h-[30px] sm:min-h-[36px]" 
            title={title}
          >
            {title}
          </h3>

          {/* Toko & Lokasi dalam 1 baris teks proporsional */}
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 min-w-0">
            <Store className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate font-medium text-slate-600 max-w-[65px] sm:max-w-[110px] shrink-0">
              {ownerOrProviderName}
            </span>
            {isVerified && (
              <ShieldCheck className="w-3 h-3 text-[#1683FF] shrink-0" title="Terverifikasi" />
            )}
            <span className="text-slate-300 shrink-0">•</span>
            <span className="truncate text-slate-400 min-w-0 flex-1" title={pickupLocation}>
              {pickupLocation}
            </span>
          </div>
        </div>

        {/* Footer: Rating, Tersewa & Harga (Responsif Vertikal di Mobile, Horizontal di Desktop) */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1.5 sm:gap-1 mt-auto">
          {/* Rating & Tersewa */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="flex items-center gap-0.5 font-bold text-slate-800">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="text-xs">{ratingDisplay}</span>
              <span className="text-slate-400 font-normal text-[10px] sm:text-[11px]">({reviewCount})</span>
            </div>
            <span className="text-slate-300">•</span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium whitespace-nowrap">
              {isRental ? `${completedCount} tersewa` : `${completedCount} selesai`}
            </span>
          </div>

          {/* Harga (Lebar Penuh di Mobile agar Digit Panjang Tidak Terpotong) */}
          <div className="text-left sm:text-right pt-0.5 sm:pt-0">
            <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium leading-none mb-0.5">
              {isRental ? (item.packages?.length > 0 || item.pricingMode === "tiered" ? "Mulai dari" : "Tarif sewa") : "Mulai"}
            </div>
            <div className="font-black text-xs sm:text-sm md:text-base text-slate-900 leading-tight flex items-baseline sm:justify-end flex-wrap gap-0.5">
              <span>{formatIDR(dailyPrice)}</span>
              {isRental ? (
                <span className="text-[9px] sm:text-[11px] font-normal text-slate-500">
                  {item.unit || "/hari"}
                </span>
              ) : (
                item.unit && (
                  <span className="text-[9px] sm:text-[11px] font-normal text-slate-500">
                    {item.unit}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
