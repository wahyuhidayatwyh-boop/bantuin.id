import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

async function verifyAdminAuth(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Akses ditolak. Token tidak disediakan.", status: 401 };
  }
  const token = authHeader.substring(7).trim();
  const decoded = verifyAccessToken(token);
  if (!decoded || (!decoded.id && !decoded.email)) {
    return { error: "Sesi tidak valid atau telah berakhir.", status: 401 };
  }

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        ...(decoded.id ? [{ id: decoded.id }] : []),
        ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
      ],
    },
  });

  if (!profile || !profile.isAdmin) {
    return { error: "Akses ditolak. Hanya Administrator yang dapat mengakses data pesanan.", status: 403 };
  }

  return { profile };
}

/**
 * GET /api/admin/orders
 * Mengambil daftar transaksi pesanan riil platform (OrderRoom & RentalBooking)
 */
export async function GET(req) {
  try {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // all | task | service | rental
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const queryOrders = type === "all" || type === "task" || type === "service";
    const queryRentals = type === "all" || type === "rental";

    const [orderRooms, rentalBookings] = await Promise.all([
      queryOrders
        ? prisma.orderRoom.findMany({
            include: {
              request: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                  mode: true,
                  rewardAmount: true,
                  locationName: true,
                },
              },
              requester: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  avatarUrl: true,
                },
              },
              helper: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : Promise.resolve([]),
      queryRentals
        ? prisma.rentalBooking.findMany({
            include: {
              rental: {
                select: {
                  id: true,
                  title: true,
                  category: true,
                  pickupLocation: true,
                },
              },
              renter: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  avatarUrl: true,
                },
              },
              owner: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
          })
        : Promise.resolve([]),
    ]);

    // Map OrderRoom to normalized structure
    const mappedOrders = orderRooms.map((o) => {
      const lockedAmount = Number(o.lockedAmount || 0);
      const platformFee = Number(o.platformFee || Math.round(lockedAmount * 0.08));
      const helperPayout = Number(o.helperPayoutAmount || (lockedAmount - platformFee));
      
      // Determine stage
      let stage = "in_progress";
      if (o.orderStatus === "completed") stage = "completed";
      else if (o.orderStatus === "disputed") stage = "disputed";
      else if (o.orderStatus === "cancelled") stage = "cancelled";
      else if (o.paymentStatus === "PAID") stage = "paid_escrow";

      return {
        id: o.id,
        requestId: o.requestId,
        orderType: o.request?.category?.toLowerCase().includes("jasa") ? "service" : "task",
        requestTitle: o.request?.title || "Pesanan Bantuan",
        category: o.request?.category || "Bantuan",
        requester: {
          id: o.requester?.id,
          name: o.requester?.fullName || "Pelanggan",
          email: o.requester?.email,
          phone: o.requester?.phoneNumber,
          avatar: o.requester?.avatarUrl,
        },
        helper: {
          id: o.helper?.id,
          name: o.helper?.fullName || "Mitra Helper",
          email: o.helper?.email,
          phone: o.helper?.phoneNumber,
          avatar: o.helper?.avatarUrl,
        },
        totalAmount: lockedAmount,
        platformFee,
        mitraNet: helperPayout,
        depositFee: 0,
        paymentStatus: o.paymentStatus,
        stage,
        disputeReason: o.disputeReason,
        isDisputed: o.orderStatus === "disputed",
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
    });

    // Map RentalBooking to normalized structure
    const mappedRentals = rentalBookings.map((b) => {
      const rentalFee = Number(b.rentalFee || 0);
      const depositFee = Number(b.depositFee || 0);
      const totalAmount = Number(b.totalAmount || (rentalFee + depositFee));
      const platformFee = Math.round(rentalFee * 0.08);
      const ownerNet = rentalFee - platformFee;

      let stage = "in_progress";
      if (b.bookingStatus === "verified_settled") stage = "completed";
      else if (b.bookingStatus === "disputed") stage = "disputed";
      else if (b.bookingStatus === "cancelled") stage = "cancelled";
      else if (b.paymentStatus === "PAID") stage = "paid_escrow";

      return {
        id: b.id,
        rentalId: b.rentalId,
        orderType: "rental",
        requestTitle: b.rental?.title || "Sewa Alat",
        category: b.rental?.category || "Sewa",
        requester: {
          id: b.renter?.id,
          name: b.renter?.fullName || "Penyewa",
          email: b.renter?.email,
          phone: b.renter?.phoneNumber,
          avatar: b.renter?.avatarUrl,
        },
        helper: {
          id: b.owner?.id,
          name: b.owner?.fullName || "Pemilik Rental",
          email: b.owner?.email,
          phone: b.owner?.phoneNumber,
          avatar: b.owner?.avatarUrl,
        },
        totalAmount,
        platformFee,
        mitraNet: ownerNet,
        depositFee,
        paymentStatus: b.paymentStatus,
        stage,
        isDisputed: b.bookingStatus === "disputed",
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      };
    });

    let combined = [...mappedOrders, ...mappedRentals];

    // Sort by createdAt desc
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Filter by status if requested
    if (status && status !== "all") {
      combined = combined.filter((item) => {
        if (status === "completed") return item.stage === "completed";
        if (status === "paid_escrow") return item.stage === "paid_escrow";
        if (status === "in_progress") return item.stage === "in_progress";
        if (status === "dispute") return item.stage === "disputed" || item.isDisputed;
        if (status === "cancelled") return item.stage === "cancelled";
        return true;
      });
    }

    // Filter by search
    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.requestTitle.toLowerCase().includes(q) ||
          (o.requester?.name || "").toLowerCase().includes(q) ||
          (o.helper?.name || "").toLowerCase().includes(q)
      );
    }

    const total = combined.length;
    const paginated = combined.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        orders: paginated,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/orders Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil daftar pesanan." },
      { status: 500 }
    );
  }
}
