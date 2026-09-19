"use client";

import React, { useState } from "react";
import { 
  Flag, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Upload, 
  Camera, 
  Loader2 
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";

const REPORT_CATEGORIES = [
  { id: "fraud", label: "Penipuan / Indikasi Fraud", desc: "Ketidaksesuaian uang muka, barang tidak dikirim, atau akun mencurigakan" },
  { id: "suspicious_item", label: "Barang / Muatan Mencurigakan", desc: "Paket berbau tajam, zat kimia tak berlabel, atau segel tertutup gelap" },
  { id: "academic_violation", label: "Permintaan Ilegal / Joki Akademik", desc: "Permintaan joki skripsi, ujian online, atau pelanggaran etika kampus" },
  { id: "harassment", label: "Pelecehan / Keamanan Fisik", desc: "Pelecehan verbal, tindakan asusila, atau ancaman saat bertemu" },
  { id: "disintermediation", label: "Ajakan Transaksi di Luar Platform", desc: "Memaksa transfer rekening pribadi atau membatalkan escrow" },
  { id: "payment_dispute", label: "Masalah Pembayaran / Refund", desc: "Perselisihan pemotongan deposit atau pembatalan sepihak" },
  { id: "other", label: "Pelanggaran Lainnya", desc: "Masalah lain yang melanggar Syarat & Ketentuan Bantuin" }
];

export default function ReportModal({ isOpen, onClose, targetRoom, targetUser }) {
  const { submitReport, addToast } = useApp();

  const [category, setCategory] = useState("fraud");
  const [description, setDescription] = useState("");
  const [evidencePhotos, setEvidencePhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setEvidencePhotos((prev) => [...prev, event.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemovePhoto = (idx) => {
    setEvidencePhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      addToast?.("Deskripsi Kurang Lengkap", "Mohon jelaskan rincian kronologi minimal 10 karakter.", "warning");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      submitReport({
        targetUserId: targetUser?.id || targetRoom?.helper?.id,
        targetRoomId: targetRoom?.id,
        targetRequestId: targetRoom?.requestId,
        category: REPORT_CATEGORIES.find((c) => c.id === category)?.label || category,
        description: description.trim(),
        evidenceUrls: evidencePhotos,
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setDescription("");
        setEvidencePhotos([]);
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Pusat Pelaporan &amp; Pengaduan
              </h3>
              <p className="text-[11px] text-slate-500">
                Notice &amp; Takedown • Peninjauan Tim Moderasi 24 Jam
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-slate-900">
              Laporan Berhasil Terkirim
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Tim Trust &amp; Safety Bantuin telah mencatat laporan ini dengan status <strong>UNDER_REVIEW</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
            
            {/* Target Info */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Objek yang Dilaporkan</span>
                <span className="font-bold text-slate-800">
                  {targetUser?.name || targetRoom?.helper?.name || targetRoom?.requestTitle || "Percakapan Ini"}
                </span>
              </div>
              <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-500">
                {targetRoom?.id || "Room"}
              </span>
            </div>

            {/* Kategori Pelaporan */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Pilih Kategori Pelanggaran:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-rose-500 transition"
              >
                {REPORT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {REPORT_CATEGORIES.find((c) => c.id === category)?.desc}
              </p>
            </div>

            {/* Rincian Deskripsi Kronologi */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Kronologi / Alasan Pelaporan: <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara ringkas dan objektif apa yang terjadi..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 transition text-xs leading-relaxed"
              />
            </div>

            {/* Upload Bukti Screenshot / Foto */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lampirkan Bukti Foto / Tangkapan Layar:</span>
                </label>
                <span className="text-[10px] text-slate-400">(Opsional)</span>
              </div>

              <input
                type="file"
                id="report-evidence-file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {evidencePhotos.length === 0 ? (
                <label
                  htmlFor="report-evidence-file"
                  className="p-3 border border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-500 hover:bg-slate-50 transition cursor-pointer text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Klik untuk unggah screenshot bukti chat / foto fisik</span>
                </label>
              ) : (
                <div className="flex flex-wrap gap-2 items-center">
                  {evidencePhotos.map((photo, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200">
                      <img src={photo} alt="Bukti" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(i)}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded p-0.5 hover:bg-rose-600"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <label
                    htmlFor="report-evidence-file"
                    className="w-14 h-14 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer text-[10px]"
                  >
                    <span>+ Foto</span>
                  </label>
                </div>
              )}
            </div>

            {/* Legal Warning Notice */}
            <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-[10px] text-amber-800 leading-snug">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Laporan palsu dengan itikad buruk dapat dikenakan sanksi pembekuan akun. Setiap laporan dicatat dalam audit trail sistem.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-3.5 h-3.5" />
                    <span>Kirim Laporan</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
