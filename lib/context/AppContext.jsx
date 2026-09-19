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
import { formatIDR } from "@/lib/utils";
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

  // Helper to initialize initial rental reviews and stats
  const getInitialRentals = () => {
    return INITIAL_RENTALS.map((r) => ({
      ...r,
      totalRentedCount: r.totalRentedCount ?? r.owner?.completedOrders ?? 86,
      ratingAvg: r.ratingAvg ?? 4.95,
      ratingCount: r.ratingCount ?? 38,
      stock: typeof r.stock === "number" ? r.stock : 3,
      reviews: r.reviews && r.reviews.length > 0 ? r.reviews : [
        {
          id: `rev-init-${r.id}-1`,
          userName: "Dimas Anggoro",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          rating: 5,
          date: "2 hari yang lalu",
          item: r.title,
          comment: "Unit bersih banget, sensor kinclong no debu. Baterai dikasih 2 buah awet seharian buat hunting wisuda. Pelayanan ramah dan tempatnya gampang dicari!",
        },
        {
          id: `rev-init-${r.id}-2`,
          userName: "Natasha Caroline",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
          rating: 5,
          date: "1 minggu yang lalu",
          item: r.title,
          comment: "Sangat terbantu buat sewa perlengkapan tugas dan wisuda kampus. Rekber Bantuin bikin tenang gak takut uang hilang. Tokonya amanah dan tepat waktu!",
        },
        {
          id: `rev-init-${r.id}-3`,
          userName: "Rifky Fauzi",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
          rating: 5,
          date: "2 minggu yang lalu",
          item: r.title,
          comment: "Unit dalam kondisi sangat prima. Dipandu cara penggunaan dan pengecekan fisik bersama mas-mas tokonya. Top rekomen buat vendor sewa di sini.",
        }
      ]
    }));
  };

  const [rentals, setRentals] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bantuin_rentals_state");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return getInitialRentals();
  });

  // Sync rentals to localStorage whenever changed
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (rentals && rentals.length > 0) {
        localStorage.setItem("bantuin_rentals_state", JSON.stringify(rentals));
      }
    } catch (e) {
      console.warn("Could not sync rentals state:", e);
    }
  }, [rentals]);

  const [services, setServices] = useState(INITIAL_SERVICES);
  const [helpers, setHelpers] = useState(INITIAL_HELPERS);
  const [partners] = useState(INITIAL_PARTNERS);
  const [orderRooms, setOrderRooms] = useState(INITIAL_ORDER_ROOMS);
  const [activeOrderRoomId, setActiveOrderRoomId] = useState("order-room-dedi");
  const [bantuinPoints] = useState(BANTUIN_POINTS);

  // -------------------------------------------------------------
  // LEDGER & HAK PEMBAYARAN MITRA (NON E-MONEY)
  // -------------------------------------------------------------
  const [mitraAvailableBalance, setMitraAvailableBalance] = useState(3850000); // Saldo dapat dicairkan (Hak status AVAILABLE)
  const [mitraPendingBalance, setMitraPendingBalance] = useState(285000);     // Dana tertahan (Hak status PENDING)
  const [mitraTotalEarned, setMitraTotalEarned] = useState(6450000);        // Total akumulasi pendapatan bersih

  // Backward compatibility alias
  const walletBalance = mitraAvailableBalance;
  const pendingEscrowBalance = mitraPendingBalance;
  const setWalletBalance = setMitraAvailableBalance;

  // Tracking Deposit Jaminan Sewa Customer (Terpisah mutlak dari pendapatan platform, 0% komisi)
  const [customerDeposits, setCustomerDeposits] = useState([
    {
      id: "DEP-2026-101",
      rentalOrderId: "order-room-rental-kamera",
      rentalTitle: "Sony Alpha A7 III + Lensa 24-70mm GM",
      depositAmount: 500000,
      refundAmount: 500000,
      deductionAmount: 0,
      deductionReason: "",
      status: "WAITING_RETURN", // 'WAITING_RETURN' | 'INSPECTION' | 'READY_FOR_REFUND' | 'REFUND_PENDING' | 'REFUNDED' | 'DISPUTE'
      paymentMethod: "QRIS",
      customerBank: "BCA",
      customerAccountNumber: "8820192841",
      customerAccountHolder: "Rian Prasetya",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      refundedAt: null,
    },
    {
      id: "DEP-2026-098",
      rentalOrderId: "order-room-098",
      rentalTitle: "DJI Ronin SC Gimbal Stabilizer",
      depositAmount: 200000,
      refundAmount: 200000,
      deductionAmount: 0,
      deductionReason: "",
      status: "REFUNDED",
      paymentMethod: "BCA Virtual Account",
      customerBank: "BCA",
      customerAccountNumber: "8820192841",
      customerAccountHolder: "Rian Prasetya",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      refundedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ]);

  // Riwayat Pengajuan Penarikan Dana (Withdrawal) Mitra - Transfer Manual Admin (MVP)
  const [withdrawals, setWithdrawals] = useState([
    {
      id: "WD-2026-902",
      mitraId: "mitra-bayu",
      mitraName: "Bayu Pratama",
      amount: 92000,
      adminFee: 2500,
      feePaidBy: "BANTUIN_OPERATIONAL", // Ditanggung platform Bantuin.id!
      netAmount: 92000, // Mitra terima 100% penuh tanpa potongan
      bankName: "Mandiri",
      accountNumber: "157000982312",
      accountHolder: "Bayu Pratama",
      status: "PENDING", // PENDING -> SUCCESS (setelah admin transfer manual)
      requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      processedAt: null,
      notes: "Menunggu transfer manual oleh admin via m-Banking",
    },
    {
      id: "WD-2026-901",
      mitraId: "user-current-01",
      mitraName: "Rian Prasetya",
      amount: 500000,
      adminFee: 2500,
      feePaidBy: "BANTUIN_OPERATIONAL",
      netAmount: 500000,
      bankName: "BCA",
      accountNumber: "8820192841",
      accountHolder: "Rian Prasetya",
      status: "SUCCESS",
      requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45000).toISOString(),
      notes: "Transfer manual admin berhasil via BCA",
    }
  ]);

  // General Ledger Entitlement & Financial Entries
  const [ledgerEntries, setLedgerEntries] = useState([
    {
      id: "LEDGER-001",
      orderId: "order-room-101",
      type: "CUSTOMER_RENTAL_PAYMENT",
      grossAmount: 352000,
      gatewayFee: 2000,
      rentalFee: 150000,
      depositAmount: 200000,
      platformFee: 12000,
      mitraEntitlement: 138000,
      description: "Pembayaran customer via QRIS untuk Rental Sony Alpha A7 III + Deposit",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "LEDGER-002",
      orderId: "order-room-101",
      type: "CUSTOMER_DEPOSIT",
      grossAmount: 200000,
      gatewayFee: 0,
      rentalFee: 0,
      depositAmount: 200000,
      platformFee: 0,
      mitraEntitlement: 0,
      description: "Deposit jaminan perlindungan kamera (titipan refundable 0% komisi)",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "LEDGER-003",
      orderId: "order-room-101",
      type: "PLATFORM_COMMISSION",
      grossAmount: 0,
      gatewayFee: 0,
      rentalFee: 150000,
      depositAmount: 0,
      platformFee: 12000,
      mitraEntitlement: 0,
      description: "Komisi platform Bantuin.id 8% dari sewa Rp150.000",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "LEDGER-004",
      orderId: "order-room-101",
      type: "MITRA_ENTITLEMENT",
      grossAmount: 0,
      gatewayFee: 0,
      rentalFee: 150000,
      depositAmount: 0,
      platformFee: 0,
      mitraEntitlement: 138000,
      description: "Hak pemilik rental (status PENDING saat barang sedang disewa)",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "LEDGER-005",
      orderId: "WD-2026-901",
      type: "MITRA_WITHDRAWAL",
      grossAmount: 0,
      gatewayFee: 0,
      rentalFee: 0,
      depositAmount: 0,
      platformFee: 0,
      mitraEntitlement: -500000,
      description: "Pencairan transfer manual admin ke BCA Rian Prasetya (Fee admin Rp2.500 ditanggung platform)",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
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
  const INITIAL_BOOKINGS = [
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
      status: "confirmed_by_owner", // 'temp_locked', 'confirmed_by_owner', 'handed_over', 'returned', 'completed'
      initialPhotos: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"],
      initialNotes: "Body bersih, lensa tanpa jamur, baterai full 2 unit.",
      returnPhotos: [],
      returnNotes: "",
    },
  ];

  const [rentalBookings, setRentalBookings] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bantuin_rental_bookings_state");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_BOOKINGS;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (rentalBookings && rentalBookings.length > 0) {
        localStorage.setItem("bantuin_rental_bookings_state", JSON.stringify(rentalBookings));
      }
    } catch (e) {
      console.warn("Could not sync rental bookings state:", e);
    }
  }, [rentalBookings]);

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

  // Active Kabupaten name derived from real location or selected location (exact sync with Navbar)
  const activeLocationStr = userRealLocation?.shortLocation || selectedLocation || userRealLocation?.city || "";
  const activeKabupaten = extractKabupatenName(activeLocationStr, userRealLocation);

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
    const platformFee = Math.round(baseAmount * 0.08);
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
                message: room.orderType === "service"
                  ? `Layanan jasa "${room.requestTitle}" telah dikonfirmasi selesai! Dana imbalan sebesar Rp${releasedAmount.toLocaleString('id-ID')} telah dicairkan ke saldo mitra ${helperName}. Penilaian diberikan: ⭐ ${numericRating}/5. Transaksi selesai!`
                  : `Tugas telah dikonfirmasi selesai! Imbalan Rp${releasedAmount.toLocaleString('id-ID')} telah dicairkan ke dompet ${helperName}. Penilaian diberikan: ⭐ ${numericRating}/5. Profil helper berhasil diperbarui!`,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                isSystem: true,
              },
            ],
          };
        }
        return room;
      })
    );

    // Shift Mitra Entitlement status from PENDING to AVAILABLE
    setMitraPendingBalance((prev) => Math.max(0, prev - releasedAmount));
    setMitraAvailableBalance((prev) => prev + releasedAmount);
    setMitraTotalEarned((prev) => prev + releasedAmount);

    // Record ledger entry: MITRA_ENTITLEMENT turning AVAILABLE
    setLedgerEntries((prev) => [
      {
        id: `LEDGER-${Date.now()}`,
        orderId: orderRoomId,
        type: "MITRA_ENTITLEMENT",
        grossAmount: 0,
        gatewayFee: 0,
        rentalFee: 0,
        depositAmount: 0,
        platformFee: 0,
        mitraEntitlement: releasedAmount,
        description: `Hak mitra beralih ke status AVAILABLE (dapat dicairkan) setelah pesanan dikonfirmasi selesai.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

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

  // 6b. Request Withdrawal (Mitra Entitlement Payout Request)
  const withdrawFunds = ({ amount, bankName, accountNumber, accountHolder }) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 20000) {
      addToast("Gagal Pengajuan", "Minimal penarikan saldo adalah Rp20.000", "error");
      return false;
    }
    if (numAmount > mitraAvailableBalance) {
      addToast("Saldo Tidak Cukup", "Jumlah penarikan melebihi saldo dapat dicairkan Anda.", "error");
      return false;
    }

    const adminFee = 2500;
    // Fee transfer admin Rp2.500 ditanggung Bantuin.id! Mitra menerima 100% utuh tanpa potongan
    const newWithdrawal = {
      id: `WD-${Date.now()}`,
      mitraId: currentUser.id || "user-current-01",
      mitraName: currentUser.fullName || "Rian Prasetya",
      amount: numAmount,
      adminFee,
      feePaidBy: "BANTUIN_OPERATIONAL",
      netAmount: numAmount, // Mitra menerima 100% utuh!
      bankName: bankName || "BCA",
      accountNumber: accountNumber || "8820192841",
      accountHolder: accountHolder || currentUser.fullName,
      status: "PENDING", // WITHDRAWAL_PENDING
      requestedAt: new Date().toISOString(),
      processedAt: null,
      transferReference: null,
      notes: "Menunggu transfer manual oleh admin via m-Banking",
    };

    setMitraAvailableBalance((prev) => prev - numAmount);
    setWithdrawals((prev) => [newWithdrawal, ...prev]);

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser.email,
        action: "WITHDRAWAL_REQUESTED",
        target: `WITHDRAW #${newWithdrawal.id}`,
        details: `Mitra mengajukan penarikan Rp${numAmount.toLocaleString('id-ID')} ke ${newWithdrawal.bankName} (${newWithdrawal.accountNumber}). Status: WITHDRAWAL_PENDING. Biaya transfer ditanggung platform.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    addToast(
      "Pengajuan Penarikan Terkirim!",
      `Permintaan pencairan Rp${numAmount.toLocaleString('id-ID')} sedang menunggu transfer manual admin. Dana akan ditransfer penuh tanpa potongan fee.`
    );
    return true;
  };

  // 6c. Admin: Tandai Transfer Manual Berhasil (WITHDRAWAL_SUCCESS)
  const adminMarkWithdrawalSuccess = (withdrawalId, transferReference = "") => {
    let targetWd = null;
    setWithdrawals((prev) =>
      prev.map((wd) => {
        if (wd.id === withdrawalId) {
          targetWd = {
            ...wd,
            status: "SUCCESS",
            processedAt: new Date().toISOString(),
            transferReference: transferReference || `TRF-MANUAL-${Date.now()}`,
          };
          return targetWd;
        }
        return wd;
      })
    );

    if (targetWd) {
      setLedgerEntries((prev) => [
        {
          id: `LEDGER-${Date.now()}`,
          orderId: targetWd.id,
          type: "MITRA_WITHDRAWAL",
          grossAmount: 0,
          gatewayFee: 0,
          rentalFee: 0,
          depositAmount: 0,
          platformFee: 0,
          mitraEntitlement: -targetWd.amount,
          description: `Transfer manual admin berhasil ke ${targetWd.bankName} ${targetWd.accountNumber} an ${targetWd.accountHolder} (Ref: ${transferReference || targetWd.id}). Fee admin Rp2.500 ditanggung Bantuin.id.`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          actor: "admin@bantuin.id",
          action: "WITHDRAWAL_SUCCESS",
          target: `WITHDRAW #${withdrawalId}`,
          details: `Admin menandai transfer manual penarikan Rp${targetWd.amount.toLocaleString('id-ID')} ke ${targetWd.bankName} (${targetWd.accountNumber}) sukses.`,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);

      addToast("Transfer Berhasil Ditandai!", `Penarikan #${withdrawalId} telah tercatat sukses dicairkan ke rekening mitra.`);
      return true;
    }
    return false;
  };

  // 6d. Admin: Tolak Penarikan & Kembalikan Saldo Mitra
  const adminRejectWithdrawal = (withdrawalId, reason = "Rekening tidak valid") => {
    let refundAmount = 0;
    setWithdrawals((prev) =>
      prev.map((wd) => {
        if (wd.id === withdrawalId) {
          refundAmount = wd.amount;
          return {
            ...wd,
            status: "REJECTED",
            processedAt: new Date().toISOString(),
            notes: `Ditolak: ${reason}`,
          };
        }
        return wd;
      })
    );

    if (refundAmount > 0) {
      setMitraAvailableBalance((prev) => prev + refundAmount);
      addToast("Penarikan Ditolak", `Dana Rp${refundAmount.toLocaleString('id-ID')} telah dikembalikan ke saldo dapat dicairkan mitra.`, "error");
      return true;
    }
    return false;
  };

  // 6e. Admin / Mitra: Tandai Barang Sewa Kembali & Masuk Inspeksi
  const adminMarkItemReturned = (rentalOrderId) => {
    setOrderRooms((prev) =>
      prev.map((r) => (r.id === rentalOrderId ? { ...r, orderStatus: "returned" } : r))
    );
    setCustomerDeposits((prev) =>
      prev.map((dep) =>
        dep.rentalOrderId === rentalOrderId
          ? { ...dep, status: "REFUND_PENDING" }
          : dep
      )
    );
    addToast("Barang Diinspeksi", "Barang telah kembali. Deposit jaminan customer berstatus REFUND_PENDING.");
  };

  // 6f. Admin: Tandai Pengembalian Deposit Manual ke Customer Berhasil
  const adminMarkDepositRefunded = (depositId, transferReference = "", options = {}) => {
    const deductionAmount = Number(options.deductionAmount) || 0;
    const deductionReason = options.deductionReason || "";
    let targetDep = null;

    setCustomerDeposits((prev) =>
      prev.map((dep) => {
        if (dep.id === depositId || dep.rentalOrderId === depositId) {
          const finalRefund = Math.max(0, dep.depositAmount - deductionAmount);
          targetDep = {
            ...dep,
            status: deductionAmount > 0 ? "DISPUTE" : "REFUNDED",
            refundAmount: finalRefund,
            deductionAmount,
            deductionReason,
            refundedAt: new Date().toISOString(),
            transferReference: transferReference || `REFUND-${Date.now()}`,
          };
          return targetDep;
        }
        return dep;
      })
    );

    if (targetDep) {
      setLedgerEntries((prev) => [
        {
          id: `LEDGER-${Date.now()}-1`,
          orderId: targetDep.rentalOrderId || depositId,
          type: "DEPOSIT_REFUND",
          grossAmount: 0,
          gatewayFee: 0,
          rentalFee: 0,
          depositAmount: -targetDep.refundAmount,
          platformFee: 0,
          mitraEntitlement: 0,
          description: `Pengembalian deposit manual admin Rp${targetDep.refundAmount.toLocaleString('id-ID')} ke customer via ${targetDep.customerBank} ${targetDep.customerAccountNumber}.`,
          timestamp: new Date().toISOString(),
        },
        ...(deductionAmount > 0 ? [
          {
            id: `LEDGER-${Date.now()}-2`,
            orderId: targetDep.rentalOrderId || depositId,
            type: "DEPOSIT_CLAIM_DAMAGE",
            grossAmount: 0,
            gatewayFee: 0,
            rentalFee: 0,
            depositAmount: -deductionAmount,
            platformFee: 0,
            mitraEntitlement: deductionAmount,
            description: `Potongan deposit kerusakan/denda Rp${deductionAmount.toLocaleString('id-ID')} untuk ganti rugi pemilik unit: ${deductionReason}`,
            timestamp: new Date().toISOString(),
          }
        ] : []),
        ...prev,
      ]);

      addToast("Deposit Berhasil Dikembalikan!", `Transfer refund deposit Rp${targetDep.refundAmount.toLocaleString('id-ID')} telah sukses dicatat.`);
      return true;
    }
    return false;
  };

  // 6g. Top Up Wallet Balance (Disabled in Non E-Money Model)
  const topUpFunds = () => {
    addToast(
      "Fitur Top-Up Dinonaktifkan",
      "Bantuin.id bukan dompet elektronik (e-money). Seluruh transaksi customer langsung dibayarkan melalui Payment Gateway (QRIS/VA) saat memesan.",
      "error"
    );
    return false;
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
  const sendChatMessage = (orderRoomId, messageText, extraData = {}) => {
    const check = detectDisintermediation(messageText);
    
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      message: messageText,
      hasWarning: check.flagged,
      warningReason: check.reason,
      timestamp: new Date().toISOString(),
      ...extraData,
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

  // 8b. Create Full Rental Order Room & Initiate Escrow
  const createRentalOrder = ({
    rentalId,
    rentalTitle,
    photoUrl,
    storeId,
    storeName,
    storeAvatar,
    storePhone,
    startDate,
    endDate,
    totalDays,
    dailyPrice,
    rentalFee,
    depositFee,
    totalAmount,
    conditionNotes,
    pickupLocation,
    paymentMethod = "qris",
    isPaid = true
  }) => {
    const roomId = `order-room-rental-${Date.now()}`;
    const dur = totalDays || 1;
    const rentFee = rentalFee || (dailyPrice * dur);
    const depFee = depositFee || 200000;
    const tot = rentFee + depFee; // Gross customer pays: rental + deposit (gateway_fee is NOT added to customer bill)
    const platformFee = Math.round(rentFee * 0.08); // 8% komisi hanya dari rentalFee!
    const ownerPayoutAmount = rentFee - platformFee;

    // Hak pemilik rental berstatus PENDING selama barang sedang disewa
    setMitraPendingBalance((prev) => prev + ownerPayoutAmount);

    // Catat deposit jaminan customer secara terpisah (0% komisi platform)
    const newDeposit = {
      id: `DEP-${Date.now()}`,
      rentalOrderId: roomId,
      rentalTitle: rentalTitle,
      depositAmount: depFee,
      refundAmount: depFee,
      deductionAmount: 0,
      deductionReason: "",
      status: "WAITING_RETURN", // WAITING_RETURN -> INSPECTION -> REFUND_PENDING -> REFUNDED
      paymentMethod: paymentMethod || "QRIS",
      customerBank: "BCA",
      customerAccountNumber: "8820192841",
      customerAccountHolder: currentUser.fullName || "Rian Prasetya",
      createdAt: new Date().toISOString(),
      refundedAt: null,
    };
    setCustomerDeposits((prev) => [newDeposit, ...prev]);

    // Catat ke ledger akuntansi
    setLedgerEntries((prev) => [
      {
        id: `LEDGER-${Date.now()}-1`,
        orderId: roomId,
        type: "CUSTOMER_RENTAL_PAYMENT",
        grossAmount: tot,
        gatewayFee: 2000,
        rentalFee: rentFee,
        depositAmount: depFee,
        platformFee: platformFee,
        mitraEntitlement: ownerPayoutAmount,
        description: `Pembayaran customer untuk sewa ${rentalTitle} via ${paymentMethod || "QRIS"}`,
        timestamp: new Date().toISOString(),
      },
      {
        id: `LEDGER-${Date.now()}-2`,
        orderId: roomId,
        type: "CUSTOMER_DEPOSIT",
        grossAmount: depFee,
        gatewayFee: 0,
        rentalFee: 0,
        depositAmount: depFee,
        platformFee: 0,
        mitraEntitlement: 0,
        description: `Deposit jaminan perlindungan unit ${rentalTitle} (0% komisi, titipan aman)`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    // Dynamic update: Decrement available stock and increment totalRentedCount in rentals
    if (isPaid && rentalId) {
      setRentals((prevRentals) =>
        prevRentals.map((r) => {
          if (r.id === rentalId) {
            const curStock = typeof r.stock === "number" ? r.stock : 3;
            const curRented = Number(r.totalRentedCount) || Number(r.owner?.completedOrders) || 86;
            return {
              ...r,
              stock: Math.max(0, curStock - 1),
              totalRentedCount: curRented + 1,
              owner: {
                ...(r.owner || {}),
                completedOrders: (Number(r.owner?.completedOrders) || 86) + 1,
              },
            };
          }
          return r;
        })
      );
    }

    // Also add to rentalBookings for activity history
    const newBooking = {
      id: roomId,
      rentalId: rentalId || "rent-1",
      rentalTitle: rentalTitle,
      photoUrl: photoUrl,
      renterId: currentUser.id || "user-current-01",
      renterName: currentUser.fullName || "Rian Prasetya",
      ownerName: storeName || "Mitra Rental Resmi",
      startDate: startDate || new Date().toISOString().split("T")[0],
      endDate: endDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
      totalDays: dur,
      rentalFee: rentFee,
      depositFee: depFee,
      totalAmount: tot,
      status: isPaid ? "paid_escrow" : "temp_locked",
      paymentMethod: paymentMethod,
      createdAt: new Date().toISOString(),
    };
    setRentalBookings((prev) => [newBooking, ...prev]);

    const newRoom = {
      id: roomId,
      categoryType: "sewa",
      orderType: "rental",
      stage: isPaid ? "active" : "inquiry",
      orderStatus: isPaid ? "paid_escrow" : "inquiry",
      requestId: rentalId || `rental-${Date.now()}`,
      requestTitle: `Sewa ${rentalTitle}`,
      category: "Sewa Alat & Kendaraan",
      mode: "offline",
      requester: {
        id: currentUser.id || "user-current-01",
        name: currentUser.fullName || "Rian Prasetya",
        avatar: currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        phone: currentUser.phone || "081298765432",
        rating: 4.95,
      },
      helper: {
        id: storeId || "mitra-rental",
        name: storeName || "Mitra Sewa Resmi",
        avatar: storeAvatar || photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
        phone: storePhone || "081234567890",
        rating: 4.9,
        isStore: true,
        storeId: storeId,
        address: pickupLocation || "Toko Mitra Sewa",
      },
      rentalDetails: {
        unitName: rentalTitle,
        photoUrl: photoUrl,
        startDate: startDate,
        endDate: endDate,
        durationDays: totalDays,
        dailyPrice: dailyPrice,
        rentalFee: rentalFee,
        depositFee: depositFee,
        totalAmount: totalAmount,
        pickupLocation: pickupLocation || "Toko Mitra Rental",
        conditionChecklist: conditionNotes || "Checklist fisik tervalidasi saat serah terima.",
        handoverPhotos: [photoUrl],
        returnPhotos: [],
      },
      lockedAmount: totalAmount,
      depositAmount: depositFee,
      rentalFeeAmount: rentalFee,
      orderStatus: "paid_escrow", // 'paid_escrow' -> 'item_handed_over' -> 'returned' -> 'completed'
      xenditStatus: "HELD_IN_ESCROW",
      xenditInvoiceId: `XND-RENT-${Math.floor(100000 + Math.random() * 900000)}`,
      lastUpdated: "Baru saja",
      unreadCount: 0,
      review: null,
      messages: [
        {
          id: `msg-sys-${Date.now()}`,
          senderId: "system",
          senderName: "Bantuin Escrow Bot",
          message: `Pembayaran sewa (${formatIDR(rentalFee)}) + Deposit Jaminan (${formatIDR(depositFee)}) total ${formatIDR(totalAmount)} telah aman di Rekening Bersama Escrow Bantuin. Silakan koordinasikan pengambilan/serah terima alat di sini.`,
          timestamp: "Sekarang",
          isSystem: true,
        },
        {
          id: `msg-store-${Date.now()}`,
          senderId: storeId || "mitra-rental",
          senderName: storeName || "Toko Mitra",
          senderAvatar: storeAvatar || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
          message: `Halo! Pesanan sewa ${rentalTitle} telah kami terima. Unit sudah siap diserahterimakan dan dites bersama. Silakan konfirmasi jam kedatangan Anda.`,
          timestamp: "Sekarang",
        }
      ]
    };

    setOrderRooms((prev) => [newRoom, ...prev]);
    addToast("Pembayaran Escrow Berhasil!", `Slot sewa ${rentalTitle} telah diamankan. Silakan koordinasi serah terima di chat.`);
    return newRoom;
  };

  const confirmRentalHandover = (roomId, handoverProof = {}) => {
    setOrderRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          const defaultPhotos = [
            r.rentalDetails?.photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"
          ];
          const rawPhotos = handoverProof.photos && handoverProof.photos.length > 0
            ? handoverProof.photos
            : defaultPhotos;
          const notes = handoverProof.notes || "Kondisi fisik alat, fungsi tombol/sensor, dan kelengkapan aksesoris (baterai, charger, tas) telah diverifikasi bersama pihak toko dalam kondisi prima.";

          const nowDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
          const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

          const updatedMessages = [
            ...r.messages,
            {
              id: `msg-hnd-${Date.now()}`,
              senderId: "system",
              senderName: "Bantuin Escrow Bot",
              message: `🤝 Serah terima alat berhasil dikonfirmasi!\nKondisi fisik unit telah diverifikasi bersama pihak toko. Masa sewa sekarang berstatus AKTIF. Bukti foto baseline kondisi fisik alat tersimpan permanen di ruang obrolan ini sebagai dokumen jaminan perlindungan Escrow.`,
              timestamp: nowTime,
              isSystem: true,
              isHandoverProof: true,
              proofData: {
                title: "Bukti Baseline Serah Terima Fisik",
                unitName: r.rentalDetails?.unitName || r.requestTitle || "Unit Alat Sewa",
                photos: rawPhotos,
                notes: notes,
                confirmedAt: `${nowDate}, ${nowTime}`,
                depositHeld: r.depositAmount || 500000,
                idHeld: "1 Identitas Fisik Asli (KTP/KTM/SIM) dititipkan di toko",
                storeName: r.helper?.name || "Toko Mitra",
                renterName: r.requester?.name || currentUser.fullName || "Penyewa"
              }
            }
          ];
          return {
            ...r,
            orderStatus: "item_handed_over",
            lastUpdated: "Baru saja",
            handoverProof: {
              photos: rawPhotos,
              notes: notes,
              timestamp: new Date().toISOString(),
              confirmedAt: `${nowDate}, ${nowTime}`
            },
            messages: updatedMessages,
          };
        }
        return r;
      })
    );
    addToast("Serah Terima Dikonfirmasi!", "Foto bukti fisik tersimpan di obrolan & masa sewa aktif.");
  };

  const confirmRentalReturn = (roomId, returnProof = {}) => {
    let refundAmount = 0;
    setOrderRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          refundAmount = r.depositAmount || 0;
          const returnPhotos = returnProof.photos || [];
          const returnNotes = returnProof.notes || "Pemeriksaan akhir selesai. Unit dikembalikan lengkap & tanpa kerusakan.";

          const nowDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
          const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

          const updatedMessages = [
            ...r.messages,
            {
              id: `msg-ret-${Date.now()}`,
              senderId: "system",
              senderName: "Bantuin Escrow Bot",
              message: `✅ Pengembalian alat telah selesai diperiksa & diverifikasi oleh pihak toko mitra.\nHak sewa toko sebesar Rp${((r.rentalFeeAmount || 150000) - Math.round((r.rentalFeeAmount || 150000) * 0.08)).toLocaleString('id-ID')} telah beralih ke status AVAILABLE (siap ditarik).\nDeposit jaminan sebesar ${formatIDR(refundAmount)} berstatus REFUND_PENDING menunggu transfer manual admin ke rekening bank Anda.`,
              timestamp: nowTime,
              isSystem: true,
              isReturnProof: true,
              proofData: {
                title: "Bukti Pengembalian & Verifikasi Alat",
                unitName: r.rentalDetails?.unitName || r.requestTitle || "Unit Alat Sewa",
                refundAmount: refundAmount,
                notes: returnNotes,
                photos: returnPhotos,
                confirmedAt: `${nowDate}, ${nowTime}`,
                idReturned: "Identitas Fisik Asli (KTP/KTM) telah diserahkan kembali ke penyewa"
              }
            }
          ];
          return {
            ...r,
            orderStatus: "returned",
            xenditStatus: "PAYOUT_RELEASED",
            lastUpdated: "Baru saja",
            returnProof: {
              photos: returnPhotos,
              notes: returnNotes,
              timestamp: new Date().toISOString(),
              confirmedAt: `${nowDate}, ${nowTime}`
            },
            messages: updatedMessages,
          };
        }
        return r;
      })
    );

    // Release owner rental fee to AVAILABLE balance
    const targetRoom = orderRooms.find((r) => r.id === roomId);
    const rentFee = targetRoom?.rentalFeeAmount || 150000;
    const platFee = Math.round(rentFee * 0.08);
    const ownerPayout = rentFee - platFee;
    setMitraPendingBalance((prev) => Math.max(0, prev - ownerPayout));
    setMitraAvailableBalance((prev) => prev + ownerPayout);
    setMitraTotalEarned((prev) => prev + ownerPayout);

    // Set customer deposit to REFUND_PENDING (menunggu transfer manual admin)
    setCustomerDeposits((prev) =>
      prev.map((d) =>
        d.rentalOrderId === roomId ? { ...d, status: "REFUND_PENDING" } : d
      )
    );

    addToast("Pemeriksaan Selesai!", `Hak sewa pemilik kini dapat dicairkan. Deposit ${formatIDR(refundAmount)} siap direfund oleh admin.`);
  };

  const submitRentalReview = (roomId, rating, comment, aspectRatings = null) => {
    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const finalComment = comment?.trim() || "Pelayanan toko sangat ramah, alat terawat dan berfungsi sangat baik!";

    let targetRentalId = null;

    setOrderRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          targetRentalId = r.requestId;
          const updatedMessages = [
            ...r.messages,
            {
              id: `msg-rev-${Date.now()}`,
              senderId: "system",
              senderName: "Bantuin Escrow Bot",
              message: `⭐ Penyewa memberikan rating ${numRating}/5 bintang: "${finalComment}". Transaksi sewa selesai sepenuhnya. Terima kasih!`,
              timestamp: "Sekarang",
              isSystem: true,
            }
          ];
          return {
            ...r,
            orderStatus: "completed",
            review: {
              rating: numRating,
              comment: finalComment,
              createdAt: new Date().toISOString(),
              reviewerName: currentUser?.fullName || "Penyewa",
            },
            messages: updatedMessages,
          };
        }
        return r;
      })
    );

    // Dynamic rating algorithm for rentals:
    // newCount = oldCount + 1
    // totalStars = (oldAvg * oldCount) + newRating
    // newAvg = (totalStars / newCount).toFixed(2)
    setRentals((prevRentals) =>
      prevRentals.map((item) => {
        if (item.id === targetRentalId || (!targetRentalId && item.id === "rent-1")) {
          const oldCount = Number(item.ratingCount) || 38;
          const oldAvg = Number(item.ratingAvg) || 4.95;
          const newCount = oldCount + 1;
          const totalStars = (oldAvg * oldCount) + numRating;
          const newAvg = Number((totalStars / newCount).toFixed(2));

          const newReviewObj = {
            id: `rev-${Date.now()}`,
            userName: currentUser?.fullName || "Rian Prasetya",
            avatar: currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            rating: numRating,
            date: "Baru saja",
            item: item.title,
            comment: finalComment,
            isVerifiedPurchase: true,
            aspectRatings: aspectRatings || {
              condition: numRating,
              response: 5.0,
              hospitality: 5.0,
              accuracy: numRating,
            },
          };

          return {
            ...item,
            ratingAvg: newAvg,
            ratingCount: newCount,
            reviews: [newReviewObj, ...(item.reviews || [])],
            owner: {
              ...(item.owner || {}),
              rating: newAvg,
            }
          };
        }
        return item;
      })
    );

    // Update rentalBookings
    setRentalBookings((prev) =>
      prev.map((b) => {
        if (b.id === roomId || b.rentalId === targetRentalId) {
          return { ...b, status: "completed", rating: numRating };
        }
        return b;
      })
    );

    addToast(
      "Penilaian Berhasil!",
      `Rating ${numRating} bintang tercatat secara dinamis pada produk & profil toko mitra.`
    );
  };

  // 8c. Start Rental Inquiry (Chat Toko Terlebih Dahulu sebelum bayar)
  const startRentalInquiry = ({
    rentalId,
    rentalTitle,
    photoUrl,
    storeId,
    storeName,
    storeAvatar,
    storePhone,
    dailyPrice,
    startDate,
    endDate,
    totalDays,
    depositFee,
    pickupLocation,
    initialQuestion
  }) => {
    // Check if an inquiry room already exists with this store
    const existing = orderRooms.find(
      (r) => r.orderType === "rental" && r.helper?.id === storeId && r.orderStatus === "inquiry"
    );
    if (existing) {
      if (initialQuestion) {
        sendChatMessage(existing.id, initialQuestion);
      }
      return existing;
    }

    const roomId = `order-room-inquiry-${Date.now()}`;
    const dur = totalDays || 1;
    const rentFee = dailyPrice * dur;
    const depFee = depositFee || Math.max(dailyPrice, 250000);
    const tot = rentFee + depFee;

    const newRoom = {
      id: roomId,
      categoryType: "sewa",
      orderType: "rental",
      stage: "inquiry",
      requestId: rentalId || `rental-${Date.now()}`,
      requestTitle: `Tanya Sewa ${rentalTitle}`,
      category: "Sewa Alat & Kendaraan",
      mode: "offline",
      requester: {
        id: currentUser.id || "user-current-01",
        name: currentUser.fullName || "Rian Prasetya",
        avatar: currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        phone: currentUser.phone || "081298765432",
        rating: 4.95,
      },
      helper: {
        id: storeId || "mitra-rental",
        name: storeName || "Mitra Sewa Resmi",
        avatar: storeAvatar || photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
        phone: storePhone || "081234567890",
        rating: 4.9,
        isStore: true,
        storeId: storeId,
        address: pickupLocation || "Toko Mitra Sewa",
      },
      rentalDetails: {
        unitName: rentalTitle,
        photoUrl: photoUrl,
        startDate: startDate || "2026-09-20",
        endDate: endDate || "2026-09-21",
        durationDays: dur,
        dailyPrice: dailyPrice,
        rentalFee: rentFee,
        depositFee: depFee,
        totalAmount: tot,
        pickupLocation: pickupLocation || "Toko Mitra Rental",
        conditionChecklist: "Menunggu pemeriksaan fisik bersama saat serah terima di toko.",
        handoverPhotos: [photoUrl],
        returnPhotos: [],
      },
      lockedAmount: tot,
      depositAmount: depFee,
      rentalFeeAmount: rentFee,
      orderStatus: "inquiry", // 'inquiry' -> 'paid_escrow' -> 'item_handed_over' -> 'returned' -> 'completed'
      xenditStatus: "PENDING_PAYMENT",
      lastUpdated: "Baru saja",
      unreadCount: 0,
      review: null,
      messages: [
        {
          id: `msg-inq-1`,
          senderId: "system",
          senderName: "Bantuin Escrow Bot",
          message: `💬 Ruang diskusi sewa untuk unit "${rentalTitle}". Silakan tanyakan ketersediaan tanggal, kelengkapan aksesoris, dan kondisi barang sebelum melakukan pembayaran escrow.`,
          timestamp: "Sekarang",
          isSystem: true,
        },
        {
          id: `msg-inq-2`,
          senderId: currentUser.id || "user-current-01",
          senderName: currentUser.fullName || "Rian Prasetya",
          message: initialQuestion || `Halo ${storeName}, apakah unit ${rentalTitle} ready untuk disewa? Boleh info kondisi fisik & kelengkapan aksesorisnya?`,
          timestamp: "Sekarang",
          isMe: true,
        },
        {
          id: `msg-inq-3`,
          senderId: storeId || "mitra-rental",
          senderName: storeName || "Toko Mitra",
          senderAvatar: storeAvatar || photoUrl,
          message: `Halo Kak Rian! Unit ${rentalTitle} kami siap sewa dan dalam kondisi prima (sensor bersih & fungsi normal 100%). Sudah include baterai + charger + tas. Jaminan cukup titip 1 KTP/KTM asli saat ambil alat + deposit rekber. Kakak bisa langsung klik "Bayar Tagihan Sewa" di atas jika tanggal sudah fix ya!`,
          timestamp: "Sekarang",
        }
      ]
    };

    setOrderRooms((prev) => [newRoom, ...prev]);
    addToast("Obrolan Toko Dimulai", `Terhubung dengan ${storeName} mengenai ${rentalTitle}.`);
    return newRoom;
  };

  // 8e. Start Jasa / Mitra Inquiry (Chat Konsultasi sebelum pesan jasa)
  const startJasaInquiry = ({
    serviceId,
    serviceTitle,
    serviceImage,
    servicePrice,
    providerId,
    providerName,
    providerAvatar,
    providerPhone,
    providerRating,
    providerAddress,
    category,
    initialQuestion
  }) => {
    // Cari apakah sudah ada room konsultasi dengan mitra ini
    const existing = orderRooms.find(
      (r) =>
        (r.orderType === "service" || r.orderType === "jasa") &&
        (r.helper?.id === providerId || r.requestId === serviceId)
    );
    if (existing) {
      if (initialQuestion) {
        sendChatMessage(existing.id, initialQuestion);
      }
      return existing;
    }

    const roomId = `order-room-jasa-${providerId || Date.now()}`;
    const newRoom = {
      id: roomId,
      categoryType: "jasa",
      orderType: "service",
      stage: "inquiry",
      requestId: serviceId || `service-${Date.now()}`,
      requestTitle: serviceTitle ? `Konsultasi: ${serviceTitle}` : `Konsultasi dengan ${providerName || "Mitra"}`,
      category: category || "Layanan Jasa",
      mode: "online",
      requester: {
        id: currentUser?.id || "user-current-01",
        name: currentUser?.fullName || "Rian Prasetya",
        avatar: currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        phone: currentUser?.phone || "081298765432",
        rating: 4.95,
      },
      helper: {
        id: providerId || "mitra-jasa",
        name: providerName || "Mitra Penyedia Jasa",
        avatar: providerAvatar || serviceImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        phone: providerPhone || "081234567890",
        rating: providerRating || 4.9,
        address: providerAddress || "Purwokerto",
      },
      lockedAmount: servicePrice || 0,
      orderStatus: "inquiry",
      lastUpdated: "Baru saja",
      unreadCount: 0,
      review: null,
      messages: [
        {
          id: `msg-jasa-inq-1`,
          senderId: "system",
          senderName: "Bantuin Escrow Bot",
          message: `💬 Ruang konsultasi pra-pemesanan untuk "${serviceTitle || "Layanan Jasa"}". Diskusikan kebutuhan spesifik, jadwal pengerjaan, dan portofolio langsung dengan mitra ${providerName || "terverifikasi"} sebelum memesan.`,
          timestamp: "Sekarang",
          isSystem: true,
        },
        {
          id: `msg-jasa-inq-2`,
          senderId: currentUser?.id || "user-current-01",
          senderName: currentUser?.fullName || "Rian Prasetya",
          message: initialQuestion || `Halo kak ${providerName || "mitra"}, saya tertarik dengan layanan "${serviceTitle || "jasa"}". Boleh konsultasi terlebih dahulu mengenai estimasi dan teknis pengerjaannya?`,
          timestamp: "Sekarang",
          isMe: true,
        },
        {
          id: `msg-jasa-inq-3`,
          senderId: providerId || "mitra-jasa",
          senderName: providerName || "Mitra Jasa",
          senderAvatar: providerAvatar || serviceImage,
          message: `Halo Kak Rian! Terima kasih sudah menghubungi kami di Bantuin. Tentu sangat bisa! Silakan sampaikan detail kebutuhan atau referensi yang Kakak inginkan ya. Setelah sepakat, Kakak bisa langsung klik "Pesan Layanan" untuk konfirmasi jadwal.`,
          timestamp: "Sekarang",
        }
      ]
    };

    setOrderRooms((prev) => [newRoom, ...prev]);
    addToast("Konsultasi Dimulai", `Terhubung dengan ${providerName || "Mitra"}.`);
    return newRoom;
  };

  // 8f. Create Jasa Order & Lock Escrow
  const createJasaOrder = ({
    serviceId,
    serviceTitle,
    serviceImage,
    packageId,
    packageName,
    servicePrice,
    totalAmount,
    targetDate,
    targetTime,
    alamat,
    patokan,
    notes,
    brief,
    isDigital,
    coords,
    providerId,
    providerName,
    providerAvatar,
    providerPhone,
    providerRating,
    providerAddress,
    category,
    paymentMethod = "qris"
  }) => {
    const roomId = `order-room-jasa-${Date.now()}`;
    const basePrice = Number(servicePrice) || 100000;
    const finalTotal = Number(totalAmount) || basePrice; // Gross tagihan customer murni (gateway fee tidak otomatis ditambah ke tagihan)
    const platformFee = Math.round(basePrice * 0.08);
    const helperPayoutAmount = basePrice - platformFee;

    // Hak pembayaran mitra berstatus PENDING (dana tertahan sampai pekerjaan dikonfirmasi selesai)
    setMitraPendingBalance((prev) => prev + helperPayoutAmount);

    // Catat mutasi akuntansi di ledger
    setLedgerEntries((prev) => [
      {
        id: `LEDGER-${Date.now()}`,
        orderId: roomId,
        type: "CUSTOMER_PAYMENT",
        grossAmount: finalTotal,
        gatewayFee: 2000, // Tercatat di backend, tidak membebani tagihan awal customer
        rentalFee: 0,
        depositAmount: 0,
        platformFee: platformFee,
        mitraEntitlement: helperPayoutAmount,
        description: `Pembayaran customer via ${paymentMethod || "QRIS"} untuk ${serviceTitle || "Layanan Jasa"}`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);

    const newRoom = {
      id: roomId,
      categoryType: "jasa",
      orderType: "service",
      stage: "active",
      orderStatus: "paid_escrow", // 'paid_escrow' -> 'in_progress' -> 'proof_submitted' -> 'completed'
      xenditStatus: "HELD_IN_ESCROW",
      xenditInvoiceId: `XND-JASA-${Math.floor(100000 + Math.random() * 900000)}`,
      requestId: serviceId || `service-${Date.now()}`,
      requestTitle: serviceTitle || `Layanan Jasa: ${packageName || "Pilihan Paket"}`,
      category: category || "Layanan Jasa",
      mode: isDigital ? "online" : "offline",
      lockedAmount: finalTotal,
      platformFee: platformFee,
      helperPayoutAmount: helperPayoutAmount,
      serviceDetails: {
        serviceId: serviceId,
        serviceTitle: serviceTitle,
        serviceImage: serviceImage,
        packageId: packageId,
        packageName: packageName,
        servicePrice: basePrice,
        totalAmount: finalTotal,
        targetDate: targetDate,
        targetTime: targetTime,
        alamat: alamat,
        patokan: patokan,
        notes: notes,
        brief: brief,
        isDigital: isDigital,
        coords: coords,
        paymentMethod: paymentMethod,
        createdAt: new Date().toISOString(),
      },
      requester: {
        id: currentUser?.id || "user-current-01",
        name: currentUser?.fullName || "Rian Prasetya",
        avatar: currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        phone: currentUser?.phone || "081298765432",
        rating: 4.95,
      },
      helper: {
        id: providerId || "mitra-jasa",
        name: providerName || "Mitra Spesialis Resmi",
        avatar: providerAvatar || serviceImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        phone: providerPhone || "081234567890",
        rating: providerRating || 4.9,
        address: providerAddress || "Purwokerto",
      },
      proofPhotos: [],
      digitalFiles: [],
      submissionUrl: "",
      proofNotes: "",
      lastUpdated: "Baru saja",
      unreadCount: 0,
      review: null,
      messages: [
        {
          id: `msg-jasa-sys-${Date.now()}`,
          senderId: "system",
          senderName: "Bantuin Escrow Bot",
          message: `Pembayaran sebesar ${formatIDR(finalTotal)} telah berhasil diamankan di Rekening Bersama (Escrow) Bantuin. Jadwal pengerjaan: ${targetDate || "Sesuai Jadwal"} pukul ${targetTime || "09:00"} WIB. Status pesanan: DANA DI ESCROW.`,
          timestamp: "Sekarang",
          isSystem: true,
        },
        {
          id: `msg-jasa-prv-${Date.now()}`,
          senderId: providerId || "mitra-jasa",
          senderName: providerName || "Mitra Jasa",
          senderAvatar: providerAvatar || serviceImage,
          message: `Halo Kak Rian! Pesanan jasa "${serviceTitle || "Layanan"}" (${packageName || "Paket Standar"}) telah kami terima. Kami siap melaksanakan tugas sesuai rincian yang telah disepakati. Silakan kirimkan referensi atau catatan tambahan di sini ya!`,
          timestamp: "Sekarang",
        }
      ]
    };

    setOrderRooms((prev) => [newRoom, ...prev]);
    addToast("Pesanan Jasa Dikonfirmasi!", `Dana telah dikunci di Escrow. Silakan koordinasi dengan ${providerName || "Mitra"}.`);
    return newRoom;
  };

  // 8g. Start Task Inquiry (Chat dengan Pelamar Tugas sebelum bayar escrow)
  const startTaskInquiry = ({ request, offer }) => {
    const helperId = offer?.helperId || offer?.id || "user-hlp-1";
    const existing = orderRooms.find(
      (r) => r.requestId === request?.id && (r.helper?.id === helperId || r.id === `inquiry-${request?.id}-${helperId}`)
    );
    if (existing) {
      return existing;
    }

    const roomId = `inquiry-${request?.id || Date.now()}-${helperId}`;
    const newRoom = {
      id: roomId,
      categoryType: "bantuan",
      orderType: "task",
      stage: "inquiry",
      orderStatus: "inquiry",
      requestId: request?.id || `req-${Date.now()}`,
      requestTitle: request?.title || "Permintaan Bantuan",
      category: request?.category || "Bantuan Komunitas",
      mode: request?.mode || "offline",
      requester: {
        id: request?.requester?.id || currentUser?.id,
        name: request?.requester?.name || currentUser?.fullName,
        avatar: request?.requester?.avatar || currentUser?.avatar,
        phone: "081298765432",
        rating: 4.95,
      },
      helper: {
        id: helperId,
        name: offer?.helperName || "Helper Bantuin",
        avatar: offer?.helperAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
        phone: "081311223344",
        rating: offer?.helperRating || 4.9,
      },
      lockedAmount: Number(offer?.proposedPrice) || Number(request?.rewardAmount) || 35000,
      messages: [
        {
          id: `msg-sys-${Date.now()}`,
          senderId: "system",
          senderName: "Bantuin Escrow Bot",
          message: `💬 Ruang diskusi pra-transaksi untuk tugas "${request?.title}". Diskusikan teknis pelaksanaan dan ketersediaan waktu sebelum mengunci dana di Escrow.`,
          timestamp: "Sekarang",
          isSystem: true,
        },
        {
          id: `msg-pitch-${Date.now()}`,
          senderId: helperId,
          senderName: offer?.helperName || "Helper",
          senderAvatar: offer?.helperAvatar,
          message: offer?.pitchMessage || "Halo! Saya telah mengajukan penawaran untuk membantu tugas Anda. Ada yang perlu dikoordinasikan terlebih dahulu?",
          timestamp: "Sekarang",
        }
      ]
    };

    setOrderRooms((prev) => [newRoom, ...prev]);
    return newRoom;
  };

  // 8d. Pay Rental Escrow (dari dalam chat inquiry atau modal)
  const payRentalEscrow = (roomId, paymentMethod = "qris") => {
    let targetRentalId = null;
    let targetLockedAmount = 0;

    setOrderRooms((prev) =>
      prev.map((r) => {
        if (r.id === roomId) {
          targetRentalId = r.requestId;
          targetLockedAmount = r.lockedAmount || 0;
          const updatedMessages = [
            ...r.messages,
            {
              id: `msg-pay-${Date.now()}`,
              senderId: "system",
              senderName: "Bantuin Escrow Bot",
              message: `💳 Pembayaran Escrow via ${paymentMethod.toUpperCase()} senilai ${formatIDR(r.lockedAmount)} (Sewa: ${formatIDR(r.rentalFeeAmount)} + Deposit Jaminan: ${formatIDR(r.depositAmount)}) BERHASIL! Dana aman di Rekber Bantuin. Status sewa kini: MENUNGGU SERAH TERIMA ALAT.`,
              timestamp: "Sekarang",
              isSystem: true,
            }
          ];
          return {
            ...r,
            orderStatus: "paid_escrow",
            stage: "active",
            xenditStatus: "HELD_IN_ESCROW",
            xenditInvoiceId: `XND-RENT-${Math.floor(100000 + Math.random() * 900000)}`,
            lastUpdated: "Baru saja",
            messages: updatedMessages,
          };
        }
        return r;
      })
    );

    // If paid using wallet, deduct balance
    if (paymentMethod === "wallet" && targetLockedAmount > 0) {
      setWalletBalance((prev) => Math.max(0, prev - targetLockedAmount));
    }

    // Dynamic update: Decrement available stock & increment totalRentedCount
    if (targetRentalId) {
      setRentals((prevRentals) =>
        prevRentals.map((r) => {
          if (r.id === targetRentalId) {
            const curStock = typeof r.stock === "number" ? r.stock : 3;
            const curRented = Number(r.totalRentedCount) || Number(r.owner?.completedOrders) || 86;
            return {
              ...r,
              stock: Math.max(0, curStock - 1),
              totalRentedCount: curRented + 1,
              owner: {
                ...(r.owner || {}),
                completedOrders: (Number(r.owner?.completedOrders) || 86) + 1,
              },
            };
          }
          return r;
        })
      );
    }

    setRentalBookings((prev) =>
      prev.map((b) => {
        if (b.id === roomId || b.rentalId === targetRentalId) {
          return { ...b, status: "paid_escrow", paymentMethod };
        }
        return b;
      })
    );

    addToast("Pembayaran Escrow Berhasil!", "Dana terkunci aman di Rekening Bersama Bantuin. Silakan koordinasi serah terima alat.");
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

  // 11. User Submit Report (Notice & Takedown - Permenkominfo No. 5/2020)
  const submitReport = ({ targetUserId, targetRoomId, targetRequestId, category, description, evidenceUrls = [] }) => {
    const newReport = {
      id: `rep-${Date.now()}`,
      reporterId: currentUser?.id || "user-current",
      reporterName: currentUser?.fullName || "Pengguna",
      targetUserId: targetUserId || null,
      targetRoomId: targetRoomId || null,
      targetRequestId: targetRequestId || null,
      category: category || "Lainnya",
      description: description || "",
      evidenceUrls,
      status: "OPEN", // 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
      createdAt: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...(prev || [])]);

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actor: currentUser?.email || currentUser?.fullName || "Pengguna",
        action: "USER_REPORT_SUBMITTED",
        target: targetRoomId ? `ROOM #${targetRoomId}` : (targetUserId ? `USER #${targetUserId}` : "GENERAL"),
        details: `Kategori: ${category}. Keterangan: ${description}`,
        timestamp: new Date().toISOString(),
      },
      ...(prev || []),
    ]);

    addToast("Laporan Diterima", "Laporan Anda telah diteruskan ke tim moderasi untuk verifikasi.", "success");
    return newReport;
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
        mitraAvailableBalance,
        setMitraAvailableBalance,
        mitraPendingBalance,
        setMitraPendingBalance,
        mitraTotalEarned,
        setMitraTotalEarned,
        customerDeposits,
        setCustomerDeposits,
        ledgerEntries,
        setLedgerEntries,
        withdrawals,
        withdrawFunds,
        adminMarkWithdrawalSuccess,
        adminRejectWithdrawal,
        adminMarkItemReturned,
        adminMarkDepositRefunded,
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
        bookRental,
        createRentalOrder,
        startRentalInquiry,
        startJasaInquiry,
        startTaskInquiry,
        createJasaOrder,
        payRentalEscrow,
        confirmRentalHandover,
        confirmRentalReturn,
        submitRentalReview,
        submitKYC,
        adminVerifyUser,
        resolveDispute,
        submitReport,
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
