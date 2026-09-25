"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getMitraStoreById, saveMitraStoreData } from "@/lib/mock/mitraData";
import { formatIDR } from "@/lib/utils";
import { resolveCategoryIcon } from "@/lib/services/categoryService";
import { 
  ArrowLeft, 
  Package, 
  Edit3, 
  Trash2, 
  Rocket, 
  Star, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Tag
} from "lucide-react";

export default function DetailKatalogRentalPage() {
  const { id } = useParams();
  const router = useRouter();
  const { setRentals, addToast } = useApp() || {};

  const [store, setStore] = useState(() => {
    return getMitraStoreById("mitra-kamera") || {};
  });

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const s = getMitraStoreById("mitra-kamera");
    if (s) setStore(s);
  }, []);

  const catalog = store.catalog || [];
  const item = catalog.find((c) => c.id === id);

  const photos = (item?.photos && item.photos.length > 0)
    ? item.photos
    : [item?.image || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"];

  const handleDelete = () => {
    setIsDeleting(true);
    const updatedCatalog = catalog.filter((c) => c.id !== id);
    const updatedStore = { ...store, catalog: updatedCatalog };
    saveMitraStoreData(updatedStore);
    setStore(updatedStore);

    if (setRentals) {
      setRentals((prev) => prev.filter((r) => r.id !== id));
    }

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    addToast?.("Unit Dihapus", `Unit "${item?.name}" berhasil dihapus.`);
    router.push("/mitra/dashboard");
  };

  if (!item) {
    return (
      <RoleGuard allowedRoles={["partner"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Unit Sewa Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Unit rental dengan ID <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">{id}</code> tidak terdaftar di etalase toko Anda.
          </p>
          <Link
            href="/mitra/dashboard"
            className="mt-5 px-5 py-2.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard Mitra</span>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  const CategoryIconComp = resolveCategoryIcon(item.category);

  return (
    <RoleGuard allowedRoles={["partner"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header & Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/mitra/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard Mitra
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href="/mitra/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Katalog Unit Sewa
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold truncate max-w-xs">{item.name}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>Rincian Unit Rental</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/mitra/dashboard"
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </Link>

              <Link
                href={`/mitra/dashboard/katalog/${item.id}/edit`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Unit</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Multi-Photo Preview Gallery */}
              <div className="space-y-3">
                <div className="aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-2xs">
                  <img
                    src={photos[activePhotoIdx] || photos[0]}
                    alt={item.name}
                    className="w-full h-full object-cover transition duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                    <CategoryIconComp className="w-3 h-3 text-blue-300" />
                    <span>{item.category}</span>
                  </div>
                </div>

                {photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`aspect-4/3 rounded-xl overflow-hidden border transition cursor-pointer ${
                          activePhotoIdx === idx ? "border-[#1683FF] ring-2 ring-blue-100" : "border-slate-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={p} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Information & Specifications */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Status: {item.stockStatus || "Siap Sewa"} ({item.stockCount || 2} Unit)</span>
                  </span>

                  <span className="text-xs text-slate-400 font-mono">ID: {item.id}</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {item.name}
                </h2>

                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Tarif Sewa Harian:</span>
                    <span className="text-xl font-black text-[#1683FF]">{formatIDR(item.price)}</span>
                    <span className="text-[10px] text-slate-500 block">{item.unit || "/ hari"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Deposit Jaminan:</span>
                    <span className="text-lg font-black text-slate-900">{formatIDR(item.depositAmount || 200000)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">100% Refundable</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Kelengkapan Bawaan Unit
                  </h3>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 font-medium">
                    {item.includedItems || "Unit Lengkap, Baterai, Charger & Tas Pelindung"}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    Kondisi &amp; Deskripsi
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 whitespace-pre-line">
                    {item.desc || "Unit siap pakai dalam kondisi terawat."}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href={`/mitra/dashboard/promosi/buat?rentalId=${item.id}`}
                    className="flex-1 py-3 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Promosikan Unit Sewa Ini</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-3 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus</span>
                  </button>
                </div>

              </div>

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
                <h3 className="text-base font-extrabold text-slate-900">Hapus Unit Rental?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus unit <span className="font-bold text-slate-800">&ldquo;{item.name}&rdquo;</span>?
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
