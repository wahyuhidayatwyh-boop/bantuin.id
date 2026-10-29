import { NextResponse } from "next/server";

/**
 * app/api/disbursements/route.js
 * DEPRECATED: Unprotected simulated disbursement endpoint has been removed.
 * Official disbursement execution must be done via authenticated /api/disbursements/execute.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Endpoint ini telah didepresiasi. Eksekusi pencairan saldo wajib menggunakan endpoint terproteksi /api/disbursements/execute.",
    },
    { status: 410 }
  );
}
