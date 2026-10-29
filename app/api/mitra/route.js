import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/mitra
 * Task 70: Direktori semua mitra toko rental terverifikasi kampus
 * 
 * Query Params:
 * - campus: Filter kampus terdekat
 * - search: Keyword nama toko mitra atau alamat
 * - page, limit: Pagination
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = {
      OR: [{ isPartner: true }, { accountRole: "partner" }],
    };

    if (campus) {
      where.campusName = { contains: campus, mode: "insensitive" };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { partnerBusinessName: { contains: search, mode: "insensitive" } },
            { partnerAddress: { contains: search, mode: "insensitive" } },
            { fullName: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [total, mitraList] = await Promise.all([
      prisma.profile.count({ where }),
      prisma.profile.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          avatarUrl: true,
          bio: true,
          campusName: true,
          isPartner: true,
          partnerBusinessName: true,
          partnerAddress: true,
          verificationStatus: true,
          ratingAvg: true,
          ratingCount: true,
          reliabilityScore: true,
          responseTimeMinutes: true,
          rentals: {
            where: { isAvailable: true },
            select: {
              id: true,
              title: true,
              category: true,
              dailyPrice: true,
              photoUrls: true,
            },
            take: 4,
          },
          _count: {
            select: {
              rentals: true,
              ownerBookings: true,
            },
          },
        },
        orderBy: [{ ratingAvg: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const formatted = mitraList.map((m) => ({
      ...m,
      businessName: m.partnerBusinessName || m.fullName,
      ratingAvg: Number(m.ratingAvg),
      totalRentalItems: m._count.rentals,
      totalOrdersCompleted: m._count.ownerBookings,
      previewItems: m.rentals.map((r) => ({
        ...r,
        dailyPrice: Number(r.dailyPrice),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        mitra: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/mitra error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil direktori mitra." },
      { status: 500 }
    );
  }
}
