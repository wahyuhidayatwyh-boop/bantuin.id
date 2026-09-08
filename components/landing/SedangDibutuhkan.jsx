"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import RequestCard from "@/components/cards/RequestCard";
import { 
  ArrowRight, 
  MapPin, 
  Clock, 
  Zap, 
  LayoutGrid, 
  List, 
  Users 
} from "lucide-react";

export default function SedangDibutuhkan() {
  const { requests, activeKabupaten, isItemInCurrentKabupaten } = useApp();
  const [viewMode, setViewMode] = useState("card"); // 'card' | 'list'

  // Exclude finished tasks and STRICTLY filter to activeKabupaten
  const localRequests = requests.filter(
    (item) =>
      item.status !== "helper_selected" &&
      item.status !== "in_progress" &&
      item.status !== "completed" &&
      item.status !== "closed" &&
      isItemInCurrentKabupaten(item)
  );

  // If local requests exist use them; if none, show all available tasks
  const displayedRequests = (localRequests.length > 0 ? localRequests : requests).slice(0, 4);

  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 py-12">
      
      {/* Header with Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
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
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("card")}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "card"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <Link
            href="/bantuan"
            className="text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] flex items-center gap-1 group whitespace-nowrap"
          >
            <span>Lihat Semua Permintaan</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Requests Grid / List */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayedRequests.map((task) => (
            <RequestCard key={task.id} request={task} />
          ))}
        </div>
      ) : (
        /* Clean List Mode */
        <div className="space-y-3">
          {displayedRequests.map((task) => {
            const offersCount = task.offers?.length || 0;
            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-200 hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <img
                    src={task.requester?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                    alt={task.requester?.name || "Peminta"}
                    className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-100"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/bantuan/${task.id}`} className="font-bold text-sm sm:text-base text-slate-900 hover:text-[#1683FF] truncate">
                        {task.title}
                      </Link>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 shrink-0">
                        {task.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <span className="font-semibold text-slate-700">{task.requester?.name}</span>
                      <span>•</span>
                      <span>{task.distanceMeters > 0 ? `${task.distanceMeters} m` : "Online"}</span>
                      <span>•</span>
                      <Link href={`/bantuan/${task.id}/pelamar`} className="text-slate-600 hover:text-[#1683FF] font-medium">
                        {offersCount} Pelamar
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] text-slate-400 font-medium uppercase">Imbalan</div>
                    <div className="font-bold text-base text-[#1683FF]">{formatIDR(task.rewardAmount)}</div>
                  </div>

                  <Link
                    href={`/bantuan/${task.id}/ajukan`}
                    className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
                  >
                    <span>Bantu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}
