"use client";

import React, { useState } from "react";
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
  AlertCircle
} from "lucide-react";

export default function ActivityPage() {
  const { requests, orderRooms, rentalBookings, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState("membutuhkan");

  const myRequests = requests.filter((r) => r.requester.id === currentUser?.id);
  const myHelps = orderRooms.filter((r) => r.helper.id === currentUser?.id || r.requester.id !== currentUser?.id);
  const myRentals = rentalBookings.filter((b) => b.renterId === currentUser?.id);

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

        {/* 4 Tabs */}
        <div className="flex items-center gap-2 border-b border-[#DCEAF7] pb-4 mb-8 overflow-x-auto">
          {[
            { id: "membutuhkan", label: `Saya Membutuhkan (${myRequests.length})` },
            { id: "membantu", label: `Saya Membantu (${myHelps.length})` },
            { id: "menyewa", label: `Saya Menyewa (${myRentals.length})` },
            { id: "menyewakan", label: "Saya Menyewakan (0)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition shrink-0 ${
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
                    href={`/order/${room.id}`}
                    className="px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-semibold hover:bg-[#0F6FE5] flex items-center gap-1.5 transition"
                  >
                    <span>Buka Order Room</span>
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
            {myRentals.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-[#DCEAF7] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={booking.photoUrl}
                    alt={booking.rentalTitle}
                    className="w-16 h-16 rounded-xl object-cover border border-[#DCEAF7]"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-50 text-[#1683FF] rounded-md">
                        {booking.status}
                      </span>
                      <span className="text-xs text-[#61758A]">
                        {booking.startDate} s/d {booking.endDate} ({booking.totalDays} hari)
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#102A43]">{booking.rentalTitle}</h3>
                    <p className="text-xs text-[#61758A] mt-0.5">Pemilik: {booking.ownerName}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#61758A]">Total Dana Escrow</div>
                  <div className="font-bold text-base text-[#1683FF]">{formatIDR(booking.totalAmount)}</div>
                </div>
              </div>
            ))}
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
