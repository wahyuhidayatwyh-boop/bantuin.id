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

export const INITIAL_PROMOTION_PACKAGES = [];

// Backwards compatibility export
export const PROMOTION_PACKAGES = [];
export const MITRA_PROMOTION_PACKAGES = [];

// Initial relational promotions for Jasa and Sewa (Dibersihkan dari data dummy statis)
export const INITIAL_PROMOTIONS = [];

// ─── STORAGE HELPERS ──────────────────────────────────────────────────────────

function getStoredPackages() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROMOTION_PACKAGES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((p) => p.type !== "toko" && p.id !== "pkg-bronze" && p.id !== "pkg-silver" && p.id !== "pkg-gold" && !p.id?.startsWith("pkg-dummy-"))
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
              slotLimit: inLanding ? landingLimit : (Number(p.slotLimit) || 4),
              benefits: Array.isArray(p.benefits) ? p.benefits : [],
            };
          });
      }
    }
  } catch {}
  return [];
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
        // Strictly filter out any legacy store or dummy demo promotions
        const filtered = parsed.filter((p) => 
          p.targetType !== "store" && 
          p.ownerId !== "fajar-ramadhan-desain" &&
          p.ownerId !== "banyumas-mandiri-teknik" &&
          p.ownerId !== "satria-lensa-fotografi" &&
          p.ownerId !== "bagus-wicaksono-helper" &&
          !p.id?.startsWith("PROMO-00")
        );
        // Deduplikasi otomatis berdasarkan entitas target agar tidak ada promosi kembar
        const seen = new Set();
        const deduplicated = [];
        for (const p of filtered) {
          const targetKey = `${p.targetType || "service"}-${p.targetId || p.serviceId || p.rentalId || p.targetTitle || p.id}`;
          if (!seen.has(targetKey)) {
            seen.add(targetKey);
            deduplicated.push(p);
          }
        }
        return deduplicated;
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

  savePackages(packages) {
    savePackages(packages);
  },

  /**
   * Mengambil paket promosi dinamis dari API backend PostgreSQL (/api/promotion-packages)
   * Menyinkronkan ke local cache agar komponen sinkron langsung ter-update
   */
  async fetchLivePackages(type = "") {
    if (typeof window === "undefined") return this.getAllPackagesSync();
    try {
      const url = type
        ? `/api/promotion-packages?status=active&type=${encodeURIComponent(type)}`
        : `/api/promotion-packages?status=active`;
      const res = await fetch(url);
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        const livePackages = json.data.map((p) => ({
          ...p,
          price: Number(p.price),
          durationDays: p.durationDays || p.duration_days,
          priority: p.priority || p.priority_level || 1,
          type: (p.type || p.service_type || "jasa").toLowerCase(),
        }));
        const current = getStoredPackages();
        const otherTypes = type
          ? current.filter((p) => p.type !== type.toLowerCase())
          : [];
        const merged = [...otherTypes, ...livePackages];
        savePackages(merged);
        return type ? livePackages.filter((p) => p.type === type.toLowerCase()) : livePackages;
      }
    } catch (err) {
      console.warn("[promotionService] fetchLivePackages error:", err);
    }
    return type ? this.getPackagesByTypeSync(type) : this.getAllPackagesSync();
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
  async fetchLivePromotions() {
    if (typeof window === "undefined") return [];
    try {
      const res = await fetch("/api/promotions");
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        const current = getStoredPromotions();
        const liveMap = new Map();
        const liveTargetKeys = new Set();
        json.data.forEach((p) => {
          liveMap.set(p.id, p);
          const tKey = `${p.targetType || "service"}-${p.targetId || p.serviceId || p.rentalId || p.targetTitle || p.id}`;
          liveTargetKeys.add(tKey);
        });

        // Hapus duplikasi: data PostgreSQL adalah single source of truth
        const merged = [
          ...json.data,
          ...current.filter((p) => {
            if (liveMap.has(p.id)) return false;
            const tKey = `${p.targetType || "service"}-${p.targetId || p.serviceId || p.rentalId || p.targetTitle || p.id}`;
            if (liveTargetKeys.has(tKey)) return false;
            return true;
          }),
        ];

        // Deduplikasi final berdasarkan entitas target
        const seenTargets = new Set();
        const cleanMerged = [];
        for (const p of merged) {
          const tKey = `${p.targetType || "service"}-${p.targetId || p.serviceId || p.rentalId || p.targetTitle || p.id}`;
          if (!seenTargets.has(tKey)) {
            seenTargets.add(tKey);
            cleanMerged.push(p);
          }
        }

        savePromotions(cleanMerged);
        return cleanMerged;
      }
    } catch (err) {
      console.warn("[promotionService] fetchLivePromotions error:", err);
    }
    return this.getActivePromotionsSync();
  },

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
      // Must be active and paid (case-insensitive)
      const isPaid = (p.paymentStatus || "").toLowerCase() === "paid";
      if (p.status !== "active" || !isPaid) return false;
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

      // Location Matching (Mendukung alias kabupaten Banyumas/Purwokerto, reachOptions: 'all'/'city'/'around')
      if (userLocation && p.reachType !== "all" && p.targetLocation !== "all") {
        const userLoc = userLocation.toLowerCase();
        const cleanUser = userLoc.replace(/^(kab\.|kota|kabupaten)\s+/i, "").trim();
        const locTarget = (p.targetLocation || "").toLowerCase();
        const cleanTarget = locTarget.replace(/^(kab\.|kota|kabupaten)\s+/i, "").trim();
        const pCity = (p.city || "").toLowerCase();

        // Area ekosistem default Banyumas & Purwokerto
        const isUserBanyumas = cleanUser.includes("banyumas") || cleanUser.includes("purwokerto");
        const isTargetBanyumas =
          cleanTarget.includes("banyumas") ||
          cleanTarget.includes("purwokerto") ||
          pCity.includes("banyumas") ||
          pCity.includes("purwokerto") ||
          (!cleanTarget.includes("jakarta") && !cleanTarget.includes("bandung") && !cleanTarget.includes("surabaya") && !cleanTarget.includes("semarang") && !cleanTarget.includes("jogja") && !cleanTarget.includes("yogyakarta"));

        const isMatch =
          (isUserBanyumas && isTargetBanyumas) ||
          locTarget.includes(cleanUser) ||
          userLoc.includes(cleanTarget) ||
          cleanTarget.includes(cleanUser) ||
          cleanUser.includes(cleanTarget) ||
          (pCity && (cleanUser.includes(pCity) || pCity.includes(cleanUser)));

        if (!isMatch) {
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

    // Deduplikasi ketat: satu item layanan/rental tidak boleh tampil ganda
    const seenTargetKeys = new Set();
    const uniqueEligible = [];
    for (const p of eligible) {
      const targetKey = `${p.targetType || "service"}-${p.targetId || p.serviceId || p.rentalId || p.targetTitle || p.id}`;
      if (!seenTargetKeys.has(targetKey)) {
        seenTargetKeys.add(targetKey);
        uniqueEligible.push(p);
      }
    }

    return uniqueEligible;
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

  async cancelPromotion(promotionId, reason = "Dibatalkan oleh pengguna") {
    const current = getStoredPromotions();
    const updatedList = current.map((p) => {
      if (p.id === promotionId || p.paymentId === promotionId) {
        return {
          ...p,
          status: "cancelled",
          paymentStatus: "cancelled",
          cancelledAt: new Date().toISOString(),
          cancelReason: reason,
        };
      }
      return p;
    });
    savePromotions(updatedList);
    return updatedList.find((p) => p.id === promotionId || p.paymentId === promotionId);
  },

  async toggleStatus(promotionId) {
    const current = getStoredPromotions();
    const target = current.find(
      (p) =>
        p.id === promotionId ||
        p.paymentId === promotionId ||
        p.midtransOrderId === promotionId ||
        p.targetId === promotionId
    );
    let nextStatus = target?.status === "active" ? "paused" : "active";

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("bantuin_auth_access_token") ||
            localStorage.getItem("bantuin_auth_session_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("bantuin_auth_token") ||
            (document.cookie.match(/bantuin_token=([^;]+)/)?.[1] || null)
          : null;
      if (token) {
        const res = await fetch(`/api/promotions/${promotionId}/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "toggle" }),
        });
        const resJson = await res.json().catch(() => ({}));
        if (resJson.success && resJson.data?.status) {
          nextStatus = resJson.data.status;
        }
      }
    } catch (e) {
      console.warn("[promotionService] DB toggle error:", e);
    }

    const updatedList = current.map((p) => {
      if (
        p.id === promotionId ||
        p.paymentId === promotionId ||
        p.midtransOrderId === promotionId ||
        p.targetId === promotionId
      ) {
        return { ...p, status: nextStatus };
      }
      return p;
    });
    savePromotions(updatedList);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bantuin_promotions_updated"));
      window.dispatchEvent(new Event("bantuin_admin_update"));
    }
    return (
      updatedList.find(
        (p) =>
          p.id === promotionId ||
          p.paymentId === promotionId ||
          p.midtransOrderId === promotionId ||
          p.targetId === promotionId
      ) || { id: promotionId, status: nextStatus }
    );
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
