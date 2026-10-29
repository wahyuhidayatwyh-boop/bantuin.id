

/**
 * lib/chat/flowConfig.js
 * Konfigurasi Tunggal & Reusable Stepper Alur Transaksi Halaman Obrolan Bantuin.id
 * Mendukung 3 Pilar Transaksi: SEWA, JASA, & BANTUAN
 */

import { getGoogleMapsUrl } from "@/lib/utils";

export function getTransactionType(room) {
  if (!room) return "jasa";
  const catType = (room.categoryType || "").toLowerCase();
  const orderType = (room.orderType || "").toLowerCase();
  const rawCat = (room.category || "").toLowerCase();
  const rawTitle = (room.requestTitle || "").toLowerCase();
  const roomId = (room.id || "").toLowerCase();

  // 1. SEWA
  if (
    catType === "sewa" ||
    catType === "rental" ||
    orderType === "rental" ||
    rawCat.includes("sewa") ||
    rawCat.includes("rental") ||
    rawCat.includes("kamera") ||
    rawCat.includes("audio") ||
    rawCat.includes("sound") ||
    rawCat.includes("proyektor") ||
    rawCat.includes("lensa") ||
    rawCat.includes("motor") ||
    rawCat.includes("mobil") ||
    rawTitle.includes("sewa") ||
    rawTitle.includes("rental") ||
    rawTitle.includes("vario") ||
    rawTitle.includes("avanza") ||
    roomId.includes("sewa") ||
    roomId.includes("rental")
  ) {
    return "sewa";
  }

  // 2. BANTUAN
  if (
    catType === "bantuan" ||
    catType === "task" ||
    orderType === "task" ||
    rawCat.includes("bantuan") ||
    rawCat.includes("errand") ||
    rawCat.includes("kurir") ||
    rawCat.includes("titip") ||
    rawCat.includes("pindahan") ||
    rawTitle.includes("bantuan") ||
    rawTitle.includes("titip") ||
    rawTitle.includes("angkat") ||
    roomId.includes("bantuan") ||
    roomId.includes("order-room-101")
  ) {
    return "bantuan";
  }

  // 3. JASA (Default untuk layanan keahlian & profesional)
  return "jasa";
}

/**
 * Mengambil konfigurasi langkah, active step, completed steps, badge, dan action button
 * @param {Object} room - Data ruang obrolan saat ini
 * @param {string} activeRole - "requester" (pemesan/klien) | "helper" (mitra penyedia/toko)
 */
export function getChatFlowConfig(room, activeRole = "requester") {
  const transactionType = getTransactionType(room);
  let status = room?.orderStatus || room?.status;

  if (status === "not_selected" || status === "cancelled") {
    // Pertahankan status not_selected atau cancelled apa adanya
  } else if (!status || room?.stage === "inquiry" || status === "inquiry") {
    status = "inquiry";
  } else if (room?.stage === "active" && (!status || status === "inquiry")) {
    status = "room_created";
  }

  // Jika pembayaran sudah berstatus PAID di database, pastikan alur langsung ke tahap paid_escrow
  if (
    room?.paymentStatus === "PAID" &&
    status !== "not_selected" &&
    status !== "cancelled" &&
    (status === "room_created" || status === "helper_selected" || status === "pending_payment" || status === "inquiry")
  ) {
    status = "paid_escrow";
  }

  let result;
  if (transactionType === "sewa") {
    result = getSewaFlowConfig(room, status, activeRole);
  } else if (transactionType === "bantuan") {
    result = getBantuanFlowConfig(room, status, activeRole);
  } else {
    result = getJasaFlowConfig(room, status, activeRole);
  }

  // Enrich hasil dengan deteksi fisik & URL Google Maps yang presisi
  const isPhysical = result?.isPhysical !== undefined
    ? result.isPhysical
    : (
        transactionType === "sewa"
          ? true
          : transactionType === "bantuan"
          ? Boolean(
              room?.mode !== "online" &&
              room?.request?.mode !== "online" &&
              !String(room?.category || "").toLowerCase().includes("online") &&
              !String(room?.category || "").toLowerCase().includes("remote") &&
              !String(room?.category || "").toLowerCase().includes("desain") &&
              !String(room?.category || "").toLowerCase().includes("ketik")
            )
          : result?.execMode !== "online"
      );

  const locInfo = result?.locationInfo || room?.request?.locationName || room?.pickupPoint || "";
  const mapsUrl = result?.googleMapsUrl || (
    isPhysical
      ? getGoogleMapsUrl(
          (room?.request?.latitude && room?.request?.longitude)
            ? { latitude: room.request.latitude, longitude: room.request.longitude }
            : (room?.latitude && room?.longitude)
            ? { latitude: room.latitude, longitude: room.longitude }
            : (room?.rental?.latitude && room?.rental?.longitude)
            ? { latitude: room.rental.latitude, longitude: room.rental.longitude }
            : (room?.request?.bantuinPoint?.latitude && room?.request?.bantuinPoint?.longitude)
            ? { latitude: room.request.bantuinPoint.latitude, longitude: room.request.bantuinPoint.longitude }
            : (room?.request?.bantuinPoint?.address || room?.request?.locationName || locInfo)
        )
      : null
  );

  return {
    ...result,
    isPhysical,
    locationInfo: locInfo,
    googleMapsUrl: mapsUrl,
  };
}

