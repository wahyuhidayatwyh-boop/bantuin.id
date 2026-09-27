/**
 * promotionService.js
 * Multi-Target Dynamic Promotion Service (Jasa, Unit Sewa, Toko Mitra)
 * Admin Configurable Packages + Dynamic Storage + Analytics Tracking + Location Targeting
 * Complies with Bantuin Brand Hierarchy (Bantuan > Marketplace > Promosi)
 *
 * TARGET PROMOSI:
 * 1. "service" -> Provider mempromosikan SERVICE / JASA tertentu
 * 2. "rental"  -> Partner mempromosikan RENTAL / UNIT SEWA tertentu
 * 3. "store"   -> Partner mempromosikan TOKO / PROFILE MITRA
 *
 * CANONICAL PROMOTION STATUSES:
 * - draft            : Dibuat tapi belum proses pembayaran
 * - pending_payment  : Menunggu pembayaran gateway
 * - paid             : Pembayaran terverifikasi gateway, siap diaktifkan
 * - active           : Promosi aktif tayang
 * - expired          : Masa tayang promosi telah berakhir
 * - cancelled        : Dibatalkan oleh pengguna / admin
 *
 * CANONICAL REACH TYPES:
 * - "around" : Di Sekitar Saya
 * - "city"   : Kota / Kabupaten
 * - "all"    : Semua Wilayah
 *
 * DILARANG MENGGUNAKAN EMOJI DALAM PROMOSI! Gunakan visual badge "Dipromosikan".
 * DILARANG MENGUBAH rating, reviewCount, atau reputasi organik mitra/provider!
 */

const PROMOTION_STORAGE_KEY = "bantuin_promotions_state";
const PROMOTION_PACKAGES_STORAGE_KEY = "bantuin_promotion_packages_state";

// Beranda memiliki total delapan slot rekomendasi: empat untuk Jasa dan
// empat untuk Sewa. Katalog masing-masing tetap dapat menampilkan seluruh
// promosi aktif tanpa batas ini.
export const LANDING_SLOT_LIMITS = Object.freeze({
  service: 4,
  rental: 4,
});

