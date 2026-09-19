"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDeadlineWithHour } from "@/lib/utils";
import { getNavigationUrl } from "@/lib/services/gpsService";
import MapComponent from "@/components/map/MapComponent";
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Star, 
  Send, 
  CheckCircle2, 
  ArrowLeft,
  MessageSquare,
  FileText,
  Briefcase,
  Users,
  Check,
  Award,
  Sparkles,
  ArrowRight,
  ExternalLink,
  CreditCard,
  QrCode,
  Building2,
  Smartphone,
  Wallet,
  Lock,
  Copy,
  AlertCircle,
  Loader2,
  Navigation,
  Camera,
  Eye,
  X
} from "lucide-react";

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    requests, 
    currentUser, 
    userCoordinates,
    getDistanceToUser,
    detectUserLocation,
    startTaskInquiry
  } = useApp();

  const request = requests.find((r) => r.id === id);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState(null);

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Permintaan Bantuan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Mungkin permintaan sudah selesai atau telah ditutup.</p>
          <Link href="/bantuan" className="px-5 py-2.5 bg-[#1683FF] text-white rounded-xl text-xs font-bold shadow-xs">
            Kembali ke Daftar Bantuan
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = currentUser?.id === request.requester?.id;
  const offersList = request.offers || [];
  const hasUserOffered = offersList.some((o) => o.helperId === currentUser?.id);
  const isClosed = request.status === "helper_selected" || request.status === "in_progress";

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(request.latitude, request.longitude, request.distanceMeters)
    : null;
  const distanceText = request.mode === "online"
    ? "Online"
    : (distanceInfo?.text || (request.distanceMeters ? `${request.distanceMeters} m` : "850 m"));

  // Open Direct Full-Page Workspace Room (No Floating Popups)
  const handleOpenChat = (offer) => {
    if (startTaskInquiry && request) {
      const inqRoom = startTaskInquiry({ request, offer });
      router.push(`/chat?room=${inqRoom?.id || "order-room-101"}`);
    } else {
      router.push(`/chat?room=order-room-101`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        
        {/* Top Breadcrumb & Category */}
        <div className="flex items-center justify-between">
          <Link
            href="/bantuan"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#1683FF] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Bantuan</span>
          </Link>

          <span className="text-xs font-semibold px-3 py-1 bg-white text-slate-700 rounded-full border border-slate-200/80 shadow-2xs">
            {request.category}
          </span>
        </div>

        {/* UNIFIED CLEAN MODERN CONTAINER */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 lg:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* 1. MAIN OVERVIEW & KEY DETAILS (Mobile: Order 1, Desktop: col-span-8) */}
            <div className="lg:col-span-8 space-y-5 order-1">
              
              {/* Clean Minimalist Meta Line */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold">
                  {request.mode === "online" ? "Online / Remote" : "Tatap Muka"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Batas: {formatDeadlineWithHour(request.deadline, request.deadlineText)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rekening Bersama Terlindungi</span>
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {request.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5 whitespace-pre-line">
                  {request.description}
                </p>
              </div>

              {/* Foto Barang / Bukti Kebutuhan (Jika Ada) */}
              {Array.isArray(request.photos) && request.photos.length > 0 && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#1683FF]" />
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Foto Barang &amp; Bukti Tugas ({request.photos.length})
                      </h4>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Klik foto untuk memperbesar
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {request.photos.map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setSelectedPhotoModal(photo)}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-2xs cursor-pointer hover:border-blue-300 transition"
                      >
                        <img
                          src={photo}
                          alt={`Foto barang ${pIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1.5 backdrop-blur-[1px]">
                          <Eye className="w-4 h-4" />
                          <span>Perbesar</span>
                        </div>
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/70 text-white text-[10px] font-bold">
                          Foto {pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clean Info Strip */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {request.mode === "online" ? "Format Pengerjaan" : "Lokasi / Titik Temu"}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">{request.locationName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {request.mode === "online" ? (
                      <span>Dapat dikerjakan dari mana saja (Online / Remote)</span>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-700">{distanceText}</span>
                        <span>dari posisi Anda</span>
                        {distanceInfo?.isRealtime && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80">
                            GPS Aktif
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {request.mode !== "online" && request.latitude && request.longitude && (
                    <div className="mt-2">
                      <a
                        href={getNavigationUrl(
                          request.latitude,
                          request.longitude,
                          userCoordinates?.latitude,
                          userCoordinates?.longitude
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50/90 hover:bg-blue-100 px-3 py-1 rounded-xl border border-blue-100 transition shadow-2xs"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Buka Petunjuk Arah / Rute</span>
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget Imbalan</div>
                  <div className="text-base sm:text-lg font-black text-[#1683FF] mt-0.5">
                    {request.isVoluntary ? "Sukarela" : formatIDR(request.rewardAmount)}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">Dana aman di rekening bersama</div>
                </div>
              </div>

              {/* Embedded Interactive Map for Offline Request Point */}
              {request.mode !== "online" && request.latitude && request.longitude && (
                <div className="mt-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                      <span>Titik Lokasi Pertemuan & Navigasi</span>
                    </div>
                    <a
                      href={getNavigationUrl(
                        request.latitude,
                        request.longitude,
                        userCoordinates?.latitude,
                        userCoordinates?.longitude
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1683FF] hover:underline"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Buka di Google Maps</span>
                    </a>
                  </div>
                  <MapComponent
                    points={[
                      {
                        id: request.id,
                        title: request.title,
                        latitude: request.latitude,
                        longitude: request.longitude,
                        type: "request",
                        rewardAmount: request.rewardAmount,
                        address: request.locationName,
                      }
                    ]}
                    userLocation={userCoordinates}
                    height="200px"
                    showRouteLine={true}
                  />
                </div>
              )}

            </div>

            {/* 2. PEMINTA BANTUAN & ACTION CTA (Mobile: Order 2 - Tepat di Atas Pelamar, Desktop: col-span-4) */}
            <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-8 space-y-4 order-2">
              <div className="space-y-4">
                
                {/* Author Profile */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Peminta Bantuan
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={request.requester?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                      alt={request.requester?.name || "Peminta"}
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{request.requester?.name || "Rian Prasetya"}</h4>
                      <p className="text-xs text-slate-500">{request.requester?.role || "Wirausaha"}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-600 font-medium mt-0.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{request.requester?.rating || 4.95}</span>
                        <span className="text-slate-400">({request.requester?.campus || "Banjarmasin"})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action CTA Button */}
                {isClosed ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                    <div className="text-xs font-bold text-amber-900">Helper Telah Diterima</div>
                    <div className="text-[11px] text-amber-700 mt-0.5">Tugas ini sedang dalam proses pengerjaan.</div>
                  </div>
                ) : !isOwner ? (
                  hasUserOffered ? (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                      <div className="text-xs font-bold text-emerald-900">Proposal Anda Sudah Diajukan</div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">Menunggu respon dari peminta bantuan.</div>
                    </div>
                  ) : (
                    <Link
                      href={`/bantuan/${request.id}/ajukan`}
                      className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Ajukan Bantuan</span>
                    </Link>
                  )
                ) : (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <div className="text-xs font-bold text-blue-950">Ini Permintaan Milik Anda</div>
                    <div className="text-[11px] text-blue-700 mt-0.5">Pilih helper dari daftar pelamar di bawah.</div>
                  </div>
                )}

                {/* Trust & Escrow Guarantee */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Garansi Rekening Bersama</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Dana aman di rekening bersama sampai tugas selesai disetujui.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. DAFTAR AJUAN PELAMAR MASUK (Mobile: Order 3, Desktop: col-span-8) */}
            <div className="lg:col-span-8 space-y-4 order-3 pt-6 lg:pt-2 border-t lg:border-t-0 border-slate-100">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#1683FF]" />
                    <span>Daftar Ajuan Pelamar Masuk</span>
                    <span className="px-2 py-0.2 bg-blue-100 text-[#1683FF] text-xs font-bold rounded-full">
                      {offersList.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih penawaran terbaik dan bayar via QRIS / VA / E-Wallet untuk mengunci dana di Escrow.
                  </p>
                </div>
              </div>

              {/* Proposals List */}
              <div className="space-y-3">
                {offersList.length > 0 ? (
                  offersList.map((offer, idx) => {
                    const isMyOffer = (currentUser && offer.helperId === currentUser.id) || (currentUser && offer.helperName === currentUser.fullName);

                    return (
                      <div
                        key={offer.id || idx}
                        className={`p-4 sm:p-5 rounded-2xl border transition duration-150 shadow-2xs space-y-3 ${
                          isMyOffer
                            ? "bg-blue-50/40 border-blue-200"
                            : "border-slate-200 bg-white hover:border-blue-200"
                        }`}
                      >
                        {/* Helper Header & Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={offer.helperAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                              alt={offer.helperName}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{offer.helperName}</h4>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {offer.helperRole || "Mitra Helper"}
                                </span>
                                {isMyOffer && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {offer.helperRating || 4.9}
                                </span>
                                <span>•</span>
                                <span>{offer.helperCampus || "Banjarmasin"}</span>
                                <span>•</span>
                                <span className="text-emerald-600 font-semibold">{offer.completedHelps || 24}x bantu</span>
                              </div>
                            </div>
                          </div>

                          {/* Proposed Price */}
                          <div className="text-left sm:text-right">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Tawaran Imbalan</div>
                            <div className="text-sm sm:text-base font-black text-[#1683FF]">
                              {formatIDR(offer.proposedPrice || request.rewardAmount)}
                            </div>
                            {offer.estimatedDuration && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 sm:justify-end">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>Estimasi: {offer.estimatedDuration}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pitch Message */}
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {offer.pitchMessage}
                        </div>

                        {/* Optional Attachments Chips */}
                        {(offer.portfolioName || offer.portfolioUrl || offer.cvName) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold text-slate-400">Lampiran:</span>
                            {(offer.portfolioName || offer.portfolioUrl) && (
                              <a
                                href={offer.portfolioUrl || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                              >
                                <Briefcase className="w-3 h-3 text-slate-500" />
                                <span>{offer.portfolioName || "Portofolio"}</span>
                              </a>
                            )}
                            {offer.cvName && (
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-500" />
                                <span>{offer.cvName}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2">
                          {isMyOffer ? (
                            <div className="flex items-center justify-between w-full">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lamaran Anda (Terkirim)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (startTaskInquiry && request) {
                                    const inqRoom = startTaskInquiry({ request, offer });
                                    router.push(`/chat?room=${inqRoom?.id || "order-room-101"}`);
                                  } else {
                                    router.push(`/chat?room=order-room-101`);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 text-xs transition cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                <span>Chat Peminta Bantuan</span>
                              </button>
                            </div>
                          ) : isOwner ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenChat(offer)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 text-xs transition"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                <span>Chat Dulu</span>
                              </button>

                              {!isClosed ? (
                                <Link
                                  href={`/bantuan/${request.id}/pembayaran?offerId=${offer.id}`}
                                  className="px-4 py-1.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 text-xs"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Pilih & Bayar Escrow</span>
                                </Link>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Selesai/Diproses</span>
                              )}
                            </>
                          ) : (
                            <div className="text-xs text-slate-400 font-medium">
                              Diajukan {offer.submittedAt || "Tadi"}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">Belum Ada Ajuan Proposal</h4>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                      Jadilah yang pertama mengajukan bantuan untuk tugas ini.
                    </p>
                    {!isOwner && !isClosed && (
                      <Link
                        href={`/bantuan/${request.id}/ajukan`}
                        className="inline-block mt-3 px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shadow-xs"
                      >
                        Ajukan Bantuan Sekarang
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Modal Lightbox Perbesar Foto */}
      {selectedPhotoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPhotoModal(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPhotoModal(null)}
              className="absolute -top-12 right-0 sm:-right-2 text-white/90 hover:text-white p-2 rounded-full bg-white/20 hover:bg-white/30 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <X className="w-5 h-5" />
              <span className="hidden sm:inline">Tutup</span>
            </button>
            <img
              src={selectedPhotoModal}
              alt="Detail foto barang"
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
