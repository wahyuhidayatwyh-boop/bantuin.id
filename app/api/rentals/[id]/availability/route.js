import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PATCH /api/rentals/[id]/availability
 * Task 59: Toggle status ketersediaan barang sewa (Tersedia / Sedang Disewa)
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    // 1. Auth check
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi otentikasi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const userProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil akun tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Find Rental
    const rental = await prisma.rental.findUnique({
      where: { id },
    });

    if (!rental) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (rental.ownerId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pemilik dari barang sewa ini." },
        { status: 403 }
      );
    }

    // 3. Toggle or Set
    const body = await req.json().catch(() => ({}));
    const nextAvailability = body.isAvailable !== undefined ? Boolean(body.isAvailable) : !rental.isAvailable;

    const updated = await prisma.rental.update({
      where: { id },
      data: { isAvailable: nextAvailability },
    });

    return NextResponse.json({
      success: true,
      message: `Status ketersediaan berhasil diubah menjadi: ${nextAvailability ? "Tersedia" : "Tidak Tersedia"}.`,
      data: {
        id: updated.id,
        isAvailable: updated.isAvailable,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/rentals/[id]/availability error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui ketersediaan barang sewa." },
      { status: 500 }
    );
  }
}
