"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { 
  ShieldCheck, 
  Star, 
  ArrowLeft, 
  CheckCircle2, 
  Send, 
  Palette,
  Briefcase,
  MapPin,
  Navigation
} from "lucide-react";
import { getNavigationUrl } from "@/lib/services/gpsService";
import MapComponent from "@/components/map/MapComponent";

export default function JasaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { services, createRequest, getDistanceToUser, userCoordinates } = useApp();

  const [briefNotes, setBriefNotes] = useState("");
  const [budgetVal, setBudgetVal] = useState("");
  const [isSent, setIsSent] = useState(false);

  const service = services.find((s) => s.id === id) || services[0];

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-[#102A43]">Jasa Tidak Ditemukan</h2>
          <Link href="/jasa" className="mt-4 px-4 py-2 bg-[#1683FF] text-white rounded-xl text-xs font-semibold">
            Kembali ke Katalog Jasa
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleSendBrief = (e) => {
    e.preventDefault();
    if (!briefNotes.trim()) return;
    
    // Create linked request
    createRequest({
      title: `Pesanan Jasa: ${service.title}`,
      description: briefNotes,
      category: service.category,
      mode: "online",
      locationName: "Online Workroom",
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      rewardAmount: Number(budgetVal) || service.startingPrice,
      isVoluntary: false,
    });

    setIsSent(true);
  };

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(service.latitude, service.longitude, service.distanceMeters)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 md:px-6 py-8">
        
        {/* Back Link */}
        <Link
          href="/jasa"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#61758A] hover:text-[#1683FF] mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Jasa</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Service Profile Card */}
            <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={service.avatarUrl}
                  alt={service.providerName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-[#EAF4FF]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base text-[#102A43]">{service.providerName}</h2>
                    {service.isVerified && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        Terverifikasi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#61758A] mt-0.5">{service.providerFaculty}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-[#102A43]">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{service.ratingAvg}</span>
                    </div>
                    <span>·</span>
                    <span className="text-[#61758A] font-normal">{service.completedJobs} pesanan selesai</span>
                  </div>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-[#102A43] tracking-tight mb-4">
                {service.title}
              </h1>

              <div className="flex flex-wrap gap-1.5 mb-6">
                {service.tags?.map((tag, i) => (
                  <span key={i} className="text-xs px-3 py-1 bg-[#F5FAFF] text-[#1683FF] border border-[#DCEAF7] rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-sm text-[#61758A] leading-relaxed mb-6">
                {service.desc || "Siap membantu pengerjaan desain, visual, dan kebutuhan materi kampus dengan pengerjaan profesional dan revisi cepat."}
              </div>
            </div>

            {/* Direct Geolocation Studio / Workshop Point Card */}
            {service.latitude && service.longitude && (
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#7C3AED]" />
                    <h3 className="font-bold text-sm text-[#102A43]">
                      Titik Lokasi Studio / Workshop Layanan
                    </h3>
                  </div>
                  <a
                    href={getNavigationUrl(
                      service.latitude,
                      service.longitude,
                      userCoordinates?.latitude,
                      userCoordinates?.longitude
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Petunjuk Arah Google Maps</span>
                  </a>
                </div>

                <div className="text-xs text-[#61758A]">
                  <div className="font-medium text-slate-800">{service.address || service.location}</div>
                  {distanceInfo?.text && (
                    <div className="mt-1 flex items-center gap-1.5 text-slate-600 font-semibold">
                      <span>Jarak: {distanceInfo.text} dari posisi GPS Anda</span>
                      {distanceInfo?.isRealtime && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          GPS Aktif
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <MapComponent
                  points={[
                    {
                      id: service.id,
                      title: service.title,
                      latitude: service.latitude,
                      longitude: service.longitude,
                      type: "service",
                      startingPrice: service.startingPrice,
                      address: service.address || service.location,
                    }
                  ]}
                  userLocation={userCoordinates}
                  height="220px"
                  showRouteLine={true}
                />
              </div>
            )}

            {service.mode === "online" && (
              <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#102A43]">Pengerjaan Online / Remote</h4>
                  <p className="text-xs text-[#61758A] mt-0.5">
                    Layanan ini dapat dipesan dan dikerjakan dari mana saja di seluruh Indonesia via order room dan koordinasi digital.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Brief Inquiry Form (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6 pb-4 border-b border-[#DCEAF7]">
                <span className="text-xs text-[#61758A]">Harga Mulai Dari</span>
                <div className="text-2xl font-extrabold text-[#1683FF]">
                  {formatIDR(service.startingPrice)}
                </div>
              </div>

              {!isSent ? (
                <form onSubmit={handleSendBrief} className="space-y-4">
                  <h3 className="font-bold text-sm text-[#102A43]">Kirim Brief Kebutuhan</h3>

                  <div>
                    <label className="block text-xs font-semibold text-[#102A43] mb-1">
                      Deskripsi Tugas / Project:
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={briefNotes}
                      onChange={(e) => setBriefNotes(e.target.value)}
                      placeholder="Jelaskan kebutuhanmu, ukuran/format, deadline, dan referensi..."
                      className="w-full text-xs p-3 rounded-xl border border-[#DCEAF7] focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#102A43] mb-1">
                      Estimasi Budget Kamu (Rp):
                    </label>
                    <input
                      type="number"
                      defaultValue={service.startingPrice}
                      onChange={(e) => setBudgetVal(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-[#DCEAF7] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#1683FF] text-white font-semibold text-xs hover:bg-[#0F6FE5] shadow flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pesanan Jasa</span>
                  </button>
                </form>
              ) : (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-sm text-[#102A43]">Brief Berhasil Dikirim!</h4>
                  <p className="text-xs text-[#61758A]">
                    Penyedia jasa akan meninjau kebutuhanmu dan merespon via chat/order room.
                  </p>
                  <Link
                    href="/activity"
                    className="inline-block mt-2 px-4 py-2 bg-[#1683FF] text-white rounded-xl text-xs font-semibold"
                  >
                    Lihat Aktivitas
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
