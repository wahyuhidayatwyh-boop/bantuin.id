"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Store, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function MitraSection() {
  const scrollRef = useRef(null);

  const partners = [
    {
      id: "mitra-kamera",
      name: "Rental Kamera",
      desc: "Kamera mirrorless, lensa premium, gimbal stabilizer & lighting profesional.",
      count: "12 Vendor Terdaftar",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      href: "/sewa",
      tag: "Top Rental",
    },
    {
      id: "mitra-cetak",
      name: "Percetakan",
      desc: "Print skripsi kilat 24 jam, jilid hard cover, cetak banner & poster event.",
      count: "8 Mitra Resmi",
      image: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80",
      href: "/bantuan?q=Print",
      tag: "Layanan Kilat",
    },
    {
      id: "mitra-sound",
      name: "Rental Sound",
      desc: "Sound system portable, wireless microphone, mixer audio, & speaker aktif.",
      count: "6 Vendor Sound",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
      href: "/sewa",
      tag: "Alat Event",
    },
    {
      id: "mitra-studio",
      name: "Studio Foto",
      desc: "Studio foto wisuda, pas foto visa/ijazah, portrait keluarga & photoshoot.",
      count: "5 Studio Terverifikasi",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      href: "/jasa",
      tag: "Studio Wisuda",
    },
    {
      id: "mitra-event",
      name: "Vendor Event",
      desc: "Panggung modular, tenda sarnafil, kursi lipat, backdrop & dekorasi acara.",
      count: "9 Vendor Event",
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
      href: "/sewa",
      tag: "Perlengkapan",
    },
    {
      id: "mitra-laptop",
      name: "Service Laptop",
      desc: "Reparasi hardware, install ulang OS, upgrade SSD/RAM & servis keyboard.",
      count: "7 Teknisi Valid",
      image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      href: "/jasa",
      tag: "Teknisi Cepat",
    },
  ];

  const marqueeItems = [...partners, ...partners];

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-14 md:py-20 bg-white border-b border-slate-100 overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>EKOSISTEM BISNIS LOKAL</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Mitra Terpercaya
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Vendor, studio, dan bisnis lokal terverifikasi di sekitarmu yang siap kamu andalkan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 transition shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link
              href="/mitra/dashboard"
              className="ml-2 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 px-4 py-2.5 rounded-xl transition"
            >
              <span>Daftar Jadi Mitra</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Full-width Smooth Running Carousel (Right to Left) */}
      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto horizontal-scroll-container py-2"
      >
        <div className="animate-marquee flex gap-5 px-4 sm:px-6">
          {marqueeItems.map((item, idx) => (
            <Link
              key={`${item.id}-${idx}`}
              href={item.href}
              className="group relative w-[280px] sm:w-[320px] md:w-[350px] h-[380px] sm:h-[420px] rounded-[28px] overflow-hidden shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/40 transition-transform duration-300 hover:scale-[1.02] flex flex-col justify-between p-6"
            >
              {/* Background Photographic Image */}
              <img
                src={item.image}
                alt={item.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />

              {/* Dark Gradient Overlay inside the photo */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/25 group-hover:via-black/50 transition-colors" />

              {/* Top Tags inside photo */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md shadow-xs border border-emerald-400/50">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mitra Terverifikasi</span>
                </span>

                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20">
                  {item.tag}
                </span>
              </div>

              {/* Bottom Content inside photo */}
              <div className="relative z-10 text-left">
                <div className="text-[11px] text-sky-300 font-semibold mb-1">
                  {item.count}
                </div>
                
                {/* Title inside photo */}
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight mb-2">
                  {item.name}
                </h3>

                {/* Description inside photo */}
                <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed line-clamp-2 mb-4 font-normal">
                  {item.desc}
                </p>

                {/* Bottom Action inside photo */}
                <div className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/15 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/25 transition">
                  <span>Lihat Katalog Mitra</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

            </Link>
          ))}
        </div>
      </div>

    </section>
  );
}
