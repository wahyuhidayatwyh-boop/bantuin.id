import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, buildUserPayload } from "@/lib/auth/session";

/**
 * GET /api/auth/me
 * Mengambil profil lengkap user yang sedang aktif (Session Me) dari database
 */
export async function GET(req) {
  try {
    const auth = await requireAuth(req, { allowSuspended: true });
    if (auth.error) return auth.error;

    const userProfile = auth.profile;

    // Hitung statistik transaksi riil
    const [completedRequestsCount, completedBookingsCount] = await Promise.all([
      prisma.request.count({
        where: {
          OR: [
            { requesterId: userProfile.id, status: "completed" },
            { selectedHelperId: userProfile.id, status: "completed" },
          ],
        },
      }).catch(() => 0),
      prisma.rentalBooking.count({
        where: {
          OR: [
            { renterId: userProfile.id, bookingStatus: "verified_settled" },
            { ownerId: userProfile.id, bookingStatus: "verified_settled" },
          ],
        },
      }).catch(() => 0),
    ]);

    const totalCompleted = completedRequestsCount + completedBookingsCount;
    const userPayload = buildUserPayload({
      ...userProfile,
      completedHelpsCount: totalCompleted > 0 ? totalCompleted : (userProfile.completedHelpsCount || 0),
    });

    return NextResponse.json({
      success: true,
      message: "Profil user aktif berhasil diambil.",
      data: userPayload,
      user: userPayload,
    });
  } catch (error) {
    console.error("GET /api/auth/me Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server saat memuat profil." },
      { status: 500 }
    );
  }
}
