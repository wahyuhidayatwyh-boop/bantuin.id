"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { Smartphone, Store, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-[#EBF3FE] text-slate-800 border-t border-[#D0E2FA] pt-16 pb-12 overflow-hidden">
      
      {/* 1. Subtle Dot Grid Matrix Motif Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(#1683FF 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 2. Ambient Soft Glow Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-300/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* 3. Decorative Corner Motif (Concentric Contour Rings & Wave Accents) */}
      <svg
        className="absolute -right-12 -bottom-10 w-[420px] h-[320px] pointer-events-none opacity-30 text-[#1683FF]"
        viewBox="0 0 420 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 240C120 180 240 300 420 210V320H0V240Z"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path
          d="M30 190C150 150 270 260 420 170"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          strokeOpacity="0.5"
        />
        <circle cx="350" cy="110" r="50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.4" />
        <circle cx="350" cy="110" r="90" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25" />
        <circle cx="350" cy="110" r="130" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" strokeOpacity="0.2" />
        <circle cx="350" cy="110" r="170" stroke="currentColor" strokeWidth="1" strokeOpacity="0.12" />
      </svg>

      <svg
        className="absolute -left-12 -top-12 w-[340px] h-[280px] pointer-events-none opacity-25 text-[#1683FF]"
        viewBox="0 0 340 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="80" cy="80" r="50" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.35" />
        <circle cx="80" cy="80" r="95" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" strokeOpacity="0.25" />
        <circle cx="80" cy="80" r="140" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.15" />
        <circle cx="80" cy="80" r="185" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.1" />
      </svg>

      <div className="relative z-10 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Col 1: Bantuin */}
          <div>
            <h4 className="font-extrabold text-sm tracking-wider uppercase text-slate-900 mb-4">
              Bantuin
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link href="/about" className="hover:text-[#1683FF] transition font-medium">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/bantuan" className="hover:text-[#1683FF] transition font-medium">
                  Bantuan Harian
                </Link>
              </li>
              <li>
                <Link href="/sewa" className="hover:text-[#1683FF] transition font-medium">
                  Sewa Alat & Gear
                </Link>
              </li>
              <li>
                <Link href="/jasa" className="hover:text-[#1683FF] transition font-medium">
                  Katalog Jasa & Skill
                </Link>
              </li>
              <li>
                <Link href="/cara-kerja" className="hover:text-[#1683FF] transition font-medium">
                  Cara Kerja
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Pusat Bantuan */}
          <div>
            <h4 className="font-extrabold text-sm tracking-wider uppercase text-slate-900 mb-4">
              Pusat Bantuan
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link href="/faq" className="hover:text-[#1683FF] transition font-medium">
                  FAQ & Kendala
                </Link>
              </li>
              <li>
                <Link href="/keamanan" className="hover:text-[#1683FF] transition font-medium">
                  Keamanan &amp; Transaksi
                </Link>
              </li>
              <li>
                <Link href="/syarat-ketentuan" className="hover:text-[#1683FF] transition font-medium">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="hover:text-[#1683FF] transition font-medium">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="hover:text-[#1683FF] transition font-medium">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal Mitra (Merchant Hub) */}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <Store className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-sm tracking-wider uppercase text-emerald-700">
                Portal Mitra
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link 
                  href="/mitra/login" 
                  className="font-bold text-slate-900 hover:text-emerald-600 transition flex items-center gap-1"
                >
                  <span>→ Masuk Portal Mitra</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/mitra/register" 
                  className="font-semibold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1"
                >
                  <span>+ Daftar Jadi Mitra Toko</span>
                </Link>
              </li>
              <li>
                <Link href="/mitra/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard Toko Mitra
                </Link>
              </li>
              <li>
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Portal Penyedia Jasa
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Download Aplikasi */}
          <div>
            <h4 className="font-extrabold text-sm tracking-wider uppercase text-slate-900 mb-4">
              Download Aplikasi
            </h4>
            <div className="space-y-2.5">
              <div className="bg-white/85 backdrop-blur-xs border border-blue-200/70 rounded-2xl p-3 flex items-center gap-3 text-slate-700 shadow-2xs hover:shadow-xs hover:border-blue-300 transition">
                <Smartphone className="w-5 h-5 text-[#1683FF]" />
                <div>
                  <div className="font-bold text-xs text-slate-900">Google Play</div>
                  <div className="text-[10px] text-slate-500 font-medium">Coming Soon</div>
                </div>
              </div>

              <div className="bg-white/85 backdrop-blur-xs border border-blue-200/70 rounded-2xl p-3 flex items-center gap-3 text-slate-700 shadow-2xs hover:shadow-xs hover:border-blue-300 transition">
                <Smartphone className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="font-bold text-xs text-slate-900">App Store</div>
                  <div className="text-[10px] text-slate-500 font-medium">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Logo & Copyright */}
        <div className="pt-8 border-t border-[#D0E2FA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-200/60 shadow-2xs">
              <Image
                src={logoImg}
                alt="Bantuin"
                height={26}
                className="h-6 w-auto object-contain mix-blend-multiply"
              />
            </div>
          </Link>

          <div className="font-medium text-slate-500">
            © 2026 Bantuin. Hak Cipta Dilindungi.
          </div>
        </div>

      </div>
    </footer>
  );
}
