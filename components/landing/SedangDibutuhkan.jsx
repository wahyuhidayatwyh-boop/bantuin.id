"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import RequestCard from "@/components/cards/RequestCard";
import { ArrowRight, Zap, MapPin, Plus } from "lucide-react";

export default function SedangDibutuhkan() {
  const { requests, activeKabupaten, isItemInCurrentKabupaten } = useApp();

  // Exclude finished tasks and STRICTLY filter to activeKabupaten
  const localRequests = requests.filter(
    (item) =>
      item.status !== "helper_selected" &&
      item.status !== "in_progress" &&
      item.status !== "completed" &&
      item.status !== "closed" &&
      isItemInCurrentKabupaten(item)
  );

  // Strictly display local requests only (max 4 on landing page)
  const displayedRequests = localRequests.slice(0, 4);

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
      
      {/* Header with Title & Action Link */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#1683FF] border border-blue-100">
              <Zap className="w-3.5 h-3.5 fill-[#1683FF]" />
              <span>TERHUBUNG CEPAT DI {activeKabupaten.toUpperCase()}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Permintaan Bantuan di <span className="text-[#1683FF]">{activeKabupaten}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar kebutuhan tugas aktif dari pengguna di wilayah {activeKabupaten}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/bantuan"
            className="text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] flex items-center gap-1.5 group whitespace-nowrap"
          >
            <span>Lihat Semua Permintaan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Requests List or Empty State */}
      {displayedRequests.length > 0 ? (
        <div className="space-y-3">
          {displayedRequests.map((task) => (
            <RequestCard key={task.id} request={task} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center mb-4 shadow-2xs">
            <MapPin className="w-7 h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            Belum Ada Permintaan Aktif di {activeKabupaten}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Jadilah yang pertama membuat permintaan bantuan atau titip tugas kilat di wilayah {activeKabupaten}.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/bantuan/create"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Permintaan Sekarang</span>
            </Link>
            <Link
              href="/bantuan"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs sm:text-sm font-semibold transition"
            >
              <span>Jelajahi Semua Wilayah</span>
            </Link>
          </div>
        </div>
      )}

    </section>
  );
}
