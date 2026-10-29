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

const INITIAL_AUDIT_LOGS = [];

function getStoredAuditLogs() {
  if (typeof window === "undefined") return INITIAL_AUDIT_LOGS;
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((l) => l.targetId !== "fajar-ramadhan-desain" && !l.id?.startsWith("log-00"));
      }
    }
  } catch {}
  return [];
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
