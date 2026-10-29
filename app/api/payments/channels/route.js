import { NextResponse } from "next/server";
import { MIDTRANS_PAYMENT_CHANNELS } from "@/lib/midtrans/client";

/**
 * GET /api/payments/channels
 * Task 55: Ambil daftar channel pembayaran aktif Midtrans (QRIS, VA, E-Wallet) & admin fee
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        provider: "midtrans",
        channels: MIDTRANS_PAYMENT_CHANNELS.map((ch) => ({
          ...ch,
          adminFee: 0,
          feeText: "Bebas Biaya Admin",
          isAvailable: true,
        })),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar channel pembayaran." },
      { status: 500 }
    );
  }
}
