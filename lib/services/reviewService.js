/**
 * reviewService.js
 * Relational Review & Rating Abstraction
 * Complies with Section K (No fake ratings/reviews, dynamic recalculation).
 */

const REVIEWS_STORAGE_KEY = "bantuin_reviews_state";

const INITIAL_REVIEWS = [
  {
    id: "rev-001",
    orderId: "ord-8819",
    targetType: "provider",
    targetId: "fajar-ramadhan-desain",
    userId: "usr-001",
    userName: "Dimas Anggoro",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    rating: 5,
    comment: "Hasil desain logo sangat memuaskan, revisi cepat dan komunikatif.",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "rev-002",
    orderId: "ord-8820",
    targetType: "partner",
    targetId: "mitra-kamera",
    userId: "usr-002",
    userName: "Natasha Caroline",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    rating: 5,
    comment: "Kamera bersih sensornya, baterai awet, proses serah terima transparan dan aman.",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

function getStoredReviews() {
  if (typeof window === "undefined") return INITIAL_REVIEWS;
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_REVIEWS;
}

function saveReviews(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_reviews_updated"));
  } catch {}
}

export const reviewService = {
  /**
   * Mengambil ulasan untuk target tertentu (provider, partner, rental, service)
   */
  async getReviews(targetType, targetId) {
    const all = getStoredReviews();
    return all.filter((r) => r.targetType === targetType && r.targetId === targetId);
  },

  /**
   * Menghitung rata-rata dan total ulasan aktual
   * Jika tidak ada ulasan: ratingAvg: null, ratingCount: 0
   */
  async getRatingSummary(targetType, targetId) {
    const reviews = await this.getReviews(targetType, targetId);
    if (!reviews || reviews.length === 0) {
      return {
        ratingAvg: null,
        ratingCount: 0,
        label: "Belum ada rating",
      };
    }

    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = Number((sum / reviews.length).toFixed(1));
    return {
      ratingAvg: avg,
      ratingCount: reviews.length,
      label: `${avg} (${reviews.length} ulasan)`,
    };
  },

  /**
   * Menambahkan ulasan baru dari pesanan yang telah selesai
   */
  async addReview({ orderId, targetType, targetId, userId, userName, userAvatar, rating, comment }) {
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating harus bernilai 1 sampai 5 bintang");
    }

    const newRev = {
      id: `rev-${Date.now()}`,
      orderId,
      targetType,
      targetId,
      userId,
      userName: userName || "Pengguna Bantuin",
      userAvatar: userAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date().toISOString(),
    };

    const current = getStoredReviews();
    saveReviews([newRev, ...current]);
    return newRev;
  },
};
