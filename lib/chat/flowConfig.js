/**
 * lib/chat/flowConfig.js
 * Konfigurasi Tunggal & Reusable Stepper Alur Transaksi Halaman Obrolan Bantuin.id
 * Mendukung 3 Pilar Transaksi: SEWA, JASA, & BANTUAN
 *
 * ATURAN UTAMA:
 * - Sumber kebenaran mutlak adalah STATUS TRANSAKSI (orderStatus)
 * - Langkah selesai = completed (✓)
 * - Langkah berikutnya yang harus dilakukan = active (→ / biru)
 * - Langkah berikutnya yang belum saatnya = pending (○ / abu-abu)
 * - Tahap yang sudah selesai TIDAK BOLEH berstatus active
 * - Tombol aksi utama (Primary Action) selalu sinkron dengan active step
 */

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
  const status = room?.orderStatus || (room?.stage === "inquiry" ? "inquiry" : "inquiry");

  if (transactionType === "sewa") {
    return getSewaFlowConfig(room, status, activeRole);
  } else if (transactionType === "bantuan") {
    return getBantuanFlowConfig(room, status, activeRole);
  } else {
    return getJasaFlowConfig(room, status, activeRole);
  }
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

  // TAHAP 2: PEMBAYARAN SELESAI (paid_escrow)
  // Serah Terima menjadi active step (Step 3) karena Pembayaran (Step 2) sudah selesai!
  if (status === "paid_escrow") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 45,
      badge: {
        stage: 2,
        title: `Tahap 2 • Siap Ambil ${unitNoun}`,
        subtitle: "Pembayaran terverifikasi resmi di sistem",
        isComplete: false,
      },
      itemTitle: rental.unitName,
      locationInfo: room?.helper?.address || "Lokasi Pengambilan Toko Mitra",
      partnerLabel: `Toko Mitra: ${room?.helper?.name || "Mitra Sewa"}`,
      primaryAction: activeRole === "helper"
        ? { type: "modal", modalKey: "handover", label: "Serah Terima Unit", icon: "Camera" }
        : { type: "modal", modalKey: "handover", label: "Konfirmasi Ambil Unit", icon: "Camera" },
    };
  }

  // TAHAP 3: SERAH TERIMA SELESAI / DIGUNAKAN (item_handed_over)
  // Serah Terima sudah selesai (✓). Pengembalian (Step 4) menjadi active step!
  if (status === "item_handed_over") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [1, 2, 3],
      activeStep: 4,
      progressPercent: 70,
      badge: {
        stage: 3,
        title: isVehicle ? "Tahap 3 • Digunakan" : "Tahap 3 • Sedang Disewa",
        subtitle: "Unit aktif digunakan. Tindakan berikutnya: Pengembalian",
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

  // TAHAP 4: UNIT DIKEMBALIKAN (returned)
  // Pengembalian selesai (✓). Selesai & Rating (Step 5) menjadi active step!
  if (status === "returned") {
    return {
      transactionType: "sewa",
      unitNoun,
      steps,
      completedSteps: [1, 2, 3, 4],
      activeStep: 5,
      progressPercent: 90,
      badge: {
        stage: 4,
        title: `Tahap 4 • ${unitNoun} Kembali`,
        subtitle: "Unit telah kembali. Deposit jaminan sedang diproses.",
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
// 2. FLOW CONFIG: JASA (Layanan Keahlian & Jasa Profesional)
// Alur: Tanya Mitra → Pembayaran → Pengerjaan → Pemeriksaan/Hasil → Selesai & Rating
// =============================================================================
function getJasaFlowConfig(room, status, activeRole) {
  const steps = [
    { number: 1, id: "inquiry", title: "Tanya Mitra", desc: "Konsultasi brief" },
    { number: 2, id: "payment", title: "Pembayaran", desc: "Rekber Bantuin" },
    { number: 3, id: "work", title: "Pengerjaan", desc: "Proses oleh Mitra" },
    { number: 4, id: "review", title: "Pemeriksaan/Hasil", desc: "Verifikasi Klien" },
    { number: 5, id: "completion", title: "Selesai & Rating", desc: "Ulasan jasa" },
  ];

  const serviceTitle = room?.serviceDetails?.serviceTitle || room?.requestTitle || "Layanan Jasa";
  const packageName = room?.serviceDetails?.packageName || room?.packageId || (room?.category ? `${room.category}` : "Paket Standar");
  const lockedPrice = room?.lockedAmount || room?.serviceDetails?.totalAmount || 150000;
  const serviceIdForPayment = room?.serviceId || room?.serviceDetails?.serviceId || (room?.requestId === "req-3" ? "cat-fjr-3" : room?.catalogId) || "cat-fjr-1";
  const paymentUrl = `/jasa/${serviceIdForPayment}/pembayaran?roomId=${room?.id || ""}&amount=${lockedPrice}&pkg=${encodeURIComponent(packageName)}`;

  // TAHAP 1: INQUIRY (Tanya Mitra / Konsultasi)
  if (status === "inquiry") {
    return {
      transactionType: "jasa",
      steps,
      completedSteps: [],
      activeStep: 1,
      progressPercent: 10,
      badge: {
        stage: 1,
        title: "Tahap 1 • Konsultasi Jasa",
        subtitle: "Diskusikan rincian brief sebelum pembayaran",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: room?.mode === "online" ? "Workroom Digital (Online)" : (room?.pickupPoint || "Lokasi Pemesan"),
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "requester"
        ? { type: "link", href: paymentUrl, label: "Bayar Sekarang", icon: "Lock" }
        : { type: "badge", label: "Menunggu Pembayaran", icon: "Clock" },
    };
  }

  // TAHAP 2: PEMBAYARAN SELESAI / REKBER DIAMANKAN (paid_escrow / room_created)
  // Tanya Mitra & Pembayaran selesai (✓). Pengerjaan (Step 3) menjadi active step!
  if (status === "paid_escrow" || status === "room_created") {
    return {
      transactionType: "jasa",
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 45,
      badge: {
        stage: 2,
        title: "Tahap 2 • Pembayaran Aman",
        subtitle: "Dana diamankan di Rekber. Mitra siap memulai.",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: room?.mode === "online" ? "Workroom Digital (Online)" : (room?.pickupPoint || "Lokasi Pemesan"),
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "helper"
        ? { type: "action", actionKey: "start_working", label: "Mulai Pengerjaan", icon: "CheckCircle2" }
        : { type: "badge", label: "Pembayaran Aman (Siap Dikerjakan)", icon: "Clock" },
    };
  }

  // TAHAP 3: SEDANG DIKERJAKAN (in_progress)
  // Pengerjaan sedang berlangsung (Step 3 = active). Tindakan berikutnya adalah Kirim Hasil Kerja.
  if (status === "in_progress") {
    return {
      transactionType: "jasa",
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 55,
      badge: {
        stage: 3,
        title: "Tahap 3 • Sedang Dikerjakan",
        subtitle: "Mitra sedang memproses pesanan sesuai brief",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: room?.mode === "online" ? "Workroom Digital (Online)" : (room?.pickupPoint || "Lokasi Pemesan"),
      partnerLabel: `Mitra Jasa: ${room?.helper?.name || "Mitra Keahlian"}`,
      primaryAction: activeRole === "helper"
        ? { type: "modal", modalKey: "deliverables", label: "Kirim Hasil Kerja", icon: "Upload" }
        : { type: "badge", label: "Sedang Dikerjakan", icon: "Clock" },
    };
  }

  // TAHAP 4: HASIL KERJA DISERAHKAN (proof_submitted)
  // Pengerjaan selesai (✓). Pemeriksaan/Hasil (Step 4) menjadi active step!
  if (status === "proof_submitted") {
    return {
      transactionType: "jasa",
      steps,
      completedSteps: [1, 2, 3],
      activeStep: 4,
      progressPercent: 80,
      badge: {
        stage: 4,
        title: "Tahap 4 • Pemeriksaan Hasil",
        subtitle: "Hasil kerja telah diserahkan. Klien memeriksa berkas.",
        isComplete: false,
      },
      itemTitle: serviceTitle,
      locationInfo: room?.mode === "online" ? "Workroom Digital (Online)" : (room?.pickupPoint || "Lokasi Pemesan"),
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
    locationInfo: room?.mode === "online" ? "Workroom Digital (Online)" : (room?.pickupPoint || "Lokasi Pemesan"),
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

  // TAHAP 2: KONFIRMASI DANA / HELPER TERPILIH (room_created / paid_escrow)
  // Ajukan Bantuan & Konfirmasi selesai (✓). Proses Bantuan (Step 3) menjadi active step!
  if (status === "room_created" || status === "paid_escrow") {
    return {
      transactionType: "bantuan",
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 45,
      badge: {
        stage: 2,
        title: "Tahap 2 • Helper Terpilih",
        subtitle: "Imbalan diamankan di Rekber Bantuin. Siap jalan.",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: room?.pickupPoint || "Titik Tugas Lapangan",
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "helper"
        ? { type: "action", actionKey: "helper_on_the_way", label: "Menuju Lokasi", icon: "MapPin" }
        : { type: "badge", label: "Menunggu Helper Mulai", icon: "Clock" },
    };
  }

  // TAHAP 3A: HELPER MENUJU LOKASI (on_the_way)
  // Bagian dari Step 3 (Proses Bantuan) aktif
  if (status === "on_the_way") {
    return {
      transactionType: "bantuan",
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 55,
      badge: {
        stage: 3,
        title: "Tahap 3 • Helper Menuju Lokasi",
        subtitle: "Helper sedang dalam perjalanan ke titik tugas",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: room?.pickupPoint || "Titik Tugas Lapangan",
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "helper"
        ? { type: "action", actionKey: "helper_picked_up", label: "Tiba / Ambil Barang", icon: "CheckCircle2" }
        : { type: "badge", label: "Helper Menuju Lokasi", icon: "Clock" },
    };
  }

  // TAHAP 3B: BARANG DIAMBIL / SEDANG DIKERJAKAN (item_picked_up / in_progress)
  // Bagian dari Step 3 (Proses Bantuan) aktif
  if (status === "item_picked_up" || status === "in_progress") {
    return {
      transactionType: "bantuan",
      steps,
      completedSteps: [1, 2],
      activeStep: 3,
      progressPercent: 65,
      badge: {
        stage: 3,
        title: "Tahap 3 • Proses Bantuan",
        subtitle: "Tugas sedang dikerjakan. Kirim bukti jika tuntas.",
        isComplete: false,
      },
      itemTitle: taskTitle,
      locationInfo: room?.pickupPoint || "Titik Tugas Lapangan",
      partnerLabel: `Helper: ${room?.helper?.name || "Mitra Helper"}`,
      primaryAction: activeRole === "helper"
        ? { type: "modal", modalKey: "task_proof", label: "Kirim Bukti Tugas", icon: "Upload" }
        : { type: "badge", label: "Tugas Berlangsung", icon: "Clock" },
    };
  }

  // TAHAP 4: BUKTI TUGAS DISERAHKAN (proof_submitted)
  // Proses Bantuan selesai (✓). Selesai (Step 4) menjadi active step!
  if (status === "proof_submitted") {
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
    primaryAction: { type: "badge_completed", label: "Bantuan Selesai ✓", icon: "Star" },
  };
}
