import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

/**
 * GET /api/admin/users
 * Task 97: Direktori seluruh akun pengguna platform dengan filter role untuk Superadmin
 */
export async function GET(req) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) {
      return adminCheck.response;
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const where = {};
    if (role && role !== "all") {
      if (role === "partner") {
        where.OR = [{ accountRole: "partner" }, { isPartner: true }];
      } else if (role === "provider") {
        where.OR = [
          { accountRole: "provider" },
          { accountRole: "helper" },
          { services: { some: {} } },
        ];
      } else {
        where.accountRole = role;
      }
    }
    if (status && status !== "all") {
      where.verificationStatus = status;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { partnerBusinessName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.profile.count({ where }),
      prisma.profile.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          avatarUrl: true,
          campusName: true,
          accountRole: true,
          isPartner: true,
          partnerBusinessName: true,
          partnerAddress: true,
          isAdmin: true,
          verificationStatus: true,
          ratingAvg: true,
          ratingCount: true,
          completedHelpsCount: true,
          createdAt: true,
          services: {
            select: {
              id: true,
              title: true,
              category: true,
              startingPrice: true,
              ratingAvg: true,
              completedOrders: true,
            },
          },
          rentals: {
            select: {
              id: true,
              title: true,
              category: true,
              dailyPrice: true,
              depositAmount: true,
              isAvailable: true,
              ratingAvg: true,
            },
          },
          _count: {
            select: {
              requesterOrderRooms: true,
              helperOrderRooms: true,
              services: true,
              rentals: true,
              renterBookings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((u) => ({
          ...u,
          ratingAvg: Number(u.ratingAvg),
          services: u.services.map((s) => ({
            ...s,
            startingPrice: Number(s.startingPrice),
            ratingAvg: Number(s.ratingAvg),
          })),
          rentals: u.rentals.map((r) => ({
            ...r,
            dailyPrice: Number(r.dailyPrice),
            depositAmount: Number(r.depositAmount),
            ratingAvg: Number(r.ratingAvg),
          })),
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/users error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar pengguna." },
      { status: 500 }
    );
  }
}
