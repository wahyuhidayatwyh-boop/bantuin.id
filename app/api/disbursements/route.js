import { NextResponse } from "next/server";
import { XenditService } from "@/lib/xendit";

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderRoomId, amount, helperId, bankCode, accountNumber } = body;

    // Trigger disbursement
    const result = await XenditService.triggerDisbursement({
      externalId: `DISB-${orderRoomId}-${Date.now()}`,
      amount,
      bankCode: bankCode || "BCA",
      accountHolderName: "Helper Bantuin",
      accountNumber: accountNumber || "1234567890",
      description: `Pencairan dana tugas Bantuin #${orderRoomId}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Disbursement failed" },
      { status: 500 }
    );
  }
}
