/**
 * lib/services/paymentService.js
 * Official Midtrans Payment Gateway Client Abstraction for Bantuin.id
 *
 * Rules:
 * 1. Customer Payment Gateway: MIDTRANS ONLY (via Midtrans Snap & Core API).
 * 2. NO dummy/mock/simulator data or fake QR code fallbacks.
 * 3. Never trust client-side prices: backend enforces database values.
 * 4. Payouts (withdrawals) and refunds are managed separately from customer collection.
 */

import { authService } from "./authService.js";

export const MIDTRANS_PAYMENT_CHANNELS = [
  { id: "qris", name: "QRIS (GoPay, OVO, Dana, LinkAja, BCA, dll.)", type: "instant", fee: 0, icon: "QrCode" },
  { id: "gopay", name: "GoPay / GoPay Later", type: "ewallet", fee: 1000, icon: "Wallet" },
  { id: "shopeepay", name: "ShopeePay", type: "ewallet", fee: 1000, icon: "Wallet" },
  { id: "bca_va", name: "BCA Virtual Account", type: "va", fee: 4000, icon: "CreditCard" },
  { id: "mandiri_va", name: "Mandiri Bill Payment", type: "va", fee: 4000, icon: "CreditCard" },
  { id: "bni_va", name: "BNI Virtual Account", type: "va", fee: 4000, icon: "CreditCard" },
  { id: "bri_va", name: "BRI Virtual Account", type: "va", fee: 4000, icon: "CreditCard" },
  { id: "permata_va", name: "Permata Virtual Account", type: "va", fee: 4000, icon: "CreditCard" },
  { id: "credit_card", name: "Kartu Kredit / Debit (Visa, Mastercard, JCB)", type: "card", fee: 2000, icon: "CreditCard" },
  { id: "indomaret", name: "Indomaret / i.saku", type: "cstore", fee: 5000, icon: "Store" },
  { id: "alfamart", name: "Alfamart / Alfamidi", type: "cstore", fee: 5000, icon: "Store" },
];

/**
 * Backward compatibility alias for legacy callers
 */
export const PAYMENT_METHODS = MIDTRANS_PAYMENT_CHANNELS;