// =============================================================================
// 1. FLOW CONFIG: SEWA (Rental Alat & Kendaraan)
// Alur: Tanya Mitra → Pembayaran → Serah Terima → Pengembalian → Selesai & Rating
// =============================================================================
function getSewaFlowConfig(room, status, activeRole) {
  const isVehicle = Boolean(
    room?.categoryType === "rental" ||
    room?.category?.toLowerCase().includes("motor") ||
    room?.category?.toLowerCase().includes("mobil") ||
    room?.requestTitle?.toLowerCase().includes("motor") ||
    room?.requestTitle?.toLowerCase().includes("mobil") ||
    room?.requestTitle?.toLowerCase().includes("vario") ||
    room?.requestTitle?.toLowerCase().includes("avanza")
  );
  const unitNoun = isVehicle ? "Kendaraan" : "Alat";

  const steps = [
    { number: 1, id: "inquiry", title: isVehicle ? "Tanya Mitra" : "Tanya Toko", desc: "Cek unit & jadwal" },
    { number: 2, id: "payment", title: "Pembayaran", desc: "Escrow Gateway" },
    { number: 3, id: "handover", title: "Serah Terima", desc: isVehicle ? "Cek unit & kunci" : "Titip KTP & Foto fisik" },
    { number: 4, id: "return", title: "Pengembalian", desc: "KTP & Deposit balik" },
    { number: 5, id: "completion", title: "Selesai & Rating", desc: "Ulasan transaksi" },
  ];

  const rental = room?.rentalDetails || {
    unitName: room?.requestTitle || `Unit ${unitNoun} Sewa`,
    startDate: "2026-09-20",
    endDate: "2026-09-22",
  };
  const paymentUrl = `/sewa/${room?.rentalDetails?.rentalId || room?.requestId || "rental-101"}/pembayaran?roomId=${room?.id || ""}&start=${rental.startDate || "2026-09-20"}&end=${rental.endDate || "2026-09-22"}`;

  // TAHAP PEMBATALAN (cancelled)
  if (status === "cancelled" || room?.paymentStatus === "CANCELLED" || room?.bookingStatus === "cancelled") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [],
      activeStep: null,
      progressPercent: 0,
      badge: {
        stage: 1,
        title: "Transaksi Sewa Dibatalkan",
        subtitle: `Pemesanan sewa unit ${unitNoun} ini telah dibatalkan. Seluruh proses transaksi dan pembayaran ditutup.`,
        isComplete: false,
      },
      itemTitle: rental.unitName,
      locationInfo: room?.pickupPoint || "Lokasi Mitra Rental",
      partnerLabel: `Pemilik: ${room?.helper?.name || "Mitra Rental"}`,
      primaryAction: { type: "badge", label: "Sewa Dibatalkan", icon: "AlertCircle" },
    };
  }

  // TAHAP 1: INQUIRY
  if (status === "inquiry") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [],
      activeStep: 1,
      progressPercent: 10,
      badge: {
        stage: 1,
        title: isVehicle ? "Tahap 1 • Tanya Mitra" : "Tahap 1 • Tanya Toko",
        subtitle: isVehicle ? "Cek unit & tanggal sewa" : "Cek ketersediaan & jadwal",
        isComplete: false,
      },
      itemTitle: rental.unitName,
      locationInfo: room?.helper?.address || "Lokasi Pengambilan Toko Mitra",
      partnerLabel: `Toko Mitra: ${room?.helper?.name || "Mitra Sewa"}`,
      primaryAction: activeRole === "requester"
        ? { type: "link", href: paymentUrl, label: "Bayar Sekarang", icon: "Lock" }
        : { type: "badge", label: "Menunggu Pembayaran", icon: "Clock" },
    };
  }

  // TAHAP 2: MENUNGGU PEMBAYARAN (room_created / pending_payment)
  if (status === "room_created" || status === "pending_payment") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [1],
      activeStep: 2,
      progressPercent: 25,
      badge: {
        stage: 2,
        title: "Tahap 2 • Menunggu Pembayaran",
        subtitle: "Lakukan pembayaran sewa & deposit jaminan via Rekber Bantuin.",
        isComplete: false,
      },
      itemTitle: rental.unitName,
      locationInfo: room?.helper?.address || "Lokasi Pengambilan Toko Mitra",
      partnerLabel: `Toko Mitra: ${room?.helper?.name || "Mitra Sewa"}`,
      primaryAction: activeRole === "requester"
        ? { type: "link", href: paymentUrl, label: "Bayar Sewa Sekarang", icon: "Lock" }
        : { type: "badge", label: "Menunggu Pembayaran", icon: "Clock" },
    };
  }

  // TAHAP 3: PEMBAYARAN SELESAI (paid_escrow / payment_held)
  // Serah Terima menjadi active step (Step 3) karena Pembayaran (Step 2) sudah selesai!
  if (status === "paid_escrow" || status === "payment_held") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 45,
      badge: {
        stage: 3,
        title: `Tahap 3 • Serah Terima ${unitNoun}`,
        subtitle: activeRole === "helper"
          ? "Pembayaran terverifikasi di Rekber Bantuin. Silakan dokumentasikan serah terima fisik unit ke penyewa."
          : "Pembayaran terverifikasi resmi di Rekber Bantuin. Menunggu mitra toko menyerahkan unit & dokumentasi serah terima.",
        isComplete: false,
      },
      itemTitle: rental.unitName,
      locationInfo: room?.helper?.address || "Lokasi Pengambilan Toko Mitra",
      partnerLabel: `Toko Mitra: ${room?.helper?.name || "Mitra Sewa"}`,
      primaryAction: activeRole === "helper"
        ? { type: "modal", modalKey: "handover", label: "Serah Terima Unit", icon: "Camera" }
        : { type: "badge", label: "Menunggu Penyerahan dari Mitra", icon: "Clock" },
    };
  }

  // TAHAP 3: SERAH TERIMA SELESAI / DIGUNAKAN (item_handed_over / handed_over / in_use / item_picked_up)
  // Serah Terima sudah selesai (✓). Pengembalian (Step 4) menjadi active step!
  if (status === "item_handed_over" || status === "handed_over" || status === "in_use" || status === "item_picked_up") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [1, 2, 3],
      activeStep: 4,
      progressPercent: 70,
      badge: {
        stage: 4,
        title: isVehicle ? "Tahap 4 • Masa Sewa & Pengembalian" : "Tahap 4 • Pengembalian Alat",
        subtitle: "Unit aktif digunakan. Tindakan berikutnya: Pengembalian unit ke toko",
        isComplete: false,
      },
      itemTitle: rental.unitName,
      locationInfo: room?.helper?.address || "Lokasi Pengambilan Toko Mitra",
      partnerLabel: `Toko Mitra: ${room?.helper?.name || "Mitra Sewa"}`,
      primaryAction: activeRole === "helper"
        ? { type: "modal", modalKey: "return", label: "Verifikasi Pengembalian", icon: "RefreshCw" }
        : { type: "modal", modalKey: "return", label: "Ajukan Pengembalian", icon: "RefreshCw" },
    };
  }

  // TAHAP 4: UNIT DIKEMBALIKAN (returned / task_delivered)
  // Pengembalian selesai (✓). Selesai & Rating (Step 5) menjadi active step!
  if (status === "returned" || status === "task_delivered") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [1, 2, 3, 4],
      activeStep: 5,
      progressPercent: 90,
      badge: {
        stage: 5,
        title: `Tahap 5 • Selesai & Rating`,
        subtitle: "Unit telah kembali. Berikan ulasan transaksi untuk toko mitra.",
        isComplete: false,
      },
      itemTitle: rental.unitName,
      locationInfo: room?.helper?.address || "Lokasi Pengambilan Toko Mitra",
      partnerLabel: `Toko Mitra: ${room?.helper?.name || "Mitra Sewa"}`,
      primaryAction: activeRole === "requester"
        ? { type: "modal", modalKey: "review", label: "Beri Rating Toko", icon: "Star" }
        : { type: "badge", label: "Menunggu Ulasan", icon: "Clock" },
    };
  }

  // TAHAP 5: SELESAI (completed)
  return {
    transactionType: "sewa",
    unitNoun,
    steps,
    completedSteps: [1, 2, 3, 4, 5],
    activeStep: null,
    progressPercent: 100,
    badge: {
      stage: 5,
      title: "Tahap 5 • Selesai",
      subtitle: "Transaksi sewa tuntas & ulasan tersimpan",
      isComplete: true,
    },
    itemTitle: rental.unitName,
    locationInfo: room?.helper?.address || "Lokasi Pengambilan Toko Mitra",
    partnerLabel: `Toko Mitra: ${room?.helper?.name || "Mitra Sewa"}`,
    primaryAction: { type: "badge_completed", label: "Selesai ✓", icon: "Star" },
  };
}

