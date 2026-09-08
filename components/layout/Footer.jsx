"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { Smartphone, Store, ShieldCheck } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 4-Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Col 1: Bantuin */}
          <div>
            <h4 className="font-extrabold text-sm tracking-wider uppercase text-white mb-4">
              Bantuin
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/bantuan" className="hover:text-white transition">
                  Bantuan Harian
                </Link>
              </li>
              <li>
                <Link href="/sewa" className="hover:text-white transition">
                  Sewa Alat & Gear
                </Link>
              </li>
              <li>
                <Link href="/jasa" className="hover:text-white transition">
                  Katalog Jasa & Skill
                </Link>
              </li>
              <li>
                <Link href="/cara-kerja" className="hover:text-white transition">
                  Cara Kerja
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Pusat Bantuan */}
          <div>
            <h4 className="font-extrabold text-sm tracking-wider uppercase text-white mb-4">
              Pusat Bantuan
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ & Kendala
                </Link>
              </li>
              <li>
                <Link href="/keamanan" className="hover:text-white transition">
                  Keamanan & Escrow
                </Link>
              </li>
              <li>
                <Link href="/syarat-ketentuan" className="hover:text-white transition">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="hover:text-white transition">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="hover:text-white transition">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Portal Mitra (Merchant Hub) */}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              <Store className="w-4 h-4 text-emerald-400" />
              <h4 className="font-extrabold text-sm tracking-wider uppercase text-emerald-400">
                Portal Mitra
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link 
                  href="/mitra/login" 
                  className="font-bold text-white hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>→ Masuk Portal Mitra</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/mitra/register" 
                  className="font-semibold text-emerald-300 hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>+ Daftar Jadi Mitra Toko</span>
                </Link>
              </li>
              <li>
                <Link href="/mitra/dashboard" className="hover:text-white transition">
                  Dashboard Toko Mitra
                </Link>
              </li>
              <li>
                <Link href="/jasa/dashboard" className="hover:text-white transition">
                  Portal Penyedia Jasa
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Download Aplikasi */}
          <div>
            <h4 className="font-extrabold text-sm tracking-wider uppercase text-white mb-4">
              Download Aplikasi
            </h4>
            <div className="space-y-2.5">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3 text-slate-300">
                <Smartphone className="w-5 h-5 text-[#1683FF]" />
                <div>
                  <div className="font-bold text-xs text-white">Google Play</div>
                  <div className="text-[10px] text-slate-400">Coming Soon</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3 text-slate-300">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                <div>
                  <div className="font-bold text-xs text-white">App Store</div>
                  <div className="text-[10px] text-slate-400">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Logo & Copyright */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-white/95 px-2.5 py-1 rounded-lg">
              <Image
                src={logoImg}
                alt="Bantuin"
                height={24}
                className="h-5 w-auto object-contain"
              />
            </div>
          </Link>

          <div>
            © 2026 Bantuin. All rights reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}
