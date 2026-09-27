/**
 * auditService.js
 * Audit Trail & Action Logging Service Abstraction
 * Complies with Section 29 of requirements.
 *
 * Mencatat setiap tindakan operasional penting yang dilakukan oleh Admin:
 * suspend, reactivate, verifikasi, tindakan pembayaran, refund, payout,
 * penarikan, promosi, resolusi sengketa, dan penyesuaian manual.
 */

const AUDIT_STORAGE_KEY = "bantuin_audit_trail_logs";

const INITIAL_AUDIT_LOGS = [
  {
    id: "log-001",
    adminId: "admin-pusat",
    adminName: "Admin Pusat",
    action: "VERIFY_KYC",
    targetType: "provider",
    targetId: "fajar-ramadhan-desain",
    target: "Fajar Ramadhan (Penyedia Jasa)",
    previousStatus: "pending",
    newStatus: "approved",
    details: "Verifikasi KTP dan NIK disetujui. Data identitas valid.",
    timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: "log-002",
    adminId: "admin-pusat",
    adminName: "Admin Pusat",
    action: "COMPLETE_PAYOUT",
    targetType: "payout",
    targetId: "payout-001",
    target: "Payout #payout-001 (Fajar Ramadhan)",
    previousStatus: "processing",
    newStatus: "completed",
    details: "Transfer hak pembayaran senilai Rp 322.000 via BCA (Ref: TRF-BCA-992810).",
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "log-003",
    adminId: "admin-pusat",
    adminName: "Admin Pusat",
    action: "APPROVE_PROMOTION",
    targetType: "promotion",
    targetId: "prm-001",
    target: "Promosi Toko: Focus Nusantara Rental",
    previousStatus: "pending_payment",
    newStatus: "active",
    details: "Pembayaran terverifikasi Payment Gateway resmi. Promosi aktif hingga 5 hari ke depan.",
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "log-004",
    adminId: "admin-pusat",
    adminName: "Admin Pusat",
    action: "RESOLVE_DISPUTE",
    targetType: "report",
    targetId: "rep-001",
    target: "Laporan #rep-001 (Disintermediasi)",
    previousStatus: "investigating",
    newStatus: "resolved",
    details: "Peringatan resmi diberikan kepada pengguna terlapor atas percobaan bypass kontak WhatsApp.",
    timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
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

export const auditService = {
  /**
   * Mengambil riwayat log audit dengan filter
   */
  async getAuditLogs(filter = {}) {
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
   * Mencatat log tindakan admin baru
   */
  async logAction({ adminId = "admin-pusat", adminName = "Admin Pusat", action, targetType, targetId, target, previousStatus = null, newStatus = null, details = "", metadata = null }) {
    if (!action || !targetType) {
      return null;
    }

    const newLog = {
      id: `log-${Date.now()}`,
      adminId,
      adminName,
      action,
      targetType,
      targetId: targetId || "",
      target: target || `${targetType} #${targetId}`,
      previousStatus,
      newStatus,
      details,
      metadata,
      timestamp: new Date().toISOString(),
    };

    const current = getStoredAuditLogs();
    saveAuditLogs([newLog, ...current]);
    return newLog;
  },
};
