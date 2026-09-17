"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Star, 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2,
  Camera,
  Navigation
} from "lucide-react";
import { getNavigationUrl } from "@/lib/services/gpsService";
import MapComponent from "@/components/map/MapComponent";

export default function RentalDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { rentals, bookRental, getDistanceToUser, userCoordinates } = useApp();

  const [startDate, setStartDate] = useState("2026-09-08");
  const [endDate, setEndDate] = useState("2026-09-09");
  const [totalDays, setTotalDays] = useState(2);
  const [conditionNotes, setConditionNotes] = useState("Body 98% mulus, sensor bersih, kabel lengkap.");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const rental = rentals.find((r) => r.id === id) || rentals[0];

  if (!rental) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-[#102A43]">Barang Sewa Tidak Ditemukan</h2>
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
  const totalAmount = rentalFee + depositFee;

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    bookRental(rental.id, startDate, endDate, totalDays, conditionNotes);
    setBookingSuccess(true);
  };

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(rental.latitude, rental.longitude, rental.distanceMeters)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 md:px-6 py-8">
        
        {/* Back Link */}
        <Link
          href="/sewa"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#61758A] hover:text-[#1683FF] mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Sewa</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Image & Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Main Product Photographic Image */}
            <div className="bg-white border border-[#DCEAF7] rounded-2xl overflow-hidden shadow-sm">
              <div className="relative aspect-[4/3] w-full">
                <img
                  src={rental.photoUrl}
                  alt={rental.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-bold px-3 py-1 bg-white/90 backdrop-blur-md rounded-full shadow-xs text-[#102A43]">
                    {rental.category}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#61758A]">
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                      {rental.location}
                    </span>
                    {distanceInfo?.text && (
                      <>
                        <span>&bull;</span>
                        <span className="font-semibold text-slate-700">{distanceInfo.text} dari posisi Anda</span>
                        {distanceInfo?.isRealtime && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
                            GPS Aktif
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {rental.latitude && rental.longitude && (
                      <a
                        href={getNavigationUrl(
                          rental.latitude,
                          rental.longitude,
                          userCoordinates?.latitude,
                          userCoordinates?.longitude
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50/90 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-100 transition shadow-2xs"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Buka Rute Pengambilan</span>
                      </a>
                    )}
                    {rental.isVerifiedPartner && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Mitra Terverifikasi
                      </span>
                    )}
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] tracking-tight mb-4">
                  {rental.title}
                </h1>

                <div className="text-sm text-[#61758A] leading-relaxed whitespace-pre-line mb-6 pb-6 border-b border-[#DCEAF7]">
                  {rental.description}
                </div>

                {/* Owner Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={rental.owner?.avatar}
                      alt={rental.owner?.name}
                      className="w-11 h-11 rounded-full object-cover border border-[#DCEAF7]"
                    />
                    <div>
                      <div className="font-bold text-sm text-[#102A43]">{rental.owner?.name}</div>
                      <div className="text-xs text-[#61758A] flex items-center gap-1 mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{rental.ratingAvg} ({rental.ratingCount} ulasan)</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    Tersedia Hari Ini
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Geolocation Pickup Point Card */}
            {rental.latitude && rental.longitude && (
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1683FF]" />
                    <h3 className="font-bold text-sm text-[#102A43]">
                      Titik Pengambilan & Serah Terima Alat
                    </h3>
                  </div>
                  <a
                    href={getNavigationUrl(
                      rental.latitude,
                      rental.longitude,
                      userCoordinates?.latitude,
                      userCoordinates?.longitude
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Petunjuk Arah Google Maps</span>
                  </a>
                </div>

                <div className="text-xs text-[#61758A]">
                  <div className="font-medium text-slate-800">{rental.address || rental.location}</div>
                  {distanceInfo?.text && (
                    <div className="mt-1 flex items-center gap-1.5 text-slate-600 font-semibold">
                      <span>Jarak: {distanceInfo.text} dari posisi GPS Anda</span>
                      {distanceInfo?.isRealtime && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          GPS Aktif
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <MapComponent
                  points={[
                    {
                      id: rental.id,
                      title: rental.title,
                      latitude: rental.latitude,
                      longitude: rental.longitude,
                      type: "rental",
                      dailyPrice: rental.dailyPrice,
                      address: rental.address || rental.location,
                    }
                  ]}
                  userLocation={userCoordinates}
                  height="220px"
                  showRouteLine={true}
                />
              </div>
            )}

            {/* Condition Checklist Policy Card */}
            <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#102A43] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#1683FF]" />
                <span>Prosedur Serah Terima & Verifikasi Kondisi</span>
              </h3>
              <p className="text-xs text-[#61758A] leading-relaxed">
                Saat pengambilan dan pengembalian barang, kedua pihak wajib mengambil foto kondisi fisik alat melalui aplikasi Bantuin. Deposit uang jaminan akan dikembalikan utuh via Xendit jika kondisi barang sesuai baseline foto serah terima awal.
              </p>
            </div>

          </div>

          {/* Right Column: Pricing & Booking Drawer (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-[#DCEAF7]">
                <div>
                  <span className="text-xs text-[#61758A]">Biaya Sewa</span>
                  <div className="text-2xl font-extrabold text-[#1683FF]">
                    {formatIDR(rental.dailyPrice)}
                    <span className="text-xs font-normal text-[#61758A]"> / hari</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#61758A]">Deposit (Escrow)</span>
                  <div className="text-sm font-bold text-[#102A43]">
                    {formatIDR(rental.depositAmount)}
                  </div>
                </div>
              </div>

              {/* Booking Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-[#102A43] mb-1">
                      Mulai Sewa:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#DCEAF7] bg-[#F5FAFF]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#102A43] mb-1">
                      Selesai Sewa:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#DCEAF7] bg-[#F5FAFF]"
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-xl bg-[#F5FAFF] border border-[#DCEAF7] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#61758A]">
                    <span>Sewa {totalDays} hari ({formatIDR(rental.dailyPrice)} x {totalDays})</span>
                    <span className="text-[#102A43] font-semibold">{formatIDR(rentalFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#61758A]">
                    <span>Deposit Jaminan (Ditahan Xendit)</span>
                    <span className="text-[#102A43] font-semibold">{formatIDR(depositFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#DCEAF7] flex items-center justify-between text-sm font-bold text-[#102A43]">
                    <span>Total Pembayaran</span>
                    <span className="text-[#1683FF] text-base">{formatIDR(totalAmount)}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#61758A] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                  <span>Slot tanggal akan terkunci sementara 15 menit saat proses booking.</span>
                </div>

                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-[#1683FF] text-white font-semibold text-xs sm:text-sm hover:bg-[#0F6FE5] shadow transition"
                >
                  Ajukan Sewa & Kunci Slot (15 Menit)
                </button>
              </div>

            </div>

          </div>

        </div>

      </main>

      {/* Booking & Condition Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#DCEAF7]">
            {!bookingSuccess ? (
              <>
                <h3 className="font-bold text-lg text-[#102A43] mb-2">
                  Checklist Kondisi & Konfirmasi Sewa
                </h3>
                <p className="text-xs text-[#61758A] mb-4">
                  Slot tanggal sedang dikunci sementara selama 15 menit untuk Anda.
                </p>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="p-3 bg-[#F5FAFF] rounded-xl border border-[#DCEAF7] text-xs">
                    <span className="font-bold text-[#102A43] block">{rental.title}</span>
                    <span className="text-[#61758A]">{startDate} s/d {endDate} ({totalDays} hari)</span>
                    <div className="text-[#1683FF] font-bold mt-1">Total Escrow: {formatIDR(totalAmount)}</div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102A43] mb-1">
                      Catatan Kondisi Awal Baseline:
                    </label>
                    <textarea
                      rows={3}
                      value={conditionNotes}
                      onChange={(e) => setConditionNotes(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#DCEAF7]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-[#61758A]"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#1683FF] text-white hover:bg-[#0F6FE5]"
                    >
                      Bayar via Xendit Escrow
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-lg text-[#102A43]">
                  Booking Rental Berhasil Diajukan!
                </h3>
                <p className="text-xs text-[#61758A]">
                  Dana sewa dan deposit telah diamankan di Escrow Xendit. Pemilik barang memiliki waktu 2 jam untuk mengonfirmasi serah terima.
                </p>
                <div className="pt-2">
                  <Link
                    href="/activity"
                    className="inline-block w-full py-2.5 rounded-xl bg-[#1683FF] text-white text-xs font-semibold"
                  >
                    Lihat di Halaman Aktivitas
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
