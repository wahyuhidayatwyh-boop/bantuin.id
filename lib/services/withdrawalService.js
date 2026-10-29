/**
 * withdrawalService.js
 * Provider & Partner Withdrawal + Reversal Service Abstraction
 * Complies with Section 15, 16, 17 of requirements.
 *
 * Withdrawal adalah penarikan hak pembayaran Provider/Mitra dari internal ledger.
 * Jika withdrawal gagal:
 * JANGAN hanya mengubah status!
 * Buat reversal transaction yang idempotent agar dana aman kembali ke ledger.
 */

const WITHDRAWAL_STORAGE_KEY = "bantuin_withdrawals_state";
const LEDGER_STORAGE_KEY = "bantuin_ledger_transactions";

const INITIAL_WITHDRAWALS = [];

function getStoredWithdrawals() {
  if (typeof window === "undefined") return INITIAL_WITHDRAWALS;
  try {
    const raw = localStorage.getItem(WITHDRAWAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((w) => w.ownerId !== "fajar-ramadhan-desain" && !w.id?.startsWith("wd-00"));
      }
    }
  } catch {}
  return [];
}

function saveWithdrawals(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WITHDRAWAL_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_withdrawals_updated"));
  } catch {}
}

function recordLedgerTransaction(tx) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(tx);
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("bantuin_ledger_updated"));
  } catch {}
}

export const withdrawalService = {
  /**
   * Mengambil daftar penarikan dana secara sinkron (untuk initial state React)
   */
  getWithdrawalsSync(filter = {}) {
    let list = getStoredWithdrawals();
    if (filter.status && filter.status !== "all") {
      list = list.filter((w) => w.status === filter.status);
    }
    if (filter.ownerId) {
      list = list.filter((w) => w.ownerId === filter.ownerId);
    }
    if (filter.ownerType && filter.ownerType !== "all") {
      list = list.filter((w) => w.ownerType === filter.ownerType);
    }
    return list;
  },

  /**
   * Mengambil daftar penarikan dana dengan filter
   */
  async getWithdrawals(filter = {}) {
    let list = getStoredWithdrawals();
    if (filter.status && filter.status !== "all") {
      list = list.filter((w) => w.status === filter.status);
    }
    if (filter.ownerId) {
      list = list.filter((w) => w.ownerId === filter.ownerId);
    }
    if (filter.ownerType && filter.ownerType !== "all") {
      list = list.filter((w) => w.ownerType === filter.ownerType);
    }
    return list;
  },

  /**
   * Mengambil detail penarikan berdasarkan ID
   */
  async getWithdrawalById(withdrawalId) {
    const list = getStoredWithdrawals();
    return list.find((w) => w.id === withdrawalId) || null;
  },

  /**
   * Mengajukan penarikan baru oleh Provider atau Mitra
   */
  async requestWithdrawal({ ownerId, ownerName, ownerType, amount, destinationType, destinationMasked }) {
    if (!amount || amount < 50000) {
      throw new Error("Nominal penarikan minimal Rp 50.000");
    }

    const newWd = {
      id: `wd-${Date.now().toString().slice(-6)}`,
      ownerId,
      ownerName: ownerName || "Mitra / Provider",
      ownerType: ownerType || "provider",
      amount,
      destinationType: destinationType || "BCA",
      destinationMasked: destinationMasked || "•••• 0000",
      status: "pending",
      transferReference: "",
      proofUrl: null,
      requestedAt: new Date().toISOString(),
      processedAt: null,
      processedBy: null,
    };

    // Catat ke ledger pengeluaran
    recordLedgerTransaction({
      id: `ldg-${Date.now()}`,
      ownerId,
      type: "withdrawal",
      amount,
      direction: "debit",
      referenceType: "withdrawal",
      referenceId: newWd.id,
      createdAt: new Date().toISOString(),
    });

    const current = getStoredWithdrawals();
    saveWithdrawals([newWd, ...current]);
    return newWd;
  },

  /**
   * Admin: Memproses penarikan
   */
  async startProcessing(withdrawalId, adminName = "Admin Pusat") {
    const list = getStoredWithdrawals();
    const updated = list.map((w) =>
      w.id === withdrawalId ? { ...w, status: "processing", processedBy: adminName } : w
    );
    saveWithdrawals(updated);
    return updated.find((w) => w.id === withdrawalId);
  },

  /**
   * Admin: Menyelesaikan penarikan dengan nomor referensi transfer bank & upload bukti
   */
  async completeWithdrawal(withdrawalId, { transferReference, proofUrl, processedBy = "Admin Pusat" }) {
    if (!transferReference) {
      throw new Error("Nomor referensi transfer bank penarikan wajib diisi.");
    }

    const list = getStoredWithdrawals();
    const updated = list.map((w) => {
      if (w.id === withdrawalId) {
        return {
          ...w,
          status: "completed",
          transferReference,
          proofUrl: proofUrl || w.proofUrl,
          processedBy,
          processedAt: new Date().toISOString(),
        };
      }
      return w;
    });

    saveWithdrawals(updated);
    return updated.find((w) => w.id === withdrawalId);
  },

  /**
   * Admin: Menandai penarikan GAGAL dan mengeksekusi REVERSAL IDEMPOTEN kembali ke ledger (Requirement 16)
   */
  async failWithdrawalWithReversal(withdrawalId, { reason = "Rekening tujuan tidak valid / ditolak bank", adminId = "admin-pusat" }) {
    const list = getStoredWithdrawals();
    const target = list.find((w) => w.id === withdrawalId);
    if (!target) throw new Error("Data penarikan tidak ditemukan.");

    // Idempotency: Jika sudah reversed, jangan kreditkan dua kali!
    if (target.status === "reversed" || target.status === "failed") {
      return target;
    }

    const ledgerTxId = `rev-${Date.now()}`;
    const reversalRecord = {
      withdrawalId,
      amount: target.amount,
      reason,
      adminId,
      previousStatus: target.status,
      newStatus: "reversed",
      timestamp: new Date().toISOString(),
      ledgerTransactionId: ledgerTxId,
    };

    // Reversal transaksi ke internal ledger (kreditkan kembali hak pembayaran)
    recordLedgerTransaction({
      id: ledgerTxId,
      ownerId: target.ownerId,
      type: "withdrawal_reversal",
      amount: target.amount,
      direction: "credit",
      referenceType: "withdrawal",
      referenceId: withdrawalId,
      notes: `Reversal penarikan gagal: ${reason}`,
      createdAt: new Date().toISOString(),
    });

    const updated = list.map((w) => {
      if (w.id === withdrawalId) {
        return {
          ...w,
          status: "reversed",
          reversalRecord,
          failureReason: reason,
          processedBy: adminId,
          processedAt: new Date().toISOString(),
        };
      }
      return w;
    });

    saveWithdrawals(updated);
    return updated.find((w) => w.id === withdrawalId);
  },
};
