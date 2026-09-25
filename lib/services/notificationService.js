/**
 * notificationService.js
 * In-App Notifications Abstraction
 * Complies with Section AH of requirements.
 */

const NOTIFICATIONS_STORAGE_KEY = "bantuin_notifications_state";

const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-001",
    userId: "usr-001",
    title: "Pesanan Berhasil Dibuat",
    message: "Pesanan Sewa Kamera Sony A7 III telah masuk ke sistem. Silakan selesaikan pembayaran.",
    type: "order", // order, payment, verification, promotion, report, announcement
    link: "/activity",
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: "notif-002",
    userId: "usr-001",
    title: "Verifikasi Identitas Berhasil",
    message: "Identitas akun Anda telah diverifikasi oleh tim Trust & Safety Bantuin.",
    type: "verification",
    link: "/profile",
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: "notif-003",
    userId: "usr-001",
    title: "Pengumuman: Fitur Promosi Toko",
    message: "Mitra rental kini dapat mengaktifkan paket Promosi untuk meningkatkan visibilitas toko.",
    type: "announcement",
    link: "/mitra/dashboard",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function getStoredNotifications() {
  if (typeof window === "undefined") return INITIAL_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_NOTIFICATIONS;
}

function saveNotifications(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_notifications_updated"));
  } catch {}
}

export const notificationService = {
  /**
   * Mengambil daftar notifikasi pengguna
   */
  async getNotifications(userId = "usr-001") {
    const all = getStoredNotifications();
    return all.filter((n) => n.userId === userId || n.userId === "all");
  },

  /**
   * Mengambil jumlah notifikasi belum dibaca
   */
  async getUnreadCount(userId = "usr-001") {
    const list = await this.getNotifications(userId);
    return list.filter((n) => !n.isRead).length;
  },

  /**
   * Menandai notifikasi telah dibaca
   */
  async markAsRead(notificationId) {
    const all = getStoredNotifications();
    const next = all.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n));
    saveNotifications(next);
  },

  /**
   * Menandai semua notifikasi telah dibaca
   */
  async markAllAsRead(userId = "usr-001") {
    const all = getStoredNotifications();
    const next = all.map((n) => (n.userId === userId ? { ...n, isRead: true } : n));
    saveNotifications(next);
  },

  /**
   * Mengirim notifikasi baru
   */
  async createNotification({ userId, title, message, type = "order", link = "" }) {
    const newNotif = {
      id: `notif-${Date.now()}`,
      userId: userId || "usr-001",
      title,
      message,
      type,
      link,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const current = getStoredNotifications();
    saveNotifications([newNotif, ...current]);
    return newNotif;
  },
};
