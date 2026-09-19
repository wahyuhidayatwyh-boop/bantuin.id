"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDateIndo, formatDeadlineWithHour } from "@/lib/utils";
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Camera, 
  FileText, 
  ShieldCheck,
  AlertCircle,
  Star,
  Briefcase,
  MapPin
} from "lucide-react";

function ActivityContent() {
  const { requests, orderRooms, rentalBookings, currentUser } = useApp();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "membutuhkan");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const myRequests = (requests || []).filter((r) => r.requester?.id === currentUser?.id);
  const myHelps = (orderRooms || []).filter((r) => r.helper?.id === currentUser?.id || r.requester?.id !== currentUser?.id);
  
  // Pesanan Jasa (Layanan Spesialis)
  const myJasaOrders = (orderRooms || []).filter(
    (r) => (r.orderType === "service" || r.orderType === "jasa") && r.orderStatus !== "inquiry"
  );

  // Combine rentalBookings and rental orderRooms without duplicates
  const rentalOrderRooms = (orderRooms || []).filter((r) => r.orderType === "rental");
  const myRentals = [
    ...(rentalBookings || []),
    ...rentalOrderRooms
      .filter((r) => !(rentalBookings || []).some((b) => b.id === r.id))
      .map((r) => ({
        id: r.id,
        rentalId: r.requestId || "rent-1",
        rentalTitle: r.rentalDetails?.unitName || r.requestTitle,
        photoUrl: r.rentalDetails?.photoUrl || r.helper?.avatar,
        renterId: r.requester?.id || currentUser?.id,
        renterName: r.requester?.name || currentUser?.fullName,
        ownerName: r.helper?.name || "Mitra Rental Resmi",
        startDate: r.rentalDetails?.startDate || "2026-09-20",
        endDate: r.rentalDetails?.endDate || "2026-09-22",
        totalDays: r.rentalDetails?.durationDays || 2,
        rentalFee: r.rentalFeeAmount || 300000,
        depositFee: r.depositAmount || 200000,
        totalAmount: r.lockedAmount || 500000,
        status: r.orderStatus || "paid_escrow",
        review: r.review,
      }))
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Riwayat & Status Transaksi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102A43] tracking-tight">
            Aktivitas Saya
          </h1>
        </div>

        {/* 5 Tabs (Bantuin Tugas, Jasa Spesialis, Membantu, Menyewa, Menyewakan) */}
        <div className="flex items-center gap-2 border-b border-[#DCEAF7] pb-4 mb-8 overflow-x-auto">
          {[
            { id: "membutuhkan", label: `Saya Membutuhkan (${myRequests.length})` },
            { id: "jasa", label: `Pesanan Jasa (${myJasaOrders.length})` },
            { id: "membantu", label: `Saya Membantu (${myHelps.length})` },
            { id: "menyewa", label: `Saya Menyewa (${myRentals.length})` },
            { id: "menyewakan", label: "Saya Menyewakan (0)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#1683FF] text-white shadow-xs"
                  : "bg-white text-[#61758A] hover:text-[#102A43] border border-[#DCEAF7]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SAYA MEMBUTUHKAN */}
        {activeTab === "membutuhkan" && (
          <div className="space-y-4">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border border-[#DCEAF7] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-[#EAF4FF] text-[#1683FF] rounded-md">
                      {req.category}
                    </span>
                    <span className="text-xs text-[#61758A]">
                      Batas waktu: {formatDeadlineWithHour(req.deadline, req.deadlineText)}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#102A43]">{req.title}</h3>
                  <p className="text-xs text-[#61758A] mt-1">{req.locationName} · {req.pickupPoint}</p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                  <div className="font-bold text-sm text-[#1683FF]">
                    {formatIDR(req.rewardAmount)}
                  </div>
                  <Link
                    href={`/bantuan/${req.id}`}
                    className="px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-semibold hover:bg-[#0F6FE5] flex items-center gap-1.5 transition"
                  >
                    <span>Lihat Detail & Kandidat ({req.offers?.length || 0})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: PESANAN JASA */}
        {activeTab === "jasa" && (
          <div className="space-y-4">
            {myJasaOrders.length === 0 ? (
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-10 text-center space-y-3 shadow-2xs">
                <Briefcase className="w-10 h-10 text-[#1683FF]/40 mx-auto" />
                <h3 className="font-bold text-[#102A43]">Belum Ada Pesanan Jasa</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Anda belum memiliki pesanan layanan jasa aktif. Jelajahi katalog desainer, teknisi AC, kebersihan, dan jasa lainnya.
                </p>
                <Link
                  href="/jasa"
                  className="inline-block px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Jelajahi Katalog Jasa
                </Link>
              </div>
            ) : (
              myJasaOrders.map((order) => {
                const isCompleted = order.orderStatus === "completed";
                const isPaidEscrow = order.orderStatus === "paid_escrow" || order.orderStatus === "room_created";
                const isInProgress = order.orderStatus === "in_progress" || order.orderStatus === "on_the_way";

                return (
                  <div
                    key={order.id}
                    className="bg-white border border-[#DCEAF7] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {order.serviceDetails?.serviceImage ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={order.serviceDetails.serviceImage}
                            alt={order.requestTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center shrink-0 border border-blue-100">
                          <Briefcase className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-bold px-2.5 py-0.5 bg-[#EAF4FF] text-[#1683FF] rounded-md">
                            {order.category || "Layanan Jasa"}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isCompleted 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : isPaidEscrow
                              ? "bg-blue-50 text-[#1683FF] border border-blue-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}>
                            {isCompleted ? "Pekerjaan Selesai" : isPaidEscrow ? "Dana Aman di Escrow" : "Sedang Dikerjakan"}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#102A43]">{order.requestTitle}</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                          <span>Mitra: <strong className="text-slate-700">{order.helper?.name}</strong></span>
                          <span>•</span>
                          <span>Jadwal: {order.serviceDetails?.targetDate || "Sesuai Jadwal"} ({order.serviceDetails?.targetTime || "09:00"} WIB)</span>
                          {order.serviceDetails?.alamat && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {order.serviceDetails.alamat.slice(0, 30)}...
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Total Pembayaran</div>
                        <div className="font-bold text-base text-[#1683FF]">
                          {formatIDR(order.lockedAmount || 0)}
                        </div>
                      </div>
                      <Link
                        href={`/chat?room=${order.id}`}
                        className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>Buka Chat &amp; Rincian</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: SAYA MEMBANTU */}
        {activeTab === "membantu" && (
          <div className="space-y-4">
            {myHelps.map((room) => (
              <div
                key={room.id}
                className="bg-white border border-[#DCEAF7] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                      Order Room #{room.id}
                    </span>
                    <span className="text-xs text-[#61758A]">
                      Status: {room.orderStatus}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[#102A43]">{room.requestTitle}</h3>
                  <p className="text-xs text-[#61758A] mt-1">Requester: {room.requester.name}</p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                  <div className="font-bold text-sm text-[#1683FF]">
                    {formatIDR(room.lockedAmount)}
                  </div>
                  <Link
                    href={`/chat?room=${room.id}`}
                    className="px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-semibold hover:bg-[#0F6FE5] flex items-center gap-1.5 transition"
                  >
                    <span>Buka Ruang Chat</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: SAYA MENYEWA */}
        {activeTab === "menyewa" && (
          <div className="space-y-4">
            {myRentals.length === 0 ? (
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-10 text-center text-slate-500">
                Belum ada transaksi sewa aktif. Jelajahi katalog sewa kami.
              </div>
            ) : (
              myRentals.map((booking) => {
                const isDone = booking.status === "completed";
                const isReturned = booking.status === "returned";
                const isHandedOver = booking.status === "item_handed_over";
                const isPaid = booking.status === "paid_escrow";

                const statusLabel = isDone ? "Selesai & Dinilai" :
                  isReturned ? "Unit Kembali (Deposit Cair)" :
                  isHandedOver ? "Masa Sewa Aktif" :
                  isPaid ? "Escrow Terkunci Aman" : "Terkonfirmasi";

                const badgeColor = isDone ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                  isReturned ? "bg-purple-50 text-purple-800 border-purple-200" :
                  isHandedOver ? "bg-blue-50 text-[#1683FF] border-blue-200" :
                  "bg-amber-50 text-amber-800 border-amber-200";

                return (
                  <div
                    key={booking.id}
                    className="bg-white border border-[#DCEAF7] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={booking.photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"}
                        alt={booking.rentalTitle}
                        className="w-16 h-16 rounded-xl object-cover border border-[#DCEAF7]"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${badgeColor}`}>
                            {statusLabel}
                          </span>
                          <span className="text-xs text-[#61758A]">
                            {booking.startDate} s/d {booking.endDate} ({booking.totalDays} hari)
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#102A43]">{booking.rentalTitle}</h3>
                        <p className="text-xs text-[#61758A] mt-0.5">Pemilik: {booking.ownerName}</p>
                        {booking.review && (
                          <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-600">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>Penilaian Kamu: {booking.review.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <div className="text-right">
                        <div className="text-[11px] text-[#61758A]">Total Dana Escrow</div>
                        <div className="font-extrabold text-sm sm:text-base text-[#1683FF]">{formatIDR(booking.totalAmount)}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/chat?room=${booking.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                        >
                          <span>{isReturned ? "Beri Rating Toko" : "Buka Alur Sewa"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        {isDone && (
                          <Link
                            href={`/sewa/${booking.rentalId || 'rent-1'}`}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
                          >
                            Lihat Produk
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 4: SAYA MENYEWAKAN */}
        {activeTab === "menyewakan" && (
          <div className="bg-white border border-[#DCEAF7] rounded-2xl p-10 text-center">
            <Camera className="w-8 h-8 text-[#1683FF] mx-auto mb-2 opacity-70" />
            <h3 className="font-bold text-sm text-[#102A43]">Belum Ada Barang yang Kamu Sewakan</h3>
            <p className="text-xs text-[#61758A] mt-1 mb-4">
              Punya kamera, proyektor, atau alat nganggur? Sewakan dan hasilkan penghasilan tambahan.
            </p>
            <Link
              href="/mitra/dashboard"
              className="px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-semibold"
            >
              Tambah Barang Sewa
            </Link>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F5FAFF]">
        <div className="text-slate-500 font-bold text-xs">Memuat riwayat aktivitas...</div>
      </div>
    }>
      <ActivityContent />
    </Suspense>
  );
}
