/**
 * promotionService.js
 * Multi-Target Promotion Service Abstraction (Jasa, Unit Sewa, Toko Mitra)
 * Complies with Section 9, 26, 56 of requirements.
 *
 * TARGET PROMOSI:
 * 1. "service" -> Provider mempromosikan SERVICE / JASA tertentu
 * 2. "rental"  -> Partner mempromosikan RENTAL / UNIT SEWA tertentu
 * 3. "store"   -> Partner mempromosikan TOKO / PROFILE MITRA
 *
 * CANONICAL PROMOTION STATUSES:
 * - draft            : Dibuat tapi belum proses pembayaran
 * - pending_payment  : Menunggu pembayaran gateway Tripay
 * - paid             : Pembayaran terverifikasi gateway, siap diaktifkan
 * - active           : Promosi aktif tayang di etalase beranda
 * - expired          : Masa tayang promosi telah berakhir
 * - cancelled        : Dibatalkan oleh pengguna / admin
 * - refunded         : Dana pembayaran dikembalikan (jika ada sengketa)
 *
 * CANONICAL PAYMENT STATUSES:
 * - pending, paid, failed, expired, cancelled, refunded
 *
 * DILARANG MENGUBAH rating, reviewCount, atau reputasi organik mitra/provider!
 */

const PROMOTION_STORAGE_KEY = "bantuin_promotions_state";

export const PROMOTION_PACKAGES = [
  {
    id: "pkg-1d",
    name: "Paket Kilat 1 Hari",
    durationDays: 1,
    price: 25000,
    badgeText: "Uji Coba",
    description: "Tampil di etalase rekomendasi Unggulan Landing Page selama 24 jam penuh.",
    features: [
      "Badge 'Promosi' / 'Unggulan' resmi",
      "Prioritas tampil di etalase Landing Page",
      "Peningkatan visibilitas katalog & listing",
      "Laporan statistik impresi tayang",
    ],
  },
  {
    id: "pkg-7d",
    name: "Paket Mingguan 7 Hari",
    durationDays: 7,
    price: 140000,
    badgeText: "Populer (Hemat 20%)",
    isPopular: true,
    description: "Pilihan favorit untuk mendongkrak order di akhir pekan dan hari kerja.",
    features: [
      "Semua fitur Paket 1 Hari",
      "Prioritas tayang 7 hari berturut-turut",
      "Rekomendasi teratas saat pencarian relevan",
      "Dukungan prioritas tim operasional",
    ],
  },
  {
    id: "pkg-30d",
    name: "Paket Bulanan 30 Hari",
    durationDays: 30,
    price: 450000,
    badgeText: "Maksimal (Hemat 40%)",
    description: "Investasi promosi berkelanjutan untuk dominasi jasa dan rental di kotamu.",
    features: [
      "Semua fitur Paket 7 Hari",
      "Slot promosi permanen 30 hari",
      "Highlight berkala di carousel rekomendasi",
      "Laporan komprehensif performa bulanan",
    ],
  },
];

// Initial relational demo promotions for all 3 target types
const INITIAL_PROMOTIONS = [
  {
    id: "PROMO-001",
    ownerId: "ptr-001",
    ownerName: "Focus Nusantara Rental",
    ownerType: "partner",
    targetType: "store",
    targetId: "ptr-001",
    targetTitle: "Focus Nusantara Rental (Toko Mitra)",
    packageId: "pkg-7d",
    packageName: "Paket Mingguan 7 Hari",
    durationDays: 7,
    type: "featured",
    amount: 140000,
    paymentId: "PAY-101",
    paymentStatus: "paid", // pending, paid, failed, expired, cancelled, refunded
    status: "active", // draft, pending_payment, paid, active, expired, cancelled, refunded
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    cancelledAt: null,
    expiredAt: null,
  },
  {
    id: "PROMO-002",
    ownerId: "fajar-ramadhan-desain",
    ownerName: "Fajar Ramadhan, S.Ds",
    ownerType: "provider",
    targetType: "service",
    targetId: "srv-001",
    targetTitle: "Desain Logo & Identitas Brand",
    packageId: "pkg-30d",
    packageName: "Paket Bulanan 30 Hari",
    durationDays: 30,
    type: "featured",
    amount: 450000,
    paymentId: "PAY-102",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 25 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    cancelledAt: null,
    expiredAt: null,
  },
  {
    id: "PROMO-003",
    ownerId: "mitra-kamera",
    ownerName: "Focus Lens Studio",
    ownerType: "partner",
    targetType: "rental",
    targetId: "rent-001",
    targetTitle: "Sony Alpha A7 III + Lensa FE 24-70mm f/2.8 GM",
    packageId: "pkg-7d",
    packageName: "Paket Mingguan 7 Hari",
    durationDays: 7,
    type: "featured",
    amount: 140000,
    paymentId: "PAY-103",
    paymentStatus: "paid",
    status: "active",
    startDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    paidAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    cancelledAt: null,
    expiredAt: null,
  },
];

