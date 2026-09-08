"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MapComponent from "@/components/map/MapComponent";
import { useApp } from "@/lib/context/AppContext";
import { ShieldCheck, Lock, MapPin, Eye, AlertTriangle } from "lucide-react";

export default function KeamananPage() {
  const { bantuinPoints } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 md:px-6 py-10 space-y-10">
        
        {/* Header */}
        <div className="text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1683FF] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#102A43]">
            Pusat Keamanan & Bantuin Point
          </h1>
          <p className="text-sm text-[#61758A] mt-2">
            Standar keselamatan berlapis untuk transaksi komunitas kampus bebas khawatir.
          </p>
        </div>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm">
            <Lock className="w-8 h-8 text-[#1683FF] mb-3" />
            <h3 className="font-bold text-base text-[#102A43] mb-1.5">Escrow Payment Xendit</h3>
            <p className="text-xs text-[#61758A] leading-relaxed">
              Bantuin tidak pernah menyimpan dana bebas tarik secara ilegal. Dana ditahan aman di escrow Xendit hingga tugas selesai dikonfirmasi.
            </p>
          </div>

          <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm">
            <Eye className="w-8 h-8 text-emerald-600 mb-3" />
            <h3 className="font-bold text-base text-[#102A43] mb-1.5">Verifikasi KTM & KTP</h3>
            <p className="text-xs text-[#61758A] leading-relaxed">
              Identitas pengguna diverifikasi secara ketat untuk mencegah akun anonim palsu dan menjamin rasa aman saat bertransaksi.
            </p>
          </div>

          <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm">
            <MapPin className="w-8 h-8 text-amber-500 mb-3" />
            <h3 className="font-bold text-base text-[#102A43] mb-1.5">Safe Bantuin Points</h3>
            <p className="text-xs text-[#61758A] leading-relaxed">
              Titik temu publik yang direkomendasikan sistem di gerbang kampus, halte aktif, dan perpustakaan dengan pos keamanan.
            </p>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white border border-[#DCEAF7] rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#102A43] mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#1683FF]" />
            <span>Peta Titik Temu Aman (Bantuin Point UI)</span>
          </h2>
          <p className="text-xs text-[#61758A] mb-4">
            Disarankan selalu melakukan serah terima barang atau dokumen di titik-titik terverifikasi berikut:
          </p>
          <MapComponent points={bantuinPoints} height="400px" />
        </div>

      </main>

      <Footer />
    </div>
  );
}
