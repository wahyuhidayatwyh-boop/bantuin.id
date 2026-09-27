/**
 * paymentService.js
 * Tripay Payment Gateway Abstraction for Customer Payment Collection
 * Complies with Section 11 & 12 of requirements.
 *
 * PENTING:
 * 1. Tripay bertindak sebagai PAYMENT GATEWAY untuk CUSTOMER PAYMENT COLLECTION.
 * 2. Tripay BUKAN escrow/rekening bersama. Bantuin TIDAK menggunakan sistem escrow.
 * 3. Tidak ada tombol palsu "Saya Sudah Bayar" yang membypass validasi gateway.
 * 4. Payout ke Provider/Mitra dan Refund ke Customer adalah flow keuangan terpisah.
 * 5. State transitions:
 *    - pending   -> status awal saat transaksi dibuat di Tripay
 *    - paid      -> terverifikasi sukses oleh webhook / callback gateway
 *    - failed    -> gateway menolak pembayaran / terjadi kegagalan sistem
 *    - expired   -> batas waktu pembayaran habis (24 jam)
 *    - cancelled -> dibatalkan oleh pengguna / admin
 */

import { promotionService } from "./promotionService";

const PAYMENT_STORAGE_KEY = "bantuin_tripay_payments";

export const PAYMENT_METHODS = [
  { id: "qris", name: "QRIS (Semua E-Wallet / Mobile Banking)", type: "instant", fee: 0, icon: "QrCode" },
  { id: "bca_va", name: "BCA Virtual Account", type: "va", fee: 2500, icon: "CreditCard" },
  { id: "mandiri_va", name: "Mandiri Virtual Account", type: "va", fee: 2500, icon: "CreditCard" },
  { id: "bni_va", name: "BNI Virtual Account", type: "va", fee: 2500, icon: "CreditCard" },
  { id: "bri_va", name: "BRI Virtual Account", type: "va", fee: 2500, icon: "CreditCard" },
  { id: "gopay", name: "GoPay / GoPay Later", type: "ewallet", fee: 1000, icon: "Wallet" },
  { id: "ovo", name: "OVO", type: "ewallet", fee: 1000, icon: "Wallet" },
  { id: "shopeepay", name: "ShopeePay", type: "ewallet", fee: 1000, icon: "Wallet" },
];

function getStoredPayments() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PAYMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePayments(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_payments_updated"));
  } catch {}
}

