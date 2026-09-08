"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  INITIAL_USER,
  INITIAL_REQUESTS,
  INITIAL_RENTALS,
  INITIAL_SERVICES,
  INITIAL_HELPERS,
  INITIAL_PARTNERS,
  INITIAL_ORDER_ROOMS,
  INITIAL_ORDER_ROOM,
  BANTUIN_POINTS,
} from "@/lib/mock/mockData";
import { detectDisintermediation } from "@/lib/security";
import { 
  calculateDistanceInMeters, 
  formatDistanceText, 
  detectRealtimeLocation,
  extractKabupatenName,
  isItemInKabupaten,
  GPS_FALLBACK_PRESETS
} from "@/lib/services/gpsService";
import LocationPermissionModal from "@/components/modals/LocationPermissionModal";
import { X } from "lucide-react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);
  
  // Persistent location across page refreshes
  const [selectedLocation, setSelectedLocation] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bantuin_selected_location");
        if (saved) return saved;
      } catch (e) {}
    }
    return "Jakarta Selatan";
  });
  
  // Real GPS Coordinates & Location persisted across page refreshes
  const [userCoordinates, setUserCoordinates] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bantuin_user_coords");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [userRealLocation, setUserRealLocation] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bantuin_user_real_location");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isGpsModalOpen, setIsGpsModalOpen] = useState(false);

  const [filterByKabupaten, setFilterByKabupaten] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bantuin_filter_kabupaten");
        if (saved !== null) return JSON.parse(saved);
      } catch (e) {}
    }
    return true;
  });

  // Sync location state to localStorage whenever changed
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (selectedLocation) {
        localStorage.setItem("bantuin_selected_location", selectedLocation);
      }
      if (userCoordinates) {
        localStorage.setItem("bantuin_user_coords", JSON.stringify(userCoordinates));
      }
      if (userRealLocation) {
        localStorage.setItem("bantuin_user_real_location", JSON.stringify(userRealLocation));
      }
      localStorage.setItem("bantuin_filter_kabupaten", JSON.stringify(filterByKabupaten));
    } catch (e) {
      console.warn("Could not sync location state:", e);
    }
  }, [selectedLocation, userCoordinates, userRealLocation, filterByKabupaten]);

  // Sync currentUser campusName with saved location on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLoc = localStorage.getItem("bantuin_selected_location");
        const savedReal = localStorage.getItem("bantuin_user_real_location");
        if (savedLoc && savedLoc !== "Jakarta Selatan") {
          const parsed = savedReal ? JSON.parse(savedReal) : null;
          setCurrentUser((prev) => ({
            ...prev,
            campusName: parsed?.fullAddress || savedLoc,
          }));
        }
      } catch (e) {}
    }
  }, []);
  
  // Datasets
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [rentals, setRentals] = useState(INITIAL_RENTALS);
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [helpers, setHelpers] = useState(INITIAL_HELPERS);
  const [partners] = useState(INITIAL_PARTNERS);
  const [orderRooms, setOrderRooms] = useState(INITIAL_ORDER_ROOMS);
  const [activeOrderRoomId, setActiveOrderRoomId] = useState("order-room-dedi");
  const [bantuinPoints] = useState(BANTUIN_POINTS);

  // Wallet, Escrow & Withdrawals
  const [walletBalance, setWalletBalance] = useState(3850000);
  const [pendingEscrowBalance, setPendingEscrowBalance] = useState(285000);
  const [withdrawals, setWithdrawals] = useState([
    {
      id: "WD-2026-901",
      amount: 500000,
      adminFee: 2500,
      netAmount: 497500,
      bankName: "BCA",
      accountNumber: "8820192841",
      accountHolder: "Rian Prasetya",
      status: "completed", // 'processing', 'completed', 'failed'
      xenditDisbursementId: "DISB-XND-883192",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45000).toISOString(),
    },
    {
      id: "WD-2026-842",
      amount: 250000,
      adminFee: 2500,
      netAmount: 247500,
      bankName: "DANA",
      accountNumber: "081298765432",
      accountHolder: "Rian Prasetya",
      status: "completed",
      xenditDisbursementId: "DISB-XND-772184",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30000).toISOString(),
    }
  ]);

  // Provider Hub Settings
  const [providerSettings, setProviderSettings] = useState({
    isAcceptingOrders: true,
    autoAcceptQuotes: false,
    minRate: 35000,
    maxActiveOrders: 5,
    slaResponseMinutes: 10,
    revisionLimit: 2,
    serviceRadiusKm: 15,
    skills: [
      "Desain Grafis & Logo",
      "Fotografi & Liputan",
      "Web & IT Development",
      "Penerjemah & Copywriting",
      "Print & Fotokopi Kilat"
    ],
  });
  
  // Rental Bookings
  const [rentalBookings, setRentalBookings] = useState([
    {
      id: "booking-1",
      rentalId: "rent-1",
      rentalTitle: "Sony Alpha A6400 Kit 16-50mm + 2 Baterai",
      photoUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      renterId: "user-current-01",
      renterName: "Rian Prasetya",
      ownerName: "Depok Cam Hub (Mitra Resmi)",
      startDate: "2026-09-05",
      endDate: "2026-09-06",
      totalDays: 2,
      rentalFee: 150000,
      depositFee: 150000,
      totalAmount: 300000,
      status: "confirmed_by_owner", // 'temp_locked', 'confirmed_by_owner', 'handed_over', 'returned', 'settled'
      initialPhotos: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"],
      initialNotes: "Body bersih, lensa tanpa jamur, baterai full 2 unit.",
      returnPhotos: [],
      returnNotes: "",
    },
  ]);

  // Admin and Trust & Safety
  const [auditLogs, setAuditLogs] = useState([
    {
      id: "log-1",
      actor: "system@bantuin.id",
      action: "ESCROW_LOCK",
      target: "ORDER #101",
      details: "Dana Rp15.000 berhasil ditahan di Xendit Test Mode Escrow",
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
    {
      id: "log-2",
      actor: "admin@bantuin.id",
      action: "KYC_VERIFIED",
      target: "USER Rian Prasetya",
      details: "Dokumen KTM UI terverifikasi valid",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [reports, setReports] = useState([
    {
      id: "rep-1",
      reporter: "Cindy Clarissa",
      target: "Akun Mencurigakan #992",
      category: "disintermediasi",
      description: "Pengguna mengirim nomor WA sebelum order room terbentuk",
      status: "pending",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  // Toast notification system
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = "success") => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // -------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------

  // Realtime GPS Location Detection
  const detectUserLocation = async (openModalOnDenied = true) => {
    setIsDetectingLocation(true);
    try {
      const loc = await detectRealtimeLocation();
      const coords = {
        latitude: loc.latitude,
        longitude: loc.longitude,
      };
      setUserCoordinates(coords);
      setUserRealLocation(loc);

      const displayLoc = loc.shortLocation || (loc.district ? `${loc.district}, ${loc.city}` : loc.city) || loc.fullAddress || "Lokasi Anda";
      setSelectedLocation(displayLoc);

      // Also update currentUser location for realism
      setCurrentUser((prev) => ({
        ...prev,
        campusName: loc.fullAddress || displayLoc,
      }));

      addToast("Lokasi GPS Terdeteksi", `Lokasi Anda: ${displayLoc}`);
      setIsGpsModalOpen(false);
      return loc;
    } catch (err) {
      console.warn("Deteksi GPS gagal:", err);
      const isDenied = Boolean(
        err.message && (
          err.message.toLowerCase().includes("ditolak") ||
          err.message.toLowerCase().includes("permission")
        )
      );
      if (isDenied && openModalOnDenied) {
        setIsGpsModalOpen(true);
      }
      addToast("Akses Lokasi", err.message || "Gagal mendeteksi lokasi GPS.", "warning");
      throw err;
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Set Manual Location / Simulation Preset
  const setManualLocationPreset = (preset) => {
    if (!preset) return;
    const coords = {
      latitude: preset.latitude,
      longitude: preset.longitude,
    };
    const displayLoc = preset.shortLocation || (preset.district ? `${preset.district}, ${preset.city}` : preset.city) || preset.name;
    setUserCoordinates(coords);
    setUserRealLocation({
      latitude: preset.latitude,
      longitude: preset.longitude,
      city: preset.city,
      district: preset.district,
      province: preset.province,
      shortLocation: displayLoc,
      fullAddress: preset.fullAddress,
    });
    setSelectedLocation(displayLoc);
    setCurrentUser((prev) => ({
      ...prev,
      campusName: preset.fullAddress || displayLoc,
    }));
    addToast("Lokasi Diperbarui", `Posisi aktif: ${preset.name}`);
    setIsGpsModalOpen(false);
  };

  // Smart update that persists and matches preset coordinates if available
  const updateSelectedLocation = (newLoc) => {
    if (!newLoc) return;
    setSelectedLocation(newLoc);
    setFilterByKabupaten(true);

    // If matches any preset, auto-set coordinates and real location
    const matchedPreset = GPS_FALLBACK_PRESETS.find((p) => {
      const q = newLoc.toLowerCase();
      return (
        q.includes(p.city.toLowerCase()) ||
        q.includes(p.name.toLowerCase()) ||
        (p.shortLocation && q.includes(p.shortLocation.toLowerCase())) ||
        (p.district && q.includes(p.district.toLowerCase()))
      );
    });

    if (matchedPreset) {
      const coords = {
        latitude: matchedPreset.latitude,
        longitude: matchedPreset.longitude,
      };
      setUserCoordinates(coords);
      setUserRealLocation({
        latitude: matchedPreset.latitude,
        longitude: matchedPreset.longitude,
        city: matchedPreset.city,
        district: matchedPreset.district,
        province: matchedPreset.province,
        shortLocation: matchedPreset.shortLocation,
        fullAddress: matchedPreset.fullAddress,
      });
      setCurrentUser((prev) => ({
        ...prev,
        campusName: matchedPreset.fullAddress || newLoc,
      }));
    } else {
      const detectedCity = extractKabupatenName(newLoc);
      setUserRealLocation((prev) => ({
        ...(prev || {}),
        city: detectedCity,
        shortLocation: newLoc,
      }));
    }
  };

  // Active Kabupaten name derived from real location or selected location
  const activeKabupaten = extractKabupatenName(selectedLocation, userRealLocation);

  // Filter helper: checks if item is located in user's active kabupaten
  const isItemInCurrentKabupaten = (item) => {
    if (!filterByKabupaten) return true;
    return isItemInKabupaten(item, activeKabupaten, userCoordinates);
  };

  // Distance helper against current user GPS
  const getDistanceToUser = (targetLat, targetLon, fallbackDistanceMeters) => {
    if (
      userCoordinates &&
      targetLat !== undefined &&
      targetLat !== null &&
      targetLon !== undefined &&
      targetLon !== null
    ) {
      const meters = calculateDistanceInMeters(
        userCoordinates.latitude,
        userCoordinates.longitude,
        targetLat,
        targetLon
      );
      if (meters !== null) {
        return {
          meters,
          text: formatDistanceText(meters),
          isRealtime: true,
        };
      }
    }
    const fb = fallbackDistanceMeters || 850;
    return {
      meters: fb,
      text: formatDistanceText(fb),
      isRealtime: false,
    };
  };

  // 1. Create Request with real coordinates
  const createRequest = (newReqData) => {
    const reqLat = newReqData.latitude !== undefined && newReqData.latitude !== null
      ? Number(newReqData.latitude)
      : (userCoordinates?.latitude || -6.2241);
    const reqLon = newReqData.longitude !== undefined && newReqData.longitude !== null
      ? Number(newReqData.longitude)
      : (userCoordinates?.longitude || 106.8294);

    const initialDistance = userCoordinates
      ? calculateDistanceInMeters(userCoordinates.latitude, userCoordinates.longitude, reqLat, reqLon) || 250
      : Math.floor(300 + Math.random() * 800);

    const newRequest = {
      id: `req-${Date.now()}`,
      ...newReqData,
      latitude: reqLat,
      longitude: reqLon,
      distanceMeters: initialDistance,
      status: "published",
      requester: {
        id: currentUser.id,
        name: currentUser.fullName,
        avatar: currentUser.avatarUrl,
        rating: currentUser.ratingAvg,
        campus: currentUser.campusName,
      },
      offers: [],
      createdAt: new Date().toISOString(),
    };

    setRequests((prev) => [newRequest, ...prev]);
    
    // Log to audit
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser.email,
        action: "REQUEST_CREATED",
        target: `REQ #${newRequest.id}`,
        details: `Request "${newRequest.title}" dipublikasikan (Budget: Rp${newRequest.rewardAmount})`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast("Request Berhasil Dibuat!", "Kebutuhanmu telah dipublikasikan ke helper di sekitar.");
    return newRequest;
  };

  // 2. Submit Helper Offer ("Saya Bisa Bantu") dengan Deskripsi Wajib & CV/Portofolio Opsional
  const submitOffer = (requestId, offerData, fallbackPrice) => {
    const isObj = typeof offerData === "object" && offerData !== null;
    const pitchMessage = isObj ? offerData.pitchMessage : offerData;
    const proposedPrice = isObj ? offerData.proposedPrice : fallbackPrice;

    const newOffer = {
      id: `off-${Date.now()}`,
      helperId: currentUser.id,
      helperName: currentUser.fullName,
      helperAvatar: currentUser.avatarUrl,
      rating: currentUser.ratingAvg,
      reliability: currentUser.reliabilityScore || 98,
      completedHelps: currentUser.completedHelpsCount || 1,
      distanceMeters: Math.floor(200 + Math.random() * 600),
      pitchMessage,
      proposedPrice: Number(proposedPrice) || 25000,
      estimatedDuration: isObj ? offerData.estimatedDuration || "1-2 Jam" : "1-2 Jam",
      cvName: isObj ? offerData.cvName || null : null,
      portfolioName: isObj ? offerData.portfolioName || null : null,
      portfolioUrl: isObj ? offerData.portfolioUrl || null : null,
      submittedAt: "Baru saja",
    };

    setRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const updatedOffers = [newOffer, ...(req.offers || [])];
          return {
            ...req,
            status: "has_offers",
            offers: updatedOffers,
          };
        }
        return req;
      })
    );

    addToast("Ajuan Bantuan Terkirim!", "Proposal tawaran bantuan & lampiran portofoliomu berhasil diajukan.");
    return newOffer;
  };

  // 3. Select Helper & Create / Upgrade Order Room
  const selectHelper = (requestId, offer, existingRoomId = null) => {
    let selectedReq = requests.find((r) => r.id === requestId) || requests[0];
    if (!selectedReq) return;

    const baseAmount = Number(offer?.proposedPrice) || Number(selectedReq.rewardAmount) || 35000;
    const platformFee = Math.round(baseAmount * 0.14);
    const helperPayoutAmount = baseAmount - platformFee;

    const newOrderRoomId = existingRoomId || `order-room-${Date.now()}`;
    const newOrderRoom = {
      id: newOrderRoomId,
      requestId: selectedReq.id,
      requestTitle: selectedReq.title,
      requester: {
        id: selectedReq.requester?.id || currentUser.id,
        name: selectedReq.requester?.name || currentUser.fullName,
        avatar: selectedReq.requester?.avatar || currentUser.avatar,
        phone: "081298765432",
        rating: selectedReq.requester?.rating || 4.95,
      },
      helper: {
        id: offer?.helperId || "user-hlp-1",
        name: offer?.helperName || "Helper Bantuin",
        avatar: offer?.helperAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        phone: "081311223344",
        rating: offer?.rating || 4.9,
      },
      mode: selectedReq.mode || "offline",
      category: selectedReq.category || "Bantuan",
      lockedAmount: baseAmount,
      platformFee: platformFee,
      helperPayoutAmount: helperPayoutAmount,
      pickupPoint: selectedReq.pickupPoint || selectedReq.locationName,
      destination: selectedReq.locationName,
      deadline: selectedReq.deadline,
      orderStatus: "room_created",
      xenditStatus: "HELD_IN_ESCROW",
      xenditInvoiceId: `BTN-INV-${Math.floor(100000 + Math.random() * 900000)}`,
      proofPhotos: [],
      digitalFiles: [],
      submissionUrl: "",
      proofNotes: "",
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: "system",
          senderName: "Bantuin Escrow Bot",
          message: `Dana sebesar Rp${baseAmount.toLocaleString('id-ID')} telah berhasil dikunci di Rekening Bersama (Escrow). Helper dapat segera mulai pengerjaan tugas!`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ],
    };

    setOrderRooms((prev) => {
      const existingIdx = prev.findIndex(
        (r) => r.id === existingRoomId || (r.requestId === selectedReq.id && r.helper?.id === offer?.helperId)
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          lockedAmount: baseAmount,
          platformFee: platformFee,
          helperPayoutAmount: helperPayoutAmount,
          orderStatus: "room_created",
          xenditStatus: "HELD_IN_ESCROW",
          messages: [
            ...(updated[existingIdx].messages || []),
            {
              id: `msg-${Date.now()}`,
              senderId: "system",
              senderName: "Bantuin Escrow Bot",
              message: `Dana sebesar Rp${baseAmount.toLocaleString('id-ID')} telah berhasil dikunci di Rekening Bersama (Escrow) Bantuin. Status penugasan kini AKTIF!`,
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              isSystem: true,
            },
          ],
        };
        return updated;
      }
      return [newOrderRoom, ...prev];
    });

    setActiveOrderRoomId(newOrderRoomId);

    // Update request status
    setRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, status: "helper_selected" } : req))
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser.email,
        action: "HELPER_SELECTED",
        target: `ORDER #${newOrderRoomId}`,
        details: `Helper ${offer?.helperName} dipilih. Dana Rp${baseAmount} ditahan di Rekening Bersama Escrow.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast("Helper Dipilih & Dana Terkunci!", "Pembayaran berhasil diamankan di Rekening Bersama Bantuin.");
    return newOrderRoomId;
  };

  // 4. Update Order Room Status
  const updateOrderStatus = (orderRoomId, newStatus) => {
    setOrderRooms((prev) =>
      prev.map((room) => {
        if (room.id === orderRoomId) {
          return { ...room, orderStatus: newStatus };
        }
        return room;
      })
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser.email,
        action: "ORDER_STATUS_UPDATE",
        target: `ORDER #${orderRoomId}`,
        details: `Status diperbarui menjadi: ${newStatus}`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // 5. Submit Proof of Work (Handles Photo and Digital Files / Links)
  const submitProof = (orderRoomId, proofData, notes = "") => {
    setOrderRooms((prev) =>
      prev.map((room) => {
        if (room.id === orderRoomId) {
          const isObj = typeof proofData === "object" && proofData !== null;
          const photoUrl = isObj ? proofData.photoUrl : (typeof proofData === "string" ? proofData : "");
          const digitalFiles = isObj ? proofData.digitalFiles || [] : [];
          const submissionUrl = isObj ? proofData.submissionUrl || "" : "";
          const finalNotes = notes || (isObj ? proofData.notes : "") || "Bukti pengerjaan berhasil diserahkan.";

          return {
            ...room,
            proofPhotos: photoUrl ? [photoUrl, ...(room.proofPhotos || [])] : (room.proofPhotos || []),
            digitalFiles: digitalFiles.length > 0 ? digitalFiles : (room.digitalFiles || []),
            submissionUrl: submissionUrl || room.submissionUrl || "",
            proofNotes: finalNotes,
            orderStatus: "proof_submitted",
          };
        }
        return room;
      })
    );

    addToast("Hasil Tugas Terkirim", "Bukti pengerjaan tugas & file digital telah berhasil diserahkan.");
  };

  // 6. Confirm Complete & Release Payout (Requester) with Rating and Profile Updates
  const confirmOrderCompletion = (orderRoomId, reviewData = { rating: 5, feedback: "" }) => {
    const numericRating = Number(reviewData?.rating) || 5;
    const reviewFeedback = reviewData?.feedback || "Tugas diselesaikan dengan sangat baik & tepat waktu.";
    let releasedAmount = 35000;
    let helperId = "";
    let helperName = "";

    setOrderRooms((prev) =>
      prev.map((room) => {
        if (room.id === orderRoomId) {
          releasedAmount = Number(room.helperPayoutAmount || room.lockedAmount || 35000);
          helperId = room.helper?.id;
          helperName = room.helper?.name || "Helper";

          const updatedHelper = {
            ...room.helper,
            completedOrders: (room.helper?.completedOrders || 0) + 1,
            completedHelps: (room.helper?.completedHelps || 0) + 1,
            rating: numericRating,
          };

          return {
            ...room,
            orderStatus: "completed",
            xenditStatus: "PAYOUT_RELEASED",
            helper: updatedHelper,
            review: {
              rating: numericRating,
              feedback: reviewFeedback,
              createdAt: new Date().toISOString(),
            },
            messages: [
              ...(room.messages || []),
              {
                id: `msg-${Date.now()}`,
                senderId: "system",
                senderName: "Bantuin Escrow Bot",
                message: `Tugas telah dikonfirmasi selesai! Imbalan Rp${releasedAmount.toLocaleString('id-ID')} telah dicairkan ke dompet ${helperName}. Penilaian diberikan: ⭐ ${numericRating}/5. Profil helper berhasil diperbarui!`,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                isSystem: true,
              },
            ],
          };
        }
        return room;
      })
    );

    // Credit to Helper Wallet Balance
    setWalletBalance((prev) => prev + releasedAmount);
    setPendingEscrowBalance((prev) => Math.max(0, prev - releasedAmount));

    // Update currentUser profile (ratingAvg, ratingCount, completedHelpsCount)
    setCurrentUser((prev) => {
      const prevCount = prev.ratingCount || 1;
      const prevAvg = prev.ratingAvg || 4.95;
      const newRatingCount = prevCount + 1;
      const newRatingAvg = Number(((prevAvg * prevCount + numericRating) / newRatingCount).toFixed(2));
      const newCompletedCount = (prev.completedHelpsCount || 28) + 1;

      return {
        ...prev,
        ratingAvg: newRatingAvg,
        ratingCount: newRatingCount,
        completedHelpsCount: newCompletedCount,
        completedOrders: [
          ...(prev.completedOrders || []),
          {
            orderId: orderRoomId,
            completedAt: new Date().toISOString(),
            payout: releasedAmount,
            rating: numericRating,
            review: reviewFeedback,
          },
        ],
      };
    });

    // Also update services matching this helper in services state
    setServices((prev) =>
      prev.map((srv) => {
        if (
          srv.providerId === helperId ||
          (helperName && srv.providerName && srv.providerName.toLowerCase().includes(helperName.toLowerCase()))
        ) {
          return {
            ...srv,
            completedJobs: (srv.completedJobs || 0) + 1,
            reviewsCount: (srv.reviewsCount || 0) + 1,
            ratingAvg: Number(((Number(srv.ratingAvg || 4.9) * 10 + numericRating) / 11).toFixed(2)),
          };
        }
        return srv;
      })
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser.email,
        action: "PAYOUT_RELEASED",
        target: `ORDER #${orderRoomId}`,
        details: `Requester mengonfirmasi selesai. Dana Rp${releasedAmount.toLocaleString('id-ID')} cair ke Helper. Rating ${numericRating} bintang & profil helper diperbarui.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast(
      "Pesanan Selesai & Profil Terupdate!",
      `Dana Rp${releasedAmount.toLocaleString('id-ID')} cair ke helper & rating ${numericRating} bintang tercatat di profil.`
    );
  };

  // 6b. Withdraw Wallet Balance (Xendit Disbursement)
  const withdrawFunds = ({ amount, bankName, accountNumber, accountHolder }) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 20000) {
      addToast("Gagal Tarik Dana", "Minimal penarikan saldo adalah Rp20.000", "error");
      return false;
    }
    if (numAmount > walletBalance) {
      addToast("Saldo Tidak Cukup", "Jumlah penarikan melebihi saldo tersedia Anda.", "error");
      return false;
    }

    const adminFee = 2500;
    const netAmount = numAmount - adminFee;
    const newWithdrawal = {
      id: `WD-${Date.now()}`,
      amount: numAmount,
      adminFee,
      netAmount,
      bankName: bankName || "BCA",
      accountNumber: accountNumber || "8820192841",
      accountHolder: accountHolder || currentUser.fullName,
      status: "completed",
      xenditDisbursementId: `DISB-XND-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 15000).toISOString(),
    };

    setWalletBalance((prev) => prev - numAmount);
    setWithdrawals((prev) => [newWithdrawal, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser.email,
        action: "WITHDRAWAL_PROCESSED",
        target: `WITHDRAW #${newWithdrawal.id}`,
        details: `Penarikan dana Rp${numAmount.toLocaleString('id-ID')} ke ${newWithdrawal.bankName} (${newWithdrawal.accountNumber}) sukses via Xendit.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast(
      "Penarikan Berhasil Diproses!",
      `Dana Rp${netAmount.toLocaleString('id-ID')} sedang ditransfer ke ${newWithdrawal.bankName} (${newWithdrawal.accountNumber}).`
    );
    return true;
  };

  // 6c. Top Up Wallet Balance (Xendit Pay-In)
  const topUpFunds = ({ amount, paymentMethod }) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 10000) {
      addToast("Gagal Isi Saldo", "Minimal isi ulang saldo adalah Rp10.000", "error");
      return false;
    }

    setWalletBalance((prev) => prev + numAmount);

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser.email,
        action: "WALLET_TOPUP",
        target: `TOPUP #TOP-${Date.now()}`,
        details: `Isi ulang saldo dompet Bantuin sebesar Rp${numAmount.toLocaleString('id-ID')} via ${paymentMethod || "QRIS"} berhasil.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast(
      "Isi Saldo Berhasil!",
      `Saldo Rp${numAmount.toLocaleString('id-ID')} telah berhasil ditambahkan ke Dompet Bantuin Anda.`
    );
    return true;
  };

  // 6d. Services CRUD for Provider Portal
  const addService = (serviceData) => {
    const newService = {
      id: `srv-${Date.now()}`,
      providerName: currentUser.fullName,
      providerAvatar: currentUser.avatarUrl,
      rating: 5.0,
      reviewsCount: 0,
      completedJobs: 0,
      location: selectedLocation || "Jabodetabek",
      isVerified: true,
      ...serviceData,
      createdAt: new Date().toISOString(),
    };

    setServices((prev) => [newService, ...prev]);
    addToast("Layanan Baru Dipublikasikan", `Paket "${newService.title}" siap menerima order dari klien.`);
    return newService;
  };

  const updateService = (serviceId, updatedData) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updatedData } : s))
    );
    addToast("Layanan Diperbarui", "Perubahan tarif dan deskripsi berhasil disimpan.");
  };

  const deleteService = (serviceId) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    addToast("Layanan Dihapus", "Paket jasa telah dihapus dari etalase publik.");
  };

  const updateProviderSettings = (newSettings) => {
    setProviderSettings((prev) => ({ ...prev, ...newSettings }));
    addToast("Pengaturan Jasa Disimpan", "Preferensi ketersediaan dan tarif berhasil diperbarui.");
  };

  // 7. Send Chat Message with Anti-Disintermediation check
  const sendChatMessage = (orderRoomId, messageText) => {
    const check = detectDisintermediation(messageText);
    
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      message: messageText,
      hasWarning: check.flagged,
      warningReason: check.reason,
      timestamp: new Date().toISOString(),
    };

    setOrderRooms((prev) =>
      prev.map((room) => {
        if (room.id === orderRoomId) {
          return {
            ...room,
            messages: [...(room.messages || []), newMsg],
          };
        }
        return room;
      })
    );

    if (check.flagged) {
      addToast("Peringatan Keamanan", check.reason, "warning");
    }
  };

  // 7b. Delete Chat Message
  const deleteChatMessage = (orderRoomId, messageId) => {
    setOrderRooms((prev) =>
      prev.map((room) => {
        if (room.id === orderRoomId) {
          return {
            ...room,
            messages: (room.messages || []).filter((msg) => msg.id !== messageId),
          };
        }
        return room;
      })
    );
    addToast("Pesan Dihapus", "Pesan telah berhasil dihapus dari ruang obrolan.");
  };

  // 7c. Delete Entire Chat Room / Conversation
  const deleteChatRoom = (orderRoomId) => {
    setOrderRooms((prev) => prev.filter((room) => room.id !== orderRoomId));
    addToast("Obrolan Dihapus", "Seluruh percakapan telah berhasil dihapus.");
  };

  // 7d. Edit Chat Message
  const editChatMessage = (orderRoomId, messageId, newText) => {
    if (!newText || !newText.trim()) return;
    const check = detectDisintermediation(newText);
    setOrderRooms((prev) =>
      prev.map((room) => {
        if (room.id === orderRoomId) {
          return {
            ...room,
            messages: (room.messages || []).map((msg) => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  message: newText.trim(),
                  isEdited: true,
                  hasWarning: check.flagged,
                  warningReason: check.reason,
                };
              }
              return msg;
            }),
          };
        }
        return room;
      })
    );
    if (check.flagged) {
      addToast("Peringatan Keamanan", check.reason, "warning");
    } else {
      addToast("Pesan Diperbarui", "Pesan telah berhasil diedit.");
    }
  };

  // 8. Book Rental Item (with 15-min temp lock & condition checklist)
  const bookRental = (rentalId, startDate, endDate, totalDays, conditionNotes) => {
    const targetRental = rentals.find((r) => r.id === rentalId);
    if (!targetRental) return;

    const rentalFee = targetRental.dailyPrice * totalDays;
    const depositFee = targetRental.depositAmount;
    const totalAmount = rentalFee + depositFee;

    const newBooking = {
      id: `booking-${Date.now()}`,
      rentalId: targetRental.id,
      rentalTitle: targetRental.title,
      photoUrl: targetRental.photoUrl,
      renterId: currentUser.id,
      renterName: currentUser.fullName,
      ownerName: targetRental.owner.name,
      startDate,
      endDate,
      totalDays,
      rentalFee,
      depositFee,
      totalAmount,
      status: "temp_locked",
      lockExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      initialPhotos: [targetRental.photoUrl],
      initialNotes: conditionNotes || "Checklist kondisi awal tervalidasi oleh sistem.",
      returnPhotos: [],
      returnNotes: "",
    };

    setRentalBookings((prev) => [newBooking, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser.email,
        action: "RENTAL_LOCKED",
        target: `RENTAL #${targetRental.id}`,
        details: `Slot tanggal ${startDate} s/d ${endDate} terkunci sementara 15 menit untuk pembayaran escrow.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast("Slot Berhasil Dikunci!", "Slot tanggal terkunci 15 menit. Menunggu konfirmasi pemilik.");
    return newBooking;
  };

  // 9. KYC Submit & Admin KYC Verify
  const submitKYC = (ktmPhotoUrl, selfieUrl) => {
    setCurrentUser((prev) => ({
      ...prev,
      verificationStatus: "pending_review",
      idCardUrl: ktmPhotoUrl,
      selfieUrl,
    }));
    addToast("Dokumen KYC Terkirim", "Tim verifikasi Bantuin akan meninjau dokumenmu dalam 1x24 jam.");
  };

  const adminVerifyUser = (userId, approved, reason) => {
    setCurrentUser((prev) => {
      if (prev.id === userId) {
        return {
          ...prev,
          verificationStatus: approved ? "verified" : "rejected",
          verificationNotes: reason,
        };
      }
      return prev;
    });

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: "admin@bantuin.id",
        action: approved ? "KYC_APPROVED" : "KYC_REJECTED",
        target: `USER #${userId}`,
        details: approved ? "Identitas resmi disetujui" : `Ditolak: ${reason}`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast(approved ? "User Disetujui" : "User Ditolak", `Status KYC telah diperbarui.`);
  };

  // 10. Admin Resolve Dispute
  const resolveDispute = (reportId, decisionNotes, refundEscrow) => {
    setReports((prev) =>
      prev.map((rep) => (rep.id === reportId ? { ...rep, status: "resolved", adminNotes: decisionNotes } : rep))
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: "admin@bantuin.id",
        action: "DISPUTE_RESOLVED",
        target: `REPORT #${reportId}`,
        details: `Keputusan: ${decisionNotes}. ${refundEscrow ? "Dana escrow di-refund ke Requester." : "Dana dicairkan ke Helper."}`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast("Sengketa Selesai", "Keputusan admin telah tersimpan di immutable audit log.");
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        selectedLocation,
        setSelectedLocation: updateSelectedLocation,
        userCoordinates,
        setUserCoordinates,
        userRealLocation,
        isDetectingLocation,
        detectUserLocation,
        getDistanceToUser,
        activeKabupaten,
        filterByKabupaten,
        setFilterByKabupaten,
        isItemInCurrentKabupaten,
        isGpsModalOpen,
        setIsGpsModalOpen,
        setManualLocationPreset,
        requests,
        setRequests,
        rentals,
        setRentals,
        services,
        helpers,
        partners,
        orderRooms,
        activeOrderRoomId,
        setActiveOrderRoomId,
        bantuinPoints,
        rentalBookings,
        auditLogs,
        reports,
        toasts,
        walletBalance,
        setWalletBalance,
        pendingEscrowBalance,
        withdrawals,
        withdrawFunds,
        topUpFunds,
        providerSettings,
        updateProviderSettings,
        addService,
        updateService,
        deleteService,
        addToast,
        removeToast,
        createRequest,
        submitOffer,
        selectHelper,
        updateOrderStatus,
        submitProof,
        confirmOrderCompletion,
        sendChatMessage,
        deleteChatMessage,
        editChatMessage,
        deleteChatRoom,
        bookRental,
        submitKYC,
        adminVerifyUser,
        resolveDispute,
      }}
    >
      {children}

      {/* Location Permission / GPS Guide Modal */}
      <LocationPermissionModal
        isOpen={isGpsModalOpen}
        onClose={() => setIsGpsModalOpen(false)}
        onSelectPreset={setManualLocationPreset}
        onRetryGPS={() => detectUserLocation(false)}
        isDetecting={isDetectingLocation}
      />

      {/* Global Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-300 animate-slide-up ${
              toast.type === "warning"
                ? "bg-amber-50/95 border-amber-300 text-amber-900"
                : toast.type === "error"
                ? "bg-rose-50/95 border-rose-300 text-rose-900"
                : "bg-white/95 border-[#DCEAF7] text-[#102A43]"
            }`}
          >
            <div className="pr-3">
              <div className="font-semibold text-sm">{toast.title}</div>
              <div className="text-xs text-[#61758A] mt-0.5 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
