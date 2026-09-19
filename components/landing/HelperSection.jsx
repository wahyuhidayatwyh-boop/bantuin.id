"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShieldCheck, MapPin, CheckCircle2, Users, ArrowRight, Eye } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import TenagaBantuanDetailModal from "@/components/modals/TenagaBantuanDetailModal";

export default function HelperSection() {
  const { activeKabupaten } = useApp();
  const [selectedHelper, setSelectedHelper] = useState(null);

  // Helper local sub-district locator
  const getSubDistricts = (kab) => {
    const k = (kab || "").toLowerCase();
    if (k.includes("banyumas") || k.includes("purwokerto")) {
      return [
        { area: "Purwokerto Utara (Dekat Unsoed)", dist: "450 m dari posisi Anda" },
        { area: "Sokaraja & Purwokerto Timur", dist: "850 m dari posisi Anda" },
        { area: "Kembaran (Dekat Kampus UMP)", dist: "1.2 km dari posisi Anda" },
        { area: "Purwokerto Barat (Dekat Stasiun)", dist: "1.5 km dari posisi Anda" },
      ];
    }
    if (k.includes("kulon") || k.includes("progo")) {
      return [
        { area: "Wates (Dekat Kampus UNY)", dist: "500 m dari posisi Anda" },
        { area: "Temon (Dekat YIA)", dist: "1.2 km dari posisi Anda" },
        { area: "Pengasih", dist: "1.8 km dari posisi Anda" },
        { area: "Panjatan", dist: "2.4 km dari posisi Anda" },
      ];
    }
    if (k.includes("depok")) {
      return [
        { area: "Kukusan (Dekat UI)", dist: "450 m dari posisi Anda" },
        { area: "Margonda Raya", dist: "750 m dari posisi Anda" },
        { area: "Beji Timur", dist: "1.1 km dari posisi Anda" },
        { area: "Kelapa Dua", dist: "1.6 km dari posisi Anda" },
      ];
    }
    if (k.includes("banjarmasin")) {
      return [
        { area: "Kayu Tangi (Dekat ULM)", dist: "500 m dari posisi Anda" },
        { area: "Siring Menara Pandang", dist: "850 m dari posisi Anda" },
        { area: "Banjarmasin Tengah", dist: "1.2 km dari posisi Anda" },
        { area: "Banjarmasin Timur", dist: "1.7 km dari posisi Anda" },
      ];
    }
    return [
      { area: "Kuningan / Setiabudi", dist: "500 m dari posisi Anda" },
      { area: "Sudirman (SCBD)", dist: "850 m dari posisi Anda" },
      { area: "Kebayoran Baru", dist: "1.2 km dari posisi Anda" },
      { area: "Pancoran Indah", dist: "1.5 km dari posisi Anda" },
    ];
  };

  const subAreas = getSubDistricts(activeKabupaten);

  const helpers = [
    {
      id: "hlp-andi",
      name: "Bagus Wicaksono",
      verified: true,
      ratingAvg: 4.95,
      completedHelps: 34,
      responseSpeed: "< 5 mnt",
      distance: subAreas[0].dist,
      role: `Tenaga Bantuan Terverifikasi · ${subAreas[0].area}`,
      locationName: subAreas[0].area,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      skills: ["Antar Barang", "Titip Dokumen", "Errand Cepat"],
      bio: "Warga Purwokerto yang aktif dan terpercaya. Siap membantu kebutuhan mobilitas kilat seperti antar-jemput dokumen, belanja mendesak, atau errand harian di sekitar kampus & perkantoran.",
      equipment: ["Motor Beat (Helm Cadangan)", "Tas Kurir Anti Air", "Smartphone Standby"],
      reviews: [
        {
          reviewer: "Siti Rahmawati (Purwokerto Utara)",
          comment: "Mas Bagus gercep banget! Berkas penting sampai di TU Unsoed tepat waktu tanpa lecek sama sekali.",
          rating: 5,
        },
        {
          reviewer: "Budi Santoso (Grendeng)",
          comment: "Sangat komunikatif dan ramah. Tarif juga masuk akal. Pasti bakal minta tolong lagi.",
          rating: 5,
        }
      ]
    },
    {
      id: "hlp-sinta",
      name: "Dwi Prasetyo",
      verified: true,
      ratingAvg: 4.9,
      completedHelps: 28,
      responseSpeed: "< 8 mnt",
      distance: subAreas[1].dist,
      role: `Tenaga Bantuan Unggulan · ${subAreas[1].area}`,
      locationName: subAreas[1].area,
      avatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80",
      skills: ["Bantu Angkat", "Pindahan Kos", "Belanja"],
      bio: "Fisik kuat dan teliti. Berpengalaman membantu angkat lemari, pindahan kos mahasiswa, belanja grosir pasar, hingga pertolongan darurat motor mogok.",
      equipment: ["Motor Vario + Tali Pengikat", "Troli Lipat Barang", "Toolkit Dasar"],
      reviews: [
        {
          reviewer: "Fajar Pratama (Sokaraja)",
          comment: "Pindahan kos jadi santai berkat Mas Dwi. Barangnya dijaga dengan baik tanpa lecet.",
          rating: 5,
        },
        {
          reviewer: "Dewi Anggraini (Purwokerto Timur)",
          comment: "Orangnya sopan dan bertenaga. Sangat membantu kalau butuh angkat perabot berat.",
          rating: 5,
        }
      ]
    },
    {
      id: "hlp-rizky",
      name: "Rina Astuti",
      verified: true,
      ratingAvg: 4.92,
      completedHelps: 19,
      responseSpeed: "< 3 mnt",
      distance: subAreas[2].dist,
      role: `Tenaga Bantuan Terverifikasi · ${subAreas[2].area}`,
      locationName: subAreas[2].area,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      skills: ["Print Tugas", "Ambil Paket", "Jaga Stand"],
      bio: "Mahasiswi aktif di Banyumas. Teliti dan rapi untuk tugas-tugas administratif seperti print & jilid laporan, ambil paket ekspedisi, atau penjagaan booth pameran/acara.",
      equipment: ["Motor Scoopy", "Map & Plastik Pelindung", "Powerbank"],
      reviews: [
        {
          reviewer: "Indah Permata (Kembaran)",
          comment: "Mbak Rina teliti banget cek jilid skripsi sebelum dikirim. Recommended banget!",
          rating: 5,
        },
        {
          reviewer: "Agus Salim (Dukuhwaluh)",
          comment: "Bantu ambil paket kurir saat saya keluar kota. Jujur dan bisa dipercaya 100%.",
          rating: 5,
        }
      ]
    },
    {
      id: "hlp-dimas",
      name: "Ahmad Rizky",
      verified: true,
      ratingAvg: 4.88,
      completedHelps: 22,
      responseSpeed: "< 10 mnt",
      distance: subAreas[3].dist,
      role: `Tenaga Bantuan Aktif · ${subAreas[3].area}`,
      locationName: subAreas[3].area,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      skills: ["Jemput Berkas", "Bantu Acara", "Errand Kilat"],
      bio: "Siap siaga di area barat kota dan stasiun. Cepat tanggap untuk kebutuhan urgent tiket, jemput berkas, hingga support operasional kegiatan.",
      equipment: ["Motor NMAX", "Jas Hujan Dobel", "Smartphone 5G"],
      reviews: [
        {
          reviewer: "Hendro Gunawan (Kober)",
          comment: "Respon chat cepat dan langsung meluncur. Sangat membantu di saat darurat.",
          rating: 5,
        },
        {
          reviewer: "Nurul Aini (Karanglewas)",
          comment: "Tepat waktu dan bertanggung jawab. Sangat recommended.",
          rating: 5,
        }
      ]
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
            href="/bantuan?tab=tenaga-bantuan"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 px-4 py-2.5 rounded-xl transition self-start sm:self-auto shrink-0"
          >
            <span>Semua Tenaga Bantuan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4 Cards: Tenaga Bantuan dengan Interaksi Detail & Aksi Cepat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {helpers.map((helper) => (
            <div
              key={helper.id}
              className="bg-white rounded-[22px] border border-slate-200/90 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(22,131,255,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center justify-between group"
            >
              <div className="flex flex-col items-center w-full">
                {/* Avatar with Verified Badge - Clickable to open modal */}
                <button
                  type="button"
                  onClick={() => setSelectedHelper(helper)}
                  className="relative mb-3.5 cursor-pointer group-hover:scale-105 transition-transform"
                  title="Klik untuk lihat detail profil & ulasan"
                >
                  <img
                    src={helper.avatarUrl}
                    alt={helper.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white ring-2 ring-blue-100 shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs ring-2 ring-white" title="Terverifikasi KTP & No. HP">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </button>

                {/* Name with verified icon */}
                <h3 
                  onClick={() => setSelectedHelper(helper)}
                  className="font-bold text-base text-slate-900 flex items-center justify-center gap-1 cursor-pointer hover:text-[#1683FF] transition"
                >
                  <span>{helper.name}</span>
                  <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                </h3>
                
                <p className="text-[11px] text-slate-500 mb-2.5">
                  {helper.role}
                </p>

                {/* Rating & Metric */}
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full mb-3.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{helper.ratingAvg}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-emerald-700 font-bold">{helper.completedHelps} tugas</span>
                </div>

                {/* Distance */}
                <div className="flex items-center gap-1 text-xs text-slate-600 mb-3.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                  <span className="font-medium">{helper.distance}</span>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap justify-center gap-1 mb-4 w-full">
                  {helper.skills.map((skill) => (
                    <span key={skill} className="text-[10px] px-2 py-0.5 bg-blue-50 text-[#1683FF] rounded-md font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons: 1 Tombol Lihat Detail (Modal) + 1 Tombol Minta Bantuan Langsung */}
              <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedHelper(helper)}
                  className="w-full py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700 hover:text-[#1683FF] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1683FF]" />
                  <span>Lihat Detail Profil</span>
                </button>

                <Link
                  href={`/bantuan/create?helper=${encodeURIComponent(helper.name)}`}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-[#1683FF] text-white font-bold text-xs shadow-xs transition text-center active:scale-95 flex items-center justify-center gap-1"
                >
                  <span>Minta Bantuan</span>
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