function getStoredPromotions() {
  if (typeof window === "undefined") return INITIAL_PROMOTIONS;
  try {
    const raw = localStorage.getItem(PROMOTION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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

export const promotionService = {
  /**
   * Mengambil daftar paket promosi resmi
   */
  getPackagesSync() {
    return PROMOTION_PACKAGES;
  },

  async getPackages() {
    return PROMOTION_PACKAGES;
  },

  /**
   * Mengambil paket berdasarkan ID
   */
  getPackageById(packageId) {
    return PROMOTION_PACKAGES.find((p) => p.id === packageId) || null;
  },

  /**
   * Mengambil seluruh promosi (Sync) dengan pengecekan kedaluwarsa otomatis
   */
  getPromotionsSync(filter = {}) {
    let list = getStoredPromotions();

    // Check expiration status automatically based on endDate
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
   * Mengambil promosi aktif untuk landing page / etalase
   * Hanya promosi berstatus 'active' dan 'paid' yang diperbolehkan tayang!
   */
  getActivePromotionsSync(filter = {}) {
    let all = this.getPromotionsSync();
    let active = all.filter((p) => p.status === "active" && p.paymentStatus === "paid");
    if (filter.targetType) {
      active = active.filter((p) => p.targetType === filter.targetType);
    }
    return active;
  },

  async getActivePromotions(filter = {}) {
    return this.getActivePromotionsSync(filter);
  },

  /**
   * Mengambil data promosi berdasarkan promotion ID
   */
  getPromotionById(promotionId) {
    const list = this.getPromotionsSync();
    return list.find((p) => p.id === promotionId) || null;
  },

  /**
   * Mengambil data promosi berdasarkan payment ID
   */
  getPromotionByPaymentId(paymentId) {
    const list = this.getPromotionsSync();
    return list.find((p) => p.paymentId === paymentId) || null;
  },

  /**
   * Membuat pesanan promosi baru (Draft / Pending Payment)
   * Status awal: pending_payment.
   * Promosi TIDAK boleh langsung berstatus active sebelum pembayaran confirmed!
   */
  async createPromotionOrder({
    id,
    ownerId,
    ownerName,
    ownerType = "provider",
    targetType = "service",
    targetId,
    targetTitle,
    packageId,
    paymentId,
    amount,
    paymentMethod = "qris",
  }) {
    if (ownerType !== "provider" && ownerType !== "partner") {
      throw new Error("Pengguna biasa tidak diizinkan membeli paket promosi.");
    }

    const pkg = this.getPackageById(packageId);
    if (!pkg) throw new Error("Paket promosi tidak valid");

    const promoId = id || `PROMO-${Date.now().toString().slice(-6)}`;
    const effectivePaymentId = paymentId || `PAY-${Date.now().toString().slice(-6)}`;
    const effectiveAmount = amount || pkg.price;

    const newPromotion = {
      id: promoId,
      ownerId,
      ownerName: ownerName || (ownerType === "provider" ? "Penyedia Jasa" : "Mitra Toko"),
      ownerType,
      targetType, // service, rental, store
      targetId: targetId || promoId,
      targetTitle: targetTitle || (targetType === "store" ? ownerName : "Layanan Unggulan"),
      packageId: pkg.id,
      packageName: pkg.name,
      durationDays: pkg.durationDays,
      type: "featured",
      amount: effectiveAmount,
      paymentId: effectivePaymentId,
      paymentStatus: "pending", // pending, paid, failed, expired, cancelled, refunded
      paymentMethod,
      status: "pending_payment", // draft, pending_payment, paid, active, expired, cancelled, refunded
      startDate: null,
      endDate: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
      cancelledAt: null,
      expiredAt: null,
    };

    const current = getStoredPromotions();
    // Replace if already exists with same ID or prepend
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

  /**
   * Mengaktifkan promosi setelah status pembayaran verified 'paid'.
   * @param {string} promotionId 
   * @param {string} [paymentId] 
   */
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

  /**
   * Alias for backwards compatibility & sync with payment gateway callback
   */
  async confirmPayment(promotionId) {
    return this.activatePromotion(promotionId);
  },

  async confirmPromotionPayment(promotionId) {
    return this.activatePromotion(promotionId);
  },

  /**
   * Memperbarui status pembayaran dan promosi ke 'failed'
   */
  async failPromotion(promotionId, reason = "Pembayaran gagal diproses") {
    const current = getStoredPromotions();
    const updatedList = current.map((p) => {
      if (p.id === promotionId || p.paymentId === promotionId) {
        return {
          ...p,
          paymentStatus: "failed",
          failureReason: reason,
        };
      }
      return p;
    });
    savePromotions(updatedList);
    return updatedList.find((p) => p.id === promotionId || p.paymentId === promotionId);
  },

  /**
   * Memperbarui status promosi ke 'expired'
   */
  async expirePromotion(promotionId, reason = "Waktu pembayaran telah kedaluwarsa") {
    const current = getStoredPromotions();
    const updatedList = current.map((p) => {
      if (p.id === promotionId || p.paymentId === promotionId) {
        return {
          ...p,
          status: "expired",
          paymentStatus: "expired",
          expiredAt: new Date().toISOString(),
          failureReason: reason,
        };
      }
      return p;
    });
    savePromotions(updatedList);
    return updatedList.find((p) => p.id === promotionId || p.paymentId === promotionId);
  },

  /**
   * Membatalkan pesanan promosi
   */
  async cancelPromotion(promotionId, reason = "Dibatalkan oleh pengguna") {
    const current = getStoredPromotions();
    const updatedList = current.map((p) => {
      if (p.id === promotionId || p.paymentId === promotionId) {
        return {
          ...p,
          status: "cancelled",
          paymentStatus: "cancelled",
          cancelReason: reason,
          cancelledAt: new Date().toISOString(),
        };
      }
      return p;
    });

    savePromotions(updatedList);
    return updatedList.find((p) => p.id === promotionId || p.paymentId === promotionId);
  },

  /**
   * Admin / Owner: Menghentikan / menonaktifkan promosi sementara
   */
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

  /**
   * Menghapus catatan promosi
   */
  async deletePromotion(promotionId) {
    const current = getStoredPromotions();
    const updatedList = current.filter((p) => p.id !== promotionId);
    savePromotions(updatedList);
    return true;
  },
};
