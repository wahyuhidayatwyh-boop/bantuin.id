"use client";

import React from "react";
import Link from "next/link";
import { PlusCircle, Users, MessageSquare, Star, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function ProcessTimeline() {
  const steps = [
    {
      num: "01",
      title: "Buat Request",
      desc: "Ceritakan apa yang kamu butuhkan. Tentukan budget, batas waktu, dan titik temu aman.",
      icon: PlusCircle,
      badge: "Cepat & Gratis",
    },
    {
      num: "02",
      title: "Orang Membantu",
      desc: "Yang bisa membantu akan menawarkan diri. Lihat rating bintang, jarak, dan testimoni helper.",
      icon: Users,
      badge: "Helper Valid",
    },
    {
      num: "03",
      title: "Pilih & Kerjakan",
      desc: "Pilih tawaran terbaik. Dana aman di rekening escrow Xendit, pantau progress lewat chat.",
      icon: MessageSquare,
      badge: "Escrow Xendit",
    },
    {
      num: "04",
      title: "Selesai & Rating",
      desc: "Konfirmasi penyelesaian tugas, dana cair otomatis ke helper, lalu beri rating terpercaya.",
      icon: Star,
      badge: "Garansi Aman",
    },
  ];

  return (
    <section className="py-14 md:py-20 bg-[#F8FBFF] border-b border-slate-100">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSPARAN & PRAKTIS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Sesimpel itu.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Dari butuh bantuan sampai selesai aman dalam 4 langkah mudah.
          </p>
        </div>

        {/* 4 Steps in Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white rounded-[22px] border border-slate-200/90 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(22,131,255,0.08)] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-black text-[#1683FF] font-mono">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-base text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">
                    {step.desc}
                  </p>
                </div>

                {/* Badge Tag */}
                <div className="pt-3 border-t border-slate-50">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{step.badge}</span>
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Action Link below steps */}
        <div className="mt-10 text-center">
          <Link
            href="/bantuan/create"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-[0_8px_20px_rgba(22,131,255,0.25)] transition active:scale-95"
          >
            <span>Coba Buat Request Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
