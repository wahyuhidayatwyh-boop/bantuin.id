import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProcessTimeline from "@/components/landing/ProcessTimeline";

export default function CaraKerjaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        <div className="pt-12 pb-6 text-center max-w-xl mx-auto px-4">
          <span className="text-xs font-bold text-[#1683FF] uppercase tracking-wider block mb-2">
            Panduan Lengkap
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#102A43]">
            Cara Kerja Bantuin
          </h1>
        </div>

        <ProcessTimeline />
      </main>

      <Footer />
    </div>
  );
}
