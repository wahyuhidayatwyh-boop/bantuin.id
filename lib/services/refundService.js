/**
 * refundService.js
 * Customer Refund Management Service Abstraction
 * Complies with Section 14 & 57 of requirements.
 *
 * Refund Customer HARUS tersedia dan merupakan proses terpisah dari Payout.
 * Menyediakan flow: pending -> approved -> processing -> completed / rejected / failed
 * dengan pencatatan bukti transfer & nomor referensi.
 */

const REFUND_STORAGE_KEY = "bantuin_refunds_state";

const INITIAL_REFUNDS = [
  {
    id: "ref-001",
    userId: "usr-002",
    userName: "Siti Rahma",
    orderId: "ord-8819",
    paymentId: "pay-1002",
    amount: 150000,
    reason: "Mitra membatalkan jadwal pengerjaan jasa karena kendala teknis.",
    method: "manual_bank_transfer",
    bankName: "BCA",
    accountHolder: "Siti Rahma",
    accountNumber: "8820199912",
    accountMasked: "BCA •••• 9912 (Siti Rahma)",
    transferReference: "REF-BCA-551920",
    proofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80",
    status: "completed", // pending, approved, processing, completed, rejected, failed
    processedBy: "Admin Pusat",
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    processedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "ref-002",
    userId: "usr-003",
    userName: "Dimas Arya",
    orderId: "ord-8824",
    paymentId: "pay-1005",
    amount: 250000,
    reason: "Unit kamera rusak sebelum serah terima (handover dibatalkan).",
    method: "manual_bank_transfer",
    bankName: "Mandiri",
    accountHolder: "Dimas Arya",
    accountNumber: "157000987721",
    accountMasked: "Mandiri •••• 7721 (Dimas Arya)",
    transferReference: "",
    proofUrl: null,
    status: "pending",
    processedBy: null,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    processedAt: null,
  },
];

function getStoredRefunds() {
  if (typeof window === "undefined") return INITIAL_REFUNDS;
  try {
    const raw = localStorage.getItem(REFUND_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_REFUNDS;
}

function saveRefunds(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFUND_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_refunds_updated"));
  } catch {}
}

export const refundService = {
  /**
   * Mengambil daftar permohonan refund secara sinkron (untuk initial state React)
   */
  getRefundsSync(filter = {}) {
    let list = getStoredRefunds();
    if (filter.status && filter.status !== "all") {
      list = list.filter((r) => r.status === filter.status);
    }
    if (filter.userId) {
      list = list.filter((r) => r.userId === filter.userId);
    }
    if (filter.orderId) {
      list = list.filter((r) => r.orderId === filter.orderId);
    }
    return list;
  },

  /**
   * Mengambil daftar permohonan refund dengan filter
   */
  async getRefunds(filter = {}) {
    let list = getStoredRefunds();
    if (filter.status && filter.status !== "all") {
      list = list.filter((r) => r.status === filter.status);
    }
    if (filter.userId) {
      list = list.filter((r) => r.userId === filter.userId);
    }
    if (filter.orderId) {
      list = list.filter((r) => r.orderId === filter.orderId);
    }
    return list;
  },

  /**
   * Mengambil detail refund berdasarkan ID
   */
  async getRefundById(refundId) {
    const list = getStoredRefunds();
    return list.find((r) => r.id === refundId) || null;
  },

  /**
   * Mengajukan refund customer baru
   */
  async requestRefund({ userId, userName, orderId, paymentId, amount, reason, method = "manual_bank_transfer", accountMasked }) {
    if (!orderId || !amount || !reason) {
      throw new Error("ID Pesanan, nominal refund, dan alasan wajib diisi.");
    }

    const newRefund = {
      id: `ref-${Date.now().toString().slice(-6)}`,
      userId: userId || "usr-current",
      userName: userName || "Customer Bantuin",
      orderId,
      paymentId: paymentId || `pay-${Date.now()}`,
      amount,
      reason,
      method,
      accountMasked: accountMasked || "Rekening Terdaftar",
      transferReference: "",
      proofUrl: null,
      status: "pending",
      processedBy: null,
      createdAt: new Date().toISOString(),
      processedAt: null,
    };

    const current = getStoredRefunds();
    saveRefunds([newRefund, ...current]);
    return newRefund;
  },

  /**
   * Admin: Menyetujui pengajuan refund (pindah ke status approved / processing)
   */
  async approveRefund(refundId, adminName = "Admin Pusat") {
    const list = getStoredRefunds();
    const updated = list.map((r) =>
      r.id === refundId ? { ...r, status: "processing", processedBy: adminName } : r
    );
    saveRefunds(updated);
    return updated.find((r) => r.id === refundId);
  },

  /**
   * Admin: Menyelesaikan refund manual dengan bukti transfer & nomor referensi
   */
  async completeRefund(refundId, { transferReference, proofUrl, processedBy = "Admin Pusat" }) {
    if (!transferReference) {
      throw new Error("Nomor referensi transfer refund wajib diisi.");
    }

    const list = getStoredRefunds();
    const updated = list.map((r) => {
      if (r.id === refundId) {
        return {
          ...r,
          status: "completed",
          transferReference,
          proofUrl: proofUrl || r.proofUrl,
          processedBy,
          processedAt: new Date().toISOString(),
        };
      }
      return r;
    });

    saveRefunds(updated);
    return updated.find((r) => r.id === refundId);
  },

  /**
   * Admin: Menolak pengajuan refund
   */
  async rejectRefund(refundId, reason = "Pengajuan tidak memenuhi syarat refund", adminName = "Admin Pusat") {
    const list = getStoredRefunds();
    const updated = list.map((r) =>
      r.id === refundId
        ? { ...r, status: "rejected", rejectionReason: reason, processedBy: adminName, processedAt: new Date().toISOString() }
        : r
    );
    saveRefunds(updated);
    return updated.find((r) => r.id === refundId);
  },
};
