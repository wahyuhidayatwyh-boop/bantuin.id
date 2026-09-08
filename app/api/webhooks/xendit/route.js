import { NextResponse } from "next/server";
import { XenditService } from "@/lib/xendit";

export async function POST(request) {
  try {
    const callbackToken = request.headers.get("x-callback-token");
    const expectedToken = process.env.XENDIT_WEBHOOK_VERIFICATION_TOKEN;

    // 1. Verify Webhook Signature
    const isValid = XenditService.verifyWebhookSignature(callbackToken, expectedToken);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid webhook token or signature" },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const { id, external_id, status, paid_amount } = payload;

    // 2. Idempotency Check & Logging
    console.log(`[Xendit Webhook Received] ID: ${id}, ExternalID: ${external_id}, Status: ${status}, Amount: ${paid_amount}`);

    // In live DB: Update order_rooms or rental_bookings payment status
    return NextResponse.json({
      received: true,
      id,
      status: "PROCESSED",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Xendit Webhook Error]:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
