"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { getAllCatalogServices } from "@/lib/mock/providersData";
import { getAllMitraStores } from "@/lib/mock/mitraData";
import jasaImg from "@/components/image/Jasa.png";
import sewaImg from "@/components/image/sewa.png";
import { 
  Wrench, 
  Camera, 
  Store, 
  ArrowRight, 
  Compass, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  Package, 
  UserCheck 
} from "lucide-react";

export default function ExploreServicesSection() {
  const { rentals = [], activeKabupaten = "Kab. Banyumas" } = useApp() || {};

  // Real counts derived from existing data
  const servicesCount = useMemo(() => {
    try {
      return getAllCatalogServices().length;
    } catch {
      return 0;
    }
  }, []);

  const rentalsCount = rentals.length;

  const storesCount = useMemo(() => {
    try {
      return getAllMitraStores().length;
    } catch {
      return 0;
    }
  }, []);

  const displayLocation = (activeKabupaten && activeKabupaten !== "Indonesia") 
    ? activeKabupaten 
    : "Kab. Banyumas";

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-slate-100 relative overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Jelajahi Layanan di <span className="text-[#1683FF]">{displayLocation}</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 mt-2 leading-relaxed">
            Akses katalog lengkap untuk mencari layanan jasa profesional, unit sewa harian, atau hubungi toko mitra terverifikasi.
          </p>
        </div>

        {/* Alternating Showcase Cards */}
        <div className="space-y-8 sm:space-y-12">
          
          {/* ============================================================ */}
          {/* ROW 1: JASA                                                  */}
          {/* Foto Jasa.png di KIRI, Keterangan persuasif + Tombol di KANAN */}
          {/* ============================================================ */}
          <div className="bg-[#FAFBFD] rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-10 shadow-xs hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
              
              {/* Kolom Kiri: Foto Jasa.png */}
              <div className="lg:col-span-6 w-full">
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-md group bg-white">
                  <Image
                    src={jasaImg}
                    alt="Layanan Jasa Profesional Bantuin"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-[11px] font-black text-slate-800">
                    <UserCheck className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>{servicesCount > 0 ? `${servicesCount}+ Talenta Aktif` : "Talenta Terverifikasi"}</span>
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Keterangan Persuasif + Button ke Nav Jasa */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1683FF] text-[11px] font-black uppercase tracking-wider mb-2 border border-blue-100">
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Layanan Jasa Profesional</span>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                    Butuh Keahlian Spesifik? Serahkan Pada Ahlinya.
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Temukan talenta terpercaya di sekitarmu untuk menyelesaikan berbagai kebutuhan secara cepat dan praktis. Mulai dari desain grafis, teknisi reparasi &amp; servis gadget, fotografer acara, koding &amp; website, hingga bantuan tenaga harian siap kerja.
                </p>

                {/* Persuasive Key Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Penyedia Jasa Terverifikasi</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Portofolio &amp; Ulasan Asli</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Chat &amp; Negosiasi Transparan</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Tersedia di {displayLocation}</span>
                  </div>
                </div>

                {/* Button Action ke Nav Jasa */}
                <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href="/jasa"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all active:scale-95 group"
                  >
                    <span>Jelajahi Katalog Jasa</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Bebas konsultasi langsung dengan mitra jasa
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* ROW 2: SEWA                                                  */}
          {/* Keterangan persuasif + Tombol di KIRI, Foto sewa.png di KANAN */}
          {/* ============================================================ */}
          <div className="bg-[#FAFBFD] rounded-3xl border border-slate-200/90 p-5 sm:p-8 lg:p-10 shadow-xs hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
              
              {/* Kolom Kiri: Keterangan Persuasif + Tombol ke Nav Sewa (di Desktop tampil di KIRI) */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-4 sm:space-y-5 order-2 lg:order-1">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-[11px] font-black uppercase tracking-wider mb-2 border border-sky-100">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Rental Gear &amp; Peralatan</span>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                    Peralatan Berkualitas Siap Pakai, Hemat Tanpa Harus Beli.
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Mau bikin konten video, tugas kuliah, dokumentasi proyek, acara penting, atau butuh perangkat cadangan? Sewa kamera DSLR, mirrorless, lensa, drone, sound system, laptop, hingga alat event langsung dari toko rental terpercaya dengan proses serah terima yang aman.
                </p>

                {/* Persuasive Key Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Unit Terawat &amp; Siap Pakai</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Sewa Fleksibel Harian &amp; Mingguan</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Jaminan Handover &amp; Deposit Jelas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Mitra Toko Resmi Terverifikasi</span>
                  </div>
                </div>

                {/* Button Action ke Nav Sewa & Nav Toko Mitra */}
                <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href="/sewa"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-slate-900/15 hover:shadow-lg transition-all active:scale-95 group"
                  >
                    <span>Jelajahi Katalog Sewa</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/mitra"
                    className="inline-flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm border border-slate-200/90 shadow-2xs transition-all active:scale-95"
                  >
                    <Store className="w-4 h-4 text-slate-500" />
                    <span>Direktori Toko Mitra</span>
                  </Link>
                </div>
              </div>

              {/* Kolom Kanan: Foto sewa.png (di Desktop tampil di KANAN) */}
              <div className="lg:col-span-6 w-full order-1 lg:order-2">
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 shadow-md group bg-white">
                  <Image
                    src={sewaImg}
                    alt="Rental Alat dan Perlengkapan Bantuin"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute top-3.5 right-3.5 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-[11px] font-black text-slate-800">
                    <Package className="w-3.5 h-3.5 text-sky-600" />
                    <span>{rentalsCount > 0 ? `${rentalsCount}+ Unit Siap Sewa` : "Unit Rental Siap Pakai"}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
