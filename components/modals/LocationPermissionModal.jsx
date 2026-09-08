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
  Info
} from "lucide-react";

export default function LocationPermissionModal({
  isOpen,
  onClose,
  onRetryGPS,
  isDetecting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                Izin Akses Lokasi Terblokir
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Panduan mengaktifkan izin GPS nyata di peramban Anda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Explanation Card */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-amber-900 leading-relaxed">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">
                  Mengapa pop-up izin tidak muncul otomatis?
                </p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Peramban (Google Chrome, Microsoft Edge, atau Safari) tidak akan menampilkan pop-up permintaan izin lagi apabila situs ini sebelumnya pernah diatur ke status &quot;Blokir&quot; atau dinonaktifkan di pengaturan sistem peramban.
                </p>
              </div>
            </div>
          </div>

          {/* Browser Unblock Steps */}
          <div>
            <div className="text-xs font-bold text-slate-900 mb-2.5">
              Langkah Cepat Membuka Izin di Browser:
            </div>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>Klik Ikon Setelan / Gembok di Kolom URL</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Di kolom URL paling atas browser (tepat di sebelah kiri alamat situs web), klik ikon setelan/slider atau ikon gembok perizinan situs.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ubah Opsi Lokasi Menjadi &quot;Izinkan&quot; (Allow)</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Cari menu perizinan <strong>Lokasi / Location</strong>, lalu ubah statusnya dari <strong>Blokir</strong> menjadi <strong>Izinkan</strong> (Allow).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-[#1683FF] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="font-bold text-slate-900 mb-0.5">
                    Perbarui Deteksi GPS
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Setelah mengubah izin, klik tombol <strong>Coba Deteksi GPS Lagi</strong> di bawah atau muat ulang halaman (<kbd className="font-mono bg-white px-1 py-0.5 border border-slate-200 rounded">F5</kbd>).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* System Device Tips */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-[11px] font-bold text-slate-700">
              Pemeriksaan Tambahan pada Perangkat:
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/80 flex items-start gap-2.5">
              <Laptop className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Untuk Pengguna Komputer / Windows:</span> Pastikan fitur lokasi sistem aktif di menu <strong>Settings &gt; Privacy &amp; Security &gt; Location</strong>, dan centang izin untuk browser peramban Anda.
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Untuk Pengguna Smartphone (Android / iOS):</span> Pastikan fitur GPS di bilah notifikasi aktif dan browser memiliki izin akses lokasi pada pengaturan aplikasi.
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            Tutup
          </button>
          
          <button
            type="button"
            onClick={onRetryGPS}
            disabled={isDetecting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDetecting ? "animate-spin" : ""}`} />
            <span>{isDetecting ? "Mendeteksi..." : "Coba Deteksi GPS Lagi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
