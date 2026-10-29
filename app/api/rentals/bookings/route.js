import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/session";

/**
 * GET /api/rentals/bookings
 * Task 60: Ambil daftar reservasi sewa (penyewa & pemilik)
 */
export async function GET(req) {
  try {
    // 1. Auth check
    const token = extractBearerToken(req);

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

    // 2. Query Params
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "all"; // 'renter', 'owner', 'all'
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = {};

    if (role === "renter") {
      where.renterId = userProfile.id;
    } else if (role === "owner") {
      where.OR = [
        { ownerId: userProfile.id },
        { rental: { ownerId: userProfile.id } },
      ];
    } else {
      where.OR = [
        { renterId: userProfile.id },
        { ownerId: userProfile.id },
        { rental: { ownerId: userProfile.id } },
      ];
    }

    if (status && status !== "all") {
      where.bookingStatus = status;
    }

    const [total, bookings] = await Promise.all([
      prisma.rentalBooking.count({ where }),
      prisma.rentalBooking.findMany({
        where,
        include: {
          rental: {
            select: {
              id: true,
              title: true,
              category: true,
              dailyPrice: true,
              depositAmount: true,
              photoUrls: true,
              pickupLocation: true,
            },
          },
          renter: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              avatarUrl: true,
              campusName: true,
            },
          },
          owner: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              avatarUrl: true,
              campusName: true,
              isPartner: true,
              partnerBusinessName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Fetch corresponding order rooms so Mitra/Renter can navigate straight to the chat room
    const midtransIds = bookings.map((b) => b.midtransOrderId).filter(Boolean);
    const bookingIds = bookings.map((b) => b.id).filter(Boolean);
    const roomOrConditions = [
      ...(midtransIds.length > 0 ? [{ midtransOrderId: { in: midtransIds } }] : []),
      ...bookingIds.map((bId) => ({
        request: {
          description: { contains: `[BOOKING_ID:${bId}]` },
        },
      })),
    ];
    const orderRooms =
      roomOrConditions.length > 0
        ? await prisma.orderRoom.findMany({
            where: { OR: roomOrConditions },
            select: {
              id: true,
              midtransOrderId: true,
              request: { select: { description: true } },
            },
          })
        : [];
    const roomByMidtransMap = new Map();
    const roomByBookingIdMap = new Map();
    for (const r of orderRooms) {
      if (r.midtransOrderId) roomByMidtransMap.set(r.midtransOrderId, r.id);
      const bMatch = r.request?.description?.match(/\[BOOKING_ID:([0-9a-f-]{36})\]/i);
      if (bMatch?.[1]) roomByBookingIdMap.set(bMatch[1], r.id);
    }

    const formatted = bookings.map((b) => ({
      ...b,
      orderRoomId: roomByBookingIdMap.get(b.id) || roomByMidtransMap.get(b.midtransOrderId) || null,
      rentalFee: Number(b.rentalFee),
      depositFee: Number(b.depositFee),
      totalAmount: Number(b.totalAmount),
      depositRefundAmount: b.depositRefundAmount ? Number(b.depositRefundAmount) : null,
      isRenter: b.renterId === userProfile.id,
      isOwner: b.ownerId === userProfile.id,
    }));

    return NextResponse.json({
      success: true,
      data: {
        bookings: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/rentals/bookings error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar reservasi sewa." },
      { status: 500 }
    );
  }
}
