/**
 * reportService.js
 * Report & Dispute Management Service Abstraction
 * Complies with Section AJ of requirements.
 */

const REPORTS_STORAGE_KEY = "bantuin_reports_state";

const INITIAL_REPORTS = [
  {
    id: "rep-001",
    reporterId: "usr-002",
    reporterName: "Siti Rahma",
    targetType: "user",
    targetId: "usr-999",
    targetName: "Budi Santoso",
    orderId: "ord-8819",
    reason: "Permintaan transaksi di luar aplikasi (Disintermediasi)",
    description: "Pengguna meminta nomor WhatsApp pribadi dan mengajak transaksi bayar langsung tanpa Rekening Bersama Bantuin.",
    evidence: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=60",
    status: "open", // open, investigating, resolved, rejected
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    resolvedAt: null,
    resolutionNotes: "",
  },
  {
    id: "rep-002",
    reporterId: "mitra-kamera",
    reporterName: "Focus Lens Studio",
    targetType: "order",
    targetId: "ord-8820",
    targetName: "Pesanan Sewa Kamera A7 III",
    orderId: "ord-8820",
    reason: "Keterlambatan pengembalian unit sewa",
    description: "Penyewa belum mengembalikan unit sewa melewati batas waktu yang disepakati tanpa konfirmasi.",
    evidence: null,
    status: "investigating",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    resolvedAt: null,
    resolutionNotes: "Admin sedang menghubungi nomor darurat penyewa.",
  },
];

function getStoredReports() {
  if (typeof window === "undefined") return INITIAL_REPORTS;
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_REPORTS;
}

function saveReports(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_reports_updated"));
  } catch {}
}

export const reportService = {
  /**
   * Mengambil daftar laporan sengketa secara sinkron (untuk initial state React)
   */
  getReportsSync(filter = {}) {
    let list = getStoredReports();
    if (filter.status && filter.status !== "all") {
      list = list.filter((r) => r.status === filter.status);
    }
    if (filter.reporterId) {
      list = list.filter((r) => r.reporterId === filter.reporterId);
    }
    return list;
  },

  /**
   * Mengambil daftar laporan sengketa
   */
  async getReports(filter = {}) {
    let list = getStoredReports();
    if (filter.status && filter.status !== "all") {
      list = list.filter((r) => r.status === filter.status);
    }
    if (filter.reporterId) {
      list = list.filter((r) => r.reporterId === filter.reporterId);
    }
    return list;
  },

  /**
   * Mengambil detail laporan berdasarkan ID
   */
  async getReportById(reportId) {
    const list = getStoredReports();
    return list.find((r) => r.id === reportId) || null;
  },

  /**
   * Membuat laporan / sengketa baru (User, Provider, atau Partner)
   */
  async createReport({ reporterId, reporterName, targetType, targetId, targetName, orderId, reason, description, evidence = null }) {
    if (!reason || !description) {
      throw new Error("Alasan dan deskripsi laporan wajib diisi");
    }

    const newReport = {
      id: `rep-${Date.now().toString().slice(-6)}`,
      reporterId: reporterId || "usr-current",
      reporterName: reporterName || "Pengguna Bantuin",
      targetType: targetType || "other",
      targetId: targetId || "",
      targetName: targetName || "Pihak Terlapor",
      orderId: orderId || null,
      reason,
      description,
      evidence,
      status: "open",
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolutionNotes: "",
    };

    const current = getStoredReports();
    saveReports([newReport, ...current]);
    return newReport;
  },

  /**
   * Admin: Memperbarui status sengketa / laporan
   */
  async updateReportStatus(reportId, status, resolutionNotes = "") {
    const list = getStoredReports();
    const updated = list.map((r) => {
      if (r.id === reportId) {
        return {
          ...r,
          status,
          resolutionNotes: resolutionNotes || r.resolutionNotes,
          resolvedAt: status === "resolved" || status === "rejected" ? new Date().toISOString() : null,
        };
      }
      return r;
    });

    saveReports(updated);
    return updated.find((r) => r.id === reportId);
  },

  /**
   * Admin: Menghapus laporan / sengketa
   */
  async deleteReport(reportId) {
    const list = getStoredReports();
    const updated = list.filter((r) => r.id !== reportId);
    saveReports(updated);
    return true;
  },
};
