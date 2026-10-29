/**
 * payoutService.js
 * Manual Payout Management Service Abstraction
 * Complies with Section 13 & 57 of requirements.
 *
 * Payout adalah proses penyaluran hak pembayaran Provider/Mitra dari transaksi yang selesai.
 * Saat ini diproses secara manual oleh Admin dengan mencatat referensi transfer bank & upload bukti.
 */

const PAYOUT_STORAGE_KEY = "bantuin_payouts_state";

const INITIAL_PAYOUTS = [];

function getStoredPayouts() {
  if (typeof window === "undefined") return INITIAL_PAYOUTS;
  try {
    const raw = localStorage.getItem(PAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((p) => p.recipientId !== "fajar-ramadhan-desain" && !p.id?.startsWith("payout-00"));
      }
    }
  } catch {}
  return [];
}

function savePayouts(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAYOUT_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_payouts_updated"));
  } catch {}
}

export const payoutService = {
  /**
   * Mengambil daftar payout secara sinkron (untuk initial state React)
   */
  getPayoutsSync(filter = {}) {
    let list = getStoredPayouts();
    if (filter.status && filter.status !== "all") {
      list = list.filter((p) => p.status === filter.status);
    }
    if (filter.recipientId) {
      list = list.filter((p) => p.recipientId === filter.recipientId);
    }
    if (filter.recipientType && filter.recipientType !== "all") {
      list = list.filter((p) => p.recipientType === filter.recipientType);
    }
    return list;
  },

  /**
   * Mengambil daftar payout dengan filter
   */
  async getPayouts(filter = {}) {
    let list = getStoredPayouts();
    if (filter.status && filter.status !== "all") {
      list = list.filter((p) => p.status === filter.status);
    }
    if (filter.recipientId) {
      list = list.filter((p) => p.recipientId === filter.recipientId);
    }
    if (filter.recipientType && filter.recipientType !== "all") {
      list = list.filter((p) => p.recipientType === filter.recipientType);
    }
    return list;
  },

  /**
   * Mengambil detail payout berdasarkan ID
   */
  async getPayoutById(payoutId) {
    const list = getStoredPayouts();
    return list.find((p) => p.id === payoutId) || null;
  },

  /**
   * Mengajukan payout baru untuk order yang tuntas
   */
  async requestPayout({ recipientId, recipientName, recipientType, orderId, grossAmount, platformFeeRate = 0.08, bankName, accountHolder, accountNumberMasked }) {
    const fee = Math.round(grossAmount * platformFeeRate);
    const net = grossAmount - fee;

    const newPayout = {
      id: `payout-${Date.now()}`,
      recipientId,
      recipientName: recipientName || "Mitra / Provider",
      recipientType: recipientType || "provider",
      orderId,
      grossAmount,
      platformFee: fee,
      netAmount: net,
      bankName: bankName || "BCA",
      accountHolder: accountHolder || recipientName,
      accountNumberMasked: accountNumberMasked || "•••• 0000",
      status: "pending",
      transferReference: "",
      proofUrl: null,
      requestedAt: new Date().toISOString(),
      transferredAt: null,
      processedBy: null,
    };

    const current = getStoredPayouts();
    savePayouts([newPayout, ...current]);
    return newPayout;
  },

  /**
   * Admin: Memproses payout ke status processing
   */
  async startProcessing(payoutId, adminName = "Admin Pusat") {
    const list = getStoredPayouts();
    const updated = list.map((p) =>
      p.id === payoutId ? { ...p, status: "processing", processedBy: adminName } : p
    );
    savePayouts(updated);
    return updated.find((p) => p.id === payoutId);
  },

  /**
   * Admin: Menyelesaikan payout manual dengan nomor referensi transfer dan bukti foto
   */
  async completePayout(payoutId, { transferReference, proofUrl, processedBy = "Admin Pusat" }) {
    if (!transferReference) {
      throw new Error("Nomor referensi transfer bank wajib diisi");
    }

    const list = getStoredPayouts();
    const updated = list.map((p) => {
      if (p.id === payoutId) {
        return {
          ...p,
          status: "completed",
          transferReference,
          proofUrl: proofUrl || p.proofUrl,
          transferredAt: new Date().toISOString(),
          processedBy,
        };
      }
      return p;
    });

    savePayouts(updated);
    return updated.find((p) => p.id === payoutId);
  },

  /**
   * Admin: Menandai payout gagal
   */
  async failPayout(payoutId, reason = "Rekening tidak valid") {
    const list = getStoredPayouts();
    const updated = list.map((p) =>
      p.id === payoutId ? { ...p, status: "failed", failureReason: reason } : p
    );
    savePayouts(updated);
    return updated.find((p) => p.id === payoutId);
  },
};
