import { authService } from "@/lib/services/authService";

/**
 * Helper untuk melakukan HTTP request terotentikasi Admin ke server API
 */
async function fetchAdminApi(endpoint, options = {}) {
  const token = await authService.getValidAccessToken();
  if (!token) {
    throw new Error("Sesi login admin tidak ditemukan. Silakan masuk terlebih dahulu.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(endpoint, {
    cache: "no-store",
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.success) {
    throw new Error(json.error || `Gagal memproses permintaan (${response.status})`);
  }

  return json;
}

export const adminApi = {
  /**
   * Mengambil statistik metrik overview dashboard (GMV, Escrow, Total User, Order, Dispute, KYC)
   */
  async getDashboardStats() {
    const res = await fetchAdminApi("/api/admin/dashboard/stats");
    return res.data;
  },

  /**
   * Mengambil direktori seluruh akun pengguna platform dari database riil
   * @param {Object} params - { role: 'all'|'user'|'provider'|'partner'|'admin', status, search, page, limit }
   */
  async getUsersList(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.role) searchParams.set("role", params.role);
    if (params.status) searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const res = await fetchAdminApi(`/api/admin/users?${searchParams.toString()}`);
    return res.data;
  },

  /**
   * Menangguhkan (suspend) atau memulihkan (unsuspend) akun pengguna
   * @param {string} userId
   * @param {boolean} isSuspended
   * @param {string} reason
   */
  async toggleUserSuspend(userId, isSuspended = true, reason = "Pelanggaran pedoman platform") {
    const res = await fetchAdminApi(`/api/admin/users/${userId}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ isSuspended, reason }),
    });
    return res;
  },

  /**
   * Mengambil daftar pengajuan verifikasi identitas (KYC) dari database riil
   * @param {Object} params - { status: 'pending_review'|'all'|'verified'|'rejected', page: 1, limit: 50 }
   */
  async getKycList(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const res = await fetchAdminApi(`/api/admin/kyc?${searchParams.toString()}`);
    return res.data;
  },

  /**
   * Menyetujui verifikasi identitas (KYC)
   * @param {string} userId
   * @param {string} notes
   */
  async verifyKyc(userId, notes = "Terverifikasi oleh Admin") {
    const res = await fetchAdminApi("/api/admin/kyc/verify", {
      method: "POST",
      body: JSON.stringify({ userId, notes }),
    });
    return res;
  },

  /**
   * Menolak verifikasi identitas (KYC) disertai alasan
   * @param {string} userId
   * @param {string} reason
   */
  async rejectKyc(userId, reason) {
    const res = await fetchAdminApi("/api/admin/kyc/reject", {
      method: "POST",
      body: JSON.stringify({ userId, reason }),
    });
    return res;
  },

  /**
   * Mengambil daftar pesanan dan transaksi riil platform (OrderRoom & RentalBooking)
   * @param {Object} params - { type: 'all'|'task'|'service'|'rental', status, search, page, limit }
   */
  async getOrdersList(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set("type", params.type);
    if (params.status) searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const res = await fetchAdminApi(`/api/admin/orders?${searchParams.toString()}`);
    return res.data;
  },

  /**
   * Membatalkan paksa pesanan dan mengembalikan dana escrow ke customer (Force Cancel)
   * @param {string} orderId
   * @param {string} reason
   */
  async forceCancelOrder(orderId, reason = "Dibatalkan oleh Admin") {
    const res = await fetchAdminApi(`/api/admin/orders/${orderId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return res;
  },

  /**
   * Membekukan atau melepaskan transaksi mencurigakan (Freeze Order)
   * @param {string} orderId
   * @param {string} reason
   */
  async toggleFreezeOrder(orderId, reason = "Transaksi dibekukan untuk verifikasi keamanan.") {
    const res = await fetchAdminApi(`/api/admin/orders/${orderId}/freeze`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
    return res;
  },

  /**
   * Mengambil daftar antrean permohonan penarikan dana payout
   * @param {Object} params - { status: 'all'|'pending'|'approved'|'completed'|'failed', search, page, limit }
   */
  async getWithdrawalsList(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.search) searchParams.set("search", params.search);
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));

    const res = await fetchAdminApi(`/api/admin/withdrawals?${searchParams.toString()}`);
    return res.data;
  },

  /**
   * Memproses permohonan penarikan dana (approve, complete, reject)
   * @param {string} id
   * @param {Object} payload - { action: 'approve'|'complete'|'reject', transferReference, proofUrl, rejectionReason }
   */
  async processWithdrawal(id, payload) {
    const res = await fetchAdminApi(`/api/admin/withdrawals/${id}/process`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res;
  },

  /**
   * Mengambil daftar sengketa transaksi aktif
   */
  async getDisputesList() {
    const res = await fetchAdminApi("/api/admin/disputes");
    return res.data;
  },

  /**
   * Resolusi sengketa oleh Admin
   * @param {Object} payload - { orderRoomId, bookingId, decision: 'payout_helper'|'refund_requester'|'split', helperSharePercentage, adminNotes }
   */
  async resolveDispute(payload) {
    const res = await fetchAdminApi("/api/admin/disputes/resolve", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  },

  /**
   * Menghapus laporan dari sistem database secara permanen
   * @param {string} id
   */
  async deleteReport(id) {
    const res = await fetchAdminApi(`/api/admin/reports/${id}`, {
      method: "DELETE",
    });
    return res;
  },

  /**
   * Menghapus atau membersihkan sengketa pesanan/rental/laporan dari sistem
   * @param {string} id
   * @param {string} type - 'report' | 'order' | 'rental'
   */
  async deleteDispute(id, type = "report") {
    const res = await fetchAdminApi(`/api/admin/disputes?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`, {
      method: "DELETE",
    });
    return res;
  },

  /**
   * Mengambil seluruh kode voucher diskon
   */
  async getVouchersList() {
    const res = await fetchAdminApi("/api/admin/vouchers");
    return res.data;
  },

  /**
   * Membuat kode voucher promo diskon baru
   * @param {Object} voucherData
   */
  async createVoucher(voucherData) {
    const res = await fetchAdminApi("/api/admin/vouchers", {
      method: "POST",
      body: JSON.stringify(voucherData),
    });
    return res;
  },

  /**
   * Mengubah status aktif / nonaktif voucher
   * @param {string} id
   * @param {boolean} isActive
   */
  async toggleVoucher(id, isActive) {
    const res = await fetchAdminApi(`/api/admin/vouchers/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
    return res;
  },

  /**
   * Memperbarui voucher
   * @param {string} id
   * @param {Object} data
   */
  async updateVoucher(id, data) {
    const res = await fetchAdminApi(`/api/admin/vouchers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res;
  },

  /**
   * Menghapus voucher
   * @param {string} id
   */
  async deleteVoucher(id) {
    const res = await fetchAdminApi(`/api/admin/vouchers/${id}`, {
      method: "DELETE",
    });
    return res;
  },

  /**
   * Mengambil seluruh pengumuman siaran platform
   */
  async getAnnouncementsList() {
    const res = await fetchAdminApi("/api/admin/announcements");
    return res.data;
  },

  /**
   * Mempublikasikan pengumuman platform baru
   * @param {Object} data - { title, content, type, audience }
   */
  async createAnnouncement(data) {
    const res = await fetchAdminApi("/api/admin/announcements", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res;
  },

  /**
   * Mengubah status siaran pengumuman (active / inactive)
   * @param {string} id
   * @param {string} status - 'active' | 'inactive'
   */
  async toggleAnnouncement(id, status) {
    const res = await fetchAdminApi(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return res;
  },

  /**
   * Memperbarui isi pengumuman
   * @param {string} id
   * @param {Object} data - { title, content, status }
   */
  async updateAnnouncement(id, data) {
    const res = await fetchAdminApi(`/api/admin/announcements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res;
  },

  /**
   * Menghapus pengumuman
   * @param {string} id
   */
  async deleteAnnouncement(id) {
    const res = await fetchAdminApi(`/api/admin/announcements/${id}`, {
      method: "DELETE",
    });
    return res;
  },

  async getLandingContent() {
    const res = await fetchAdminApi("/api/admin/landing-content");
    return res.data;
  },

  async createLandingContent(data) {
    const res = await fetchAdminApi("/api/admin/landing-content", { method: "POST", body: JSON.stringify(data) });
    return res.data;
  },

  async updateLandingContent(type, id, data) {
    const res = await fetchAdminApi(`/api/admin/landing-content/${type}/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    return res.data;
  },

  async deleteLandingContent(type, id) {
    return fetchAdminApi(`/api/admin/landing-content/${type}/${id}`, { method: "DELETE" });
  },

  /**
   * Mengambil riwayat immutable audit log
   * @param {Object} params - { page, limit, search, action, targetEntity }
   */
  async getAuditLogs(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.search) searchParams.set("search", params.search);
    if (params.action) searchParams.set("action", params.action);
    if (params.targetEntity) searchParams.set("targetEntity", params.targetEntity);

    const res = await fetchAdminApi(`/api/admin/audit-logs?${searchParams.toString()}`);
    return res.data;
  },

  /**
   * Mengambil tiket pesan bantuan pengguna ke Admin CS
   */
  async getSupportTickets() {
    const res = await fetchAdminApi("/api/chat/admin");
    return res.data;
  },

  /**
   * Mengirim balasan CS Admin ke tiket pengguna
   * @param {Object} payload - { ticketId, message, targetUserId }
   */
  async sendSupportReply(payload) {
    const res = await fetchAdminApi("/api/chat/admin/message", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  },

  /**
   * Mengambil daftar promosi aktif, riwayat, dan analitik promosi dari DB
   */
  async getPromotions(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set("status", params.status);
    if (params.type) searchParams.set("type", params.type);
    if (params.search) searchParams.set("search", params.search);
    const query = searchParams.toString();
    const res = await fetchAdminApi(`/api/admin/promotions${query ? `?${query}` : ""}`);
    return res.data;
  },

  /**
   * Memperbarui status promosi (misal batalkan atau ubah tanggal berakhir)
   */
  async updatePromotion(id, data) {
    const res = await fetchAdminApi(`/api/admin/promotions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res;
  },

  /**
   * Menghapus promosi
   */
  async deletePromotion(id) {
    const res = await fetchAdminApi(`/api/admin/promotions/${id}`, {
      method: "DELETE",
    });
    return res;
  },

  /**
   * Mengambil paket promosi dari PostgreSQL
   */
  async getPromotionPackages() {
    const res = await fetchAdminApi("/api/admin/promotion-packages");
    return res.data;
  },

  /**
   * Membuat paket promosi baru
   */
  async createPromotionPackage(payload) {
    const res = await fetchAdminApi("/api/admin/promotion-packages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return res;
  },

  /**
   * Memperbarui paket promosi
   */
  async updatePromotionPackage(id, payload) {
    const res = await fetchAdminApi(`/api/admin/promotion-packages/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return res;
  },

  /**
   * Menghapus paket promosi (dengan deteksi soft delete jika ada transaksi aktif)
   */
  async deletePromotionPackage(id) {
    const res = await fetchAdminApi(`/api/admin/promotion-packages/${id}`, {
      method: "DELETE",
    });
    return res;
  },
};
