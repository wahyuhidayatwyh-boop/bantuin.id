import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { HelpCircle, ChevronRight } from "lucide-react";

export default function FaqPage() {
  const faqs = [
    {
      q: "Bagaimana cara kerja pembayaran dan escrow di Bantuin?",
      a: "Bantuin bermitra dengan Xendit sebagai Payment Gateway resmi. Ketika kamu memilih helper atau merental barang, dana pembayaran akan ditahan di rekening escrow Xendit. Dana baru akan dicairkan ke helper setelah kamu mengonfirmasi bahwa tugas telah selesai dengan baik.",
    },
    {
      q: "Apakah satu akun bisa menjadi pembutuh bantuan sekaligus helper?",
      a: "Ya! Prinsip Bantuin adalah satu akun untuk semua peran. Kamu bisa membuat request saat butuh bantuan, dan di waktu lain menjadi helper untuk membantu mahasiswa lain di sekitarmu.",
    },
    {
      q: "Bagaimana jika terjadi kendala atau barang tidak sesuai?",
      a: "Kamu dapat menekan tombol menu di Order Room dan memilih 'Buka Sengketa'. Tim admin Bantuin akan meninjau bukti foto serah terima dari kedua belah pihak dan memutuskan pengembalian dana (refund) atau pencairan secara adil.",
    },
    {
      q: "Apa itu Safe Bantuin Point?",
      a: "Bantuin Point adalah titik temu publik yang direkomendasikan sistem (seperti gerbang utama kampus, perpustakaan, atau minimarket 24 jam dengan pos satpam) agar serah terima barang berjalan aman.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-10">
          <HelpCircle className="w-10 h-10 text-[#1683FF] mx-auto mb-2" />
          <h1 className="text-3xl font-bold text-[#102A43]">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h1>
          <p className="text-xs sm:text-sm text-[#61758A] mt-1">
            Jawaban lengkap seputar keamanan, alur transaksi, dan kebijakan Bantuin.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-[#102A43] mb-2">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-[#61758A] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
