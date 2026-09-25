/**
 * announcementService.js
 * Platform Announcement & Broadcast Service Abstraction
 * Complies with Section 42 of requirements.
 *
 * Mengelola pengumuman resmi platform yang dapat ditargetkan ke seluruh pengguna,
 * atau spesifik untuk Provider / Partner.
 */

const ANNOUNCEMENT_STORAGE_KEY = "bantuin_announcements_state";

const INITIAL_ANNOUNCEMENTS = [
  {
    id: "bc-1",
    title: "Sistem Pembayaran Resmi Terverifikasi Aktif",
    content: "Seluruh pembayaran pesanan bantuan, jasa, dan sewa di platform Bantuin diverifikasi otomatis melalui Payment Gateway resmi. Jangan pernah mentransfer ke rekening pribadi mitra!",
    type: "info", // info, warning, promo
    audience: "all", // all, user, provider, partner
    status: "active",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "bc-2",
    title: "Peringatan Keamanan Anti-Disintermediasi",
    content: "Dilarang keras membagikan kontak pribadi (WhatsApp) atau mengajak transaksi di luar platform sebelum pembayaran resmi terkonfirmasi.",
    type: "warning",
    audience: "all",
    status: "active",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "bc-3",
    title: "Program Promosi Unggulan Etalase Aktif",
    content: "Penyedia Jasa dan Mitra Toko kini dapat mengaktifkan paket promosi unggulan untuk menempatkan listing di etalase rekomendasi landing page.",
    type: "promo",
    audience: "partner",
    status: "active",
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

function getStoredAnnouncements() {
  if (typeof window === "undefined") return INITIAL_ANNOUNCEMENTS;
  try {
    const raw = localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_ANNOUNCEMENTS;
}

function saveAnnouncements(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_announcements_updated"));
  } catch {}
}

export const announcementService = {
  /**
   * Mengambil daftar pengumuman dengan filter audiens & status
   */
  async getAnnouncements(filter = {}) {
    let list = getStoredAnnouncements();
    if (filter.status && filter.status !== "all") {
      list = list.filter((a) => a.status === filter.status);
    }
    if (filter.audience && filter.audience !== "all") {
      list = list.filter((a) => a.audience === "all" || a.audience === filter.audience);
    }
    return list;
  },

  /**
   * Admin: Membuat pengumuman baru
   */
  async createAnnouncement({ title, content, type = "info", audience = "all" }) {
    if (!title || !content) {
      throw new Error("Judul dan isi pengumuman wajib diisi.");
    }

    const newAnnouncement = {
      id: `bc-${Date.now()}`,
      title,
      content,
      type,
      audience,
      status: "active",
      createdAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    };

    const list = getStoredAnnouncements();
    saveAnnouncements([newAnnouncement, ...list]);
    return newAnnouncement;
  },

  /**
   * Admin: Mengaktifkan / Menutup pengumuman
   */
  async toggleAnnouncement(id) {
    const list = getStoredAnnouncements();
    const updated = list.map((a) =>
      a.id === id ? { ...a, status: a.status === "active" ? "inactive" : "active" } : a
    );
    saveAnnouncements(updated);
    return updated.find((a) => a.id === id);
  },

  /**
   * Admin: Menghapus pengumuman
   */
  async deleteAnnouncement(id) {
    const list = getStoredAnnouncements();
    const updated = list.filter((a) => a.id !== id);
    saveAnnouncements(updated);
    return true;
  },
};
