"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShieldCheck, MapPin, CheckCircle2, Users, ArrowRight, Eye } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import TenagaBantuanDetailModal from "@/components/modals/TenagaBantuanDetailModal";

export default function HelperSection() {
  const { activeKabupaten, getDistanceToUser } = useApp();
  const [selectedHelper, setSelectedHelper] = useState(null);

  // Dynamic helper data with authentic coordinates
  const helpers = [
    {
      id: "hlp-andi",
      providerId: "bagus-wicaksono-helper",
      name: "Bagus Wicaksono",
      verified: true,
      ratingAvg: 4.95,
      completedHelps: 34,
      responseSpeed: "< 15 mnt",
      latitude: -7.4089,
      longitude: 109.2512,
      role: "Tenaga Bantuan & Logistik",
      locationName: "Purwokerto Utara, Banyumas",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      skills: ["Antar Barang", "Titip Dokumen", "Errand Cepat"],
      bio: "Tenaga bantuan andalan yang aktif dan terpercaya. Siap membantu mobilitas kilat seperti antar-jemput dokumen, belanja mendesak, atau errand harian.",
      equipment: ["Motor (Helm Cadangan)", "Tas Kurir Anti Air", "Smartphone Standby"],
      reviews: [
        {
          reviewer: "Siti Rahmawati",
          comment: "Mas Bagus gercep banget! Berkas penting sampai di tujuan tepat waktu tanpa lecek sama sekali.",
          rating: 5,
        },
      ],
    },
    {
      id: "hlp-sinta",
      providerId: "dwi-prasetyo-helper",
      name: "Dwi Prasetyo",
      verified: true,
      ratingAvg: 4.9,
      completedHelps: 28,
      responseSpeed: "< 20 mnt",
      latitude: -7.4150,
      longitude: 109.2480,
      role: "Tenaga Bantuan Fisik & Pindahan",
      locationName: "Banyumas",
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80",
      skills: ["Bantu Angkat", "Pindahan Kos", "Belanja"],
      bio: "Fisik kuat dan teliti. Berpengalaman membantu angkat lemari, pindahan kos, belanja grosir pasar, hingga pertolongan darurat motor mogok.",
      equipment: ["Motor + Tali Pengikat", "Troli Lipat Barang", "Toolkit Dasar"],
      reviews: [
        {
          reviewer: "Fajar Pratama",
          comment: "Pindahan kos jadi santai berkat Mas Dwi. Barangnya dijaga dengan baik tanpa lecet.",
          rating: 5,
        },
      ],
    },
    {
      id: "hlp-rizky",
      providerId: "rina-astuti-helper",
      name: "Rina Astuti",
      verified: true,
      ratingAvg: 4.92,
      completedHelps: 19,
      responseSpeed: "< 15 mnt",
      latitude: -7.4200,
      longitude: 109.2400,
      role: "Tenaga Bantuan Administratif",
      locationName: "Banyumas",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      skills: ["Print Tugas", "Ambil Paket", "Jaga Stand"],
      bio: "Teliti dan rapi untuk tugas-tugas administratif seperti print & jilid dokumen, ambil paket ekspedisi, atau asistensi acara.",
      equipment: ["Motor Scoopy", "Map Pelindung Dokumen", "Powerbank"],
      reviews: [
        {
          reviewer: "Indah Permata",
          comment: "Mbak Rina teliti banget cek berkas sebelum dikirim. Sangat direkomendasikan!",
          rating: 5,
        },
      ],
    },
    {
      id: "hlp-dimas",
      providerId: "ahmad-rizky-helper",
      name: "Ahmad Rizky",
      verified: true,
      ratingAvg: 4.88,
      completedHelps: 22,
      responseSpeed: "< 25 mnt",
      latitude: -7.4250,
      longitude: 109.2350,
      role: "Tenaga Bantuan Umum & Kurir",
      locationName: "Banyumas",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      skills: ["Jemput Berkas", "Bantu Acara", "Errand Kilat"],
      bio: "Cepat tanggap untuk kebutuhan mendesak, jemput berkas, hingga support operasional kegiatan.",
      equipment: ["Motor Standby", "Jas Hujan", "Smartphone Aktif"],
      reviews: [
        {
          reviewer: "Hendro Gunawan",
          comment: "Respon chat cepat dan langsung meluncur. Sangat membantu di saat darurat.",
          rating: 5,
        },
      ],
    },
  ];

  return (
    <section className="py-14 md:py-20 bg-[#F8FBFF] border-b border-slate-100">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>KOMUNITAS TENAGA BANTUAN {activeKabupaten.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Orang yang Siap Membantu di <span className="text-[#1683FF]">{activeKabupaten}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tenaga bantuan terverifikasi identitas di sekitar wilayah {activeKabupaten} yang siap membantu kebutuhan harian Anda kapan saja.
            </p>
          </div>

          <Link
            href="/jasa"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 px-4 py-2.5 rounded-xl transition self-start sm:self-auto shrink-0"
          >
            <span>Semua Tenaga Bantuan &amp; Mitra</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Cards: Tenaga Bantuan dengan Interaksi Detail & Aksi Cepat */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-5">
          {helpers.map((helper) => (
            <div
              key={helper.id}
              className="bg-white rounded-xl sm:rounded-[22px] border border-slate-200/90 p-3 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(22,131,255,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center justify-between group"
            >
              <div className="flex flex-col items-center w-full">
                {/* Avatar with Verified Badge - Clickable to open public provider profile */}
                <Link
                  href={`/jasa/penyedia/${helper.providerId}`}
                  className="relative mb-2 sm:mb-3.5 block group-hover:scale-105 transition-transform"
                  title={`Buka profil publik resmi ${helper.name}`}
                >
                  <img
                    src={helper.avatarUrl}
                    alt={helper.name}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white ring-2 ring-blue-100 shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 sm:p-1 shadow-xs ring-2 ring-white" title="Terverifikasi KTP & No. HP">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                </Link>

                {/* Name with verified icon */}
                <div className="w-full min-w-0 px-1">
                  <Link 
                    href={`/jasa/penyedia/${helper.providerId}`}
                    className="font-bold text-xs sm:text-base text-slate-900 flex items-center justify-center gap-1 hover:text-[#1683FF] transition min-w-0"
                  >
                    <span className="truncate">{helper.name}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1683FF] shrink-0" />
                  </Link>
                </div>
                
                <p className="text-[10px] sm:text-[11px] text-slate-500 mb-1.5 sm:mb-2.5 truncate w-full px-1">
                  {helper.role}
                </p>

                {/* Rating & Metric */}
                <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full mb-2 sm:mb-3.5 max-w-full overflow-hidden">
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <span>{helper.ratingAvg}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-bold truncate">{helper.completedHelps} tugas</span>
                </div>

                {/* Genuine Distance / Location */}
                {(() => {
                  const distInfo = getDistanceToUser ? getDistanceToUser(helper.latitude, helper.longitude) : null;
                  const displayLoc = distInfo?.isRealtime && distInfo?.text ? distInfo.text : helper.locationName;
                  return (
                    <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs text-slate-600 mb-2 sm:mb-3.5 w-full min-w-0 px-1 overflow-hidden">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1683FF] shrink-0" />
                      <span className="font-medium truncate max-w-full">{displayLoc}</span>
                    </div>
                  );
                })()}

                {/* Skills tags (visible on desktop) */}
                <div className="hidden sm:flex flex-wrap justify-center gap-1 mb-4 w-full">
                  {helper.skills.map((skill) => (
                    <span key={skill} className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#1683FF] rounded-md font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Buka Profil Publik & Pesan Langsung */}
              <div className="w-full flex flex-col gap-1.5 sm:gap-2 pt-2 border-t border-slate-100 min-w-0">
                <Link
                  href={`/jasa/penyedia/${helper.providerId}`}
                  className="w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-[#1683FF] font-bold text-[11px] sm:text-xs transition flex items-center justify-center gap-1 cursor-pointer truncate"
                >
                  <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 group-hover:text-[#1683FF] shrink-0" />
                  <span className="truncate">Lihat Profil</span>
                </Link>

                <Link
                  href={`/jasa/penyedia/${helper.providerId}`}
                  className="w-full py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-[11px] sm:text-xs shadow-xs transition text-center active:scale-95 flex items-center justify-center gap-1 truncate"
                >
                  <span className="truncate">Pesan Jasa</span>
                </Link>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Modal Detail Tenaga Bantuan (Usability: Tetap di Halaman, Tanpa Navigasi Bingung) */}
      <TenagaBantuanDetailModal
        isOpen={Boolean(selectedHelper)}
        onClose={() => setSelectedHelper(null)}
        helper={selectedHelper}
      />
    </section>
  );
}

