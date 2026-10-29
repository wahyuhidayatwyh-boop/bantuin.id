/**
 * reviewService.js
 * Relational Review & Rating Abstraction
 * Complies with Section K (No fake ratings/reviews, dynamic recalculation).
 */

const REVIEWS_STORAGE_KEY = "bantuin_reviews_state";

const INITIAL_REVIEWS = [];

function getStoredReviews() {
  if (typeof window === "undefined") return INITIAL_REVIEWS;
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((r) => r.targetId !== "fajar-ramadhan-desain" && !r.id?.startsWith("rev-00"));
      }
    }
  } catch {}
  return [];
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
