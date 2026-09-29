import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/auth/me
 * Mengambil profil lengkap user yang sedang aktif (Session Me) dari database
 */
export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Token otentikasi tidak ditemukan." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid atau telah kedaluwarsa." },
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
        { success: false, error: "Profil pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

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

    const data = {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.fullName || "",
      phoneNumber: userProfile.phoneNumber || "",
      avatarUrl: userProfile.avatarUrl && !userProfile.avatarUrl.includes("images.unsplash.com") ? userProfile.avatarUrl : null,
      bio: userProfile.bio || "",
      campusName: userProfile.campusName || "Bekasi Barat, Kota Bekasi",
      accountRole: userProfile.accountRole || "user",
      isPartner: userProfile.isPartner || false,
      isAdmin: userProfile.isAdmin || false,
      partnerBusinessName: userProfile.partnerBusinessName || "",
      partnerAddress: userProfile.partnerAddress || "",
      verificationStatus: userProfile.verificationStatus || "unverified",
      idNumber: userProfile.idNumber || "",
      idCardUrl: userProfile.idCardUrl || null,
      selfieUrl: userProfile.selfieUrl || null,
      payoutBank: userProfile.payoutBank || "",
      payoutAccountNumber: userProfile.payoutAccountNumber || "",
      payoutAccountHolder: userProfile.payoutAccountHolder || "",
      authProvider: userProfile.authProvider || (userProfile.password ? "local" : "google"),
      hasPassword: Boolean(userProfile.password),
      ratingAvg: Number(userProfile.ratingAvg) || 5.0,
      ratingCount: userProfile.ratingCount || 0,
      completedHelpsCount: totalCompleted > 0 ? totalCompleted : (userProfile.completedHelpsCount || 0),
      reliabilityScore: userProfile.reliabilityScore || 100,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: "Profil user aktif berhasil diambil.",
      data,
      user: data,
    });
  } catch (error) {
    console.error("GET /api/auth/me Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server saat memuat profil." },
      { status: 500 }
    );
  }
}
