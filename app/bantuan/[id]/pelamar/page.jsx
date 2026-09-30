"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDeadlineWithHour } from "@/lib/utils";
import { getNavigationUrl } from "@/lib/services/gpsService";
import { 
  ArrowLeft, 
  Users, 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  Briefcase, 
  FileText, 
  MessageSquare, 
  Check, 
  Send, 
  Clock, 
  MapPin, 
  Globe,
  SlidersHorizontal, 
  Search, 
  ChevronDown, 
  ExternalLink,
  Award,
  Filter,
  Eye,
  Trash2,
  X,
  Upload,
  Link2,
  CreditCard,
  QrCode,
  Building2,
  Smartphone,
  Wallet,
  Lock,
  Copy,
  Loader2,
  Navigation,
  XCircle,
  ArrowRight,
  Play
} from "lucide-react";

export default function PelamarListPage() {
  const { id } = useParams();
  const router = useRouter();
  const { 
    currentUser, 
    selectHelper, 
    submitOffer, 
    walletBalance, 
    addToast,
    userCoordinates,
    getDistanceToUser,
    startTaskInquiry,
    sendChatMessage
  } = useApp();

  const [request, setRequest] = useState(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedOfferToAccept, setSelectedOfferToAccept] = useState(null);
  const [isStartingWork, setIsStartingWork] = useState(false);

  const handleStartWork = async (offer) => {
    if (!id || isStartingWork) return;
    setIsStartingWork(true);
    try {
      const startMsg = `Halo! Saya sudah siap membantu sekarang, dan akan segera mengabari Anda jika ada kendala atau saat tugas selesai dikerjakan.`;

      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in_progress",
          selectedHelperId: offer?.helperId || currentUser?.id,
          startMessage: startMsg,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memulai pengerjaan tugas.");
      }

      // Inisiasi room chat & kirim pesan
      let roomId = request?.id || id;
      if (startTaskInquiry && request) {
        const inqRoom = startTaskInquiry({ request, offer });
        if (inqRoom?.id) roomId = inqRoom.id;
      }

      if (sendChatMessage) {
        await sendChatMessage(roomId, startMsg, {
          senderId: currentUser?.id,
          senderName: currentUser?.fullName || "Helper",
        });
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_activity_updated"));
      }

      addToast?.(
        "Pengerjaan Tugas Dimulai!",
        "Tugas kini berstatus Sedang Dikerjakan dan pesan otomatis telah dikirim ke pembuat tugas.",
        "success"
      );

      // Update state request lokal
      setRequest((prev) => (prev ? { ...prev, status: "in_progress" } : prev));

      // Navigasi ke chat peminta
      router.push(`/chat?room=${roomId}`);
    } catch (err) {
      console.error("Start work error in pelamar page:", err);
      addToast?.("Gagal Memulai", err.message || "Terjadi kesalahan saat memulai pengerjaan.", "error");
    } finally {
      setIsStartingWork(false);
    }
  };

  const fetchRequestDetail = async () => {
    if (!id) return;
    setIsLoadingRequest(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/requests/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Permintaan bantuan tidak ditemukan.");
      }
      setRequest(json.data);
    } catch (err) {
      console.error("Fetch request error in pelamar page:", err);
      setErrorMsg(err.message);
    } finally {
      setIsLoadingRequest(false);
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const [searchFilter, setSearchFilter] = useState("");
  const [sortBy, setSortBy] = useState("recommended"); // 'recommended' | 'price_low' | 'price_high' | 'rating'
  const [filterWithPortfolio, setFilterWithPortfolio] = useState(false);
  const [filterWithCV, setFilterWithCV] = useState(false);

  // Multi-Participant Chat Room State
  const [chattingCandidate, setChattingCandidate] = useState(null);
  const [activeChatRoomCandidateId, setActiveChatRoomCandidateId] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [candidateMessages, setCandidateMessages] = useState({});


  // Apply modal state (if visitor wants to apply too)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [pitchMessage, setPitchMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("1-2 Jam");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [portfolioFileName, setPortfolioFileName] = useState("");
  const [cvFileName, setCvFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview Document Modal state
  const [previewDoc, setPreviewDoc] = useState(null);

  const offersList = useMemo(() => request?.offers || [], [request?.offers]);

  // Filter & Sort Applicants (Declared unconditionally before any return)
  const filteredOffers = useMemo(() => {
    return offersList
      .filter((offer) => {
        const matchesSearch =
          !searchFilter ||
          offer.helperName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
          offer.pitchMessage?.toLowerCase().includes(searchFilter.toLowerCase());

        const matchesPortfolio = !filterWithPortfolio || !!(offer.portfolioName || offer.portfolioUrl);
        const matchesCV = !filterWithCV || !!offer.cvName;

        return matchesSearch && matchesPortfolio && matchesCV;
      })
      .sort((a, b) => {
        if (sortBy === "price_low") return (a.proposedPrice || 0) - (b.proposedPrice || 0);
        if (sortBy === "price_high") return (b.proposedPrice || 0) - (a.proposedPrice || 0);
        if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
        return (b.reliability || 95) - (a.reliability || 95); // 'recommended'
      });
  }, [offersList, searchFilter, sortBy, filterWithPortfolio, filterWithCV]);

  if (isLoadingRequest) {
    return (
      <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Memuat data pelamar...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!request || errorMsg) {
    return (
      <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-black text-slate-900">Permintaan Bantuan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">{errorMsg || "Mungkin permintaan sudah ditutup atau diselesaikan."}</p>
          <Link href="/bantuan" className="px-5 py-2.5 bg-[#1683FF] text-white rounded-2xl text-xs font-bold shadow-md">
            Kembali ke Daftar Bantuan
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = currentUser?.id === request.requesterId || currentUser?.id === request.requester?.id;
  const hasUserOffered = offersList.some((o) => o.helperId === currentUser?.id);
  const isCancelled = request.status === "cancelled";
  const isClosed = isCancelled || request.status === "helper_selected" || request.status === "in_progress" || request.status === "completed";

  const distanceInfo = getDistanceToUser
    ? getDistanceToUser(request.latitude, request.longitude, request.distanceMeters)
    : null;
  const distanceText = request.mode === "online"
    ? "Online"
    : (distanceInfo?.text || (request.distanceMeters ? `${request.distanceMeters} m` : "850 m"));

  // Average offered price
  const avgPrice = offersList.length > 0
    ? Math.round(offersList.reduce((acc, curr) => acc + (curr.proposedPrice || request.rewardAmount), 0) / offersList.length)
    : request.rewardAmount;


  // Open Direct Full-Page Workspace Room (No Floating Popups)
  const handleOpenChat = (offer) => {
    if (startTaskInquiry && request) {
      const inqRoom = startTaskInquiry({ request, offer });
      router.push(`/chat?room=${inqRoom?.id || request.id}`);
    } else {
      router.push(`/chat?room=${request?.id || id}`);
    }
  };

  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !chattingCandidate) return;

    const candidateKey = activeChatRoomCandidateId || chattingCandidate.id || chattingCandidate.helperId;
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: "user",
      senderName: currentUser?.fullName || "Saya",
      senderAvatar: currentUser?.avatarUrl,
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setCandidateMessages((prev) => ({
      ...prev,
      [candidateKey]: [...(prev[candidateKey] || []), newMsg],
    }));
    setChatMessage("");
  };

  // Submit Apply
  const handleSendOffer = (e) => {
    e.preventDefault();
    if (!pitchMessage.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      submitOffer(request.id, {
        pitchMessage: pitchMessage.trim(),
        proposedPrice: Number(proposedPrice) || request.rewardAmount,
        estimatedDuration,
        cvName: cvFileName || null,
        portfolioName: portfolioFileName || (portfolioLink ? "Tautan Portofolio Online" : null),
        portfolioUrl: portfolioLink || null,
      });

      setIsSubmitting(false);
      setIsApplyModalOpen(false);
      setPitchMessage("");
      setProposedPrice("");
      setPortfolioLink("");
      setPortfolioFileName("");
      setCvFileName("");
    }, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
        
        {/* Top Breadcrumb & Category */}
        <div className="flex items-center justify-between">
          <Link
            href={`/bantuan/${request.id}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#1683FF] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Detail Permintaan</span>
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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-semibold">
                  {request.mode === "online" ? (
                    <>
                      <Globe className="w-3.5 h-3.5 text-slate-500" /> Online / Remote
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> Tatap Muka
                    </>
                  )}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Batas: {formatDeadlineWithHour(request.deadline, request.deadlineText)}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sistem Pembayaran Terverifikasi</span>
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
                  <div className="text-[11px] text-emerald-700 font-medium">Dana pembayaran terverifikasi aman</div>
                </div>
              </div>

            </div>

            {/* 2. PEMINTA BANTUAN & ACTION CTA (Mobile: Order 2 - Desktop: col-span-4) */}
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
                {!isOwner ? (
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
                      <span>Ajukan Bantuan Saya</span>
                    </Link>
                  )
                ) : (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                    <div className="text-xs font-bold text-blue-950">Ini Permintaan Milik Anda</div>
                    <div className="text-[11px] text-blue-700 mt-0.5">Pilih helper dari daftar pelamar di bawah.</div>
                  </div>
                )}

                {/* Trust & Payment Guarantee */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Garansi Pembayaran Terverifikasi</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Dana aman diproses resmi sampai tugas selesai disetujui.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. DAFTAR AJUAN PELAMAR MASUK (Mobile: Order 3, Desktop: col-span-8) */}
            <div className="lg:col-span-8 space-y-4 order-3 pt-6 lg:pt-2 border-t lg:border-t-0 border-slate-100">
              
              {/* Header & Filter Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#1683FF]" />
                    <span>Daftar Pelamar Bantuan</span>
                    <span className="px-2 py-0.2 bg-blue-100 text-[#1683FF] text-xs font-bold rounded-full">
                      {filteredOffers.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih penawaran terbaik dan selesaikan pembayaran via QRIS / VA / E-Wallet (Payment Gateway).
                  </p>
                </div>

                {/* Search & Sort Pills */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari pelamar..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-7 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-[#1683FF] w-36"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="recommended">Rekomendasi</option>
                    <option value="rating">Rating</option>
                    <option value="price_low">Harga Terendah</option>
                    <option value="price_high">Harga Tertinggi</option>
                  </select>
                </div>
              </div>

                  {/* Proposals List */}
              <div className="space-y-3">
                {filteredOffers.length > 0 ? (
                  filteredOffers.map((offer, idx) => {
                    const isMyOffer = (currentUser && (offer.helperId === currentUser.id || offer.helper?.id === currentUser.id)) || (currentUser && offer.helperName === currentUser.fullName);
                    const isThisOfferAccepted = (request?.selectedHelperId && (request.selectedHelperId === offer.helperId || request.selectedHelperId === offer.helper?.id)) || offer.status === "accepted";
                    const isThisOfferRejected = (isClosed && !isThisOfferAccepted) || offer.status === "rejected";

                    return (
                      <div
                        key={offer.id || idx}
                        className={`p-4 sm:p-5 rounded-2xl border transition duration-150 shadow-2xs space-y-3 ${
                          isThisOfferAccepted
                            ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300"
                            : isMyOffer
                            ? isThisOfferRejected
                              ? "bg-slate-50/70 border-slate-200 opacity-85"
                              : "bg-blue-50/40 border-blue-200"
                            : "border-slate-200 bg-white hover:border-blue-200"
                        }`}
                      >
                        {/* Helper Header & Price */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {offer.helperAvatar && !offer.helperAvatar.includes("images.unsplash.com") ? (
                              <img
                                src={offer.helperAvatar}
                                alt={offer.helperName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 bg-white"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1683FF] flex items-center justify-center font-black text-xs border border-blue-200 shrink-0 shadow-2xs">
                                {(offer.helperName || "U")[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{offer.helperName}</h4>
                                {offer.helperRole && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                    {offer.helperRole}
                                  </span>
                                )}
                                {isMyOffer && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                                {offer.helperRating !== null && (
                                  <>
                                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      {Number(offer.helperRating).toFixed(1)}
                                    </span>
                                    <span>•</span>
                                  </>
                                )}
                                {offer.helperCampus && (
                                  <>
                                    <span>{offer.helperCampus}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span className="text-emerald-600 font-semibold">
                                  {typeof offer.completedHelps === "number" ? `${offer.completedHelps}x bantu` : "0x bantu"}
                                </span>
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
                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs gap-2">
                        {isMyOffer ? (
                          <div className="flex flex-wrap items-center justify-between w-full gap-2">
                            {isThisOfferAccepted ? (
                              <div className="flex items-center gap-2">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-xs">
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                  <span>Lamaran Diterima</span>
                                </div>
                                {request?.status === "in_progress" && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-[#1683FF] border border-blue-200 font-bold text-[11px] animate-pulse">
                                    <span>Sedang Dikerjakan</span>
                                  </div>
                                )}
                              </div>
                            ) : isThisOfferRejected ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                                <XCircle className="w-4 h-4 text-rose-600" />
                                <span>Lamaran Tidak Diterima</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1683FF] border border-blue-200 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                                <span>Lamaran Anda (Terkirim)</span>
                              </div>
                            )}

                            {/* Jika lamaran DITERIMA dan BELUM mulai dikerjakan: Tombol "Mulai Kerjakan" */}
                            {isThisOfferAccepted && request?.status !== "in_progress" && request?.status !== "completed" ? (
                              <button
                                type="button"
                                disabled={isStartingWork}
                                onClick={() => handleStartWork(offer)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                              >
                                {isStartingWork ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Memulai...</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 fill-white" />
                                    <span>Mulai Kerjakan</span>
                                  </>
                                )}
                              </button>
                            ) : isThisOfferAccepted ? (
                              /* Jika lamaran DITERIMA dan SUDAH mulai dikerjakan: Tombol "Chat Peminta Tugas" */
                              <button
                                type="button"
                                onClick={() => {
                                  if (startTaskInquiry && request) {
                                    const inqRoom = startTaskInquiry({ request, offer });
                                    router.push(`/chat?room=${inqRoom?.id || request.id}`);
                                  } else {
                                    router.push(`/chat?room=${request?.id || id}`);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-[#1683FF] hover:bg-[#0F6FE5] text-white shadow-xs transition cursor-pointer shrink-0"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat Peminta Tugas</span>
                              </button>
                            ) : !isThisOfferRejected ? (
                              /* Jika lamaran masih menunggu seleksi: Chat Peminta */
                              <button
                                type="button"
                                onClick={() => {
                                  if (startTaskInquiry && request) {
                                    const inqRoom = startTaskInquiry({ request, offer });
                                    router.push(`/chat?room=${inqRoom?.id || request.id}`);
                                  } else {
                                    router.push(`/chat?room=${request?.id || id}`);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer shrink-0"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat Peminta</span>
                              </button>
                            ) : null}
                          </div>
                        ) : isOwner ? (
                          <>
                            {isThisOfferAccepted ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Helper Terpilih</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenChat(offer)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 text-xs transition cursor-pointer shrink-0"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                <span>Chat Dulu</span>
                              </button>
                            )}

                            {!isClosed ? (
                              <button
                                type="button"
                                onClick={() => setSelectedOfferToAccept(offer)}
                                className="px-4 py-1.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 text-xs shrink-0 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pilih &amp; Bayar Resmi</span>
                              </button>
                            ) : isThisOfferAccepted ? (
                              <button
                                type="button"
                                onClick={() => handleOpenChat(offer)}
                                className="px-3.5 py-1.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat Helper</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded-md bg-slate-100">
                                Tidak Terpilih
                              </span>
                            )}
                          </>
                        ) : (
                          <div>
                            {isThisOfferAccepted ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                Helper Terpilih
                              </span>
                            ) : isClosed ? (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Tidak Terpilih
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">
                                Diajukan {offer.submittedAt || "Tadi"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })
                ) : (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">Tidak Ada Pelamar yang Sesuai</h4>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-sm mx-auto">
                      Coba sesuaikan kata kunci pencarian atau reset filter.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL PREVIEW DOKUMEN (CV / PORTOFOLIO) */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[32px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto mb-3">
              {previewDoc.type === "cv" ? <FileText className="w-7 h-7" /> : <Briefcase className="w-7 h-7" />}
            </div>

            <h3 className="font-black text-base text-slate-900">{previewDoc.title}</h3>
            <p className="text-xs text-slate-500 mt-1">Diajukan oleh {previewDoc.helperName}</p>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 my-4 text-xs text-slate-600 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Dokumen:</span>
                <span className="font-bold text-slate-800">{previewDoc.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Keamanan:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terenkripsi & Bebas Malware
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(`Mengunduh dokumen: ${previewDoc.name}`);
                  setPreviewDoc(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-black text-xs shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Unduh / Buka Dokumen</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pemilihan Helper & Pembayaran */}
      {selectedOfferToAccept && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedOfferToAccept(null)}
        >
          <div
            className="bg-white rounded-[24px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Konfirmasi Pemilihan Helper</h3>
                  <p className="text-[11px] text-slate-500">Pilih helper resmi untuk mengerjakan tugas Anda</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOfferToAccept(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Helper Card Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {selectedOfferToAccept.helperAvatar && !selectedOfferToAccept.helperAvatar.includes("images.unsplash.com") ? (
                    <img
                      src={selectedOfferToAccept.helperAvatar}
                      alt={selectedOfferToAccept.helperName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 bg-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1683FF] flex items-center justify-center font-black text-xs border border-blue-200 shrink-0 shadow-2xs">
                      {(selectedOfferToAccept.helperName || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {selectedOfferToAccept.helperName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      {selectedOfferToAccept.helperRole && (
                        <span className="font-semibold text-slate-700">
                          {selectedOfferToAccept.helperRole}
                        </span>
                      )}
                      {selectedOfferToAccept.helperRating !== null && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            ★ {Number(selectedOfferToAccept.helperRating).toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Imbalan</div>
                  <div className="font-black text-sm sm:text-base text-[#1683FF]">
                    {formatIDR(selectedOfferToAccept.proposedPrice || request.rewardAmount)}
                  </div>
                </div>
              </div>

              {selectedOfferToAccept.pitchMessage && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60 text-[11px] text-slate-600 line-clamp-2 leading-relaxed italic">
                  &quot;{selectedOfferToAccept.pitchMessage}&quot;
                </div>
              )}
            </div>

            {/* Escrow Guarantee Note */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2 text-[11px] text-emerald-800 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-emerald-900 block">Garansi Rekening Bersama (Escrow):</strong>
                Dana Anda akan diamankan oleh sistem Bantuin dan baru dicairkan ke helper setelah tugas selesai dan disetujui oleh Anda.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedOfferToAccept(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Batal
              </button>

              <Link
                href={`/bantuan/${request.id}/pembayaran?offerId=${selectedOfferToAccept.id}`}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
              >
                <span>Lanjut Bayar Resmi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
