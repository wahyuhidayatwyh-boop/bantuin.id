import midtransClient from "midtrans-client";
import crypto from "crypto";

/**
 * lib/midtrans/client.js
 * Centralized Midtrans Client & Configuration Manager for Bantuin.id
 *
 * Security & Design Rules:
 * 1. MIDTRANS_SERVER_KEY is strictly server-side.
 * 2. NEXT_PUBLIC_MIDTRANS_CLIENT_KEY is exposed for frontend Snap popup/redirect.
 * 3. Never auto-enable production. Default is sandbox (isProduction: false).
 * 4. Never log secret keys, tokens, or raw payment credentials.
 * 5. If keys are missing, throw a clean, explicit server error. Never return dummy/mock data.
 */

const WEAK_MIDTRANS_SERVER_KEYS = new Set([
  "your_server_key",
  "sb-mid-server-xxx",
  "mid-server-xxx",
  "changeme",
  "placeholder",
  "dummy",
]);

export function isStrongMidtransKey(key) {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  if (trimmed.length < 12) return false;
  if (WEAK_MIDTRANS_SERVER_KEYS.has(trimmed.toLowerCase())) return false;
  return true;
}

export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim() || "";
  const clientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY?.trim() ||
    process.env.MIDTRANS_CLIENT_KEY?.trim() ||
    "";
  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    process.env.MIDTRANS_IS_PRODUCTION === "1";

  return {
    serverKey,
    clientKey,
    isProduction,
    isConfigured: isStrongMidtransKey(serverKey),
  };
}

let cachedSnapClient = null;
let cachedCoreApiClient = null;

/**
 * Returns an instance of Midtrans Snap Client
 * @throws {Error} if MIDTRANS_SERVER_KEY is missing
 */
export function getSnapClient() {
  const config = getMidtransConfig();
  if (!config.isConfigured) {
    throw new Error(
      "Konfigurasi Midtrans Server Key belum tersedia di server. Transaksi pembayaran tidak dapat diproses."
    );
  }

  if (!cachedSnapClient) {
    cachedSnapClient = new midtransClient.Snap({
      isProduction: config.isProduction,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    });
  }

  return cachedSnapClient;
}

/**
 * Returns an instance of Midtrans CoreApi Client (for server-side status checks & actions)
 * @throws {Error} if MIDTRANS_SERVER_KEY is missing
 */
export function getCoreApiClient() {
  const config = getMidtransConfig();
  if (!config.isConfigured) {
    throw new Error(
      "Konfigurasi Midtrans Server Key belum tersedia di server. Pemeriksaan status pembayaran tidak dapat diproses."
    );
  }

  if (!cachedCoreApiClient) {
    cachedCoreApiClient = new midtransClient.CoreApi({
      isProduction: config.isProduction,
      serverKey: config.serverKey,
      clientKey: config.clientKey,
    });
  }

  return cachedCoreApiClient;
}

let cachedIrisClient = null;

export function getIrisConfig() {
  const irisKey =
    process.env.MIDTRANS_IRIS_KEY?.trim() ||
    process.env.MIDTRANS_SERVER_KEY?.trim() ||
    "";
  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === "true" ||
    process.env.MIDTRANS_IS_PRODUCTION === "1";

  return {
    irisKey,
    isProduction,
    isConfigured: Boolean(irisKey && irisKey.length > 5),
  };
}

/**
 * Returns an instance of Midtrans Iris Client (for automated payouts/disbursements)
 */
export function getIrisClient() {
  const config = getIrisConfig();
  if (!config.isConfigured) {
    throw new Error(
      "Konfigurasi Midtrans Iris Key belum tersedia di server. Pencairan otomatis belum dapat diproses."
    );
  }

  if (!cachedIrisClient) {
    cachedIrisClient = new midtransClient.Iris({
      isProduction: config.isProduction,
      serverKey: config.irisKey,
    });
  }

  return cachedIrisClient;
}

/**
 * Automated disbursement/payout via Midtrans Iris
 * @param {Object} params
 * @param {string} [params.payoutId]
 * @param {string} params.beneficiaryName
 * @param {string} params.beneficiaryAccount
 * @param {string} params.beneficiaryBank
 * @param {string} [params.beneficiaryEmail]
 * @param {number|string} params.amount
 * @param {string} [params.notes]
 */
