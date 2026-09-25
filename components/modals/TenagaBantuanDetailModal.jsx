"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { 
  X, 
  Star, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ThumbsUp, 
  MessageSquare, 
  Send, 
  Bike,
  Award,
  Eye,
  Check
} from "lucide-react";

export default function TenagaBantuanDetailModal({ isOpen, onClose, helper }) {
  // Tutup dengan tombol Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !helper) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] z-10 animate-scale-up"
      >
        {/* Header Ribbon / Banner */}
        <div className="bg-linear-to-r from-[#1683FF] to-[#0D62C4] px-6 pt-6 pb-12 text-white relative">
          <button
            onClick={onClose}
            aria-label="Tutup detail"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-blue-50 border border-white/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Profil Tenaga Bantuan Terverifikasi</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Detail Tenaga Bantuan
          </h2>
          <p className="text-xs text-blue-100 mt-0.5">
            Siap membantu kebutuhan mikro & tugas harian di wilayah sekitar Anda
          </p>
        </div>

        {/* Profile Card Overlay */}
        <div className="px-6 -mt-8 relative z-10 flex-1 overflow-y-auto">
          {/* Main Identity Box */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={helper.avatarUrl}
                alt={helper.name}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white shadow-md border border-slate-100"
              />
              <div 
                className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-xs ring-2 ring-white" 
                title="Terverifikasi KTP & No. HP"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                  {helper.name}
                </h3>
                <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Siap Bertugas
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {helper.role}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                <span className="font-semibold text-slate-700">{helper.locationName}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500">{helper.distance}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 mt-3.5">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-500 font-black text-sm sm:text-base">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{helper.ratingAvg}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Rating Kepuasan</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-600 font-black text-sm sm:text-base">
                <ThumbsUp className="w-4 h-4" />
                <span>{helper.completedHelps}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Bantuan Selesai</span>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
              <div className="flex items-center justify-center gap-1 text-[#1683FF] font-black text-sm sm:text-base">
                <Clock className="w-4 h-4" />
                <span>{helper.responseSpeed || "< 5 mnt"}</span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Respon Kilat</span>
            </div>
          </div>

          {/* Bio / Ringkasan Diri */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span>Tentang Tenaga Bantuan</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              {helper.bio || "Warga terdaftar dan terverifikasi di wilayah Banyumas yang siap membantu tugas harian, mobilitas cepat, dan kebutuhan mendesak Anda dengan amanah."}
            </p>
          </div>

          {/* Keahlian & Kategori Bantuan */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Bantuan yang Siap Dikerjakan
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {helper.skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-semibold px-3 py-1 bg-blue-50 text-[#1683FF] rounded-lg border border-blue-100 flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-[#1683FF]" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Perlengkapan / Kendaraan Pendukung */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bike className="w-3.5 h-3.5 text-slate-500" />
              <span>Perlengkapan & Mobilitas</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(helper.equipment || ["Motor Pribadi (Helm Cadangan)", "Tas Belanja / Kurir", "Smartphone Standby"]).map((eq) => (
                <span
                  key={eq}
                  className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md"
                >
                  {eq}
                </span>
              ))}
            </div>
          </div>

          {/* Ulasan Tetangga / Pengguna Sekitar */}
          <div className="mt-5 mb-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Ulasan Warga Sekitar ({helper.reviews ? helper.reviews.length : 2})</span>
            </h4>
            <div className="space-y-2">
              {(helper.reviews || [
                {
                  reviewer: "Siti Rahmawati (Purwokerto)",
                  comment: "Komunikatif dan amanah. Dokumen penting sampai tepat waktu tanpa ada yang lecek.",
                  rating: 5,
                },
                {
                  reviewer: "Budi Santoso (Grendeng)",
                  comment: "Bantuan angkat barang kos sangat rapi dan cepat. Rekomendasi sekali!",
                  rating: 5,
                }
              ]).map((rev, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">{rev.reviewer}</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions: Jelas & Langsung Beraksi */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Link
            href={`/jasa/penyedia/${helper?.providerId || "bagus-wicaksono-helper"}`}
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition active:scale-95"
          >
            <Eye className="w-4 h-4 text-[#1683FF]" />
            <span>Lihat Profil & Katalog Lengkap</span>
          </Link>

          <Link
            href={`/bantuan/create?helper=${encodeURIComponent(helper?.name || "")}`}
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition active:scale-95 text-center"
          >
            <Send className="w-4 h-4" />
            <span>Minta Bantuan ke {helper?.name?.split(" ")[0] || "Helper"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
