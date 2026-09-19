"use client";

import React from "react";
import { QrisLogo, BantuinPayLogo } from "./PaymentBankLogos";
import { Copy, CheckCircle2, Smartphone, ShieldCheck } from "lucide-react";

export default function QrisCodeCard({ 
  totalAmount, 
  formatIDR, 
  handleCopy, 
  isCopiedNominal 
}) {
  return (
    <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl sm:rounded-3xl border border-slate-200/80 flex flex-col md:flex-row items-center gap-6 sm:gap-7">
      {/* Enlarged QR Code Container Card */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center shrink-0 w-full max-w-[280px] sm:max-w-[300px]">
        {/* Top Header of QR Card */}
        <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <QrisLogo className="h-6 w-auto object-contain" />
          <span className="text-[10px] font-black text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 tracking-wider">
            GPN
          </span>
        </div>

        {/* Large Vector QR Code */}
        <div className="relative w-56 h-56 sm:w-60 sm:h-60 bg-white p-2 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full text-slate-900 select-none"
            fill="currentColor"
          >
            {/* --- FINDER PATTERNS --- */}
            {/* Top-Left */}
            <rect x="6" y="6" width="56" height="56" rx="8" />
            <rect x="16" y="16" width="36" height="36" rx="4" fill="white" />
            <rect x="24" y="24" width="20" height="20" rx="2" />

            {/* Top-Right */}
            <rect x="138" y="6" width="56" height="56" rx="8" />
            <rect x="148" y="16" width="36" height="36" rx="4" fill="white" />
            <rect x="156" y="24" width="20" height="20" rx="2" />

            {/* Bottom-Left */}
            <rect x="6" y="138" width="56" height="56" rx="8" />
            <rect x="16" y="148" width="36" height="36" rx="4" fill="white" />
            <rect x="24" y="156" width="20" height="20" rx="2" />

            {/* Alignment Pattern (Bottom-Right) */}
            <rect x="142" y="142" width="30" height="30" rx="4" />
            <rect x="148" y="148" width="18" height="18" rx="2" fill="white" />
            <rect x="153" y="153" width="8" height="8" rx="1" />

            {/* --- TIMING PATTERNS --- */}
            <rect x="70" y="24" width="8" height="8" rx="1.5" />
            <rect x="86" y="24" width="8" height="8" rx="1.5" />
            <rect x="102" y="24" width="8" height="8" rx="1.5" />
            <rect x="118" y="24" width="8" height="8" rx="1.5" />

            <rect x="24" y="70" width="8" height="8" rx="1.5" />
            <rect x="24" y="86" width="8" height="8" rx="1.5" />
            <rect x="24" y="102" width="8" height="8" rx="1.5" />
            <rect x="24" y="118" width="8" height="8" rx="1.5" />

            {/* --- REALISTIC DENSE QR DATA MATRIX --- */}
            {/* Top region modules */}
            <rect x="70" y="6" width="8" height="8" rx="1" />
            <rect x="86" y="6" width="8" height="14" rx="1" />
            <rect x="110" y="6" width="8" height="8" rx="1" />
            <rect x="126" y="14" width="6" height="14" rx="1" />
            <rect x="78" y="14" width="8" height="8" rx="1" />
            <rect x="94" y="14" width="8" height="8" rx="1" />
            <rect x="118" y="14" width="8" height="8" rx="1" />

            {/* Left region modules */}
            <rect x="6" y="70" width="8" height="8" rx="1" />
            <rect x="14" y="78" width="8" height="14" rx="1" />
            <rect x="6" y="94" width="14" height="8" rx="1" />
            <rect x="14" y="110" width="8" height="8" rx="1" />
            <rect x="6" y="126" width="14" height="8" rx="1" />
            <rect x="38" y="70" width="8" height="14" rx="1" />
            <rect x="52" y="78" width="8" height="8" rx="1" />
            <rect x="46" y="94" width="14" height="8" rx="1" />
            <rect x="38" y="110" width="8" height="14" rx="1" />
            <rect x="52" y="126" width="8" height="8" rx="1" />

            {/* Middle region modules */}
            <rect x="70" y="46" width="14" height="8" rx="1" />
            <rect x="94" y="46" width="8" height="8" rx="1" />
            <rect x="110" y="46" width="14" height="8" rx="1" />
            <rect x="134" y="46" width="8" height="8" rx="1" />
            <rect x="46" y="62" width="8" height="8" rx="1" />
            <rect x="62" y="62" width="14" height="8" rx="1" />
            <rect x="86" y="62" width="8" height="8" rx="1" />
            <rect x="102" y="62" width="8" height="8" rx="1" />
            <rect x="118" y="62" width="14" height="8" rx="1" />

            {/* Center Area Cutout Placeholder for Logo */}
            <rect x="68" y="68" width="64" height="64" rx="8" fill="white" />
            <rect x="70" y="70" width="60" height="60" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="2" />

            {/* Bottom-left to bottom-right modules */}
            <rect x="70" y="142" width="14" height="8" rx="1" />
            <rect x="94" y="142" width="8" height="8" rx="1" />
            <rect x="110" y="142" width="14" height="8" rx="1" />
            <rect x="126" y="142" width="8" height="8" rx="1" />
            <rect x="78" y="158" width="8" height="14" rx="1" />
            <rect x="94" y="158" width="8" height="8" rx="1" />
            <rect x="110" y="158" width="8" height="14" rx="1" />
            <rect x="126" y="158" width="8" height="8" rx="1" />

            <rect x="70" y="174" width="8" height="14" rx="1" />
            <rect x="86" y="174" width="14" height="8" rx="1" />
            <rect x="106" y="174" width="8" height="14" rx="1" />
            <rect x="122" y="174" width="14" height="8" rx="1" />
            <rect x="178" y="174" width="14" height="14" rx="1" />

            {/* Right side data modules */}
            <rect x="138" y="70" width="8" height="14" rx="1" />
            <rect x="154" y="70" width="14" height="8" rx="1" />
            <rect x="174" y="70" width="14" height="8" rx="1" />
            <rect x="146" y="94" width="14" height="8" rx="1" />
            <rect x="170" y="94" width="8" height="14" rx="1" />
            <rect x="186" y="94" width="8" height="8" rx="1" />
            <rect x="138" y="118" width="14" height="8" rx="1" />
            <rect x="162" y="118" width="8" height="8" rx="1" />
            <rect x="178" y="118" width="14" height="8" rx="1" />
          </svg>

          {/* Centered Bantuin Badge inside QR code */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 bg-white rounded-xl shadow-md border border-slate-200 flex items-center justify-center p-1.5">
              <BantuinPayLogo className="h-6 w-auto object-contain" />
            </div>
          </div>
        </div>

        {/* Bottom Details of QR Card */}
        <div className="w-full pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
          <span className="tracking-tight">NMID: ID1020039281729</span>
          <span className="text-[#1683FF] font-bold">Bantuin Escrow</span>
        </div>
      </div>

      {/* Right Details & Instructions */}
      <div className="flex-1 space-y-4 text-center sm:text-left min-w-0 w-full">
        <div>
          <span className="text-base sm:text-lg font-black text-slate-900 block">
            Scan Kode QRIS
          </span>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Dukung seluruh aplikasi perbankan & dompet digital: BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay & LinkAja.
          </p>
        </div>

        {/* Amount to Pay Box */}
        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Nominal Pembayaran</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
              {formatIDR(totalAmount)}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(totalAmount, "nominal")}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#1683FF] border border-blue-100 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{isCopiedNominal ? "Tersalin" : "Salin Nominal"}</span>
          </button>
        </div>

        {/* 3 Quick Steps */}
        <div className="space-y-1.5 text-xs text-slate-600 bg-white/70 p-3 rounded-xl border border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-[#1683FF] text-[10px] font-black flex items-center justify-center shrink-0">1</span>
            <span>Buka aplikasi m-Banking atau e-Wallet di smartphone Anda</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-[#1683FF] text-[10px] font-black flex items-center justify-center shrink-0">2</span>
            <span>Pilih menu <strong>Scan QRIS</strong> dan arahkan kamera ke kode di samping</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-[#1683FF] text-[10px] font-black flex items-center justify-center shrink-0">3</span>
            <span>Periksa nominal tagihan dan konfirmasi pembayaran Anda</span>
          </div>
        </div>

        {/* Auto Status Pulse */}
        <div className="text-xs text-slate-600 flex items-center justify-center sm:justify-start gap-2 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1683FF] animate-pulse shrink-0" />
          <span>Menunggu scan pembayaran (terdeteksi otomatis 24 jam)</span>
        </div>
      </div>
    </div>
  );
}
