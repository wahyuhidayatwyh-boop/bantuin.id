import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/admin/withdrawals
 * Task 92: Ambil daftar antrean permohonan penarikan dana payout pengguna untuk Superadmin
 * 
 * Rules:
 * 1. Strict Admin Authorization.
 * 2. Filter by status (pending, approved, completed, failed, all).
 * 3. Search by ownerName or destinationAccount.
 * 4. Pagination support.
 */
export async function GET(req) {
  try {
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

    const adminProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!adminProfile || !adminProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat melihat daftar penarikan dana." },
        { status: 403 }
      );
    }

    // 2. Query Params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { ownerName: { contains: search, mode: "insensitive" } },
        { destinationAccount: { contains: search, mode: "insensitive" } },
        { destinationHolder: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, withdrawals] = await Promise.all([
      prisma.withdrawal.count({ where }),
      prisma.withdrawal.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              verificationStatus: true,
              payoutBank: true,
              payoutAccountNumber: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/withdrawals error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar penarikan dana." },
      { status: 500 }
    );
  }
}
