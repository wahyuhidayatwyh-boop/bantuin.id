/**
 * orderService.js
 * Order & Handover Management Service Abstraction
 * Complies with Section L (Provider Order Flow) & Section M (Partner Handover Flow).
 */

import { INITIAL_ORDER_ROOMS } from "@/lib/mock/mockData";

const ORDERS_STORAGE_KEY = "bantuin_orders_state";

export const ORDER_FLOW_STATUS = {
  // Provider Jasa Flow
  MENUNGGU_PEMBAYARAN: "Menunggu Pembayaran",
  DIBAYAR: "Dibayar",
  MENUNGGU_DIKERJAKAN: "Menunggu Dikerjakan",
  SEDANG_DIKERJAKAN: "Sedang Dikerjakan",
  MENUNGGU_KONFIRMASI: "Menunggu Konfirmasi",
  SELESAI: "Selesai",
  CANCELLED: "Dibatalkan",
  DISPUTED: "Sengketa",
  REFUNDED: "Dana Dikembalikan",

  // Partner Sewa Handover Flow
  READY_FOR_PICKUP: "Siap Diambil",
  HANDOVER: "Proses Handover",
  ITEM_HANDED_OVER: "Barang Diserahkan",
  ACTIVE_RENTAL: "Sedang Disewa",
  RETURNED: "Barang Dikembalikan",
  INSPECTION: "Pemeriksaan Unit",
  DEPOSIT_REFUNDED: "Deposit Dikembalikan",
};

function getStoredOrders() {
  if (typeof window === "undefined") return INITIAL_ORDER_ROOMS;
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_ORDER_ROOMS;
}

function saveOrders(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_orders_updated"));
  } catch {}
}

export const orderService = {
  /**
   * Mengambil daftar pesanan dengan filter
   */
  async getOrders(filter = {}) {
    let list = getStoredOrders();

    if (filter.customerId) {
      list = list.filter((o) => o.customerId === filter.customerId);
    }
    if (filter.providerId) {
      list = list.filter((o) => o.providerId === filter.providerId || o.helperId === filter.providerId);
    }
    if (filter.partnerId) {
      list = list.filter((o) => o.partnerId === filter.partnerId || o.ownerId === filter.partnerId);
    }
    if (filter.status && filter.status !== "all") {
      list = list.filter((o) => o.status === filter.status);
    }
    if (filter.type) {
      list = list.filter((o) => o.type === filter.type);
    }
    return list;
  },

  /**
   * Mengambil pesanan spesifik berdasarkan ID
   */
  async getOrderById(orderId) {
    const list = getStoredOrders();
    return list.find((o) => o.id === orderId || o.orderNumber === orderId) || null;
  },

  /**
   * Membuat pesanan baru
   */
  async createOrder(orderData) {
    const id = `ord-${Date.now()}`;
    const orderNumber = `BTN-${Date.now().toString().slice(-6)}`;

    const newOrder = {
      id,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: ORDER_FLOW_STATUS.MENUNGGU_PEMBAYARAN,
      timeline: [
        {
          status: ORDER_FLOW_STATUS.MENUNGGU_PEMBAYARAN,
          time: new Date().toISOString(),
          note: "Pesanan dibuat, menunggu pembayaran pelanggan.",
        },
      ],
      ...orderData,
    };

    const current = getStoredOrders();
    saveOrders([newOrder, ...current]);
    return newOrder;
  },

  /**
   * Memperbarui status pesanan & mencatat ke timeline
   */
  async updateOrderStatus(orderId, nextStatus, note = "") {
    const list = getStoredOrders();
    const target = list.find((o) => o.id === orderId);
    if (!target) throw new Error("Pesanan tidak ditemukan");

    const newTimelineItem = {
      status: nextStatus,
      time: new Date().toISOString(),
      note: note || `Status diperbarui menjadi ${nextStatus}`,
    };

    const updatedList = list.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          timeline: [...(o.timeline || []), newTimelineItem],
        };
      }
      return o;
    });

    saveOrders(updatedList);
    return updatedList.find((o) => o.id === orderId);
  },

  /**
   * Memperbarui bukti handover barang (Mitra Sewa)
   * Menyimpan foto fisik sebelum disewa dan setelah dikembalikan
   */
  async updateHandoverProof(orderId, { photoBefore, photoAfter, inspectionNotes, conditionStatus = "Baik" }) {
    const list = getStoredOrders();
    const updatedList = list.map((o) => {
      if (o.id === orderId) {
        const handoverData = o.handoverData || {};
        if (photoBefore) handoverData.photoBefore = photoBefore;
        if (photoAfter) handoverData.photoAfter = photoAfter;
        if (inspectionNotes) handoverData.inspectionNotes = inspectionNotes;
        if (conditionStatus) handoverData.conditionStatus = conditionStatus;
        handoverData.updatedAt = new Date().toISOString();

        return {
          ...o,
          handoverData,
        };
      }
      return o;
    });

    saveOrders(updatedList);
    return updatedList.find((o) => o.id === orderId);
  },
};
