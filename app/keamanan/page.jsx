"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import {
  ShieldCheck,
  Flag,
  ChevronDown,
  Lock,
  Eye,
  MapPin,
  MessageSquare,
  Users,
  CheckCircle2,
} from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Bagaimana dana saya aman saat transaksi?",
    a: "Dana pembayaran diamankan melalui Payment Gateway resmi dan sistem pembayaran terverifikasi Bantuin. Dana baru diteruskan ke mitra/helper setelah kamu mengonfirmasi pesanan selesai. Jika ada kendala, dana diproses melalui refund resmi.",
  },
  {
    q: "Apa itu Safe Bantuin Points?",
    a: "Titik temu publik terverifikasi — gerbang kampus, perpustakaan, minimarket — yang direkomendasikan untuk serah terima barang. Ramai, terang, dan aman untuk semua pihak.",
  },
  {
    q: "Apa yang terjadi jika barang sewa rusak?",
    a: "Setiap sewa dilindungi dokumentasi kondisi (foto) awal dan akhir. Jika ada kerusakan, deposit dipotong sesuai perjanjian. Klaim dilakukan lewat fitur Sengketa dengan bukti foto.",
  },
  {
    q: "Berapa lama laporan ditangani?",
    a: "Tim Trust & Safety menargetkan respons awal dalam 1×24 jam. Laporan dengan bukti lengkap biasanya selesai dalam 3–5 hari kerja.",
  },
  {
    q: "Apakah identitas saya aman saat melapor?",
    a: "Ya. Laporan bersifat anonim bagi pihak terlapor. Identitas kamu hanya dapat diakses oleh tim admin Bantuin untuk keperluan investigasi.",
  },
  {
    q: "Apa yang dimaksud disintermediasi?",
    a: "Disintermediasi adalah ketika pengguna meminta transaksi di luar platform (berbagi nomor WA, transfer langsung). Ini melanggar aturan dan menghilangkan proteksi pembayaran resmi Bantuin. Segera laporkan jika terjadi.",
  },
];

export default function KeamananPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* ── HEADER + 2 CTA ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white border border-[#DCEAF7] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#EAF4FF] border border-[#DCEAF7] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#1683FF]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-[#102A43]">Pusat Keamanan Bantuin</h1>
              <p className="text-sm text-[#61758A] mt-1 leading-relaxed">
                Pembayaran Terverifikasi Resmi, verifikasi KTM/KTP, dan Safe Points — perlindungan berlapis untuk setiap transaksi komunitas kampus.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <Link
              href="/lapor"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition active:scale-95 shadow-sm"
            >
              <Flag className="w-4 h-4" />
              Laporkan Masalah
            </Link>
            <Link
              href="/chat/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#DCEAF7] hover:border-[#1683FF] text-[#61758A] hover:text-[#1683FF] text-sm font-bold transition"
            >
              <MessageSquare className="w-4 h-4" />
              Chat Admin
            </Link>
          </div>
        </div>

        {/* ── 3 PILAR ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Lock, color: "text-[#1683FF]", bg: "bg-[#EAF4FF]", border: "border-[#DCEAF7]",
              title: "Sistem Pembayaran Terverifikasi",
              desc: "Pembayaran diproses via Payment Gateway resmi dan diamankan hingga pesanan tuntas dikonfirmasi.",
            },
            {
              icon: Eye, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200",
              title: "Verifikasi KTM & KTP",
              desc: "Setiap pengguna diverifikasi dokumen resmi. Tidak ada akun anonim di Bantuin.",
            },
            {
              icon: MapPin, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200",
              title: "Safe Bantuin Points",
              desc: "Titik temu publik berCCTV yang direkomendasikan untuk serah terima aman dan terverifikasi.",
            },
          ].map((p, i) => (
            <div key={i} className="bg-white border border-[#DCEAF7] rounded-xl p-5 flex items-start gap-3.5">
              <div className={`w-9 h-9 rounded-lg ${p.bg} border ${p.border} flex items-center justify-center shrink-0`}>
                <p.icon className={`w-4 h-4 ${p.color}`} />
              </div>
              <div>
                <div className="font-bold text-sm text-[#102A43]">{p.title}</div>
                <p className="text-xs text-[#61758A] mt-0.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── FAQ + KONTAK BANTUAN berdampingan ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* FAQ — lebar 2/3 */}
          <div className="lg:col-span-2 bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-sm text-[#102A43] mb-4">Pertanyaan Umum Keamanan</h2>
            <div className="space-y-2">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="border border-[#DCEAF7] rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#EAF4FF] transition cursor-pointer group"
                  >
                    <span className="text-xs font-semibold text-[#102A43] group-hover:text-[#1683FF] transition pr-4">
                      {item.q}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#61758A] shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180 text-[#1683FF]" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-3.5 pt-3 text-xs text-[#61758A] leading-relaxed border-t border-[#DCEAF7] bg-[#F5FAFF]">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Kontak Bantuan — lebar 1/3 */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Card Laporkan */}
            <div className="bg-white border border-[#DCEAF7] rounded-2xl p-5 shadow-sm flex-1">
              <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center mb-3">
                <Flag className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="font-bold text-sm text-[#102A43]">Ada Masalah?</h3>
              <p className="text-xs text-[#61758A] mt-1 leading-relaxed mb-4">
                Laporkan kecurangan, penipuan, atau pelanggaran. Tim kami merespons dalam 1×24 jam.
              </p>
              <Link
                href="/lapor"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition"
              >
                <Flag className="w-3.5 h-3.5" />
                Buat Laporan
              </Link>
            </div>

            {/* Card Chat Admin */}
            <div className="bg-white border border-[#DCEAF7] rounded-2xl p-5 shadow-sm flex-1">
              <div className="w-9 h-9 rounded-lg bg-[#EAF4FF] border border-[#DCEAF7] flex items-center justify-center mb-3">
                <MessageSquare className="w-4 h-4 text-[#1683FF]" />
              </div>
              <h3 className="font-bold text-sm text-[#102A43]">Chat Langsung Admin</h3>
              <p className="text-xs text-[#61758A] mt-1 leading-relaxed mb-4">
                Butuh bantuan segera? Hubungi tim Trust &amp; Safety Bantuin secara langsung.
              </p>
              <Link
                href="/chat/admin"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Mulai Chat Admin
              </Link>
            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
