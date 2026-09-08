import React from "react";
import { Heart, Users, Sparkles, ShieldCheck } from "lucide-react";

export default function CommunityBanner() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[28px] md:rounded-[36px] overflow-hidden bg-gradient-to-br from-[#102A43] via-[#1A365D] to-[#0F172A] p-8 sm:p-14 md:p-16 text-white shadow-[0_20px_50px_rgba(16,42,67,0.15)] border border-[#234E70]">
          
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#1683FF]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Inner Content */}
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-[#38bdf8] uppercase tracking-wider mb-6">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span>Semangat Gotong Royong Digital</span>
            </div>
            
            <blockquote className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-snug mb-6">
              &ldquo;Kadang kamu tidak butuh birokrasi rumit. Kamu cuma butuh seseorang di sekitarmu yang bisa{" "}
              <span className="text-[#38bdf8] underline decoration-blue-400/40 decoration-wavy">Bantuin.</span>&rdquo;
            </blockquote>

            <p className="text-sm sm:text-base text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed mb-8">
              Membangun budaya tolong-menolong modern yang aman, transparan, dan saling memberdayakan ekonomi warga dan mahasiswa di seluruh Indonesia.
            </p>

            {/* Impact Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/15 max-w-2xl mx-auto">
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-white">0% Fee Awal</span>
                <span className="text-xs text-slate-400 mt-0.5">Bebas buat request</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-[#38bdf8]">Escrow Aman</span>
                <span className="text-xs text-slate-400 mt-0.5">Xendit Payment Gateway</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-emerald-400">Titik Temu Aman</span>
                <span className="text-xs text-slate-400 mt-0.5">Area publik terverifikasi</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}

