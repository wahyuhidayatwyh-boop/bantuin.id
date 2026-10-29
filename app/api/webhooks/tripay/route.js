import { NextResponse } from "next/server";

/**
 * app/api/webhooks/tripay/route.js
 * DEPRECATED: Tripay webhook is deactivated. Midtrans is the active gateway.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Tripay webhook listener is deprecated. Webhook resmi dialihkan ke /api/webhooks/midtrans.",
    },
    { status: 410 }
  );
}