// =============================================================================
// HELPER: DETEKSI METODE PELAKSANAAN (ONLINE, ON-SITE / PANGGILAN, WORKSHOP, HYBRID)
// =============================================================================
export function getExecutionMode(room, transactionType = "jasa") {
  if (transactionType === "sewa") return "physical";

  const explicitMode = (
    room?.locationType ||
    room?.serviceDetails?.locationType ||
    room?.service?.locationType ||
    room?.mode ||
    room?.request?.mode ||
    ""
  ).toLowerCase();

  if (explicitMode === "online" || explicitMode === "remote") return "online";
  if (explicitMode === "customer_location" || explicitMode === "panggilan") return "customer_location";
  if (explicitMode === "onsite" || explicitMode === "studio" || explicitMode === "workshop") return "onsite";
  if (explicitMode === "offline") return "customer_location";
  if (explicitMode === "hybrid") return "hybrid";

  // Heuristik cerdas berbasis kategori & judul
  const text = `${room?.category || ""} ${room?.serviceDetails?.category || ""} ${room?.requestTitle || ""} ${room?.title || ""}`.toLowerCase();

  // Bantuan / Jasa Lapangan
  if (
    text.includes("antar") ||
    text.includes("titip") ||
    text.includes("kurir") ||
    text.includes("pindahan") ||
    text.includes("print") ||
    text.includes("fotokopi") ||
    text.includes("angkat")
  ) {
    return "customer_location";
  }

  // Layanan Panggilan ke Lokasi Klien
  if (
    text.includes("makeup") ||
    text.includes("mua") ||
    text.includes("les privat") ||
    text.includes("tutor") ||
    text.includes("panggilan") ||
    text.includes("montir") ||
    text.includes("kebersihan") ||
    text.includes("cuci ac") ||
    text.includes("fotografi wisuda")
  ) {
    return "customer_location";
  }

  // Layanan di Studio / Workshop / Konter
  if (
    text.includes("studio") ||
    text.includes("workshop") ||
    text.includes("servis laptop") ||
    text.includes("servis hp") ||
    text.includes("sablon") ||
    text.includes("percetakan") ||
    text.includes("konter")
  ) {
    return "onsite";
  }

  // Layanan Digital
  if (
    text.includes("desain") ||
    text.includes("koding") ||
    text.includes("programming") ||
    text.includes("web") ||
    text.includes("ketik") ||
    text.includes("excel") ||
    text.includes("translate") ||
    text.includes("terjemah") ||
    text.includes("jurnal") ||
    text.includes("skripsi") ||
    text.includes("presentasi")
  ) {
    return "online";
  }

  return transactionType === "bantuan" ? "customer_location" : "hybrid";
}

