"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Edit3, 
  Trash2, 
  ChevronRight,
  Calendar,
  User,
  Tag,
  AlertTriangle
} from "lucide-react";

export default function DetailPortofolioPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const p = getProviderById("fajar-ramadhan-desain");
    if (p) setProvider(p);
  }, []);

  const photos = provider.portfolioPhotos || [];
  // id can match photo.id or photo index
  const photo = photos.find((p, idx) => p.id === id || String(idx) === String(id));

  const handleDelete = () => {
    setIsDeleting(true);
    const updatedPhotos = photos.filter((p, idx) => p.id !== id && String(idx) !== String(id));
    const updatedProvider = { ...provider, portfolioPhotos: updatedPhotos };
    saveProviderData(updatedProvider);
    setProvider(updatedProvider);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    addToast?.("Foto Dihapus", "Foto karya berhasil dihapus dari portofolio.");
    router.push("/jasa/dashboard");
  };

  if (!photo) {
    return (
      <RoleGuard allowedRoles={["provider"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Karya Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Foto portofolio yang Anda cari tidak tersedia atau telah dihapus.
          </p>
          <Link
            href="/jasa/dashboard"
            className="mt-5 px-5 py-2.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["provider"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header & Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Portofolio &amp; Foto
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold truncate max-w-xs">{photo.title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>Rincian Karya Portofolio</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/jasa/dashboard"
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </Link>

              <Link
                href={`/jasa/dashboard/portofolio/${id}/edit`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Karya</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
            
            {/* Image Box */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>

            {/* Meta & Info */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 bg-blue-50 text-[#1683FF] text-xs font-bold rounded-lg flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Kategori: {photo.category || "Branding"}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {photo.title}
              </h2>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block">Keterangan Karya:</span>
                <p className="whitespace-pre-line">{photo.description || "Dokumentasi hasil pengerjaan resmi untuk klien Bantuin."}</p>
              </div>

              {photo.clientName && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Klien / Penerima: <strong className="text-slate-800">{photo.clientName}</strong></span>
                </div>
              )}
            </div>

          </div>
        </main>

        {/* Modal Konfirmasi Hapus */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">Hapus Foto dari Portofolio?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus foto <span className="font-bold text-slate-800">&ldquo;{photo.title}&rdquo;</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