export const INITIAL_PROMOTION_PACKAGES = [
  // ─── PAKET PROMOSI JASA ─────────────────────────────────────────────────────
  {
    id: "pkg-jasa-1d",
    name: "Promosi Jasa 1 Hari",
    type: "jasa",
    durationDays: 1,
    price: 10000,
    reachOptions: ["around", "city", "all"],
    placements: ["katalog", "search"],
    priority: 1,
    slotLimit: 5,
    benefits: [
      "Badge 'Dipromosikan' resmi di katalog Jasa",
      "Prioritas tampil di hasil pencarian jasa relevan",
      "Tidak menggunakan slot Beranda",
      "Statistik tayang & klik harian",
    ],
    description: "Paket awal untuk promosi di katalog Jasa dan pencarian.",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-jasa-7d",
    name: "Promosi Jasa 7 Hari",
    type: "jasa",
    durationDays: 7,
    price: 35000,
    reachOptions: ["around", "city", "all"],
    placements: ["landing", "katalog", "search", "highlight"],
    priority: 2,
    slotLimit: 4,
    isPopular: true,
    benefits: [
      "Semua fitur Paket 1 Hari",
      "Prioritas tayang 7 hari berturut-turut",
      "Eligible untuk antrean slot Beranda Jasa (maks. 4 dari total 8 slot)",
      "Rekomendasi teratas saat pencarian relevan",
      "Dukungan prioritas tim operasional",
    ],
    description: "Pilihan favorit untuk mendongkrak order jasa sepekan penuh.",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-jasa-30d",
    name: "Promosi Jasa 30 Hari",
    type: "jasa",
    durationDays: 30,
    price: 100000,
    reachOptions: ["around", "city", "all"],
    placements: ["landing", "katalog", "search", "highlight"],
    priority: 3,
    slotLimit: 4,
    benefits: [
      "Semua fitur Paket 7 Hari",
      "Prioritas tertinggi pada slot Beranda Jasa (maks. 4 dari total 8 slot)",
      "Highlight berkala di etalase rekomendasi jasa",
      "Laporan komprehensif performa bulanan",
    ],
    description: "Investasi promosi berkelanjutan untuk dominasi jasa di kotamu.",
    status: "active",
    createdAt: new Date().toISOString(),
  },

  // ─── PAKET PROMOSI SEWA ─────────────────────────────────────────────────────
  {
    id: "pkg-sewa-1d",
    name: "Promosi Sewa 1 Hari",
    type: "sewa",
    durationDays: 1,
    price: 10000,
    reachOptions: ["around", "city"],
    placements: ["katalog", "search"],
    priority: 1,
    slotLimit: 5,
    benefits: [
      "Badge 'Dipromosikan' resmi di katalog Sewa",
      "Prioritas teratas hasil pencarian alat",
      "Tidak menggunakan slot Beranda",
      "Statistik impresi harian",
    ],
    description: "Paket awal untuk promosi di katalog Sewa dan pencarian.",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-sewa-7d",
    name: "Promosi Sewa 7 Hari",
    type: "sewa",
    durationDays: 7,
    price: 35000,
    reachOptions: ["around", "city", "all"],
    placements: ["landing", "katalog", "search", "highlight"],
    priority: 2,
    slotLimit: 4,
    isPopular: true,
    benefits: [
      "Semua fitur Paket 1 Hari",
      "Prioritas tayang 7 hari berturut-turut",
      "Eligible untuk antrean slot Beranda Sewa (maks. 4 dari total 8 slot)",
      "Spotlight pada kategori alat sewa",
      "Estimasi jangkauan +500 calon penyewa",
    ],
    description: "Paling diminati mitra untuk unit kamera, drone, dan alat outdoor.",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pkg-sewa-30d",
    name: "Promosi Sewa 30 Hari",
    type: "sewa",
    durationDays: 30,
    price: 100000,
    reachOptions: ["around", "city", "all"],
    placements: ["landing", "katalog", "search", "highlight"],
    priority: 3,
    slotLimit: 4,
    benefits: [
      "Semua fitur Paket 7 Hari",
      "Prioritas tertinggi pada slot Beranda Sewa (maks. 4 dari total 8 slot)",
      "Prioritas #1 pencarian alat rental",
      "Laporan analitik promosi lengkap",
    ],
    description: "Maksimal omset rental alat jangka panjang.",
    status: "active",
    createdAt: new Date().toISOString(),
  },

];

// Backwards compatibility export
export const PROMOTION_PACKAGES = INITIAL_PROMOTION_PACKAGES.filter((p) => p.type === "jasa");
export const MITRA_PROMOTION_PACKAGES = INITIAL_PROMOTION_PACKAGES.filter((p) => p.type === "sewa");