export async function createIrisPayout({
  payoutId,
  beneficiaryName,
  beneficiaryAccount,
  beneficiaryBank,
  beneficiaryEmail,
  amount,
  notes = "Pencairan Saldo Bantuin.id",
}) {
  const iris = getIrisClient();
  const bankCode = String(beneficiaryBank || "bca").toLowerCase();

  const payoutPayload = {
    payouts: [
      {
        beneficiary_name: beneficiaryName || "Penerima Dana Bantuin",
        beneficiary_account: String(beneficiaryAccount),
        beneficiary_bank: bankCode,
        beneficiary_email: beneficiaryEmail || "hellobantuinaja@gmail.com",
        amount: Math.round(Number(amount)).toFixed(2),
        notes: notes || `Payout Bantuin ${payoutId || ""}`,
      },
    ],
  };

  const createRes = await iris.createPayouts(payoutPayload);
  const refNos = createRes?.payouts?.map((p) => p.reference_no).filter(Boolean);
  if (refNos && refNos.length > 0) {
    await iris.approvePayouts({ reference_nos: refNos }).catch((err) => {
      console.warn("[Midtrans Iris Approve Payout Warning]:", err?.message);
    });
  }
  return createRes;
}

/**
 * Cancels an active or pending transaction via Midtrans Core API
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function cancelMidtransTransaction(orderId) {
  if (!orderId) {
    throw new Error("Order ID wajib disertakan untuk membatalkan transaksi di Midtrans.");
  }
  const core = getCoreApiClient();
  return await core.transaction.cancel(orderId);
}

/**
 * Fetches official transaction status via Midtrans Core API
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
export async function getMidtransTransactionStatus(orderId) {
  if (!orderId) {
    throw new Error("Order ID wajib disertakan untuk memeriksa status transaksi di Midtrans.");
  }
  const core = getCoreApiClient();
  return await core.transaction.status(orderId);
}

/**
 * Validates Midtrans webhook SHA-512 signature using constant-time comparison
 * Signature algorithm: SHA512(order_id + status_code + gross_amount + ServerKey)
 *
 * @param {Object} params
 * @param {string} params.orderId
 * @param {string|number} params.statusCode
 * @param {string|number} params.grossAmount
 * @param {string} params.receivedSignature
 * @returns {boolean}
 */
export function verifyMidtransWebhookSignature({
  orderId,
  statusCode,
  grossAmount,
  receivedSignature,
}) {
  const config = getMidtransConfig();
  if (!config.isConfigured || !config.serverKey || !receivedSignature || !orderId || !statusCode || !grossAmount) {
    return false;
  }

  try {
    const rawString = `${orderId}${statusCode}${grossAmount}${config.serverKey}`;
    const calculatedSignature = crypto
      .createHash("sha512")
      .update(rawString)
      .digest("hex");

    const calculatedBuffer = Buffer.from(calculatedSignature, "utf8");
    const receivedBuffer = Buffer.from(receivedSignature, "utf8");

    if (calculatedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Maps Midtrans transaction statuses to internal application payment status
 *
 * @param {string} transactionStatus
 * @param {string} [fraudStatus]
 * @returns {{"paymentStatus": "PAID"|"PENDING"|"FAILED"|"EXPIRED"|"CANCELLED"|"CHALLENGE"|"REFUNDED"|"UNKNOWN", "isSettled": boolean}}
 */
export function mapMidtransStatus(transactionStatus, fraudStatus) {
  const status = String(transactionStatus || "").toLowerCase();
  const fraud = String(fraudStatus || "").toLowerCase();

  switch (status) {
    case "capture":
      if (fraud === "challenge") {
        return { paymentStatus: "CHALLENGE", isSettled: false };
      }
      if (fraud === "deny") {
        return { paymentStatus: "FAILED", isSettled: false };
      }
      return { paymentStatus: "PAID", isSettled: true };

    case "settlement":
      return { paymentStatus: "PAID", isSettled: true };

    case "pending":
      return { paymentStatus: "PENDING", isSettled: false };

    case "deny":
      return { paymentStatus: "FAILED", isSettled: false };

    case "cancel":
      return { paymentStatus: "CANCELLED", isSettled: false };

    case "expire":
      return { paymentStatus: "EXPIRED", isSettled: false };

    case "refund":
    case "partial_refund":
      return { paymentStatus: "REFUNDED", isSettled: false };

    default:
      return { paymentStatus: "UNKNOWN", isSettled: false };
  }
}

export { MIDTRANS_PAYMENT_CHANNELS } from "../services/paymentService.js";