// =============================================================================
// 2. FLOW CONFIG: JASA (Layanan Keahlian & Jasa Profesional - Adaptif)
// Alur Adaptif berdasarkan Metode:
// - customer_location: Tanya & Jadwal → Pembayaran → Kunjungan & Kerja (OTW/Tiba) → Serah Terima Fisik → Selesai & Rating
// - onsite: Tanya Mitra → Pembayaran → Workshop (Terima Unit/Servis) → Siap Diambil → Selesai & Rating
// - online: Tanya Mitra → Pembayaran → Pengerjaan Digital → Pemeriksaan Berkas → Selesai & Rating
// - hybrid: Tanya Mitra → Pembayaran → Pelaksanaan → Serah Terima Hasil → Selesai & Rating
// =============================================================================
function getJasaFlowConfig(room, status, activeRole) {
  const execMode = getExecutionMode(room, "jasa");

  // Langkah stepper yang menyesuaikan metode layanan
  let steps = [
    { number: 1, id: "inquiry", title: "Tanya Mitra", desc: "Konsultasi brief" },
    { number: 2, id: "payment", title: "Pembayaran", desc: "Rekber Bantuin" },
    { number: 3, id: "work", title: "Pengerjaan", desc: "Proses oleh Mitra" },
    { number: 4, id: "review", title: "Pemeriksaan/Hasil", desc: "Verifikasi Klien" },
    { number: 5, id: "completion", title: "Selesai & Rating", desc: "Ulasan jasa" },
  ];

  if (execMode === "customer_location") {
    steps = [
      { number: 1, id: "inquiry", title: "Tanya & Jadwal", desc: "Janji temu & alamat" },
      { number: 2, id: "payment", title: "Pembayaran", desc: "Rekber Bantuin" },
      { number: 3, id: "work", title: "Kunjungan & Kerja", desc: "OTW & Mulai di lokasi" },
      { number: 4, id: "review", title: "Serah Terima", desc: "Bukti fisik selesai" },
      { number: 5, id: "completion", title: "Selesai & Rating", desc: "Ulasan jasa" },
    ];
  } else if (execMode === "onsite") {
    steps = [
      { number: 1, id: "inquiry", title: "Tanya Mitra", desc: "Jadwal & konsultasi" },
      { number: 2, id: "payment", title: "Pembayaran", desc: "Rekber Bantuin" },
      { number: 3, id: "work", title: "Pengerjaan di Lokasi Mitra", desc: "Klien datang & diproses" },
      { number: 4, id: "review", title: "Pemeriksaan & Serah Terima", desc: "Bukti selesai & cek hasil" },
      { number: 5, id: "completion", title: "Selesai & Rating", desc: "Ulasan jasa" },
    ];
  } else if (execMode === "online") {
    steps = [
      { number: 1, id: "inquiry", title: "Tanya Mitra", desc: "Konsultasi brief" },
      { number: 2, id: "payment", title: "Pembayaran", desc: "Rekber Bantuin" },
      { number: 3, id: "work", title: "Pengerjaan Digital", desc: "Diproses oleh Mitra" },
      { number: 4, id: "review", title: "Pemeriksaan Berkas", desc: "Periksa berkas/link" },
      { number: 5, id: "completion", title: "Selesai & Rating", desc: "Ulasan jasa" },
    ];
  }

  const serviceTitle = room?.serviceDetails?.serviceTitle || room?.requestTitle || "Layanan Jasa";
  const packageName = room?.serviceDetails?.packageName || room?.packageId || (room?.category ? `${room.category}` : "Paket Standar");
  const lockedPrice = room?.lockedAmount || room?.serviceDetails?.totalAmount || 150000;
  const serviceIdForPayment = room?.serviceId || room?.serviceDetails?.serviceId || (room?.requestId === "req-3" ? "cat-fjr-3" : room?.catalogId) || "cat-fjr-1";
  const paymentUrl = `/jasa/${serviceIdForPayment}/pembayaran?roomId=${room?.id || ""}&amount=${lockedPrice}&pkg=${encodeURIComponent(packageName)}`;

  const locationSubtitle = execMode === "customer_location"
    ? (room?.pickupPoint || room?.address || "Lokasi Pemesan (Panggilan)")
    : execMode === "onsite"
    ? (room?.address || room?.helper?.partnerAddress || room?.helper?.address || "Lokasi Tempat Mitra")
    : execMode === "online"
    ? "Workroom Digital (100% Online)"
    : (room?.pickupPoint || room?.address || "Hybrid (Online / Lokasi Mitra)");

  // TAHAP PEMBATALAN (cancelled)
  if (status === "cancelled" || room?.paymentStatus === "CANCELLED" || room?.orderStatus === "cancelled") {
    return {
      transactionType: "jasa",
      execMode,
      steps,
      completedSteps: [],
      activeStep: null,
      progressPercent: 0,
      badge: {
        stage: 1,
        title: "Pesanan Jasa Dibatalkan",
        subtitle: "Pesanan jasa ini telah dibatalkan secara resmi. Seluruh proses pengerjaan dan pembayaran dinonaktifkan.",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: locationSubtitle,
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: { type: "badge", label: "Pesanan Dibatalkan", icon: "AlertCircle" },
    };
  }

  // TAHAP 1: INQUIRY (Tanya Mitra / Konsultasi)
  if (status === "inquiry") {
    return {
      transactionType: "jasa",
      execMode,
      steps,
      completedSteps: [],
      activeStep: 1,
      progressPercent: 10,
      badge: {
        stage: 1,
        title: execMode === "customer_location" ? "Tahap 1 • Janji Temu & Konsultasi" : "Tahap 1 • Konsultasi Jasa",
        subtitle: execMode === "customer_location" ? "Diskusikan rincian brief, alamat, dan tanggal janji temu" : "Diskusikan rincian brief sebelum pembayaran",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: locationSubtitle,
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "requester"
        ? { type: "link", href: paymentUrl, label: "Bayar Sekarang", icon: "Lock" }
        : { type: "badge", label: "Menunggu Pembayaran", icon: "Clock" },
    };
  }

  // TAHAP 2: MENUNGGU PEMBAYARAN (room_created / pending_payment)
  if (status === "room_created" || status === "pending_payment") {
    return {
      transactionType: "jasa",
      execMode,
      steps,
      completedSteps: [1],
      activeStep: 2,
      progressPercent: 25,
      badge: {
        stage: 2,
        title: "Tahap 2 • Menunggu Pembayaran",
        subtitle: "Selesaikan pembayaran Rekber Bantuin untuk memulai pelaksanaan jasa.",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: locationSubtitle,
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "requester"
        ? { type: "link", href: paymentUrl, label: "Bayar Sekarang", icon: "Lock" }
        : { type: "badge", label: "Menunggu Pembayaran Klien", icon: "Clock" },
    };
  }

  // TAHAP 3: PEMBAYARAN TERVERIFIKASI (paid_escrow)
  if (status === "paid_escrow") {
    let helperAction = { type: "action", actionKey: "start_working", label: "Mulai Pengerjaan", icon: "CheckCircle2" };
    let badgeTitle = "Tahap 3 • Pengerjaan Jasa";
    let badgeSubtitle = "Dana diamankan di Rekber Bantuin. Mitra siap memulai pengerjaan.";
    let requesterBadge = "Pembayaran Aman (Siap Dikerjakan)";

    if (execMode === "customer_location") {
      helperAction = { type: "action", actionKey: "jasa_on_the_way", label: "Menuju Lokasi (OTW)", icon: "MapPin" };
      badgeTitle = "Tahap 3 • Siap Menuju Lokasi";
      badgeSubtitle = "Dana diamankan di Rekber. Mitra bersiap berangkat ke lokasi janji temu.";
      requesterBadge = "Dana Diamankan (Mitra Siap OTW)";
    } else if (execMode === "onsite") {
      helperAction = { type: "action", actionKey: "jasa_unit_received", label: "Konfirmasi Klien Tiba / Mulai", icon: "CheckCircle2" };
      badgeTitle = "Tahap 3 • Menunggu Kedatangan Klien";
      badgeSubtitle = "Dana aman di Rekber. Klien dapat datang langsung ke lokasi tempat mitra sesuai jadwal.";
      requesterBadge = "Dana Aman (Silakan Datang ke Lokasi Mitra)";
    } else if (execMode === "online") {
      helperAction = { type: "action", actionKey: "start_working", label: "Mulai Pengerjaan Digital", icon: "CheckCircle2" };
      badgeTitle = "Tahap 3 • Mulai Pengerjaan Digital";
      badgeSubtitle = "Dana diamankan di Rekber Bantuin. Mitra siap memproses brief pekerjaan.";
      requesterBadge = "Pembayaran Aman (Mitra Siap Mengerjakan)";
    }

    return {
      transactionType: "jasa",
      execMode,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 45,
      badge: {
        stage: 3,
        title: badgeTitle,
        subtitle: badgeSubtitle,
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: locationSubtitle,
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "helper"
        ? helperAction
        : { type: "badge", label: requesterBadge, icon: "Clock" },
    };
  }

  // TAHAP 3A: MITRA MENUJU LOKASI (on_the_way - Khusus Panggilan / Lapangan)
  if (status === "on_the_way") {
    return {
      transactionType: "jasa",
      execMode,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 55,
      badge: {
        stage: 3,
        title: "Tahap 3 • Mitra Sedang OTW",
        subtitle: "Mitra sedang dalam perjalanan menuju titik lokasi pemesan",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: locationSubtitle,
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "helper"
        ? { type: "action", actionKey: "jasa_arrived", label: "Tiba di Lokasi & Mulai", icon: "CheckCircle2" }
        : { type: "badge", label: "Mitra Sedang Menuju Lokasi", icon: "Clock" },
    };
  }

  // TAHAP 3C: SEDANG DIKERJAKAN (in_progress atau startedAt sudah ada)
  if (status === "in_progress" || Boolean(room?.startedAt)) {
    const deliverableLabel = execMode === "online"
      ? "Kirim Berkas / Tautan Hasil"
      : execMode === "onsite"
      ? "Pekerjaan Selesai & Kirim Bukti"
      : "Kirim Bukti Pekerjaan Selesai";

    return {
      transactionType: "jasa",
      execMode,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 65,
      badge: {
        stage: 3,
        title: execMode === "customer_location" ? "Tahap 3 • Pengerjaan di Tempat" : "Tahap 3 • Sedang Dikerjakan",
        subtitle: execMode === "customer_location"
          ? "Mitra sedang melaksanakan layanan secara langsung di lokasi"
          : "Mitra sedang memproses pesanan sesuai rincian brief",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: locationSubtitle,
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "helper"
        ? { type: "modal", modalKey: "deliverables", label: deliverableLabel, icon: "Upload" }
        : { type: "badge", label: "Sedang Dikerjakan", icon: "Clock" },
    };
  }

  // TAHAP 3B: KLIEN TIBA DI LOKASI MITRA (item_picked_up - Khusus Onsite, sebelum startedAt)
  if (status === "item_picked_up") {
    return {
      transactionType: "jasa",
      execMode,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 55,
      badge: {
        stage: 3,
        title: "Tahap 3 • Klien Tiba di Lokasi Mitra",
        subtitle: "Klien telah tiba di lokasi tempat mitra dan pengerjaan layanan dimulai",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: locationSubtitle,
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "helper"
        ? { type: "action", actionKey: "start_working", label: "Mulai Pengerjaan", icon: "CheckCircle2" }
        : { type: "badge", label: "Pengerjaan di Lokasi Mitra", icon: "Clock" },
    };
  }

  // TAHAP 4: HASIL KERJA DISERAHKAN (proof_submitted / awaiting_confirmation / task_delivered)
  if (status === "proof_submitted" || status === "awaiting_confirmation" || status === "task_delivered") {
    return {
      transactionType: "jasa",
      execMode,
      steps,
      completedSteps: [1, 2, 3],
      activeStep: 4,
      progressPercent: 80,
      badge: {
        stage: 4,
        title: execMode === "onsite" ? "Tahap 4 • Pemeriksaan & Serah Terima" : "Tahap 4 • Pemeriksaan Hasil",
        subtitle: execMode === "online"
          ? "Hasil kerja telah diserahkan. Klien memeriksa berkas/tautan digital."
          : "Pekerjaan telah rampung dan bukti dokumentasi fisik telah diserahkan. Klien memeriksa hasil.",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: locationSubtitle,
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "requester"
        ? {
          type: "dual",
          secondary: { type: "modal", modalKey: "revision", label: "Minta Revisi" },
          primary: { type: "modal", modalKey: "review", label: "Setujui & Selesaikan", icon: "CheckCircle2" }
        }
        : { type: "badge", label: "Menunggu Review Klien", icon: "Clock" },
    };
  }

  // TAHAP 5: SELESAI (completed)
  return {
    transactionType: "jasa",
    execMode,
    steps,
    completedSteps: [1, 2, 3, 4, 5],
    activeStep: null,
    progressPercent: 100,
    badge: {
      stage: 5,
      title: "Tahap 5 • Selesai",
      subtitle: "Pesanan jasa disetujui, dana dicairkan, & transaksi tuntas",
      isComplete: true,
    },
    itemTitle: serviceTitle,
    locationInfo: locationSubtitle,
    partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
    primaryAction: { type: "badge_completed", label: "Selesai ✓", icon: "Star" },
  };
}

// =============================================================================
// 3. FLOW CONFIG: BANTUAN (Komunitas, Kurir, Titip & Errand Lapangan)
// Alur: Ajukan Bantuan → Konfirmasi → Proses Bantuan → Selesai → Rating
// =============================================================================
function getBantuanFlowConfig(room, status, activeRole) {
  const steps = [
    { number: 1, id: "inquiry", title: "Ajukan Bantuan", desc: "Diskusi kebutuhan" },
    { number: 2, id: "confirmation", title: "Konfirmasi", desc: "Pilih helper & kunci dana" },
    { number: 3, id: "process", title: "Proses Bantuan", desc: "Helper menjalankan tugas" },
    { number: 4, id: "finish", title: "Selesai", desc: "Verifikasi tugas tuntas" },
    { number: 5, id: "rating", title: "Rating", desc: "Ulasan helper" },
  ];

  const taskTitle = room?.requestTitle || room?.serviceDetails?.serviceTitle || "Tugas Bantuan Lapangan";
  const paymentUrl = `/bantuan/${room?.requestId || "req-1"}/pembayaran?offerId=${room?.helper?.id || "off-101"}&roomId=${room?.id || ""}`;

  // TAHAP: PELAMAR BELUM TERPILIH / TUGAS DITUTUP (not_selected / cancelled)
  if (status === "not_selected" || status === "cancelled" || room?.orderStatus === "cancelled" || room?.request?.status === "cancelled") {
    const isCancelledExplicit = status === "cancelled" || room?.orderStatus === "cancelled" || room?.request?.status === "cancelled";
    return {
      transactionType: "bantuan",
      steps,
      completedSteps: [],
      activeStep: null,
      progressPercent: 0,
      badge: {
        stage: 1,
        title: isCancelledExplicit ? "Permintaan Bantuan Dibatalkan" : "Tawaran Belum Terpilih / Tugas Ditutup",
        subtitle: isCancelledExplicit
          ? "Permintaan tugas bantuan ini telah dibatalkan secara resmi. Seluruh proses pengerjaan dan pembayaran dinonaktifkan."
          : activeRole === "helper"
          ? "Pemesan telah memilih helper lain untuk tugas bantuan ini."
          : "Permintaan bantuan ini telah memiliki helper terpilih atau ditutup.",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: room?.pickupPoint || "Titik Tugas Lapangan",
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: { type: "badge", label: isCancelledExplicit ? "Tugas Dibatalkan" : "Tawaran Ditutup", icon: "Clock" },
    };
  }

  // TAHAP 1: AJUKAN BANTUAN / DISKUSI (inquiry)
  if (status === "inquiry") {
    return {
      transactionType: "bantuan",
      steps,
      completedSteps: [],
      activeStep: 1,
      progressPercent: 10,
      badge: {
        stage: 1,
        title: "Tahap 1 • Diskusi Bantuan",
        subtitle: "Sepakati detail bantuan sebelum konfirmasi",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: room?.pickupPoint || "Titik Tugas Lapangan",
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "requester"
        ? { type: "link", href: paymentUrl, label: "Pilih Helper & Kunci Dana", icon: "Lock" }
        : { type: "badge", label: "Menunggu Konfirmasi", icon: "Clock" },
    };
  }

  // TAHAP 2: MENUNGGU PEMBAYARAN / KUNCI DANA (room_created / pending_payment / helper_selected)
  if (status === "room_created" || status === "pending_payment" || status === "helper_selected") {
    return {
      transactionType: "bantuan",
      steps,
      completedSteps: [1],
      activeStep: 2,
      progressPercent: 25,
      badge: {
        stage: 2,
        title: "Tahap 2 • Menunggu Pembayaran",
        subtitle: "Selesaikan penguncian dana imbalan di Rekber Bantuin untuk menugaskan helper.",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: room?.pickupPoint || "Titik Tugas Lapangan",
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "requester"
        ? { type: "link", href: paymentUrl, label: "Kunci Dana Sekarang", icon: "Lock" }
        : { type: "badge", label: "Menunggu Pembayaran Klien", icon: "Clock" },
    };
  }

  const execMode = getExecutionMode(room, "bantuan");
  const isOnline = execMode === "online";

  // TAHAP 3: PEMBAYARAN SELESAI / HELPER TERPILIH (paid_escrow)
  if (status === "paid_escrow") {
    return {
      transactionType: "bantuan",
      execMode,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 45,
      badge: {
        stage: 3,
        title: isOnline ? "Tahap 3 • Mulai Pengerjaan Digital" : "Tahap 3 • Proses Bantuan",
        subtitle: isOnline
          ? "Dana diamankan di Rekber. Helper siap memproses pengerjaan digital secara online."
          : "Helper telah dipilih & imbalan diamankan di Rekber. Helper siap menjalankan tugas ke lokasi.",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: isOnline ? "Workroom Digital (Online)" : (room?.pickupPoint || "Titik Tugas Lapangan"),
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "helper"
        ? (isOnline
            ? { type: "action", actionKey: "helper_on_the_way", label: "Mulai Kerjakan Digital", icon: "Play" }
            : { type: "action", actionKey: "helper_on_the_way", label: "Menuju Lokasi (OTW)", icon: "MapPin" })
        : { type: "badge", label: isOnline ? "Dana Terkunci (Helper Siap Mengerjakan)" : "Dana Terkunci (Helper Siap OTW)", icon: "Clock" },
    };
  }

  // TAHAP 3A: HELPER MENUJU LOKASI / PROSES DIGITAL (on_the_way)
  if (status === "on_the_way") {
    return {
      transactionType: "bantuan",
      execMode,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 55,
      badge: {
        stage: 3,
        title: isOnline ? "Tahap 3 • Pengerjaan Digital Berjalan" : "Tahap 3 • Helper Menuju Lokasi",
        subtitle: isOnline
          ? "Helper sedang memproses pengerjaan tugas secara digital/remote"
          : "Helper sedang dalam perjalanan ke titik tugas",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: isOnline ? "Workroom Digital (Online)" : (room?.pickupPoint || "Titik Tugas Lapangan"),
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "helper"
        ? (isOnline
            ? { type: "modal", modalKey: "task_proof", label: "Kirim Hasil Pengerjaan", icon: "Upload" }
            : { type: "action", actionKey: "helper_picked_up", label: "Tiba / Ambil Barang", icon: "CheckCircle2" })
        : { type: "badge", label: isOnline ? "Pengerjaan Digital" : "Helper Menuju Lokasi", icon: "Clock" },
    };
  }

  // TAHAP 3B: BARANG DIAMBIL / SEDANG DIKERJAKAN (item_picked_up / in_progress)
  if (status === "item_picked_up" || status === "in_progress") {
    return {
      transactionType: "bantuan",
      execMode,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 65,
      badge: {
        stage: 3,
        title: isOnline ? "Tahap 3 • Pengerjaan Digital Berlangsung" : "Tahap 3 • Proses Bantuan",
        subtitle: isOnline ? "Tugas online sedang diproses. Kirim berkas/tautan jika tuntas." : "Tugas sedang dikerjakan. Kirim bukti jika tuntas.",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: isOnline ? "Workroom Digital (Online)" : (room?.pickupPoint || "Titik Tugas Lapangan"),
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "helper"
        ? { type: "modal", modalKey: "task_proof", label: isOnline ? "Kirim Hasil (Berkas / Tautan)" : "Kirim Bukti Tugas", icon: "Upload" }
        : { type: "badge", label: "Tugas Berlangsung", icon: "Clock" },
    };
  }

  // TAHAP 4: BUKTI TUGAS DISERAHKAN (proof_submitted / awaiting_confirmation / task_delivered)
  // Proses Bantuan selesai (✓). Selesai (Step 4) menjadi active step!
  if (status === "proof_submitted" || status === "awaiting_confirmation" || status === "task_delivered") {
    return {
      transactionType: "bantuan",
      steps,
      completedSteps: [1, 2, 3],
      activeStep: 4,
      progressPercent: 85,
      badge: {
        stage: 4,
        title: "Tahap 4 • Verifikasi Tugas",
        subtitle: "Helper telah mengirim bukti tugas. Pemesan memeriksa.",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: room?.pickupPoint || "Titik Tugas Lapangan",
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "requester"
        ? { type: "modal", modalKey: "task_completion", label: "Konfirmasi Tugas Selesai", icon: "CheckCircle2" }
        : { type: "badge", label: "Menunggu Konfirmasi Pemesan", icon: "Clock" },
    };
  }

  // TAHAP 5: SELESAI & RATING (completed)
  return {
    transactionType: "bantuan",
    steps,
    completedSteps: [1, 2, 3, 4, 5],
    activeStep: null,
    progressPercent: 100,
    badge: {
      stage: 5,
      title: "Tahap 5 • Selesai & Terverifikasi",
      subtitle: "Bantuan telah tuntas & dana imbalan telah diteruskan ke helper",
      isComplete: true,
    },
    itemTitle: taskTitle,
    locationInfo: room?.pickupPoint || "Titik Tugas Lapangan",
    partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
    primaryAction: { type: "badge_completed", label: "Bantuan Selesai", icon: "Star" },
  };
}
