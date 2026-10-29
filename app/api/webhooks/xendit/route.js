import { NextResponse } from "next/server";

/**
 * app/api/webhooks/xendit/route.js
 * DEPRECATED: Xendit webhook listener is deactivated.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Xendit webhook listener is deprecated. Payment gateway resmi Bantuin.id adalah Midtrans.",
    },
    { status: 410 }
  );
}
