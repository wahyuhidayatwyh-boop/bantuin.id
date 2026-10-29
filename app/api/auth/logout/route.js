import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Task 45: Logout akun & pembersihan sesi
 */
export async function POST(req) {
  try {
    const response = NextResponse.json({
      success: true,
      message: "Sesi akun Anda berhasil diakhiri.",
    });

    // Clear session cookies if present
    response.cookies.set("sb-access-token", "", { maxAge: 0, path: "/" });
    response.cookies.set("sb-refresh-token", "", { maxAge: 0, path: "/" });
    response.cookies.set("bantuin_token", "", { maxAge: 0, path: "/" });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Gagal logout." },
      { status: 500 }
    );
  }
}