// Initial relational demo promotions for Jasa and Sewa
export const INITIAL_PROMOTIONS = [
  // ─── JASA PROMOTIONS ───────────────────────────────────────────────────────
  {
    id: "PROMO-002",
    ownerId: "fajar-ramadhan-desain",
    ownerName: "Fajar Ramadhan, S.Ds",
    ownerType: "provider",
    targetType: "service",
    targetId: "cat-fjr-1",
    targetTitle: "Desain Logo & Identitas Brand UMKM",
    targetImage: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
    targetPrice: 75000,
    targetCategory: "Desain & Kreatif",
    targetLocation: "all",
    reachType: "all",
    placements: ["landing", "katalog", "search", "highlight", "jasa"],
    packageId: "pkg-jasa-30d",
    packageName: "Promosi Jasa 30 Hari",
    durationDays: 30,
    priority: 3,
    amount: 100000,
    paymentId: "PAY-102",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 25 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    analytics: { views: 820, clicks: 145, chats: 26, orders: 9 },
  },
  {
    id: "PROMO-004",
    ownerId: "banyumas-mandiri-teknik",
    ownerName: "Banyumas Mandiri Teknik",
    ownerType: "provider",
    targetType: "service",
    targetId: "cat-bmt-1",
    targetTitle: "Cuci Bersih AC Split 0.5 - 2 PK Dingin Maksimal",
    targetImage: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    targetPrice: 65000,
    targetCategory: "Teknisi & Servis",
    targetLocation: "Banyumas",
    reachType: "city",
    placements: ["landing", "katalog", "search", "highlight", "jasa"],
    packageId: "pkg-jasa-7d",
    packageName: "Promosi Jasa 7 Hari",
    durationDays: 7,
    priority: 3,
    amount: 35000,
    paymentId: "PAY-104",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    analytics: { views: 630, clicks: 112, chats: 35, orders: 14 },
  },
  {
    id: "PROMO-005",
    ownerId: "satria-lensa-fotografi",
    ownerName: "Satria Lensa Fotografi",
    ownerType: "provider",
    targetType: "service",
    targetId: "cat-stl-1",
    targetTitle: "Paket Foto Wisuda Solo & Pasangan Outdoor",
    targetImage: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=600&q=80",
    targetPrice: 150000,
    targetCategory: "Fotografi & Kamera",
    targetLocation: "Banyumas",
    reachType: "city",
    placements: ["landing", "katalog", "search", "highlight", "jasa"],
    packageId: "pkg-jasa-7d",
    packageName: "Promosi Jasa 7 Hari",
    durationDays: 7,
    priority: 2,
    amount: 35000,
    paymentId: "PAY-105",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    analytics: { views: 540, clicks: 95, chats: 22, orders: 8 },
  },
  {
    id: "PROMO-006",
    ownerId: "bagus-wicaksono-helper",
    ownerName: "Bagus Wicaksono (Helper)",
    ownerType: "provider",
    targetType: "service",
    targetId: "cat-bg-1",
    targetTitle: "Jasa Bantuan Pindahan Kost & Angkut Barang",
    targetImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    targetPrice: 80000,
    targetCategory: "Bantuan Tenaga",
    targetLocation: "Banyumas",
    reachType: "city",
    placements: ["landing", "katalog", "search", "highlight", "jasa"],
    packageId: "pkg-jasa-7d",
    packageName: "Promosi Jasa 7 Hari",
    durationDays: 7,
    priority: 2,
    amount: 35000,
    paymentId: "PAY-106",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    analytics: { views: 410, clicks: 68, chats: 18, orders: 11 },
  },

  // ─── SEWA PROMOTIONS ───────────────────────────────────────────────────────
  {
    id: "PROMO-003",
    ownerId: "mitra-kamera",
    ownerName: "Focus Lens Studio",
    ownerType: "partner",
    targetType: "rental",
    targetId: "cam-1",
    targetTitle: "Sony Alpha A7 III Full-Frame 4K",
    targetImage: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    targetPrice: 185000,
    targetCategory: "Kamera & Multimedia",
    targetLocation: "Banyumas",
    reachType: "city",
    placements: ["landing", "katalog", "search", "highlight", "sewa"],
    packageId: "pkg-sewa-7d",
    packageName: "Promosi Sewa 7 Hari",
    durationDays: 7,
    priority: 3,
    amount: 35000,
    paymentId: "PAY-103",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    analytics: { views: 512, clicks: 89, chats: 19, orders: 6 },
  },
  {
    id: "PROMO-007",
    ownerId: "mitra-sound",
    ownerName: "Rental Sound System Banyumas",
    ownerType: "partner",
    targetType: "rental",
    targetId: "snd-1",
    targetTitle: "Portable Speaker Wireless 15' + 2 Mic Wireless",
    targetImage: "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80",
    targetPrice: 125000,
    targetCategory: "Audio & Sound System",
    targetLocation: "Banyumas",
    reachType: "city",
    placements: ["landing", "katalog", "search", "highlight", "sewa"],
    packageId: "pkg-sewa-7d",
    packageName: "Promosi Sewa 7 Hari",
    durationDays: 7,
    priority: 2,
    amount: 35000,
    paymentId: "PAY-107",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    analytics: { views: 390, clicks: 71, chats: 15, orders: 5 },
  },
  {
    id: "PROMO-008",
    ownerId: "mitra-laptop",
    ownerName: "Rental Laptop & IT",
    ownerType: "partner",
    targetType: "rental",
    targetId: "it-1",
    targetTitle: "Sewa Laptop Asus Core i5 RAM 16GB SSD 512GB (Siap Pakai)",
    targetImage: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80",
    targetPrice: 75000,
    targetCategory: "Elektronik & Gadget",
    targetLocation: "Banyumas",
    reachType: "city",
    placements: ["landing", "katalog", "search", "highlight", "sewa"],
    packageId: "pkg-sewa-7d",
    packageName: "Promosi Sewa 7 Hari",
    durationDays: 7,
    priority: 2,
    amount: 35000,
    paymentId: "PAY-108",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    analytics: { views: 420, clicks: 76, chats: 17, orders: 4 },
  },
];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

