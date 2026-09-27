import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import ExploreCategories from "@/components/landing/ExploreCategories";
import SedangDibutuhkan from "@/components/landing/SedangDibutuhkan";
import PromotedSection from "@/components/landing/PromotedSection";
import ExploreServicesSection from "@/components/landing/ExploreServicesSection";
import UserReviewsSection from "@/components/landing/UserReviewsSection";
import PartnerLogosSection from "@/components/landing/PartnerLogosSection";
import CtaBanner from "@/components/landing/CtaBanner";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 1. Hero / Pencarian */}
        <HeroSection />
        <ExploreCategories />

        {/* 2. Bantuan — Fitur Utama #1 Bantuin (Paling Dominan Setelah Hero) */}
        <SedangDibutuhkan />

        {/* 3. Pilihan yang Dipromosikan — Satu-Satunya Etalase Promosi Berbayar Aktif (Auto-Hide Jika Kosong) */}
        <PromotedSection />

        {/* 4. Jelajahi Layanan — Pintu Masuk ke Katalog Organik (Jasa & Sewa) */}
        <ExploreServicesSection />

        {/* 5. Ulasan dari Pengguna — Social Proof & Testimoni Komunitas */}
        <UserReviewsSection />

        {/* 6. Mitra Bekerja Sama — Logo Toko Rental, Kanal Pembayaran & Kampus */}
        <PartnerLogosSection />

        {/* 7. Section Relevan Penutup — CTA Banner */}
        <CtaBanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
