"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  MapPin, 
  CheckCircle2, 
  CreditCard, 
  Users,
  Zap,
  Clock
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";

export default function HeroSection() {
  const router = useRouter();
  const { activeKabupaten } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const quickTags = [
    { label: "Ambil Dokumen", query: "Ambil Dokumen", tab: "bantuan" },
    { label: "Desain Poster", query: "Desain Poster", tab: "jasa" },
    { label: "Sewa Kamera", query: "Sewa Kamera", tab: "sewa" },
    { label: "Print Tugas", query: "Print Tugas", tab: "bantuan" },
  ];

  const trustBadges = [
    {
      icon: ShieldCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      title: "Aman & Terpercaya",
      desc: "User terverifikasi identitas",
    },
    {
      icon: MapPin,
      color: "text-[#1683FF]",
      bg: "bg-blue-50",
      border: "border-blue-100",
      title: `Dekat di ${activeKabupaten}`,
      desc: `Bantuan & sewa sekitarmu`,
    },
    {
      icon: CheckCircle2,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      title: "Mudah & Praktis",
      desc: "Semua dalam satu platform",
    },
    {
      icon: CreditCard,
      color: "text-purple-500",
      bg: "bg-purple-50",
      border: "border-purple-100",
      title: "Bayar Aman",
      desc: "Sistem pembayaran transparan",
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      router.push("/bantuan");
      return;
    }
    router.push(`/bantuan?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleTagClick = (tag) => {
    if (tag.tab === "sewa") {
      router.push(`/sewa?q=${encodeURIComponent(tag.query)}`);
    } else if (tag.tab === "jasa") {
      router.push(`/jasa?q=${encodeURIComponent(tag.query)}`);
    } else {
      router.push(`/bantuan?q=${encodeURIComponent(tag.query)}`);
    }
  };

  return (
    <section className="relative w-full px-2 sm:px-3.5 md:px-5 lg:px-6 pt-2 pb-10">
      
      {/* Mepet Large Rounded Hero Canvas with Soft Ice-Blue Base */}
      <div className="relative w-full max-w-[1560px] mx-auto rounded-[28px] sm:rounded-[36px] md:rounded-[44px] overflow-hidden min-h-[540px] md:min-h-[600px] bg-gradient-to-r from-[#DEEEFC] via-[#E8F3FD] to-[#F1F7FD] border border-slate-200/80 shadow-[0_16px_45px_rgba(22,131,255,0.07)] flex flex-col justify-between p-6 sm:p-10 md:p-14">
        
        {/* Full-width Photo with Ultra-Smooth Alpha Mask (Zero Hard Edges) */}
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, transparent 28%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 65%, black 90%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 28%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.6) 65%, black 90%)"
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2000&q=85"
            alt="Komunitas Saling Bantu"
            className="w-full h-full object-cover object-[72%_center]"
          />
        </div>

        {/* Soft Ambient Radial Lights for Seamless Depth */}
        <div className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-white/90 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-[#DEEEFC]/80 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content Area */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
          
          {/* Left Text & Search */}
          <div className="lg:col-span-7 flex flex-col items-start text-left max-w-2xl">
            
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white text-xs font-bold text-[#1683FF] mb-5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>BANTUAN, JASA & SEWA DI {activeKabupaten.toUpperCase()}</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-[60px] font-black tracking-tight text-slate-900 leading-[1.05] mb-4">
              Butuh sesuatu? <br />
              <span className="text-[#1683FF]">Bantuin aja.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 font-medium leading-relaxed mb-7 max-w-xl">
              Temukan orang yang bisa membantu, jasa terpercaya, atau barang yang bisa kamu sewa di sekitar <strong className="text-slate-800">{activeKabupaten}</strong> dengan aman & cepat.
            </p>

            {/* Floating Search Bar */}
            <form
              onSubmit={handleSearch}
              className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-full p-2 sm:p-2.5 shadow-[0_12px_36px_rgba(22,131,255,0.12)] border border-white flex flex-col sm:flex-row items-center gap-2"
            >
              <div className="flex items-center gap-2.5 w-full pl-3 text-slate-400">
                <Search className="w-5 h-5 text-[#1683FF] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kamu lagi butuh apa?"
                  className="flex-1 bg-transparent text-xs sm:text-sm md:text-base text-slate-900 placeholder-slate-400 focus:outline-none py-1"
                />
              </div>
              
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-full bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              >
                <span>Cari</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Tags matching exact list */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-xs text-slate-500 font-semibold">Contoh:</span>
              {quickTags.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className="text-xs px-3.5 py-1 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#1683FF] border border-slate-200/70 shadow-2xs transition font-semibold"
                >
                  {tag.label}
                </button>
              ))}
            </div>

          </div>

          {/* Right Floating Social Proof Glass Card */}
          <div className="lg:col-span-5 hidden lg:flex justify-end">
            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] max-w-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">2.4K+ Tenaga Bantuan</div>
                  <div className="text-[11px] text-slate-500">Siap bantu di sekitarmu</div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100/60 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>Respon Cepat</span>
                  </span>
                  <span className="text-[#1683FF]">&lt; 15 Menit</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Rekening Bersama</span>
                  </span>
                  <span className="text-emerald-600 font-semibold">100% Aman</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4 Trust Badges Strip */}
      <div className="max-w-[1560px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6">
        {trustBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.title}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex items-center gap-3.5 hover:shadow-[0_8px_24px_rgba(22,131,255,0.06)] hover:-translate-y-0.5 transition"
            >
              <div className={`w-11 h-11 rounded-xl ${badge.bg} ${badge.border} border flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${badge.color}`} />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                  {badge.title}
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                  {badge.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
}
