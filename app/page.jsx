import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import ExploreCategories from "@/components/landing/ExploreCategories";
import SedangDibutuhkan from "@/components/landing/SedangDibutuhkan";
import SewaSection from "@/components/landing/SewaSection";
import JasaSection from "@/components/landing/JasaSection";
import HelperSection from "@/components/landing/HelperSection";
import MitraSection from "@/components/landing/MitraSection";
import ProcessTimeline from "@/components/landing/ProcessTimeline";
import CtaBanner from "@/components/landing/CtaBanner";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section with Search & 4 Trust Badges */}
        <HeroSection />

        {/* 3. 3D Glass / Neumorphic Categories matching reference */}
        <ExploreCategories />

        {/* 4. Sedang Dibutuhkan di Sekitarmu */}
        <SedangDibutuhkan />


        {/* 5. Cari / Sewa Barang */}
        <SewaSection />

        {/* 6. Jasa di Sekitarmu */}
        <JasaSection />

        {/* 7. Orang yang Siap Membantu */}
        <HelperSection />

        {/* 8. Mitra Terpercaya */}
        <MitraSection />

        {/* 8. Sesimpel itu. (Cara Kerja) */}
        <ProcessTimeline />

        {/* 9. CTA Banner Penutup */}
        <CtaBanner />
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
}
