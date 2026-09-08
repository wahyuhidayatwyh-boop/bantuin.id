"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Zap, Camera, Palette, Store, Package } from "lucide-react";

export default function FeaturedServices() {
  const scrollRef = useRef(null);

  const services = [
    {
      id: "bantuan-kilat",
      tag: "Layanan Kilat",
      title: "Titip Antar & Ambil Dokumen",
      description: "Ambil titipan berkas di rektorat, antar paket darurat, hingga print laporan mendadak.",
      image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=800&q=80",
      href: "/bantuan",
      btnText: "Lihat Permintaan",
      icon: Zap,
    },
    {
      id: "sewa-kamera",
      tag: "Rental Harian",
      title: "Sewa Kamera & Alat Event",
      description: "Sony Alpha, lensa G-Master, mic podcast, proyektor, dan sound system siap pakai.",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      href: "/sewa",
      btnText: "Katalog Sewa",
      icon: Camera,
    },
    {
      id: "jasa-kreatif",
      tag: "Skill & Desain",
      title: "Jasa Foto Wisuda & Desain",
      description: "Fotografer wisuda kampus, desain feed/logo, website portofolio, dan edit video kilat.",
      image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80",
      href: "/jasa",
      btnText: "Pesan Jasa",
      icon: Palette,
    },
    {
      id: "mitra-umkm",
      tag: "Mitra Resmi",
      title: "Servis AC & Bantuan Rumah",
      description: "Tukang servis AC terdekat, reparasi gadget/laptop, percetakan, dan vendor lokal.",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
      href: "/mitra/dashboard",
      btnText: "Lihat Mitra",
      icon: Store,
    },
    {
      id: "bantuan-tugas",
      tag: "Akademik & Riset",
      title: "Olah Data & Proofreading",
      description: "Bantuan olah data SPSS/Python, translate jurnal, dan bimbingan tugas kampus.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
      href: "/bantuan?q=Tugas",
      btnText: "Cari Bantuan",
      icon: Package,
    },
  ];

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white border-b border-slate-100">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header matching reference */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#1683FF] mb-2">
              <span className="w-2 h-2 rounded-full bg-[#1683FF]" />
              <span>LAYANAN UTAMA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.08]">
              Semua kebutuhanmu, <br className="hidden sm:inline" />
              <span className="font-serif italic font-normal text-[#1683FF]">tersedia di sekitarmu.</span>
            </h2>
          </div>

          {/* Right subtitle & arrow controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs leading-relaxed">
              Dari bantuan kilat, sewa alat, hingga jasa profesional — terlindungi sistem escrow resmi.
            </p>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => scroll("left")}
                aria-label="Previous"
                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-[#1683FF] hover:text-white hover:border-[#1683FF] transition shadow-2xs"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                aria-label="Next"
                className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-[#1683FF] hover:text-white hover:border-[#1683FF] transition shadow-2xs"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tall Photographic Cards Row matching reference */}
        <div
          ref={scrollRef}
          className="horizontal-scroll-container flex items-stretch gap-5 sm:gap-6 pb-6 pt-2 overflow-x-auto"
        >
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="relative w-[270px] sm:w-[290px] md:w-[310px] h-[430px] sm:h-[460px] rounded-[28px] overflow-hidden shrink-0 shadow-[0_12px_36px_rgba(16,42,67,0.08)] group hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between p-6 text-white"
              >
                {/* Full-bleed Photo */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Dark Blue/Navy Vignette Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B192C] via-[#0B192C]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                {/* Top Card Bar: Badge & Frosted Circle Icon */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-xs">
                    {item.tag}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom Card Content: Title, Description & Circular Arrow Pill */}
                <div className="relative z-10 flex flex-col items-start pt-6">
                  <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-sky-300 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-5 font-normal">
                    {item.description}
                  </p>

                  {/* Circular Arrow Pill Button */}
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-[#102A43] font-bold text-xs shadow-md transition group-hover:bg-[#1683FF] group-hover:text-white"
                  >
                    <span>{item.btnText}</span>
                    <div className="w-5 h-5 rounded-full bg-[#102A43] text-white flex items-center justify-center group-hover:bg-white group-hover:text-[#1683FF] transition">
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </Link>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
