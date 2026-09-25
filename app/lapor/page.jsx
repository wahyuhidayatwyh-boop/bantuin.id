"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import {
  Flag,
  ChevronRight,
  CheckCircle2,
  Clock,
  Send,
  Upload,
  X,
  ImagePlus,
  ShieldCheck,
  AlertTriangle,
  User,
  MessageSquare,
  Package,
  Calendar,
  FileText,
  Eye,
  Trash2,
  ArrowLeft,
  Info,
} from "lucide-react";

const CATEGORIES = [
  { id: "disintermediasi", label: "Disintermediasi / Bypass Platform", desc: "Minta transaksi di luar Bantuin (WA, transfer langsung)" },
  { id: "penipuan", label: "Penipuan / Scam", desc: "Barang tidak dikirim, pembayaran tidak dikembalikan, identitas palsu" },
  { id: "pelecehan", label: "Pelecehan / Konten Tidak Pantas", desc: "Pesan kasar, ancaman, atau konten tidak senonoh" },
  { id: "barang_palsu", label: "Barang Palsu / Tidak Sesuai", desc: "Unit sewa berbeda jauh dengan foto di katalog" },
  { id: "pelanggaran_jadwal", label: "Pelanggaran Jadwal / No Show", desc: "Helper atau mitra tidak hadir sesuai waktu yang disepakati" },
  { id: "lainnya", label: "Lainnya", desc: "Masalah lain yang tidak tercakup di atas" },
];

