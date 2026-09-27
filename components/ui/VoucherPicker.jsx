"use client";

import React, { useState } from "react";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { isVoucherLocationMatch } from "@/lib/mock/voucherData";
import { 
  Tag, 
  ChevronRight, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Gift, 
  Ticket,
  MapPin
} from "lucide-react";

/**
 * VoucherPicker — Komponen pemilih voucher gaya Shopee dengan dukungan filter wilayah/lokasi
 *
 * Props:
 *   category      : "bantuan" | "jasa" | "sewa"
 *   orderAmount   : number — nilai transaksi (sebelum diskon)
 *   onApply       : (discount: number, voucher: object | null) => void
 *   appliedVoucher: object | null — voucher yang sedang aktif
 *   orderLocation : string | null — kota / kabupaten tujuan order (opsional, fallback ke selectedLocation)
 */
export default function VoucherPicker({ 
  category, 
  orderAmount, 
  onApply, 
  appliedVoucher, 
  orderLocation = null 
}) {
  const { vouchers = [], redeemVoucher, selectedLocation } = useApp();
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Lokasi efektif pesanan atau user
  const effectiveLocation = orderLocation || selectedLocation || "Semua Wilayah";

  // Voucher yang relevan untuk kategori ini
  const availableVouchers = vouchers.filter(
    (v) =>
      v.isActive &&
      v.quota - v.usedCount > 0 &&
      new Date(v.expiresAt) >= new Date() &&
      (v.appliesTo === "all" || v.appliesTo === category)
  );

  const calcDiscount = (vc) => {
    const locMatches = isVoucherLocationMatch(vc.targetLocation, effectiveLocation);
    if (!locMatches) return null;
    if (orderAmount < vc.minOrder) return null;
    const raw = vc.type === "percent" ? Math.round((vc.value / 100) * orderAmount) : vc.value;
    return Math.min(raw, vc.maxDiscount);
  };

  const handleApplyCode = () => {
    setError("");
    if (!inputCode.trim()) { 
      setError("Masukkan kode voucher terlebih dahulu."); 
      return; 
    }
    const result = redeemVoucher(inputCode, category, orderAmount, effectiveLocation);
    if (!result.ok) { 
      setError(result.error); 
      return; 
    }
    onApply(result.discount, result.voucher);
    setInputCode("");
    setIsExpanded(false);
  };

  const handleSelectCard = (vc) => {
    const result = redeemVoucher(vc.code, category, orderAmount, effectiveLocation);
    if (!result.ok) { 
      setError(result.error); 
      return; 
    }
    setError("");
    onApply(result.discount, result.voucher);
    setIsExpanded(false);
  };

  const handleRemove = () => {
    onApply(0, null);
    setError("");
    setInputCode("");
  };

  // ── Sudah ada voucher terpasang ──
  if (appliedVoucher) {
    const discount = calcDiscount(appliedVoucher) ?? (
      appliedVoucher.type === "percent" 
        ? Math.min(Math.round((appliedVoucher.value / 100) * orderAmount), appliedVoucher.maxDiscount)
        : appliedVoucher.value
    );
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Ticket className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-emerald-800 font-mono tracking-wider">{appliedVoucher.code}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                Terpasang
              </span>
              {appliedVoucher.targetLocation && appliedVoucher.targetLocation !== "all" && (
                <span className="text-[10px] bg-emerald-100/80 text-emerald-700 px-2 py-0.2 rounded-md font-semibold flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{appliedVoucher.targetLocation}</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
              Hemat {formatIDR(discount)}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          className="w-7 h-7 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center transition shrink-0 cursor-pointer"
          title="Hapus voucher"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-dashed border-[#DCEAF7] bg-blue-50/30 hover:border-[#1683FF] hover:bg-blue-50/60 transition group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 text-slate-700 group-hover:text-[#1683FF] min-w-0">
          <Tag className="w-4 h-4 text-[#1683FF] shrink-0" />
          <span className="text-xs font-bold truncate">Pakai Voucher atau Diskon Wilayah</span>
          {availableVouchers.length > 0 && (
            <span className="text-[10px] bg-[#1683FF] text-white px-2 py-0.5 rounded-full font-black shrink-0">
              {availableVouchers.length} tersedia
            </span>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-[#1683FF] transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
      </button>

      {/* Expandable panel */}
      {isExpanded && (
        <div className="rounded-2xl border border-[#DCEAF7] bg-white p-4 space-y-4 animate-in fade-in duration-150 shadow-sm">

          {/* Location indicator */}
          <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span>Lokasi Transaksi Anda:</span>
            </span>
            <strong className="text-slate-900 font-bold">{effectiveLocation}</strong>
          </div>

          {/* Input manual */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Punya Kode Voucher?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => { setInputCode(e.target.value.toUpperCase()); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCode()}
                placeholder="Masukkan kode promo..."
                className="flex-1 text-xs font-mono font-bold tracking-widest border border-[#DCEAF7] rounded-xl px-4 py-2.5 bg-[#F5FAFF] text-[#102A43] placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-[#1683FF] focus:bg-white transition"
              />
              <button
                type="button"
                onClick={handleApplyCode}
                className="px-4 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
              >
                Pakai
              </button>
            </div>
            {error && (
              <div className="flex items-start gap-1.5 mt-2 text-[11px] text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-100 leading-snug">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Available voucher cards */}
          {availableVouchers.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Daftar Voucher Tersedia
              </p>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
                {availableVouchers.map((vc) => {
                  const locationMatches = isVoucherLocationMatch(vc.targetLocation, effectiveLocation);
                  const amountMatches = orderAmount >= vc.minOrder;
                  const discount = calcDiscount(vc);
                  const eligible = discount !== null;

                  // Category styling colors
                  const categoryBadgeStyles = {
                    all: "bg-blue-50 text-[#1683FF] border-blue-200",
                    sewa: "bg-purple-50 text-purple-700 border-purple-200",
                    jasa: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    bantuan: "bg-amber-50 text-amber-800 border-amber-200",
                  };

                  const categoryGradients = {
                    all: "from-[#1683FF] to-[#0F6FE5]",
                    sewa: "from-violet-500 to-purple-600",
                    jasa: "from-emerald-500 to-teal-600",
                    bantuan: "from-amber-500 to-orange-600",
                  };

                  const gradientClass = vc.color || categoryGradients[vc.appliesTo] || categoryGradients.all;

                  return (
                    <button
                      key={vc.id}
                      type="button"
                      disabled={!eligible}
                      onClick={() => eligible && handleSelectCard(vc)}
                      className={`w-full text-left rounded-2xl overflow-hidden border flex items-stretch transition cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed ${
                        eligible
                          ? "border-[#DCEAF7] hover:border-[#1683FF] hover:shadow-xs bg-white"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      {/* Left Gradient Strip */}
                      <div className={`w-1.5 bg-gradient-to-b ${gradientClass} shrink-0`} />

                      {/* Icon */}
                      <div className={`w-12 flex items-center justify-center bg-gradient-to-br ${gradientClass} text-white shrink-0`}>
                        <Gift className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 truncate">{vc.title}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{vc.description}</div>
                          </div>
                          {eligible && (
                            <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                              -{formatIDR(discount)}
                            </span>
                          )}
                        </div>

                        {/* Badges row: Code + Wilayah + Terms */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[10px]">
                          {/* Code */}
                          <span className="font-bold text-[#1683FF] font-mono tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {vc.code}
                          </span>

                          {/* Category Badge */}
                          <span className={`font-bold px-2 py-0.5 rounded-md border ${categoryBadgeStyles[vc.appliesTo] || categoryBadgeStyles.all}`}>
                            {vc.appliesTo === "all" ? "Semua Layanan" : vc.appliesTo.toUpperCase()}
                          </span>

                          {/* Wilayah Badge */}
                          <span className={`font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            locationMatches
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            <MapPin className="w-2.5 h-2.5 text-[#1683FF]" />
                            <span>{vc.targetLocation === "all" || !vc.targetLocation ? "Nasional" : vc.targetLocation}</span>
                          </span>

                          {/* Min Order */}
                          <span className="text-slate-400 font-medium">
                            Min. {formatIDR(vc.minOrder)}
                          </span>

                          {/* Ineligible Reasons */}
                          {!locationMatches && (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Khusus area {vc.targetLocation}
                            </span>
                          )}
                          {locationMatches && !amountMatches && (
                            <span className="text-rose-500 font-semibold">
                              Kurang {formatIDR(vc.minOrder - orderAmount)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Arrow */}
                      <div className="flex items-center pr-3 pl-1">
                        <ChevronRight className={`w-4 h-4 ${eligible ? "text-[#1683FF]" : "text-slate-300"}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableVouchers.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <Gift className="w-8 h-8 text-slate-200" />
              <span>Belum ada voucher tersedia untuk kategori ini.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