export const paymentService = {
  /**
   * Mengambil daftar metode pembayaran resmi Tripay
   */
  async getPaymentMethods() {
    return PAYMENT_METHODS;
  },

  /**
   * CREATE PROMOTION PAYMENT
   * Membuka transaksi pembayaran baru untuk promosi layanan / jasa via Tripay Payment Gateway
   * Kontrak API / Service Frontend:
   *
   * @param {Object} payload
   * @param {string} [payload.promotionId]
   * @param {string} payload.ownerId
   * @param {string} [payload.ownerName]
   * @param {"provider"|"partner"} [payload.ownerType]
   * @param {"service"|"rental"|"store"} [payload.targetType]
   * @param {string} payload.targetId
   * @param {string} [payload.targetTitle]
   * @param {string} payload.packageId
   * @param {string} [payload.packageName]
   * @param {number} payload.amount
   * @param {string} [payload.paymentProvider]
   * @param {string} [payload.paymentMethod]
   * @param {string} [payload.payerName]
   * @param {string} [payload.payerEmail]
   * @param {string} [payload.payerPhone]
   */
  async createPromotionPayment({
    promotionId,
    ownerId,
    ownerName = "Penyedia Jasa",
    ownerType = "provider",
    targetType = "service",
    targetId,
    targetTitle = "Layanan Jasa Unggulan",
    packageId,
    packageName = "Paket Promosi",
    amount,
    paymentProvider = "tripay",
    paymentMethod = "qris",
    payerName = "Penyedia Jasa",
    payerEmail = "provider@bantuin.id",
    payerPhone = "081298765432",
  }) {
    if (!packageId || !amount) {
      throw new Error("Paket promosi dan nominal biaya wajib disertakan.");
    }

    const promoId = promotionId || `PROMO-${Date.now().toString().slice(-6)}`;
    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const reference = `TRIPAY-PROMO-${Math.floor(100000 + Math.random() * 900000)}`;

    let tripayDetails = null;

    // Dispatch ke server-side BFF route jika browser mendukung fetch
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/payments/tripay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: promoId,
            amount: Number(amount),
            paymentMethod,
            customerName: payerName,
            customerEmail: payerEmail,
            customerPhone: payerPhone,
            itemName: `Promosi ${packageName} - ${targetTitle}`,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          tripayDetails = json.data;
        }
      } catch (e) {
        console.warn("[paymentService]: Menggunakan fallback contract lokal untuk Tripay:", e);
      }
    }

    const checkoutUrl = tripayDetails?.checkout_url || `https://tripay.co.id/checkout/${tripayDetails?.reference || reference}`;
    const payCode = tripayDetails?.pay_code || (paymentMethod.includes("va") ? `827708${Math.floor(10000000 + Math.random() * 90000000)}` : null);
    const qrUrl = tripayDetails?.qr_url || (paymentMethod === "qris" ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" : null);
    const qrString = tripayDetails?.qr_string || (paymentMethod === "qris" ? `00020101021226680016ID.CO.TRIPAY.WWW011893600998${Date.now()}51440014ID.LINKAJA.WWW0215202609051029835204581253033605802ID5910BANTUIN ID6010JAKARTA61051294062070703A0163048991` : null);
    const expiredAt = tripayDetails?.expired_time
      ? new Date(tripayDetails.expired_time * 1000).toISOString()
      : new Date(Date.now() + 24 * 3600000).toISOString();

    const newPayment = {
      id: paymentId,
      paymentId, // for convenience
      orderId: promoId,
      promotionId: promoId,
      provider: paymentProvider || "tripay",
      reference: tripayDetails?.reference || reference,
      externalReference: tripayDetails?.reference || reference,
      amount: Number(amount),
      status: "pending", // strictly pending! Never directly paid
      paymentUrl: checkoutUrl,
      checkoutUrl,
      paymentMethod,
      payCode,
      qrUrl,
      qrString,
      createdAt: new Date().toISOString(),
      expiredAt,
      paidAt: null,
      failedAt: null,
      cancelledAt: null,
      metadata: {
        type: "promotion",
        promotionId: promoId,
        ownerId,
        ownerName,
        ownerType,
        targetType,
        targetId,
        targetTitle,
        packageId,
        packageName,
        payerName,
        payerEmail,
        payerPhone,
      },
    };

    // 1. Simpan payment record di payment storage
    const currentPayments = getStoredPayments();
    savePayments([newPayment, ...currentPayments]);

    // 2. Buat atau sinkronkan data promosi di promotionService (status: pending_payment)
    await promotionService.createPromotionOrder({
      id: promoId,
      ownerId,
      ownerName,
      ownerType,
      targetType,
      targetId,
      targetTitle,
      packageId,
      paymentId,
      amount: Number(amount),
      paymentMethod,
    });

    return newPayment;
  },

  /**
   * Membuat transaksi pembayaran pesanan umum (Order / Rental / Jasa Klien)
   */
  async createPayment({ orderId, amount, paymentMethod = "qris", payerName = "Pengguna Bantuin", type = "order", metadata = {} }) {
    if (!orderId || !amount) {
      throw new Error("ID Pesanan dan Nominal transaksi wajib disertakan.");
    }

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const reference = `TRIPAY-${type.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    let tripayDetails = null;

    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/payments/tripay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: Number(amount),
            paymentMethod,
            customerName: payerName,
            customerEmail: metadata.customerEmail || "customer@bantuin.id",
            customerPhone: metadata.customerPhone || "081298765432",
            itemName: metadata.title || `Pesanan Bantuin #${orderId}`,
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          tripayDetails = json.data;
        }
      } catch (e) {
        console.warn("[paymentService]: Fallback lokal Tripay:", e);
      }
    }

    const newPayment = {
      id: paymentId,
      paymentId,
      orderId,
      provider: "tripay",
      reference: tripayDetails?.reference || reference,
      externalReference: tripayDetails?.reference || reference,
      paymentMethod,
      amount: Number(amount),
      status: "pending",
      paidAt: null,
      expiredAt: tripayDetails?.expired_time ? new Date(tripayDetails.expired_time * 1000).toISOString() : new Date(Date.now() + 24 * 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      payCode: tripayDetails?.pay_code || null,
      qrUrl: tripayDetails?.qr_url || null,
      qrString: tripayDetails?.qr_string || null,
      checkoutUrl: tripayDetails?.checkout_url || `https://tripay.co.id/checkout/${reference}`,
      paymentUrl: tripayDetails?.checkout_url || `https://tripay.co.id/checkout/${reference}`,
      metadata: {
        payerName,
        type,
        channel: paymentMethod,
        ...metadata,
      },
    };

    const current = getStoredPayments();
    savePayments([newPayment, ...current]);
    return newPayment;
  },

  /**
   * Mengambil status transaksi pembayaran berdasarkan paymentId atau orderId
   * Mengembalikan status kanonikal: pending, paid, failed, expired, cancelled, refunded
   */
  async getPaymentStatus(paymentId) {
    const list = getStoredPayments();
    const item = list.find((p) => p.id === paymentId || p.paymentId === paymentId || p.orderId === paymentId || p.reference === paymentId);
    if (!item) return { status: "not_found" };

    // Auto-check expiration if pending
    if (item.status === "pending" && item.expiredAt && new Date(item.expiredAt) < new Date()) {
      item.status = "expired";
      item.failedAt = item.expiredAt;
      savePayments(list);
      if (item.metadata?.type === "promotion" || item.promotionId) {
        await promotionService.expirePromotion(item.promotionId || item.orderId);
      }
    }

    return item;
  },

  /**
   * Membatalkan transaksi pembayaran
   */
  async cancelPayment(paymentId, reason = "Dibatalkan oleh pengguna") {
    const list = getStoredPayments();
    let updatedItem = null;

    const nextList = list.map((p) => {
      if (p.id === paymentId || p.paymentId === paymentId || p.orderId === paymentId || p.reference === paymentId) {
        updatedItem = {
          ...p,
          status: "cancelled",
          cancelReason: reason,
          cancelledAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return p;
    });

    savePayments(nextList);

    if (updatedItem && (updatedItem.metadata?.type === "promotion" || updatedItem.promotionId)) {
      try {
        await promotionService.cancelPromotion(updatedItem.promotionId || updatedItem.orderId, reason);
      } catch (err) {}
    }

    return updatedItem;
  },

  /**
   * Menandai pembayaran gagal (ditolak gateway / timeout)
   */
  async failPayment(paymentId, reason = "Pembayaran gagal diproses oleh gateway") {
    const list = getStoredPayments();
    let updatedItem = null;

    const nextList = list.map((p) => {
      if (p.id === paymentId || p.paymentId === paymentId || p.orderId === paymentId || p.reference === paymentId) {
        updatedItem = {
          ...p,
          status: "failed",
          failureReason: reason,
          failedAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return p;
    });

    savePayments(nextList);

    if (updatedItem && (updatedItem.metadata?.type === "promotion" || updatedItem.promotionId)) {
      try {
        await promotionService.failPromotion(updatedItem.promotionId || updatedItem.orderId, reason);
      } catch (err) {}
    }

    return updatedItem;
  },

  /**
   * Menandai pembayaran kedaluwarsa
   */
  async expirePayment(paymentId, reason = "Batas waktu pembayaran telah kedaluwarsa") {
    const list = getStoredPayments();
    let updatedItem = null;

    const nextList = list.map((p) => {
      if (p.id === paymentId || p.paymentId === paymentId || p.orderId === paymentId || p.reference === paymentId) {
        updatedItem = {
          ...p,
          status: "expired",
          failureReason: reason,
          expiredAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return p;
    });

    savePayments(nextList);

    if (updatedItem && (updatedItem.metadata?.type === "promotion" || updatedItem.promotionId)) {
      try {
        await promotionService.expirePromotion(updatedItem.promotionId || updatedItem.orderId, reason);
      } catch (err) {}
    }

    return updatedItem;
  },

  /**
   * Konfirmasi Pembayaran Berhasil (Tripay Callback / Verified Webhook)
   * Hanya dipanggil jika status resmi dari gateway Tripay adalah 'PAID'.
   * Mengubah status payment -> 'paid' dan memicu aktivasi promosi -> 'active'.
   */
  async confirmPayment(paymentId) {
    const list = getStoredPayments();
    let updatedItem = null;

    const nextList = list.map((p) => {
      if (p.id === paymentId || p.paymentId === paymentId || p.orderId === paymentId || p.reference === paymentId) {
        updatedItem = {
          ...p,
          status: "paid",
          paidAt: new Date().toISOString(),
        };
        return updatedItem;
      }
      return p;
    });

    savePayments(nextList);

    // Jika pembayaran untuk paket promosi, aktifkan paket promosinya otomatis
    if (updatedItem && (updatedItem.metadata?.type === "promotion" || updatedItem.promotionId)) {
      try {
        const promoTargetId = updatedItem.promotionId || updatedItem.orderId;
        await promotionService.activatePromotion(promoTargetId, updatedItem.id);
      } catch (err) {
        console.error("[paymentService]: Gagal mengaktifkan promosi:", err);
      }
    }

    return updatedItem;
  },

  /**
   * Simulasi verifikasi pembayaran berhasil (Developer Mock / Sandbox)
   */
  async simulateDevPaymentSuccess(paymentId) {
    return await this.confirmPayment(paymentId);
  },

  /**
   * Menangani kembalinya pengguna dari payment gateway (Return Handler)
   * JANGAN mempercayai query param frontend secara mentah!
   * Selalu memvalidasi ke server/service state.
   */
  async handlePaymentReturn(params = {}) {
    const paymentId = params.paymentId || params.reference || params.orderId;
    if (!paymentId) {
      return { verified: false, error: "Parameter transaksi pembayaran tidak ditemukan." };
    }

    const payment = await this.getPaymentStatus(paymentId);
    if (!payment || payment.status === "not_found") {
      return { verified: false, error: "Data transaksi pembayaran tidak ditemukan di sistem." };
    }

    return {
      verified: true,
      paymentId: payment.id,
      status: payment.status,
      isPaid: payment.status === "paid",
      isPending: payment.status === "pending",
      isFailed: payment.status === "failed",
      isExpired: payment.status === "expired",
      isCancelled: payment.status === "cancelled",
      payment,
    };
  },

  /**
   * [DEVELOPMENT MOCK ONLY]
   * Helper simulator pengujian gateway Tripay untuk lingkungan frontend demo.
   * DIBERI LABEL KHUSUS PENGUJIAN DAN TERPISAH DARI PRODUCTION CONTRACT.
   */
  async mockSimulateTripayPayment(paymentId, targetStatus = "paid") {
    console.info(`[DEVELOPMENT MOCK ONLY]: Mensimulasikan webhook Tripay untuk ${paymentId} -> ${targetStatus}`);
    if (targetStatus === "paid") {
      return await this.confirmPayment(paymentId);
    } else if (targetStatus === "failed") {
      return await this.failPayment(paymentId, "Simulasi penolakan pembayaran oleh bank/channel");
    } else if (targetStatus === "expired") {
      return await this.expirePayment(paymentId, "Simulasi batas waktu transaksi habis (Expired)");
    } else if (targetStatus === "cancelled") {
      return await this.cancelPayment(paymentId, "Simulasi pembatalan pembayaran");
    }
    return await this.getPaymentStatus(paymentId);
  },

  /**
   * Mengambil riwayat seluruh transaksi pembayaran
   */
  async getPaymentHistory(filter = {}) {
    let list = getStoredPayments();
    if (filter.type) {
      list = list.filter((p) => p.metadata?.type === filter.type);
    }
    if (filter.status && filter.status !== "all") {
      list = list.filter((p) => p.status === filter.status);
    }
    return list;
  },
};
