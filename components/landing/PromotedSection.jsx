"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { LANDING_SLOT_LIMITS, promotionService } from "@/lib/services/promotionService";
import PromotedCard from "@/components/promotion/PromotedCard";
import { getAllCatalogServices } from "@/lib/mock/providersData";
import { getAllMitraStores } from "@/lib/mock/mitraData";
import { MapPin, Award } from "lucide-react";

export default function PromotedSection() {
  const { activeKabupaten, filterByKabupaten, rentals = [] } = useApp();
  const [promotions, setPromotions] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'service' | 'rental'

  useEffect(() => {
    const loadPromotions = (trackImpressions = false) => {
      const active = promotionService
        .getActivePromotionsSync({
          placement: "landing",
          userLocation: filterByKabupaten ? activeKabupaten : undefined,
        })
        .filter((p) => p.targetType === "service" || p.targetType === "rental");
      setPromotions(active);

      // Catat impresi sekali saat section pertama dimuat. Jangan lakukan saat
      // event pembaruan diterima, karena pencatatan sendiri memancarkan event
      // yang sama dan sebelumnya dapat membuat browser berulang tanpa henti.
      if (trackImpressions) {
        active.forEach((p) => {
          promotionService.recordImpression(p.id);
        });
      }
    };

    loadPromotions(true);

    const handleSync = () => loadPromotions(false);
    window.addEventListener("bantuin_promotions_updated", handleSync);
    window.addEventListener("bantuin_promotion_packages_updated", handleSync);
    return () => {
      window.removeEventListener("bantuin_promotions_updated", handleSync);
      window.removeEventListener("bantuin_promotion_packages_updated", handleSync);
    };
  }, [activeKabupaten, filterByKabupaten]);

  // Beranda memiliki total delapan slot: maksimal empat Jasa dan empat Sewa.
  // Promosi setelah urutan keempat per jenis tetap aktif di katalog terkait.
  const landingGroups = useMemo(() => {
    const createGroup = (id, label) => {
      const allItems = promotions.filter((promo) => promo.targetType === id);
      const limit = LANDING_SLOT_LIMITS[id];
      return {
        id,
        label,
        limit,
        items: allItems.slice(0, limit),
        queuedCount: Math.max(0, allItems.length - limit),
      };
    };

    return [
      createGroup("service", "Jasa Unggulan"),
      createGroup("rental", "Sewa Unggulan"),
    ];
  }, [promotions]);

  const visibleGroups = useMemo(
    () => landingGroups.filter((group) => activeTab === "all" || group.id === activeTab),
    [landingGroups, activeTab]
  );

  // Slot tetap dibatasi per jenis, tetapi Beranda menampilkannya dalam satu
  // etalase yang rapi. Dengan begitu tidak ada kolom kategori kosong ketika
  // jumlah promosi Jasa dan Sewa belum penuh.
  const visiblePromotions = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups]
  );

  // Promosi tersimpan dapat mengarah ke item yang sudah dihapus atau ID lama.
  // Validasi target sebelum membuat tautan agar klik kartu tidak membuka rute detail
  // dengan data yang tidak dapat di-resolve.
  const promotionHrefs = useMemo(() => {
    const services = getAllCatalogServices();
    const stores = getAllMitraStores();
    const rentalItems = [
      ...rentals,
      ...stores.flatMap((store) =>
        (store.catalog || []).map((item) => ({ ...item, storeId: store.id }))
      ),
    ];

    return new Map(promotions.map((promo) => {
      const targetIds = String(promo.targetId || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const type = promo.targetType;

      if (type === "service") {
        const service = services.find((item) => targetIds.includes(String(item.id))) ||
          services.find((item) => item.title === promo.targetTitle);
        const href = service
          ? `/jasa/${encodeURIComponent(service.id)}`
          : `/jasa?search=${encodeURIComponent(promo.targetTitle || "")}`;
        return [promo.id, href];
      }

      const rental = rentalItems.find((item) => targetIds.includes(String(item.id))) ||
        rentalItems.find((item) => (item.title || item.name) === promo.targetTitle) ||
        rentalItems.find((item) => item.storeId === promo.ownerId);
      const href = rental
        ? `/sewa/${encodeURIComponent(rental.id)}`
        : `/sewa?search=${encodeURIComponent(promo.targetTitle || "")}`;
      return [promo.id, href];
    }));
  }, [promotions, rentals]);

  // JIKA TIDAK ADA PROMOSI AKTIF, HILANGKAN SECTION SEPENUHNYA
  if (!promotions || promotions.length === 0) {
    return null;
  }

  const handleCardClick = (promoId) => {
    promotionService.recordClick(promoId);
  };

  return (
    <section className="py-10 sm:py-14 bg-gradient-to-b from-[#EEF5FF] via-[#F6FAFF] to-white border-y border-blue-100/70 relative overflow-hidden">
      {/* Decorative ambient spotlight circles */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header: Premium Spotlight Design */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Pilihan Direkomendasikan</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Total maksimal 8 rekomendasi tampil di Beranda: 4 layanan Jasa dan 4 unit Sewa. Promosi lainnya tetap diprioritaskan di katalog masing-masing.
            </p>
          </div>

          {/* Filter Tabs (Semua / Jasa / Sewa) with dynamic active counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs self-start md:self-auto">
            {[
              { id: "all", label: "Semua", count: landingGroups.reduce((total, group) => total + group.items.length, 0) },
              { id: "service", label: "Jasa", count: `${landingGroups[0].items.length}/${landingGroups[0].limit}` },
              { id: "rental", label: "Sewa", count: `${landingGroups[1].items.length}/${landingGroups[1].limit}` },
            ]
              .map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer text-xs flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "bg-[#1683FF] text-white shadow-sm shadow-blue-500/25"
                      : "bg-white/90 text-slate-700 hover:text-slate-900 hover:bg-white border border-slate-200/90 shadow-2xs"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-[11px] font-bold text-slate-600">{visiblePromotions.length} promosi sedang tampil</span>
          {landingGroups.some((group) => group.queuedCount > 0) && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500">
              {landingGroups.reduce((total, group) => total + group.queuedCount, 0)} promosi dalam antrean Beranda
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {visiblePromotions.map((promo) => (
            <PromotedCard
              key={promo.id}
              item={promo}
              href={promotionHrefs.get(promo.id)}
              onCardClick={() => handleCardClick(promo.id)}
              variant={promo.targetType === "service" ? "jasa" : "rental"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
