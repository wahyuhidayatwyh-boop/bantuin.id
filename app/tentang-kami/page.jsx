import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ShieldCheck, Heart, Users, Target } from "lucide-react";

export default function TentangKamiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[900px] w-full mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-[#1683FF] uppercase tracking-widest block mb-2">
            Misi & Nilai Kami
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#102A43] tracking-tight">
            Tentang Bantuin
          </h1>
          <p className="text-sm text-[#61758A] mt-2 max-w-xl mx-auto leading-relaxed">
            Platform hyper-local yang lahir dari kebutuhan nyata mahasiswa untuk saling membantu tugas, menyewa peralatan, dan menawarkan keahlian.
          </p>
        </div>

        <div className="bg-white border border-[#DCEAF7] rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 text-sm text-[#61758A] leading-relaxed">
          <div>
            <h2 className="text-xl font-bold text-[#102A43] mb-3">Latar Belakang</h2>
            <p>
              Di lingkungan kampus, ribuan kebutuhan muncul setiap harinya: mengambil dokumen bebas pustaka yang mendesak, mencetak makalah puluhan lembar saat kelas akan dimulai, menyewa kamera untuk liputan acara, hingga mencari desainer poster. Di sisi lain, ribuan mahasiswa memiliki waktu luang, alat, atau keahlian yang dapat dimanfaatkan untuk mendapatkan penghasilan tambahan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <div className="p-5 rounded-2xl bg-[#F5FAFF] border border-[#DCEAF7]">
              <Target className="w-6 h-6 text-[#1683FF] mb-2" />
              <h3 className="font-bold text-base text-[#102A43] mb-1">Visi Kami</h3>
              <p className="text-xs">
                Menciptakan ekosistem tolong-menolong berbasis komunitas yang inklusif, aman, dan memberdayakan ekonomi kampus di seluruh Indonesia.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F5FAFF] border border-[#DCEAF7]">
              <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
              <h3 className="font-bold text-base text-[#102A43] mb-1">Prinsip Keamanan</h3>
              <p className="text-xs">
                Perlindungan pembayaran resmi terverifikasi dan safe meet-up Bantuin Point untuk memastikan transaksi bebas risiko penipuan.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