function PhotoPreview({ file, onRemove, onPreview }) {
  const url = URL.createObjectURL(file);
  return (
    <div className="relative group rounded-xl overflow-hidden border border-[#DCEAF7] aspect-square bg-[#F5FAFF]">
      <img src={url} alt={file.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
        <button type="button" onClick={() => onPreview(url)}
          className="p-1.5 rounded-lg bg-white/90 text-[#102A43] hover:bg-white transition cursor-pointer">
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={onRemove}
          className="p-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function LaporPage() {
  const { submitReport, addToast, orderRooms = [] } = useApp();
  const fileInputRef = useRef(null);

  const [category, setCategory] = useState("");
  const [targetRoomId, setTargetRoomId] = useState("");
  const [involvedUser, setInvolvedUser] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");

  const activeOrders = orderRooms.filter(
    (r) => r.orderStatus !== "completed" && r.orderStatus !== "cancelled"
  );

  const handleFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => {
      if (!f.type.startsWith("image/")) {
        addToast("Format Tidak Didukung", `${f.name} bukan file gambar.`, "warning");
        return false;
      }
      if (f.size > 10 * 1024 * 1024) {
        addToast("File Terlalu Besar", `${f.name} melebihi 10MB.`, "warning");
        return false;
      }
      return true;
    });
    setPhotos((prev) => {
      const combined = [...prev, ...valid];
      if (combined.length > 5) {
        addToast("Maks. 5 Foto", "Maksimal 5 foto bukti per laporan.", "warning");
        return combined.slice(0, 5);
      }
      return combined;
    });
  }, [addToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      addToast("Pilih Kategori", "Silakan pilih kategori masalah.", "warning");
      return;
    }
    if (description.trim().length < 20) {
      addToast("Keterangan Kurang", "Jelaskan masalah minimal 20 karakter.", "warning");
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    const evidenceUrls = photos.map((f, i) => `evidence-${Date.now()}-${i}`);
    const report = submitReport({ targetRoomId: targetRoomId || null, targetUserId: involvedUser || null, category, description: description.trim(), evidenceUrls });
    setReportId(report?.id || `rep-${Date.now()}`);
    setIsSubmitting(false);
    setSubmitted(true);
  };

  // ── Sukses ──────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="bg-white rounded-2xl border border-[#DCEAF7] shadow-sm p-10 max-w-md w-full text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#102A43]">Laporan Terkirim</h2>
              <p className="text-sm text-[#61758A] mt-1.5 leading-relaxed">
                Tim Trust &amp; Safety akan meninjau dan merespons dalam <strong className="text-[#102A43]">1×24 jam</strong>.
              </p>
            </div>
            <div className="bg-[#F5FAFF] border border-[#DCEAF7] rounded-xl px-4 py-3 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#61758A]">ID Laporan</span>
                <span className="font-bold text-[#102A43] font-mono">{reportId}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#61758A]">Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px]">
                  <Clock className="w-3 h-3" />
                  Menunggu Review
                </span>
              </div>
              {photos.length > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#61758A]">Bukti</span>
                  <span className="font-bold text-[#102A43]">{photos.length} foto dilampirkan</span>
                </div>
              )}
            </div>
            <div className="flex gap-2.5">
              <Link href="/keamanan"
                className="flex-1 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition text-center">
                Pusat Keamanan
              </Link>
              <Link href="/"
                className="flex-1 py-2.5 rounded-xl bg-white border border-[#DCEAF7] hover:border-[#1683FF] text-[#61758A] hover:text-[#1683FF] text-xs font-bold transition text-center">
                Beranda
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#61758A] mb-6">
          <Link href="/keamanan" className="hover:text-[#1683FF] transition">Pusat Keamanan</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#102A43] font-semibold">Laporkan Masalah</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── KOLOM KIRI: Info + Kategori ─────────────────────────── */}
            <div className="lg:col-span-1 space-y-5">

              {/* Info header */}
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                    <Flag className="w-4.5 h-4.5 text-rose-500" />
                  </div>
                  <div>
                    <h1 className="font-bold text-sm text-[#102A43]">Laporkan Masalah</h1>
                    <p className="text-[11px] text-[#61758A]">Respons 1×24 jam</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-[#1683FF] bg-[#EAF4FF] border border-[#DCEAF7] rounded-lg px-3 py-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Identitas kamu anonim bagi pihak terlapor. Hanya diakses tim admin Bantuin.</span>
                </div>
              </div>

              {/* Kategori */}
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-5 shadow-sm">
                <label className="block text-xs font-bold text-[#102A43] mb-3">
                  Kategori Masalah <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {CATEGORIES.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition text-xs ${
                        category === cat.id
                          ? "border-[#1683FF] bg-[#EAF4FF]"
                          : "border-[#DCEAF7] hover:border-[#1683FF]/40 hover:bg-[#F5FAFF]"
                      }`}
                    >
                      <input type="radio" name="category" value={cat.id}
                        checked={category === cat.id}
                        onChange={() => setCategory(cat.id)}
                        className="mt-0.5 accent-[#1683FF] shrink-0"
                      />
                      <div>
                        <div className={`font-semibold ${category === cat.id ? "text-[#1683FF]" : "text-[#102A43]"}`}>
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-[#61758A] mt-0.5">{cat.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── KOLOM KANAN: Detail + Foto + Submit ──────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Konteks transaksi */}
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="text-xs font-bold text-[#102A43]">Konteks <span className="font-normal text-[#61758A]">(opsional)</span></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#61758A] mb-1.5">Pesanan Terkait</label>
                    <select value={targetRoomId} onChange={(e) => setTargetRoomId(e.target.value)}
                      className="w-full text-xs border border-[#DCEAF7] rounded-xl px-3 py-2.5 bg-white text-[#102A43] focus:outline-none focus:border-[#1683FF] transition cursor-pointer">
                      <option value="">-- Tidak terkait transaksi --</option>
                      {activeOrders.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.requestTitle || room.rentalDetails?.unitName || `Pesanan ${room.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#61758A] mb-1.5">Nama Pengguna Terlapor</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#61758A]" />
                      <input type="text" value={involvedUser} onChange={(e) => setInvolvedUser(e.target.value)}
                        placeholder="Nama / username..."
                        className="w-full text-xs border border-[#DCEAF7] rounded-xl pl-9 pr-3 py-2.5 bg-white text-[#102A43] placeholder:text-[#61758A] focus:outline-none focus:border-[#1683FF] transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#102A43]">
                    Keterangan Masalah <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-semibold ${description.length >= 20 ? "text-emerald-600" : "text-[#61758A]"}`}>
                    {description.length} karakter
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan masalah secara detail — tanggal, nama pengguna terlibat, dan kronologi kejadian..."
                  rows={6}
                  className="w-full text-xs border border-[#DCEAF7] rounded-xl px-4 py-3 bg-white text-[#102A43] placeholder:text-[#61758A] focus:outline-none focus:border-[#1683FF] transition resize-none leading-relaxed"
                />
                <p className="text-[11px] text-[#61758A] mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Minimal 20 karakter
                </p>
              </div>

              {/* Upload Foto */}
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-[#102A43]">
                    Bukti Foto <span className="font-normal text-[#61758A]">(opsional, maks. 5 foto)</span>
                  </label>
                  {photos.length > 0 && (
                    <span className="text-[11px] font-bold text-[#1683FF]">{photos.length}/5 foto</span>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
                  onClick={() => photos.length < 5 && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer ${
                    isDragging ? "border-[#1683FF] bg-[#EAF4FF]" :
                    photos.length >= 5 ? "border-[#DCEAF7] bg-[#F5FAFF] cursor-not-allowed opacity-60" :
                    "border-[#DCEAF7] hover:border-[#1683FF] hover:bg-[#F5FAFF]"
                  }`}
                >
                  <ImagePlus className={`w-6 h-6 mx-auto mb-1.5 ${isDragging ? "text-[#1683FF]" : "text-[#DCEAF7]"}`} />
                  <p className="text-xs font-semibold text-[#102A43]">
                    {photos.length >= 5 ? "Batas foto tercapai" : "Klik atau seret foto ke sini"}
                  </p>
                  <p className="text-[11px] text-[#61758A] mt-0.5">PNG, JPG, WEBP — maks. 10MB</p>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => handleFiles(e.target.files)} />

                {/* Preview grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {photos.map((file, i) => (
                      <PhotoPreview key={i} file={file}
                        onRemove={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                        onPreview={setPreviewUrl}
                      />
                    ))}
                    {photos.length < 5 && (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-[#DCEAF7] hover:border-[#1683FF] bg-[#F5FAFF] hover:bg-[#EAF4FF] flex items-center justify-center transition cursor-pointer">
                        <ImagePlus className="w-4 h-4 text-[#DCEAF7]" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Link href="/keamanan"
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#DCEAF7] hover:border-[#1683FF] text-[#61758A] hover:text-[#1683FF] text-sm font-bold transition">
                  <ArrowLeft className="w-4 h-4" />
                  Batal
                </Link>
                <button type="submit"
                  disabled={isSubmitting || !category || description.trim().length < 20}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-[#DCEAF7] disabled:text-[#61758A] text-white text-sm font-bold transition active:scale-[.98] cursor-pointer disabled:cursor-not-allowed shadow-sm">
                  {isSubmitting ? (
                    <><Clock className="w-4 h-4 animate-spin" /> Mengirim...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Laporan ke Tim Bantuin
                      {photos.length > 0 && (
                        <span className="bg-white/20 text-[11px] px-1.5 py-0.5 rounded-md font-bold">
                          {photos.length} foto
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </form>
      </main>

      <Footer />

      {/* Lightbox */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="Preview" className="w-full rounded-2xl shadow-2xl max-h-[80vh] object-contain" />
            <button onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-[#102A43] hover:bg-slate-100 flex items-center justify-center shadow-lg cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
