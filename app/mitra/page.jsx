"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { getAllMitraStores } from "@/lib/mock/mitraData";
import { 
  Store, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Search, 
  ChevronRight, 
  Package
} from "lucide-react";

export default function MitraCatalogPage() {
  const { activeKabupaten = "Indonesia" } = useApp() || {};
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState(() => getAllMitraStores());

  useEffect(() => {
    setStores(getAllMitraStores());
    const handleUpdate = () => setStores(getAllMitraStores());
    window.addEventListener("bantuin_mitra_store_updated", handleUpdate);
    return () => window.removeEventListener("bantuin_mitra_store_updated", handleUpdate);
  }, []);

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const q = searchQuery.toLowerCase().trim();
    return stores.filter((st) => {
      const nameMatch = (st.name || "").toLowerCase().includes(q);
      const tagMatch = (st.tagline || "").toLowerCase().includes(q);
      const catMatch = (st.category || "").toLowerCase().includes(q);
      const addrMatch = (st.address || "").toLowerCase().includes(q);
      return nameMatch || tagMatch || catMatch || addrMatch;
    });
  }, [stores, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Header Hero */}
        <section className="bg-white border-b border-slate-200/80 pt-8 pb-10">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-2">
                <Store className="w-3.5 h-3.5" />
                <span>DIREKTORI TOKO MITRA RESMI</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                Katalog Toko &amp; Mitra Terverifikasi
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Temukan outlet resmi penyewaan kamera, audio sound, studio foto, hingga perlengkapan event bergaransi di wilayah {activeKabupaten}.
              </p>

              {/* Search Bar */}
              <div className="mt-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari toko berdasarkan nama, kategori, atau alamat..."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20 text-xs sm:text-sm text-slate-900 transition outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stores Grid */}
        <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Daftar Toko Mitra ({filteredStores.length})
            </h2>
            <span className="text-xs text-slate-500">
              Terverifikasi identitas &amp; lokasi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredStores.map((st) => (
              <Link
                key={st.id}
                href={`/mitra/${st.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#1683FF] hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start gap-3.5 mb-3.5">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img
                        src={st.avatar}
                        alt={st.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#1683FF] transition truncate">
                          {st.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {st.tagline || st.category}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                        <span className="flex items-center gap-0.5 font-bold text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {st.rating || 4.9}
                        </span>
                        <span className="text-slate-300">&middot;</span>
                        <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.2 rounded flex items-center gap-0.5 text-[10px]">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                          Terverifikasi
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {st.about || "Penyedia unit persewaan resmi dengan jaminan fungsi dan prosedur sewa aman."}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span>{st.catalog?.length || 0} unit sewa</span>
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[160px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{st.address || "Banyumas"}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1683FF] group-hover:underline">
                    Kunjungi Toko
                  </span>
                  <span className="w-7 h-7 rounded-xl bg-blue-50 text-[#1683FF] group-hover:bg-[#1683FF] group-hover:text-white flex items-center justify-center transition">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {filteredStores.length === 0 && (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Tidak ada toko yang cocok dengan &ldquo;{searchQuery}&rdquo;</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mt-3 text-xs font-bold text-[#1683FF] hover:underline cursor-pointer"
              >
                Reset pencarian
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

