/**
 * adminService.js
 * Admin Control & Audit Trail Service Abstraction
 * Complies with Section N, AK, AL of requirements.
 */

const AUDIT_STORAGE_KEY = "bantuin_admin_audit_trail";

const INITIAL_AUDIT_LOGS = [
  {
    id: "aud-001",
    adminId: "adm-001",
    adminName: "Super Admin",
    action: "VERIFY_KYC",
    targetType: "provider",
    targetId: "fajar-ramadhan-desain",
    targetName: "Fajar Ramadhan, S.Ds",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    reason: "Dokumen KTP dan portofolio valid",
    metadata: { verificationType: "KTP_OFFICIAL" },
  },
  {
    id: "aud-002",
    adminId: "adm-001",
    adminName: "Super Admin",
    action: "APPROVE_PROMOTION",
    targetType: "promotion",
    targetId: "prm-001",
    targetName: "Paket Mingguan Focus Nusantara",
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    reason: "Pembayaran Rp 140.000 terverifikasi",
    metadata: { packageId: "pkg-7d", amount: 140000 },
  },
  {
    id: "aud-003",
    adminId: "adm-001",
    adminName: "Super Admin",
    action: "RESOLVE_DISPUTE",
    targetType: "order",
    targetId: "ord-8819",
    targetName: "Pesanan Desain Logo",
    timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    reason: "Mediasi berhasil disepakati kedua pihak",
    metadata: { resolution: "COMPLETED_WITH_PARTIAL_REFUND" },
  },
];

function getStoredAuditLogs() {
  if (typeof window === "undefined") return INITIAL_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_AUDIT_LOGS;
}

function saveAuditLogs(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_audit_updated"));
  } catch {}
}

export const adminService = {
  /**
   * Mengambil riwayat Audit Trail
   */
  async getAuditTrail(filter = {}) {
    let list = getStoredAuditLogs();
    if (filter.action && filter.action !== "all") {
      list = list.filter((l) => l.action === filter.action);
    }
    if (filter.targetType && filter.targetType !== "all") {
      list = list.filter((l) => l.targetType === filter.targetType);
    }
    return list;
  },

  /**
   * Mencatat tindakan admin ke dalam audit trail (Requirement AK)
   */
  async logAction({ adminId = "adm-001", adminName = "Admin", action, targetType, targetId, targetName = "", reason = "", metadata = {} }) {
    const newLog = {
      id: `aud-${Date.now()}`,
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      targetName,
      timestamp: new Date().toISOString(),
      reason,
      metadata,
    };

    const current = getStoredAuditLogs();
    saveAuditLogs([newLog, ...current]);
    return newLog;
  },

  /**
   * Mengambil statistik operasional untuk dashboard overview
   */
  async getOverviewStats() {
    return {
      urgentActions: 4,
      totalTransactionsVolume: 34500000,
      activeDisputes: 2,
      pendingKyc: 3,
      activePromotions: 2,
    };
  },
};
