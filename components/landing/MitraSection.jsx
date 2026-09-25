"use client";

import React from "react";
import Link from "next/link";
import { Store, ShieldCheck, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";

export default function MitraSection() {
  const { activeKabupaten } = useApp();

  const partners = [
    {
      id: "mitra-kamera",
      name: "Rental Kamera",
      desc: "Kamera mirrorless, lensa premium, gimbal stabilizer & lighting profesional.",
      count: `Rental Aktif di ${activeKabupaten}`,
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      href: "/mitra/mitra-kamera",
      tag: "Rental Kamera",
    },
    {
      id: "mitra-cetak",
      name: "Rental Printer Event",
      desc: "Sewa printer laserjet, scanner dokumen ADF & mesin laminating seminar.",
      count: `Rental Resmi ${activeKabupaten}`,
      image: "https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80",
      href: "/mitra/mitra-cetak",
      tag: "Rental Printer",
    },
    {
      id: "mitra-sound",
      name: "Rental Sound System",
      desc: "Speaker portable 15', sound akustik 2000W, mic wireless & mixer audio.",
      count: `Rental Sound ${activeKabupaten}`,
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
      href: "/mitra/mitra-sound",
      tag: "Rental Sound",
    },
    {
      id: "mitra-studio",
      name: "Rental Studio Foto",
      desc: "Sewa ruang studio foto per jam, paket lighting godox & kostum toga.",
      count: `Studio Resmi ${activeKabupaten}`,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      href: "/mitra/mitra-studio",
      tag: "Rental Studio",
    },
    {
      id: "mitra-event",
      name: "Rental Tenda & Event",
      desc: "Tenda sarnafil kerucut, panggung modular, kursi futura & kipas kabut.",
      count: `Vendor Tenda ${activeKabupaten}`,
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
      href: "/mitra/mitra-event",
      tag: "Rental Event",
    },
    {
      id: "mitra-laptop",
      name: "Rental Laptop & IT",
      desc: "Sewa laptop core i5/i7 ujian, proyektor 3600 lumens, layar & smart TV.",
      count: `Vendor IT ${activeKabupaten}`,
      image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80",
      href: "/mitra/mitra-laptop",
      tag: "Rental Laptop",
    },
  ];

  return (
    <section className="py-12 md:py-16 bg-white border-b border-slate-100">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>EKOSISTEM MITRA PENYEWAAN DI {activeKabupaten.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Mitra Penyewaan di <span className="text-[#1683FF]">{activeKabupaten}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Vendor persewaan barang terverifikasi di wilayah {activeKabupaten} yang siap kamu sewa dengan aman.
            </p>
          </div>

          <div>
            <Link
              href="/mitra/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 hover:bg-blue-100/70 px-4 py-2.5 rounded-xl transition"
            >
              <span>Daftar Mitra Rental</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 6 Squircle Cards in 1 Row on Desktop, Static without Moving Animation */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {partners.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex flex-col items-center text-center min-w-0 w-full overflow-hidden"
            >
              {/* Squircle Image Card matching reference */}
              <div className="w-full aspect-square rounded-[18px] sm:rounded-[26px] md:rounded-[30px] overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs group-hover:shadow-md group-hover:border-[#1683FF]/50 group-hover:-translate-y-1 transition-all duration-300 relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                
                {/* Verified icon pill */}
                <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5">
                  <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/90 text-emerald-600 backdrop-blur-md shadow-2xs border border-white/60">
                    <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </span>
                </div>

                {/* Subtle bottom hover gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2.5">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1">
                    Buka <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Title & Tag */}
              <div className="mt-1.5 sm:mt-2.5 w-full min-w-0 px-0.5">
                <h3 className="text-[11px] sm:text-sm font-bold text-slate-800 group-hover:text-[#1683FF] transition-colors truncate w-full">
                  {item.name}
                </h3>
                <p className="text-[9px] sm:text-[11px] text-slate-500 truncate mt-0.5 w-full">
                  {item.tag}
                </p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
