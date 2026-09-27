// lib/mock/voucherData.js
// Data voucher mock — sumber kebenaran untuk fitur voucher & diskon Bantuin
// Dikontrol admin via tab "Voucher" di /admin

const today = new Date();
const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split("T")[0];
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

/** Pilihan wilayah target populer untuk seleksi voucher di admin */
export const VOUCHER_LOCATIONS = [
  { id: "all", label: "Semua Wilayah (Nasional)" },
  { id: "Jakarta Selatan", label: "Jakarta Selatan" },
  { id: "Kota Depok", label: "Kota Depok" },
  { id: "Sleman, Yogyakarta", label: "Sleman, Yogyakarta" },
  { id: "Kab. Banyumas", label: "Purwokerto / Banyumas" },
  { id: "Kota Banjarmasin", label: "Kota Banjarmasin" },
];

/**
 * Helper validasi apakah voucher cocok dengan lokasi pengguna/pesanan
 */
export function isVoucherLocationMatch(targetLocation, userLocation) {
  if (!targetLocation || targetLocation === "all" || targetLocation.toLowerCase() === "semua wilayah") {
    return true;
  }
  if (!userLocation) return true; // Fallback jika lokasi tidak terdeteksi
  const normTarget = String(targetLocation).toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
  const normUser = String(userLocation).toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
  if (normTarget === normUser) return true;
  if (normTarget.includes(normUser) || normUser.includes(normTarget)) return true;
  
  // Cluster regional fallbacks (misal: Sleman masuk DIY/Yogyakarta, Jaksel masuk Jakarta)
  if ((normTarget.includes("sleman") || normTarget.includes("yogyakarta") || normTarget.includes("diy")) &&
      (normUser.includes("sleman") || normUser.includes("yogyakarta") || normUser.includes("diy"))) {
    return true;
  }
  if (normTarget.includes("jakarta") && normUser.includes("jakarta")) {
    return true;
  }
  return false;
}

export const initialVouchers = [
  {
    id: "vc-001",
    code: "BANTUIN15",
    title: "Diskon 15% Semua Layanan",
    description: "Hemat 15% untuk semua transaksi bantuan, jasa, dan sewa di seluruh Indonesia.",
    type: "percent",       // "percent" | "fixed"
    value: 15,             // 15%
    maxDiscount: 25000,    // maks Rp 25.000
    minOrder: 30000,       // min. order Rp 30.000
    appliesTo: "all",      // "all" | "bantuan" | "jasa" | "sewa"
    targetLocation: "all", // "all" = Nasional
    quota: 50,
    usedCount: 12,
    expiresAt: nextMonth,
    isActive: true,
    color: "from-[#1683FF] to-[#0F6FE5]",
  },
  {
    id: "vc-002",
    code: "SEWAMUDAH",
    title: "Hemat Rp 20.000 Sewa Jogja",
    description: "Potongan langsung Rp 20.000 untuk sewa alat area Sleman & Yogyakarta.",
    type: "fixed",
    value: 20000,
    maxDiscount: 20000,
    minOrder: 100000,
    appliesTo: "sewa",
    targetLocation: "Sleman, Yogyakarta",
    quota: 30,
    usedCount: 8,
    expiresAt: nextMonth,
    isActive: true,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "vc-003",
    code: "JASAHEMAT",
    title: "Diskon 10% Jasa Jaksel",
    description: "Nikmati potongan 10% pembayaran jasa profesional wilayah Jakarta Selatan.",
    type: "percent",
    value: 10,
    maxDiscount: 15000,
    minOrder: 50000,
    appliesTo: "jasa",
    targetLocation: "Jakarta Selatan",
    quota: 20,
    usedCount: 5,
    expiresAt: nextWeek,
    isActive: true,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "vc-004",
    code: "BANTUHEMAT",
    title: "Hemat Rp 10.000 Bantuan Depok",
    description: "Potongan Rp 10.000 untuk tugas & errand sekitar Kota Depok.",
    type: "fixed",
    value: 10000,
    maxDiscount: 10000,
    minOrder: 25000,
    appliesTo: "bantuan",
    targetLocation: "Kota Depok",
    quota: 100,
    usedCount: 43,
    expiresAt: nextMonth,
    isActive: true,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "vc-005",
    code: "NONAKTIF",
    title: "Voucher Nonaktif (Contoh)",
    description: "Voucher ini sudah dinonaktifkan oleh admin.",
    type: "fixed",
    value: 5000,
    maxDiscount: 5000,
    minOrder: 20000,
    appliesTo: "all",
    targetLocation: "all",
    quota: 50,
    usedCount: 0,
    expiresAt: nextMonth,
    isActive: false,
    color: "from-slate-400 to-slate-500",
  },
];
