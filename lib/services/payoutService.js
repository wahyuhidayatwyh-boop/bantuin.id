/**
 * payoutService.js
 * Manual Payout Management Service Abstraction
 * Complies with Section 13 & 57 of requirements.
 *
 * Payout adalah proses penyaluran hak pembayaran Provider/Mitra dari transaksi yang selesai.
 * Saat ini diproses secara manual oleh Admin dengan mencatat referensi transfer bank & upload bukti.
 */

const PAYOUT_STORAGE_KEY = "bantuin_payouts_state";

const INITIAL_PAYOUTS = [
  {
    id: "payout-001",
    recipientId: "fajar-ramadhan-desain",
    recipientName: "Fajar Ramadhan, S.Ds",
    recipientType: "provider",
    orderId: "ord-8819",
    grossAmount: 350000,
    platformFee: 28000, // 8%
    netAmount: 322000,
    bankName: "BCA",
    accountHolder: "Fajar Ramadhan",
    accountNumber: "8820198821",
    accountNumberMasked: "•••• 8821",
    status: "completed", // pending, processing, completed, failed, cancelled
    transferReference: "TRF-BCA-992810",
    proofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80",
    requestedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    transferredAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    processedBy: "Admin Pusat",
  },
  {
    id: "payout-002",
    recipientId: "mitra-kamera",
    recipientName: "Focus Lens Studio",
    recipientType: "partner",
    orderId: "ord-8820",
    grossAmount: 750000,
    platformFee: 60000, // 8%
    netAmount: 690000,
    bankName: "Mandiri",
    accountHolder: "Focus Lens Studio CV",
    accountNumber: "157000984432",
    accountNumberMasked: "•••• 4432",
    status: "processing",
    transferReference: "",
    proofUrl: null,
    requestedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    transferredAt: null,
    processedBy: "Admin Pusat",
  },
  {
    id: "payout-003",
    recipientId: "fajar-ramadhan-desain",
    recipientName: "Fajar Ramadhan, S.Ds",
    recipientType: "provider",
    orderId: "ord-8822",
    grossAmount: 500000,
    platformFee: 40000,
    netAmount: 460000,
    bankName: "BCA",
    accountHolder: "Fajar Ramadhan",
    accountNumber: "8820198821",
    accountNumberMasked: "•••• 8821",
    status: "pending",
    transferReference: "",
    proofUrl: null,
    requestedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    transferredAt: null,
    processedBy: null,
  },
];

function getStoredPayouts() {
  if (typeof window === "undefined") return INITIAL_PAYOUTS;
  try {
    const raw = localStorage.getItem(PAYOUT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_PAYOUTS;
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
