"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Home, MessageCircle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { formatIDR } from "@/lib/utils";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "transaksi";
  const title = searchParams.get("title") || "Transaksi Bantuin";
  const amount = Number(searchParams.get("amount")) || 0;
  const next = searchParams.get("next") || "/";
  const isChat = next.startsWith("/chat");
  const isPromotion = type === "promosi";

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex items-center">
        <section className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-9 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-500" />
          </div>
          <p className="mt-5 text-[11px] sm:text-xs font-bold tracking-wider uppercase text-emerald-600">Pembayaran terkonfirmasi</p>
          <h1 className="mt-1.5 text-xl sm:text-3xl font-black tracking-tight text-slate-900">Pembayaran berhasil</h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
            {isPromotion
              ? "Promosi Anda sudah aktif dan siap menjangkau lebih banyak pelanggan."
              : "Dana Anda telah diamankan oleh sistem pembayaran Bantuin."}
          </p>

          <div className="mt-5 sm:mt-6 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 p-3.5 sm:p-4 text-left space-y-2">
            <div className="flex gap-3 justify-between text-xs sm:text-sm">
              <span className="text-slate-500 shrink-0">Untuk</span>
              <span className="font-bold text-slate-800 text-right break-words">{title}</span>
            </div>
            {amount > 0 && <div className="flex gap-3 justify-between border-t border-slate-200 pt-2 text-xs sm:text-sm"><span className="text-slate-500">Total</span><span className="font-black text-[#1683FF]">{formatIDR(amount)}</span></div>}
          </div>

          <div className="mt-4 flex items-start gap-2.5 text-left rounded-xl bg-blue-50 border border-blue-100 p-3 text-[11px] sm:text-xs leading-relaxed text-slate-600">
            <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
            <span>{isPromotion ? "Status promosi dapat dilihat dari dashboard Anda." : "Lanjutkan ke chat untuk mengatur detail transaksi bersama mitra."}</span>
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <Link href={next} className="min-h-11 px-4 py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition">
              {isChat ? <MessageCircle className="w-4 h-4" /> : <Home className="w-4 h-4" />}
              {isChat ? "Lanjut ke Chat" : "Kembali ke Beranda"}
            </Link>
            <Link href="/" className="min-h-11 px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition">
              <Home className="w-4 h-4" /> Beranda
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#F4F7FB]" />}><PaymentSuccessContent /></Suspense>;
}