function getStoredPackages() {
  if (typeof window === "undefined") return INITIAL_PROMOTION_PACKAGES;
  try {
    const raw = localStorage.getItem(PROMOTION_PACKAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Paket lama juga mengikuti batas harga minimum yang sama dengan
        // paket baru, sehingga formulir mitra tidak pernah menerima harga di
        // bawah Rp10.000 walau data localStorage dibuat dari versi terdahulu.
        return parsed
          .filter((p) => p.type !== "toko")
          .map((p) => {
            const type = p.type === "sewa" ? "sewa" : "jasa";
            const placements = Array.isArray(p.placements) && p.placements.length > 0
              ? p.placements
              : ["katalog", "search"];
            const landingLimit = LANDING_SLOT_LIMITS[type === "sewa" ? "rental" : "service"];
            const inLanding = placements.includes("landing");

            return {
              ...p,
              type,
              price: Math.max(10000, Number(p.price) || 10000),
              placements,
              // Paket lama yang masih tersimpan di browser ikut memakai
              // pembagian slot baru: 4 Jasa + 4 Sewa.
              slotLimit: inLanding ? landingLimit : (Number(p.slotLimit) || 4),
              benefits: Array.isArray(p.benefits)
                ? p.benefits.map((benefit) => inLanding
                  ? String(benefit).replace(/maks\.?\s*8/gi, `maks. ${landingLimit}`)
                  : benefit)
                : p.benefits,
            };
          });
      }
    }
  } catch {}
  return INITIAL_PROMOTION_PACKAGES;
}

function savePackages(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROMOTION_PACKAGES_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_promotion_packages_updated"));
  } catch {}
}

function getStoredPromotions() {
  if (typeof window === "undefined") return INITIAL_PROMOTIONS;
  try {
    const raw = localStorage.getItem(PROMOTION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Smart merge: ensure new initial promotions are present without overwriting custom created ones
        // Also strictly filter out any legacy store promotions
        const filtered = parsed.filter((p) => p.targetType !== "store");
        const existingIds = new Set(filtered.map((p) => p.id));
        const missing = INITIAL_PROMOTIONS.filter((p) => !existingIds.has(p.id));
        if (missing.length > 0) {
          const merged = [...filtered, ...missing];
          try {
            localStorage.setItem(PROMOTION_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        }
        return filtered;
      }
    }
  } catch {}
  return INITIAL_PROMOTIONS;
}

function savePromotions(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROMOTION_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_promotions_updated"));
  } catch {}
}

// ─── SERVICE ABSTRACTION ──────────────────────────────────────────────────────

