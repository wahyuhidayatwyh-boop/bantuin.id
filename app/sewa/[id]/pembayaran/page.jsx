"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { getAllMitraStores } from "@/lib/mock/mitraData";
import { paymentService } from "@/lib/services/paymentService";
import { authService } from "@/lib/services/authService";
import { 
  QrisLogo, 
  BcaLogo, 
  MandiriLogo, 
  BriLogo, 
  BniLogo, 
  BantuinPayLogo 
} from "@/components/ui/PaymentBankLogos";
import QrisCodeCard from "@/components/ui/QrisCodeCard";
import VoucherPicker from "@/components/ui/VoucherPicker";
import { saveFormDraft, getFormDraft, clearFormDraft } from "@/lib/hooks/useFormDraft";
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Lock,
  Loader2,
  Clock,
  Calendar,
  MapPin,
  IdCard,
  Info,
  Building2,
  AlertCircle
} from "lucide-react";

function parsePackageDurationDays(durationStr) {
  if (!durationStr) return 1;
  const match = String(durationStr).match(/(\d+)\s*hari/i);
  if (match && match[1]) {
    const days = parseInt(match[1], 10);
    return days > 0 ? days : 1;
  }
  const matchNum = String(durationStr).match(/(\d+)/);
  if (matchNum && matchNum[1]) {
    const num = parseInt(matchNum[1], 10);
    return num > 0 ? num : 1;
  }
  return 1;
}

function RentalPembayaranContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get("roomId");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const daysParam = searchParams.get("days");

  const DRAFT_KEY = `bantuin_draft_sewa_pembayaran_${id}`;
  const savedDraft = typeof window !== "undefined" ? getFormDraft(DRAFT_KEY, null) : null;

  const { 
    rentals = [], 
    orderRooms = [],
    walletBalance, 
    createRentalOrder,
    payRentalEscrow,
    addToast 
  } = useApp();

  // Selected payment channel
  const [selectedMethod, setSelectedMethod] = useState(() => savedDraft?.selectedMethod || "qris"); // 'qris', 'bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'wallet'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCopiedVA, setIsCopiedVA] = useState(false);
  const [isCopiedNominal, setIsCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Dates state with automatic calculation
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(() => savedDraft?.startDate || startParam || todayStr);
  const [endDate, setEndDate] = useState(() => savedDraft?.endDate || endParam || tomorrowStr);
  const [totalDays, setTotalDays] = useState(() => Number(daysParam) || 2);

  const [dbRental, setDbRental] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/rentals/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const r = json.data;
          const photosList = Array.isArray(r.photoUrls) && r.photoUrls.length > 0
            ? r.photoUrls
            : (Array.isArray(r.photos) && r.photos.length > 0 ? r.photos : [r.coverImageUrl || r.photoUrl || r.image || "/logotab.png"]);
          const resolvedPhoto = photosList[0] || r.coverImageUrl || r.photoUrl || r.image || "/logotab.png";

          setDbRental({
            id: r.id,
            title: r.title,
            category: r.category,
            dailyPrice: Number(r.dailyPrice),
            depositAmount: Number(r.depositAmount || 200000),
            photoUrl: resolvedPhoto,
            photos: photosList,
            ownerName: r.owner?.partnerBusinessName || r.owner?.fullName || "Mitra Sewa Resmi",
            owner: {
              id: r.owner?.id,
              name: r.owner?.partnerBusinessName || r.owner?.fullName || "Mitra Sewa Resmi",
              avatar: r.owner?.avatarUrl || "/logotab.png",
              phone: r.owner?.phoneNumber || "-",
            },
            location: r.pickupLocation || r.owner?.campusName || "Indonesia",
            packages: r.packages || [],
            pricingMode: r.pricingMode || "single",
          });
        }
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    saveFormDraft(DRAFT_KEY, { selectedMethod, startDate, endDate });
  }, [selectedMethod, startDate, endDate, DRAFT_KEY]);

  // Find rental item across DB, AppContext, and Mock catalog
  const existingRoom = roomIdParam ? orderRooms.find((r) => r.id === roomIdParam) : null;
  const pkgIdParam = searchParams.get("pkg") || searchParams.get("packageId");

  const rental = useMemo(() => {
    if (dbRental) return dbRental;
    const found = rentals.find((r) => r.id === id);
    if (found) {
      const itemPhoto = (Array.isArray(found.photoUrls) && found.photoUrls[0]) || (Array.isArray(found.photos) && found.photos[0]) || found.photoUrl || found.image || "/logotab.png";
      return {
        ...found,
        photoUrl: itemPhoto,
        photos: Array.isArray(found.photoUrls) && found.photoUrls.length > 0 ? found.photoUrls : [itemPhoto],
      };
    }

    if (existingRoom?.rentalDetails) {
      const roomPhoto = existingRoom.rentalDetails.photoUrl || (Array.isArray(existingRoom.rentalDetails.handoverPhotos) && existingRoom.rentalDetails.handoverPhotos[0]) || "/logotab.png";
      return {
        id: existingRoom.requestId || id,
        title: existingRoom.rentalDetails.unitName || existingRoom.requestTitle || "Unit Sewa",
        category: "Sewa Alat",
        dailyPrice: Number(existingRoom.rentalDetails.dailyPrice || 150000),
        depositAmount: Number(existingRoom.rentalDetails.depositFee || existingRoom.depositAmount || 200000),
        photoUrl: roomPhoto,
        photos: [roomPhoto],
        ownerName: existingRoom.helper?.name || "Toko Mitra",
        owner: {
          id: existingRoom.helper?.id,
          name: existingRoom.helper?.name || "Toko Mitra",
          avatar: existingRoom.helper?.avatar || "/logotab.png",
          phone: existingRoom.helper?.phone || "-",
        },
        location: existingRoom.rentalDetails.pickupLocation || "Indonesia",
        packages: [],
        pricingMode: "single",
      };
    }

    const allStores = getAllMitraStores();
    for (const st of allStores) {
      const catItem = st.catalog?.find((c) => c.id === id);
      if (catItem) {
        const catPhoto = (Array.isArray(catItem.photos) && catItem.photos[0]) || catItem.image || "/logotab.png";
        return {
          id: catItem.id,
          title: catItem.name,
          category: catItem.category,
          dailyPrice: Number(catItem.price),
          depositAmount: Number(catItem.depositAmount || 200000),
          photoUrl: catPhoto,
          photos: Array.isArray(catItem.photos) && catItem.photos.length > 0 ? catItem.photos : [catPhoto],
          ownerName: st.name,
          owner: {
            id: st.id,
            name: st.name,
            avatar: st.avatar || "/logotab.png",
            phone: st.phone || "-",
          },
          location: st.address || "Indonesia",
          packages: catItem.packages || [],
          pricingMode: catItem.pricingMode || "single",
        };
      }
    }
    return rentals[0] || {
      id: "rental-101",
      title: "Kamera Sony A7 III Body Only",
      category: "Fotografi",
      dailyPrice: 185000,
      depositAmount: 500000,
      location: "Indonesia",
      photoUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      owner: {
        name: "Toko Mitra Rental",
        avatar: "/logotab.png",
        phone: "-",
      }
    };
  }, [rentals, id, dbRental]);

  // Mode Paketan vs Harian
  const isTieredMode = rental?.pricingMode === "tiered" || (Array.isArray(rental?.packages) && rental.packages.length > 0);
  const selectedPackage = (rental?.packages || []).find((p) => p.id === pkgIdParam) || (isTieredMode && rental?.packages?.length > 0 ? rental.packages[0] : null);

  // Synchronize duration from package or room
  useEffect(() => {
    if (selectedPackage) {
      const d = parsePackageDurationDays(selectedPackage.duration);
      setTotalDays(Number(daysParam) || d);
    }
  }, [selectedPackage, daysParam]);

  // Synchronize dates from existing room if present
  useEffect(() => {
    if (existingRoom?.rentalDetails) {
      if (existingRoom.rentalDetails.startDate) setStartDate(existingRoom.rentalDetails.startDate);
      if (existingRoom.rentalDetails.endDate) setEndDate(existingRoom.rentalDetails.endDate);
      if (existingRoom.rentalDetails.durationDays) setTotalDays(existingRoom.rentalDetails.durationDays);
    }
  }, [existingRoom]);

  // Recalculate duration whenever startDate or endDate changes (hanya pada mode harian)
  useEffect(() => {
    if (!selectedPackage && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end.getTime() - start.getTime();
      const calculatedDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      setTotalDays(calculatedDays);
    }
  }, [startDate, endDate, selectedPackage]);

  // 15-minute countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Accurate Calculation Breakdown (Gross Amount = rentalFee + depositFee)
  // gateway_fee dicatat di ledger sistem, bukan ditambahkan ke tagihan customer
  const dailyPrice = selectedPackage
    ? (Number(selectedPackage.price) || Number(rental.dailyPrice) || 185000)
    : (Number(rental.dailyPrice) || 185000);
  const depositFee = selectedPackage?.depositAmount !== undefined && selectedPackage?.depositAmount !== null && Number(selectedPackage.depositAmount) >= 0
    ? Number(selectedPackage.depositAmount)
    : (Number(rental.depositAmount) || 200000);
  
  // KETENTUAN HARGA: Mode Paketan adalah flat fixed price, Mode Harian adalah dailyPrice * totalDays
  const rentalFee = selectedPackage ? Number(selectedPackage.price) : dailyPrice * totalDays; // Subtotal Biaya Sewa
  
  // Total tagihan murni yang dibayar penyewa ke payment gateway (Gross Amount)
  const totalAmount = rentalFee + depositFee;

  // Voucher discount applies ONLY to rentalFee, NOT deposit
  const finalRentalFee = Math.max(0, rentalFee - discountAmount);
  const finalAmount = finalRentalFee + depositFee;

  const handleVoucherApply = (discount, voucher) => {
    setDiscountAmount(discount);
    setAppliedVoucher(voucher);
  };

  // Platform Fee (Potongan Platform Bantuin 8% dari Biaya Sewa, TIDAK MEMOTONG DEPOSIT)
  const platformFee = Math.round(rentalFee * 0.08);
  const storeNetPayout = rentalFee - platformFee;

  // Virtual Account Numbers mapping
  const vaNumbers = {
    bca_va: "8802918291028371",
    mandiri_va: "8920199201928374",
    bri_va: "8801728192038172",
    bni_va: "8271019283819201"
  };

  const handleCopy = (text, type = "va") => {
    navigator.clipboard?.writeText(text);
    if (type === "va") {
      setIsCopiedVA(true);
      addToast("Nomor VA Disalin", "Nomor Virtual Account telah disalin ke clipboard.");
      setTimeout(() => setIsCopiedVA(false), 2000);
    } else {
      setIsCopiedNominal(true);
      addToast("Nominal Disalin", `Nominal ${formatIDR(text)} telah disalin.`);
      setTimeout(() => setIsCopiedNominal(false), 2000);
    }
  };

  const isCancelled = existingRoom?.orderStatus === "cancelled" || existingRoom?.status === "cancelled" || existingRoom?.bookingStatus === "cancelled";

  const handleConfirmPayment = async () => {
    if (isCancelled) {
      addToast("Pesanan Dibatalkan", "Pesanan sewa ini telah dibatalkan dan tidak dapat dibayar lagi.", "error");
      return;
    }

    setIsProcessing(true);

    try {
      let targetRoomId = roomIdParam || null;
      let createdBookingId = null;
      let bookingMidtransOrderId = null;
      let snapToken = null;

      // 1. Simpan booking sewa langsung ke PostgreSQL Database via API resmi
      try {
        const token = await authService.getValidAccessToken();
        if (token && rental?.id) {
          const bookRes = await fetch(`/api/rentals/${rental.id}/book`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              startDate,
              endDate,
              rentalFee,
              depositFee,
              totalAmount: finalAmount,
              isPaid: false,
              paymentMethod: selectedMethod,
              notes: selectedPackage ? `Paket: ${selectedPackage.name}` : "Pemesanan sewa via checkout Bantuin.id",
            }),
          });
          const bookJson = await bookRes.json().catch(() => ({}));
          if (bookJson?.data?.orderRoomId) {
            targetRoomId = bookJson.data.orderRoomId;
          }
          if (bookJson?.data?.booking?.id) {
            createdBookingId = bookJson.data.booking.id;
            bookingMidtransOrderId = bookJson.data.booking.midtransOrderId || null;
          }
          if (bookJson?.data?.snapToken) {
            snapToken = bookJson.data.snapToken;
          }
          if (!bookJson?.success && bookJson?.error) {
            console.warn("Direct booking persistence warning:", bookJson.error);
            addToast?.("Perhatian", bookJson.error, "warning");
          }
        }
      } catch (bookErr) {
        console.warn("Direct booking persistence warning:", bookErr);
      }

      if (roomIdParam && payRentalEscrow) {
        payRentalEscrow(roomIdParam, selectedMethod);
      } else if (createRentalOrder) {
        const newRoom = createRentalOrder({
          rentalId: rental.id,
          rentalTitle: rental.title,
          photoUrl: rental.photoUrl,
          storeId: rental.owner?.id || rental.userId || "mitra-sewa",
          storeName: rental.owner?.name || "Toko Mitra Rental",
          storeAvatar: rental.owner?.avatar || "/logotab.png",
          storePhone: rental.owner?.phone || "-",
          startDate,
          endDate,
          totalDays,
          dailyPrice: selectedPackage ? Number(selectedPackage.price) : dailyPrice,
          rentalFee,
          depositFee,
          packageId: selectedPackage?.id || null,
          packageName: selectedPackage?.name || null,
          totalAmount: finalAmount,
          discountAmount,
          appliedVoucher: appliedVoucher?.code || null,
          conditionNotes: "Body mulus, sensor bersih, kabel & charger lengkap.",
          pickupLocation: rental.address || rental.location || "Alamat Toko Mitra",
          paymentMethod: selectedMethod,
          isPaid: true,
        });
        if (!targetRoomId) {
          targetRoomId = newRoom?.id || `order-room-rental-${Date.now()}`;
        }
      }

      // 2. Hubungkan ke Midtrans Snap via paymentService jika belum ada snapToken dari book route
      if (!snapToken && (createdBookingId || targetRoomId)) {
        try {
          const paymentRes = await paymentService.createPayment({
            orderId: createdBookingId || targetRoomId,
            entityType: createdBookingId ? "rental" : "order",
            paymentMethod: selectedMethod,
          });
          snapToken = paymentRes?.snapToken || paymentRes?.token || null;
          bookingMidtransOrderId = paymentRes?.orderId || bookingMidtransOrderId || null;
        } catch (paymentErr) {
          console.warn("Midtrans payment creation note:", paymentErr.message);
        }
      }

      // 3. Helper untuk memfinalisasi dan mensinkronkan status sewa & chat
      const persistRentalPayment = async (transResult = null) => {
        try {
          const token = await authService.getValidAccessToken();
          const authHeaders = {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };

          const activeMidtransId = transResult?.order_id || bookingMidtransOrderId;

          // 3a. Sync status Midtrans ke server database
          if (activeMidtransId) {
            await fetch(`/api/payments/status?orderId=${encodeURIComponent(activeMidtransId)}&entityType=rental`, {
              headers: authHeaders,
            }).catch(() => null);
          } else if (createdBookingId) {
            await fetch(`/api/payments/status?entityId=${encodeURIComponent(createdBookingId)}&entityType=rental`, {
              headers: authHeaders,
            }).catch(() => null);
          }

          // 3b. Persist status PAID ke chat room
          if (targetRoomId) {
            await fetch("/api/chat/rooms", {
              method: "PATCH",
              headers: authHeaders,
              body: JSON.stringify({
                orderRoomId: targetRoomId,
                status: "paid_escrow",
                paymentStatus: "PAID",
                midtransOrderId: activeMidtransId || undefined,
                transactionId: transResult?.transaction_id || undefined,
              }),
            }).catch(() => {});

            // Kirim pesan pengumuman resmi di bilik chat
            if (sendChatMessage) {
              sendChatMessage(
                targetRoomId,
                `[PEMBAYARAN SEWA TERVERIFIKASI] Pembayaran sewa unit '${rental.title}' sebesar ${formatIDR(finalAmount)} telah aman terverifikasi di Rekening Bersama Bantuin.id. Mitra Toko dan Penyewa dapat mulai berkoordinasi untuk serah terima (handover) unit.`,
                { isSystemAnnouncement: true }
              );
            }
          }

          // 3c. Potong kuota voucher promo resmi jika ada
          if (appliedVoucher?.code) {
            await fetch("/api/vouchers/validate", {
              method: "POST",
              headers: authHeaders,
              body: JSON.stringify({
                code: appliedVoucher.code,
                orderAmount: rentalFee,
                category: "sewa",
                action: "redeem",
              }),
            }).catch((err) => console.warn("Failed to redeem voucher:", err));
          }
        } catch (syncErr) {
          console.warn("[Rental payment sync warning]:", syncErr);
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("bantuin_order_created"));
          window.dispatchEvent(new Event("bantuin_activity_updated"));
          window.dispatchEvent(new Event("bantuin_chat_update"));
          window.dispatchEvent(new Event("bantuin_notification_updated"));
          window.dispatchEvent(new Event("bantuin_vouchers_updated"));
        }

        setIsProcessing(false);
        setIsSuccess(true);
        clearFormDraft(DRAFT_KEY);

        const chatRoomId = targetRoomId || `order-room-rental-${Date.now()}`;
        const next = encodeURIComponent(`/chat?room=${chatRoomId}&category=sewa`);
        router.push(
          `/pembayaran/berhasil?type=sewa&title=${encodeURIComponent(
            rental?.title || "Pemesanan Sewa"
          )}&amount=${finalAmount}&next=${next}`
        );
      };

      // 4. Buka Midtrans Snap Popup jika token tersedia
      let snapObj = typeof window !== "undefined" ? window.snap : null;
      if (!snapObj && snapToken) {
        snapObj = await paymentService.loadSnap();
      }

      if (snapObj && snapToken) {
        snapObj.pay(snapToken, {
          onSuccess: async function (result) {
            await persistRentalPayment(result);
          },
          onPending: function () {
            setIsProcessing(false);
            router.push(`/activity`);
          },
          onError: function () {
            setIsProcessing(false);
            addToast?.("Pembayaran Gagal", "Pembayaran ditolak atau dibatalkan oleh gateway.");
          },
          onClose: function () {
            setIsProcessing(false);
          },
        });
      } else {
        // Fallback konfirmasi pembayaran terverifikasi di sandbox / offline dev mode
        await persistRentalPayment(null);
      }
    } catch (err) {
      console.error("Rental payment error:", err);
      setIsProcessing(false);
    }
  };

  const paymentChannels = [
    {
      id: "qris",
      name: "QRIS Instan",
      badge: "Paling Cepat",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay",
      feeText: "Bebas Biaya Admin",
      logo: <QrisLogo />
    },
    {
      id: "bca_va",
      name: "BCA Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "m-BCA, myBCA, KlikBCA, ATM BCA",
      feeText: "Bebas Biaya Admin",
      logo: <BcaLogo />
    },
    {
      id: "mandiri_va",
      name: "Mandiri Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Livin' by Mandiri, ATM Mandiri, Kopra",
      feeText: "Bebas Biaya Admin",
      logo: <MandiriLogo />
    },
    {
      id: "bri_va",
      name: "BRI Virtual Account (BRIVA)",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "BRImo, ATM BRI, AgenBRILink",
      feeText: "Bebas Biaya Admin",
      logo: <BriLogo />
    },
    {
      id: "bni_va",
      name: "BNI Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "BNI Mobile Banking, Internet Banking, ATM BNI",
      feeText: "Bebas Biaya Admin",
      logo: <BniLogo />
    }
  ];

  if (isCancelled) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
        <Navbar />
        <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-12 flex flex-col items-center justify-center">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-rose-200 shadow-sm flex flex-col items-center text-center max-w-md w-full animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider mb-2">
              Status: Dibatalkan
            </span>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">Transaksi Sewa Telah Dibatalkan</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
              Pesanan sewa unit <strong>&ldquo;{rental.title}&rdquo;</strong> telah dibatalkan. Sesi pembayaran telah dinonaktifkan secara permanen.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              <Link
                href="/activity?tab=selesai"
                className="flex-1 py-3 px-4 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm rounded-xl transition text-center shadow-xs"
              >
                Ke Riwayat Aktivitas
              </Link>
              <Link
                href={roomIdParam ? `/chat?room=${roomIdParam}` : `/sewa/${rental.id}`}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition text-center"
              >
                Kembali
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
      <Navbar />

      {/* Breadcrumb / Top Bar */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-[1400px] mx-auto px-3.5 sm:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
          <Link
            href={roomIdParam ? `/chat?room=${roomIdParam}` : `/sewa/${rental.id}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{roomIdParam ? "Kembali ke Chat Toko" : "Kembali ke Detail Barang"}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#1683FF] bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full border border-blue-100 whitespace-normal text-left">
              <Lock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span>Sistem Pembayaran Terverifikasi</span>
            </span>
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-blue-50/70 border border-blue-100 text-slate-700 text-[11px] sm:text-xs font-semibold shrink-0">
              <Clock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span>Batas Waktu:</span>
              <span className="font-mono font-black text-[#1683FF]">{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container - Expansive, clean, and fills space naturally */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Metode Pembayaran (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-5 min-w-0">
            <div>
              {/* Header Title */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                    Pilih Metode Pembayaran
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Pilih kanal bayar resmi berlisensi Bank Indonesia
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs text-[#1683FF] font-bold flex items-center gap-1.5 bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full border border-blue-100 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                  Verifikasi Otomatis
                </span>
              </div>

                {/* Payment Channel Selector List - Consistent Visual Structure */}
                <div className="flex flex-col gap-2 mt-3 sm:mt-4">
                  {paymentChannels.map((channel) => {
                    const isSelected = selectedMethod === channel.id;
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => setSelectedMethod(channel.id)}
                        className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer relative ${
                          isSelected
                            ? "border-[#1683FF] bg-blue-50/40 shadow-xs ring-1.5 ring-[#1683FF]"
                            : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                        }`}
                      >
                        {/* [Logo] */}
                        <div className="w-14 sm:w-16 h-10 px-2 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {channel.logo}
                        </div>

                        {/* Nama Metode & Informasi/Subtext */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {channel.name}
                            </span>
                            {channel.badge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border hidden xs:inline ${channel.badgeColor}`}>
                                {channel.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-500 leading-snug break-words mt-0.5">
                            {channel.description ? `${channel.description} • ${channel.feeText}` : channel.feeText}
                          </div>
                        </div>

                        {/* [Radio/Check] */}
                        <div className="shrink-0 pl-1">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-[#1683FF] text-white flex items-center justify-center shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

              {/* Active Channel Action Area */}
              <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-slate-100">
                {selectedMethod === "qris" && (
                  <QrisCodeCard
                    totalAmount={finalAmount}
                    formatIDR={formatIDR}
                    handleCopy={handleCopy}
                    isCopiedNominal={isCopiedNominal}
                  />
                )}

                {selectedMethod.endsWith("_va") && (
                  <div className="p-3.5 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 sm:space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs sm:text-sm">
                      <span className="text-slate-700 font-semibold">
                        Virtual Account {selectedMethod.split("_")[0].toUpperCase()}:
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                        Midtrans Otomatis
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="text-xs sm:text-sm text-slate-600 font-medium text-center sm:text-left">
                        Nomor Virtual Account resmi akan otomatis diterbitkan oleh Midtrans saat Anda menekan tombol <strong>Bayar Sekarang</strong>.
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500 pt-1">
                      <span className="break-words">Total Tagihan: <strong className="text-slate-900 font-bold">{formatIDR(finalAmount)}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopy(finalAmount, "nominal")}
                        className="self-start sm:self-auto px-2.5 sm:px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1683FF] border border-blue-100 text-xs font-bold rounded-md transition flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span>{isCopiedNominal ? "Tersalin" : "Salin Nominal"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Security Notice */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
              <span className="min-w-0 break-words">Transaksi dilindungi Sistem Pembayaran Resmi &amp; Terverifikasi Bantuin.</span>
            </div>
          </div>

          {/* Right Column: Rincian Tagihan & Tombol Bayar (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-5 min-w-0">
            <div className="space-y-3.5 sm:space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Rincian Tagihan
                </h2>
                <span className="text-[11px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-100 shrink-0">
                  100% Terverifikasi
                </span>
              </div>

              {/* Compact Item Card */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-start sm:items-center gap-3">
                <img
                  src={rental.photoUrl}
                  alt={rental.title}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words line-clamp-2">
                    {rental.title}
                  </h3>
                  {selectedPackage && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] text-[10px] font-extrabold mt-1 border border-blue-100">
                      <span>{selectedPackage.tier || "Paket"}: {selectedPackage.name}</span>
                    </div>
                  )}
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    Toko: <strong className="text-slate-700">{rental.owner?.name || "Toko Mitra"}</strong>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                    <span>{startDate} s/d {endDate} ({totalDays} Hari)</span>
                  </div>
                </div>
              </div>

              {/* Clean Harmonious Price Breakdown */}
              <div className="space-y-1.5 pt-1 text-xs">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                  <span className="min-w-0 break-words">
                    {selectedPackage
                      ? `Biaya Paket (${selectedPackage.name} - ${totalDays} hari)`
                      : `Biaya Sewa (${totalDays} hari × ${formatIDR(dailyPrice)})`}
                  </span>
                  <span className="font-semibold text-slate-900 text-right whitespace-nowrap">{formatIDR(rentalFee)}</span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                  <span className="inline-flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span>Uang Jaminan (Deposit)</span>
                    <span className="text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 whitespace-nowrap">
                      100% Balik
                    </span>
                  </span>
                  <span className="font-semibold text-slate-900 text-right whitespace-nowrap">{formatIDR(depositFee)}</span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-500 text-[11px]">
                  <span className="min-w-0 break-words">Potongan Platform Bantuin (8%)</span>
                  <span className="font-medium text-slate-700 text-right">-{formatIDR(platformFee)} (dari omset toko)</span>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-500 text-[11px]">
                  <span className="min-w-0 break-words">Biaya Pemrosesan Gateway</span>
                  <span className="font-semibold text-emerald-600 text-right whitespace-nowrap">Gratis (Ditanggung Platform)</span>
                </div>

                {discountAmount > 0 && (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-xs font-semibold text-emerald-600">
                    <span className="min-w-0 break-words">Diskon Voucher ({appliedVoucher?.code})</span>
                    <span className="text-right whitespace-nowrap">-{formatIDR(discountAmount)}</span>
                  </div>
                )}

                {/* Total Row */}
                <div className="pt-2.5 border-t border-slate-200/90 flex items-center justify-between gap-3 mt-1">
                  <div className="min-w-0">
                    <span className="font-black text-xs sm:text-sm text-slate-900 block">Total Pembayaran</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">Diproses via Payment Gateway Resmi</span>
                  </div>
                  <div className="text-right shrink-0">
                    {discountAmount > 0 && (
                      <span className="text-[10px] text-slate-400 line-through block">{formatIDR(totalAmount)}</span>
                    )}
                    <span className="font-black text-xl sm:text-2xl text-[#1683FF] tracking-tight whitespace-nowrap block">{formatIDR(finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Voucher & Diskon Shopee-style */}
              <VoucherPicker
                category="sewa"
                orderAmount={rentalFee}
                orderLocation={rental.location || rental.address || "Sleman, Yogyakarta"}
                onApply={handleVoucherApply}
                appliedVoucher={appliedVoucher}
              />

              {/* Trust Highlight - Sleek inline bar */}
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-slate-600 font-semibold text-center">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" /> Pembayaran Terverifikasi
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-[#1683FF] shrink-0" /> Titip KTP di Toko
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" /> Deposit Balik Utuh
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-2.5 pt-2">
              {isSuccess && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                  <span>Pembayaran Berhasil! Mengalihkan ke Ruang Chat...</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing || isSuccess}
                className="w-full py-3.5 sm:py-4 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm md:text-base rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <span>Memverifikasi Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 shrink-0" />
                    <span>Bayar Sekarang ({formatIDR(finalAmount)})</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RentalPembayaranPage() {
  return (
    <Suspense fallback={null}>
      <RentalPembayaranContent />
    </Suspense>
  );
}