export const paymentService = {
  /**
   * Mengambil daftar saluran pembayaran resmi Midtrans
   */
  async getPaymentMethods() {
    return MIDTRANS_PAYMENT_CHANNELS;
  },

  /**
   * CREATE PAYMENT (Midtrans Snap Transaction)
   * Mengirim request pembuatan Snap token ke backend BFF `/api/payments/create-invoice`.
   * Backend memvalidasi auth, kepemilikan pesanan, dan mengambil nominal aktual dari database.
   *
   * @param {Object} params
   * @param {string} params.orderId - ID Bilik Pesanan (OrderRoom id atau Request id)
   * @param {string} [params.entityType="order"] - 'order' | 'rental' | 'promotion'
   * @param {string} [params.paymentMethod="qris"]
   * @param {string} [params.payerName]
   * @param {Object} [params.metadata]
   */
  async createPayment({
    orderId,
    entityType = "order",
    paymentMethod = "qris",
    payerName,
    metadata = {},
  }) {
    if (!orderId) {
      throw new Error("ID Transaksi wajib disertakan untuk membuat tagihan pembayaran.");
    }

    const token = await authService.getValidAccessToken();
    if (!token) {
      throw new Error("Sesi pengguna tidak ditemukan. Silakan masuk terlebih dahulu.");
    }

    const payload = {
      entityType,
      entityId: orderId,
      orderRoomId: entityType === "order" ? orderId : undefined,
      rentalBookingId: entityType === "rental" ? orderId : undefined,
      promotionId: entityType === "promotion" ? orderId : undefined,
      paymentMethod,
    };

    const response = await fetch("/api/payments/create-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.success) {
      const errorMsg =
        result.error ||
        result.message ||
        `Gagal membuat transaksi Midtrans (HTTP ${response.status}).`;
      throw new Error(errorMsg);
    }

    const data = result.data;

    return {
      id: data.orderId,
      paymentId: data.orderId,
      orderId: data.orderId,
      provider: "midtrans",
      token: data.token,
      snapToken: data.token,
      redirectUrl: data.redirectUrl,
      paymentUrl: data.redirectUrl,
      checkoutUrl: data.redirectUrl,
      amount: data.amount,
      entityType: data.entityType,
      entityId: data.entityId,
      status: "pending",
      paymentMethod,
      createdAt: new Date().toISOString(),
      metadata,
    };
  },

  /**
   * CREATE PROMOTION PAYMENT (Midtrans Snap)
   */
  async createPromotionPayment({
    promotionId,
    packageId,
    amount,
    paymentMethod = "qris",
    metadata = {},
  }) {
    if (!promotionId && !packageId) {
      throw new Error("ID Pesanan promosi wajib disertakan.");
    }

    return await this.createPayment({
      orderId: promotionId,
      entityType: "promotion",
      paymentMethod,
      metadata,
    });
  },

  /**
   * GET PAYMENT STATUS
   * Mengambil status pembayaran terverifikasi langsung dari database & Midtrans CoreApi
   */
  async getPaymentStatus(orderId, entityType = "order") {
    if (!orderId) {
      return { status: "not_found" };
    }

    try {
      const token = await authService.getValidAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(
        `/api/payments/status?orderId=${encodeURIComponent(orderId)}&entityType=${encodeURIComponent(entityType)}`,
        { headers }
      );

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success && result.data) {
        const item = result.data;
        const normalizedStatus = (item.paymentStatus || "").toLowerCase();

        return {
          id: item.orderId,
          orderId: item.orderId,
          status: normalizedStatus,
          paymentStatus: item.paymentStatus,
          isPaid: item.paymentStatus === "PAID",
          isPending: item.paymentStatus === "PENDING",
          isSettled: item.isSettled,
          paymentMethod: item.paymentMethod,
          paidAt: item.paidAt,
        };
      }

      return { status: "not_found" };
    } catch (err) {
      console.warn("[paymentService]: Gagal memeriksa status pembayaran:", err);
      return { status: "error", error: err.message };
    }
  },

  /**
   * RETURN HANDLER
   * Menangani kembalinya pengguna setelah proses pembayaran di Midtrans Snap
   */
  async handlePaymentReturn(params = {}) {
    const orderId = params.order_id || params.orderId || params.id;
    if (!orderId) {
      return { verified: false, error: "Parameter order_id tidak ditemukan." };
    }

    const payment = await this.getPaymentStatus(orderId, params.entityType || "order");

    return {
      verified: payment && payment.status !== "not_found" && payment.status !== "error",
      orderId,
      status: payment.status,
      isPaid: payment.isPaid,
      isPending: payment.isPending,
      isSettled: payment.isSettled,
      payment,
    };
  },

  /**
   * Safe Backward-Compatibility Stub: confirmPayment
   * Memeriksa status nyata transaksi di Midtrans melalui backend status endpoint,
   * TIDAK mengizinkan penetapan sepihak (fake success) dari frontend.
   */
  async confirmPayment(paymentId, entityType = "promotion") {
    if (!paymentId) return { success: false, status: "not_found" };
    const payment = await this.getPaymentStatus(paymentId, entityType);
    return {
      id: paymentId,
      orderId: paymentId,
      status: payment?.status || "pending",
      isPaid: Boolean(payment?.isPaid),
      verified: Boolean(payment?.isSettled || payment?.isPaid),
    };
  },

  /**
   * CANCEL PAYMENT (Midtrans Real Cancellation)
   * Mengirim permintaan pembatalan transaksi resmi ke backend `/api/payments/cancel`.
   * Backend memanggil Midtrans Core API `/v2/{order_id}/cancel` dan memvalidasi respons gateway.
   *
   * @param {string} paymentId - Order ID atau Entity ID yang ingin dibatalkan
   * @param {string} [reason="Dibatalkan oleh pengguna"]
   * @param {string} [entityType="order"] - 'order' | 'rental' | 'promotion'
   */
  async cancelPayment(paymentId, reason = "Dibatalkan oleh pengguna", entityType = "order") {
    if (!paymentId) {
      throw new Error("ID Transaksi pembayaran wajib disertakan untuk pembatalan.");
    }

    try {
      const token = await authService.getValidAccessToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch("/api/payments/cancel", {
        method: "POST",
        headers,
        body: JSON.stringify({
          orderId: paymentId,
          entityId: paymentId,
          entityType,
          reason,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        const errorMsg =
          result?.error ||
          result?.message ||
          `Gagal membatalkan transaksi di payment gateway (HTTP ${response.status}).`;
        throw new Error(errorMsg);
      }

      return {
        success: true,
        id: paymentId,
        orderId: paymentId,
        status: "cancelled",
        cancelReason: reason,
        data: result.data,
      };
    } catch (err) {
      console.warn("[paymentService]: Gagal membatalkan transaksi:", err.message);
      throw err;
    }
  },

  /**
   * Safe Backward-Compatibility Stub: failPayment
   */
  async failPayment(paymentId, reason = "Transaksi gagal") {
    return {
      id: paymentId,
      orderId: paymentId,
      status: "failed",
      failureReason: reason,
    };
  },

  /**
   * Safe Backward-Compatibility Stub: expirePayment
   */
  async expirePayment(paymentId, reason = "Batas waktu transaksi telah kedaluwarsa") {
    return {
      id: paymentId,
      orderId: paymentId,
      status: "expired",
      failureReason: reason,
    };
  },

  /**
   * Safe Backward-Compatibility Stub: mockSimulateTripayPayment
   * Simulator dinonaktifkan sesuai aturan: sistem hanya menggunakan Midtrans asli.
   */
  async mockSimulateTripayPayment(paymentId, targetStatus = "paid") {
    console.warn(
      `[paymentService Warning]: Simulator pembayaran dinonaktifkan. Mengarahkan pengecekan ke status transaksi resmi untuk ID: ${paymentId}`
    );
    return await this.getPaymentStatus(paymentId);
  },

  /**
   * Memuat Midtrans Snap SDK secara dinamis hanya saat dibutuhkan
   */
  async loadSnap() {
    return await loadMidtransSnap();
  },
};

/**
 * Memuat script Midtrans Snap SDK secara dinamis (on-demand).
 * Mencegah script pihak ketiga (Midtrans & Aliyun Captcha) membebani
 * halaman utama/landing page dan hanya diunduh saat checkout dibutuhkan.
 */
export async function loadMidtransSnap() {
  if (typeof window === "undefined") return null;
  if (window.snap) return window.snap;

  return new Promise((resolve) => {
    const isProd = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const snapUrl = isProd
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

    const existingScript = document.querySelector(`script[src*="snap.js"]`);
    if (existingScript) {
      if (window.snap) return resolve(window.snap);
      existingScript.addEventListener("load", () => resolve(window.snap));
      existingScript.addEventListener("error", () => resolve(null));
      return;
    }

    const script = document.createElement("script");
    script.src = snapUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => resolve(window.snap);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