export const promotionService = {
  // ─── ADMIN PACKAGE CRUD ─────────────────────────────────────────────────────

  /**
   * Mengambil semua paket promosi (Sync)
   */
  getAllPackagesSync() {
    return getStoredPackages();
  },

  getPackagesSync() {
    return this.getAllPackagesSync();
  },

  async getPackages() {
    return this.getAllPackagesSync();
  },

  /**
   * Mengambil paket promosi berdasarkan tipe: 'jasa' | 'sewa' | 'toko'
   * Hanya mengembalikan paket yang berstatus 'active' untuk mitra
   */
  getPackagesByTypeSync(type, includeInactive = false) {
    const all = getStoredPackages();
    return all.filter((pkg) => {
      const typeMatch = pkg.type === type;
      return includeInactive ? typeMatch : typeMatch && pkg.status === "active";
    });
  },

  /**
   * Mengambil paket berdasarkan ID
   */
  getPackageById(packageId) {
    const list = getStoredPackages();
    return list.find((p) => p.id === packageId) || null;
  },

  /**
   * Admin: Buat paket promosi baru
   */
  createPackage(packageData) {
    const current = getStoredPackages();
    const packageType = packageData.type === "sewa" ? "sewa" : "jasa";
    const newPackage = {
      id: packageData.id || `pkg-${packageType}-${Date.now().toString().slice(-6)}`,
      name: packageData.name || "Paket Promosi Baru",
      type: packageType,
      durationDays: Number(packageData.durationDays) || 7,
      price: Math.max(10000, Number(packageData.price) || 10000),
      reachOptions: Array.isArray(packageData.reachOptions) && packageData.reachOptions.length > 0
        ? packageData.reachOptions
        : ["around", "city"],
      placements: Array.isArray(packageData.placements) && packageData.placements.length > 0
        ? packageData.placements
        : ["katalog", "search"],
      priority: Number(packageData.priority) || 1,
      slotLimit: Number(packageData.slotLimit) || 10,
      benefits: Array.isArray(packageData.benefits) ? packageData.benefits : [],
      description: packageData.description || "",
      status: packageData.status || "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newPackage, ...current];
    savePackages(updated);
    return newPackage;
  },

  /**
   * Admin: Perbarui data paket promosi
   */
  updatePackage(packageId, updates) {
    const current = getStoredPackages();
    const updated = current.map((p) => {
      if (p.id === packageId) {
        return {
          ...p,
          ...updates,
          type: updates.type === "sewa" ? "sewa" : updates.type === "jasa" ? "jasa" : p.type,
          price: updates.price !== undefined ? Math.max(10000, Number(updates.price) || 10000) : p.price,
          durationDays: updates.durationDays !== undefined ? Number(updates.durationDays) : p.durationDays,
          priority: updates.priority !== undefined ? Number(updates.priority) : p.priority,
          slotLimit: updates.slotLimit !== undefined ? Number(updates.slotLimit) : p.slotLimit,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    savePackages(updated);
    return updated.find((p) => p.id === packageId) || null;
  },

  /**
   * Admin: Toggle status aktif / nonaktif paket promosi
   */
  togglePackageStatus(packageId) {
    const current = getStoredPackages();
    const updated = current.map((p) => {
      if (p.id === packageId) {
        const nextStatus = p.status === "active" ? "inactive" : "active";
        return { ...p, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return p;
    });

    savePackages(updated);
    return updated.find((p) => p.id === packageId) || null;
  },

  /**
   * Admin: Hapus paket promosi (jika aman)
   */
  deletePackage(packageId) {
    const current = getStoredPackages();
    const updated = current.filter((p) => p.id !== packageId);
    savePackages(updated);
    return true;
  },

  // ─── PROMOTIONS QUERY & MANAGEMENT ──────────────────────────────────────────

  /**
   * Mengambil seluruh promosi (Sync) dengan auto-expiration
   */
  getPromotionsSync(filter = {}) {
    let list = getStoredPromotions();

    // Auto-expire items past their endDate
    const now = new Date();
    let hasChanged = false;
    list = list.map((item) => {
      if (item.status === "active" && item.endDate && new Date(item.endDate) < now) {
        hasChanged = true;
        return { ...item, status: "expired", expiredAt: item.endDate };
      }
      return item;
    });

    if (hasChanged) {
      savePromotions(list);
    }

    if (filter.ownerId) {
      list = list.filter((p) => p.ownerId === filter.ownerId);
    }
    if (filter.ownerType && filter.ownerType !== "all") {
      list = list.filter((p) => p.ownerType === filter.ownerType);
    }
    if (filter.targetType && filter.targetType !== "all") {
      list = list.filter((p) => p.targetType === filter.targetType);
    }
    if (filter.status && filter.status !== "all") {
      list = list.filter((p) => p.status === filter.status);
    }
    return list;
  },

  getAllPromotions(filter = {}) {
    return this.getPromotionsSync(filter);
  },

  async getPromotions(filter = {}) {
    return this.getPromotionsSync(filter);
  },

  /**
   * Mengambil promosi aktif yang eligible untuk ditampilkan (Filtered by Placement, Location, etc.)
   */
  getActivePromotionsSync(options = {}) {
    const rawTargetType = options.targetType || options.type || "all";
    const targetType =
      rawTargetType === "jasa"
        ? "service"
        : rawTargetType === "sewa"
        ? "rental"
        : rawTargetType === "toko"
        ? "store"
        : rawTargetType;

    const placement = options.placement || "all";
    const userLocation = options.userLocation || "";
    const category = options.category || "";
    const searchQuery = options.searchQuery || options.search || "";

    const all = this.getPromotionsSync();
    const now = new Date();

    let eligible = all.filter((p) => {
      // Must be active and paid
      if (p.status !== "active" || p.paymentStatus !== "paid") return false;
      // Must not be expired
      if (p.endDate && new Date(p.endDate) < now) return false;

      // Target Type Match
      if (targetType !== "all" && p.targetType !== targetType) return false;

      // Placement paket dikontrol Admin. Konfigurasi paket terbaru berlaku
      // langsung di Beranda maupun katalog, sedangkan status promosi tetap
      // ditentukan oleh pembayaran dan periode tayangnya.
      if (placement !== "all") {
        const packageConfig = this.getPackageById(p.packageId);
        const allowedPlacements = packageConfig?.placements || p.placements || ["katalog", "search"];
        const isMatchedPlacement =
          allowedPlacements.includes(placement) ||
          ((placement === "jasa" || placement === "sewa") && allowedPlacements.includes("katalog"));
        if (!isMatchedPlacement) return false;
      }

      // Location Matching (Step 10 & 11)
      if (userLocation && p.reachType !== "all" && p.targetLocation !== "all") {
        const locTarget = (p.targetLocation || "").toLowerCase();
        const userLoc = userLocation.toLowerCase();
        if (locTarget && !locTarget.includes(userLoc) && !userLoc.includes(locTarget)) {
          return false;
        }
      }

      // Category Match (Step 7)
      if (category && category !== "all" && category !== "Semua") {
        const catTarget = (p.targetCategory || "").toLowerCase();
        const catQuery = category.toLowerCase();
        if (!catTarget.includes(catQuery)) return false;
      }

      // Search Query Relevance (Step 6: RELEVANCE > PROMOTION)
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const title = (p.targetTitle || "").toLowerCase();
        const cat = (p.targetCategory || "").toLowerCase();
        if (!title.includes(q) && !cat.includes(q)) return false;
      }

      return true;
    });

    // Sort by priority paket terbaru (higher first), then by startDate
    // (newest first). Jadi saat admin menaikkan prioritas paket, urutan di
    // Beranda, Jasa, dan Sewa ikut berubah tanpa menunggu promosi dibeli ulang.
    eligible.sort((a, b) => {
      const prioA = Number(this.getPackageById(a.packageId)?.priority ?? a.priority) || 1;
      const prioB = Number(this.getPackageById(b.packageId)?.priority ?? b.priority) || 1;
      if (prioB !== prioA) return prioB - prioA;
      return new Date(b.startDate || 0) - new Date(a.startDate || 0);
    });

    return eligible;
  },

  /**
   * Ringkasan slot Beranda. Posisi 1–4 per jenis adalah yang tampil;
   * sisanya tetap aktif pada katalog dan masuk antrean Beranda.
   */
  getLandingSlotSummarySync(userLocation = "") {
    const toSummary = (targetType) => {
      const candidates = this.getActivePromotionsSync({
        targetType,
        placement: "landing",
        userLocation,
      });
      const limit = LANDING_SLOT_LIMITS[targetType];
      return {
        limit,
        showing: candidates.slice(0, limit),
        queued: candidates.slice(limit),
        totalEligible: candidates.length,
      };
    };

    return {
      service: toSummary("service"),
      rental: toSummary("rental"),
    };
  },

  getPromotionById(promotionId) {
    const list = this.getPromotionsSync();
    return list.find((p) => p.id === promotionId) || null;
  },

  getPromotionByPaymentId(paymentId) {
    const list = this.getPromotionsSync();
    return list.find((p) => p.paymentId === paymentId) || null;
  },

  // ─── ORDER & ACTIVATION ─────────────────────────────────────────────────────

  /**
   * Membuat pesanan promosi baru (Pending Payment)
   */
  async createPromotionOrder(data) {
    const {
      id,
      ownerId,
      ownerName,
      ownerType = "provider", // 'provider' | 'partner'
      targetType = "service",  // 'service' | 'rental' | 'store'
      targetId,
      targetTitle,
      targetImage,
      targetPrice,
      targetCategory,
      packageId,
      reachType = "city", // 'around' | 'city' | 'all'
      targetLocation = "all",
      paymentId,
      amount,
      paymentMethod = "qris",
    } = data;

    const pkg = this.getPackageById(packageId);
    if (!pkg) throw new Error("Paket promosi tidak valid");

    // Strict Type Validation (Step B & M)
    const normalizedTargetType = targetType === "service" ? "jasa" : targetType === "rental" ? "sewa" : "toko";
    if (pkg.type !== normalizedTargetType) {
      throw new Error(`Paket "${pkg.name}" hanya berlaku untuk ${pkg.type.toUpperCase()}, tidak dapat digunakan untuk ${targetType}.`);
    }

    const promoId = id || `PROMO-${Date.now().toString().slice(-6)}`;
    const effectivePaymentId = paymentId || `PAY-${Date.now().toString().slice(-6)}`;
    const effectiveAmount = amount || pkg.price;

    const newPromotion = {
      id: promoId,
      ownerId,
      ownerName: ownerName || (ownerType === "provider" ? "Penyedia Jasa" : "Mitra Toko"),
      ownerType,
      targetType, // 'service' | 'rental' | 'store'
      targetId: targetId || promoId,
      targetTitle: targetTitle || "Item Promosi",
      targetImage: targetImage || null,
      targetPrice: targetPrice !== undefined ? Number(targetPrice) : null,
      targetCategory: targetCategory || "Umum",
      packageId: pkg.id,
      packageName: pkg.name,
      durationDays: pkg.durationDays,
      reachType: reachType || "city",
      targetLocation: targetLocation || "all",
      placements: pkg.placements || ["landing", "katalog", "search"],
      priority: pkg.priority || 1,
      slotLimit: pkg.slotLimit || 10,
      amount: effectiveAmount,
      paymentId: effectivePaymentId,
      paymentStatus: "pending",
      paymentMethod,
      status: "pending_payment",
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
      cancelledAt: null,
      expiredAt: null,
      analytics: { views: 0, clicks: 0, chats: 0, orders: 0 },
    };

    const current = getStoredPromotions();
    const existingIndex = current.findIndex((p) => p.id === promoId);
    let updated;
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = newPromotion;
    } else {
      updated = [newPromotion, ...current];
    }

    savePromotions(updated);
    return newPromotion;
  },

  async activatePromotion(promotionId, paymentId = null) {
    const current = getStoredPromotions();
    const target = current.find((p) => p.id === promotionId || (paymentId && p.paymentId === paymentId));
    if (!target) throw new Error("Pesanan promosi tidak ditemukan");

    const startDate = new Date();
    const duration = target.durationDays || 7;
    const endDate = new Date(startDate.getTime() + duration * 86400000);

    const updatedList = current.map((p) => {
      if (p.id === target.id) {
        return {
          ...p,
          status: "active",
          paymentStatus: "paid",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          paidAt: new Date().toISOString(),
        };
      }
      return p;
    });

    savePromotions(updatedList);
    return updatedList.find((p) => p.id === target.id);
  },

  async confirmPromotionPayment(promotionId) {
    return this.activatePromotion(promotionId);
  },

  async toggleStatus(promotionId) {
    const current = getStoredPromotions();
    const updatedList = current.map((p) => {
      if (p.id === promotionId) {
        const nextStatus = p.status === "active" ? "cancelled" : "active";
        return { ...p, status: nextStatus };
      }
      return p;
    });
    savePromotions(updatedList);
    return updatedList.find((p) => p.id === promotionId);
  },

  async deletePromotion(promotionId) {
    const current = getStoredPromotions();
    const updatedList = current.filter((p) => p.id !== promotionId);
    savePromotions(updatedList);
    return true;
  },

  // ─── ANALYTICS TRACKING (STEP R & AF) ────────────────────────────────────────

  recordImpression(promotionId) {
    if (!promotionId) return;
    const current = getStoredPromotions();
    const updated = current.map((p) => {
      if (p.id === promotionId) {
        const analytics = p.analytics || { views: 0, clicks: 0, chats: 0, orders: 0 };
        return { ...p, analytics: { ...analytics, views: (analytics.views || 0) + 1 } };
      }
      return p;
    });
    savePromotions(updated);
  },

  recordClick(promotionId) {
    if (!promotionId) return;
    const current = getStoredPromotions();
    const updated = current.map((p) => {
      if (p.id === promotionId) {
        const analytics = p.analytics || { views: 0, clicks: 0, chats: 0, orders: 0 };
        return { ...p, analytics: { ...analytics, clicks: (analytics.clicks || 0) + 1 } };
      }
      return p;
    });
    savePromotions(updated);
  },

  recordChat(promotionId) {
    if (!promotionId) return;
    const current = getStoredPromotions();
    const updated = current.map((p) => {
      if (p.id === promotionId) {
        const analytics = p.analytics || { views: 0, clicks: 0, chats: 0, orders: 0 };
        return { ...p, analytics: { ...analytics, chats: (analytics.chats || 0) + 1 } };
      }
      return p;
    });
    savePromotions(updated);
  },

  recordOrder(promotionId) {
    if (!promotionId) return;
    const current = getStoredPromotions();
    const updated = current.map((p) => {
      if (p.id === promotionId) {
        const analytics = p.analytics || { views: 0, clicks: 0, chats: 0, orders: 0 };
        return { ...p, analytics: { ...analytics, orders: (analytics.orders || 0) + 1 } };
      }
      return p;
    });
    savePromotions(updated);
  },

  /**
   * Summary statistik agregat untuk Admin Dashboard (Step Y)
   */
  getAdminStatsSync() {
    const list = this.getPromotionsSync();
    const active = list.filter((p) => p.status === "active");
    const completed = list.filter((p) => p.status === "expired" || p.status === "completed");
    const totalRevenue = list
      .filter((p) => p.paymentStatus === "paid")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const servicePromos = list.filter((p) => p.targetType === "service");
    const rentalPromos = list.filter((p) => p.targetType === "rental");
    const storePromos = list.filter((p) => p.targetType === "store");

    const totalViews = list.reduce((acc, p) => acc + (p.analytics?.views || 0), 0);
    const totalClicks = list.reduce((acc, p) => acc + (p.analytics?.clicks || 0), 0);
    const totalChats = list.reduce((acc, p) => acc + (p.analytics?.chats || 0), 0);
    const totalOrders = list.reduce((acc, p) => acc + (p.analytics?.orders || 0), 0);

    return {
      totalPromotions: list.length,
      activePromotions: active.length,
      completedPromotions: completed.length,
      totalRevenue,
      breakdown: {
        service: {
          count: servicePromos.length,
          active: servicePromos.filter((p) => p.status === "active").length,
          revenue: servicePromos.filter((p) => p.paymentStatus === "paid").reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
        },
        rental: {
          count: rentalPromos.length,
          active: rentalPromos.filter((p) => p.status === "active").length,
          revenue: rentalPromos.filter((p) => p.paymentStatus === "paid").reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
        },
        store: {
          count: storePromos.length,
          active: storePromos.filter((p) => p.status === "active").length,
          revenue: storePromos.filter((p) => p.paymentStatus === "paid").reduce((acc, c) => acc + (Number(c.amount) || 0), 0),
        },
      },
      analytics: {
        views: totalViews,
        clicks: totalClicks,
        chats: totalChats,
        orders: totalOrders,
        ctr: totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) + "%" : "0%",
      },
    };
  },
};
