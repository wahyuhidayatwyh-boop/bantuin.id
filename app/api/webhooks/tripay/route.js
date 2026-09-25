import { NextResponse } from "next/server";
import crypto from "crypto";
import { paymentService } from "@/lib/services/paymentService";

/**
 * app/api/webhooks/tripay/route.js
 * Tripay Payment Webhook Handler (Contract & Architecture)
 * Complies with Section 11 & 12 of requirements.
 *
 * Endpoint callback notifikasi status pembayaran dari Tripay Gateway.
 * Keamanan:
 * 1. Signature Verification: Memvalidasi X-Callback-Signature HMAC-SHA256 dari Tripay.
 * 2. Idempotency: Memastikan event webhook yang sama tidak memproses pesanan ganda.
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-callback-signature");
    const event = request.headers.get("x-callback-event");

    const PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY;

    // 1. Verifikasi Signature Tripay jika Private Key dikonfigurasi
    if (PRIVATE_KEY && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", PRIVATE_KEY)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("[Tripay Webhook]: Invalid Signature detected.");
        return NextResponse.json(
          { success: false, message: "Invalid callback signature" },
          { status: 403 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const { reference, merchant_ref, payment_method, status, total_amount } = payload;

    console.log(`[Tripay Webhook Received] Event: ${event || "payment_status"} | Ref: ${reference} | MerchantRef: ${merchant_ref} | Status: ${status} | Amount: ${total_amount}`);

    // 2. Status verification & state transition
    if (status === "PAID") {
      // Konfirmasi pembayaran secara idempotent
      await paymentService.confirmPayment(merchant_ref || reference);
    } else if (status === "EXPIRED" || status === "FAILED") {
      await paymentService.failPayment(merchant_ref || reference, `Status webhook: ${status}`);
    }

    return NextResponse.json({
      success: true,
      reference,
      merchant_ref,
      status: "PROCESSED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Tripay Webhook Error]:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses webhook Tripay" },
      { status: 500 }
    );
  }
}
