"use client";

import React from "react";
import { 
  ShieldAlert, 
  X, 
  RefreshCw, 
  SlidersHorizontal, 
  CheckCircle2, 
  Laptop,
  Smartphone,
  Info,
  MapPin,
  Compass
} from "lucide-react";

export default function LocationPermissionModal({
  isOpen,
  onClose,
  onRetryGPS,
  onSelectPreset,
  isDetecting,
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 relative max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Fixed Top) */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-3 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                Izin Akses Lokasi Terblokir
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Panduan mengaktifkan izin GPS di browser Anda
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Modal"
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Takes remaining space and scrolls smoothly) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs overscroll-contain">
          {/* Explanation Alert Card */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 text-amber-900 leading-relaxed shadow-2xs">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-amber-900 mb-1">
                  Mengapa pop-up izin tidak muncul otomatis?
                </p>
                <p className="text-amber-800/95 text-[11.5px] leading-relaxed">
                  Peramban (Google Chrome, Edge, atau Safari) tidak akan menampilkan pop-up permintaan izin apabila situs ini sebelumnya pernah diatur ke status &quot;Blokir&quot; atau dinonaktifkan pada setelan peramban.
                </p>
              </div>
            </div>
          </div>

          {/* Browser Unblock Steps */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#1683FF]" />
              <span>Langkah Cepat Membuka Izin di Browser:</span>
            </div>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:bg-slate-50 transition">
                <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-2xs">
                  1
                </div>
                <div className="text-xs leading-relaxed min-w-0 flex-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>Klik Ikon Setelan / Gembok di Kolom URL</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    Di kolom URL paling atas browser (di sebelah kiri alamat situs web), klik ikon setelan/slider atau ikon gembok perizinan situs.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:bg-slate-50 transition">
                <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-2xs">
                  2
                </div>
                <div className="text-xs leading-relaxed min-w-0 flex-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ubah Opsi Lokasi Menjadi &quot;Izinkan&quot; (Allow)</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    Cari opsi perizinan <strong>Lokasi / Location</strong>, lalu ubah statusnya dari <strong>Blokir</strong> menjadi <strong>Izinkan</strong> (Allow).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 hover:bg-slate-50 transition">
                <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5 shadow-2xs">
                  3
                </div>
                <div className="text-xs leading-relaxed min-w-0 flex-1">
                  <div className="font-bold text-slate-900 mb-0.5">
                    Perbarui Deteksi GPS
                  </div>
                  <p className="text-slate-600 text-[11px] leading-normal">
                    Setelah izin dibuka, klik tombol <strong>Coba Deteksi GPS Lagi</strong> di bawah atau segarkan halaman (<kbd className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded text-[10px]">F5</kbd>).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Device Tips */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="text-[11.5px] font-bold text-slate-800">
              Pemeriksaan Tambahan pada Perangkat:
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100/90 flex items-start gap-2.5">
              <Laptop className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Untuk Komputer / Windows:</span> Pastikan fitur lokasi sistem aktif di menu <strong>Settings &gt; Privacy &amp; Security &gt; Location</strong>, dan aktifkan izin untuk browser Anda.
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Untuk Smartphone (Android / iOS):</span> Pastikan fitur GPS di panel notifikasi aktif dan browser memiliki izin akses lokasi pada setelan aplikasi.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action Buttons (Fixed Bottom) */}
        <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 pt-3 border-t border-slate-100 shrink-0 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
          >
            Tutup
          </button>
          
          <button
            type="button"
            onClick={onRetryGPS}
            disabled={isDetecting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? "animate-spin" : ""}`} />
            <span>{isDetecting ? "Mendeteksi..." : "Coba Deteksi GPS Lagi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
