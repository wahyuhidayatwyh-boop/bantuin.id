import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/admin/disputes
 * Task 94: Ambil daftar sengketa transaksi yang sedang aktif untuk Superadmin
 */
export async function GET(req) {
  try {
    // 1. Auth check from Header or Cookie
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/bantuin_auth_token=([^;]+)/) || cookieHeader.match(/bantuin_token=([^;]+)/);
      if (match) token = match[1];
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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat melihat daftar sengketa." },
        { status: 403 }
      );
    }

    // 2. Query Reports, Disputed Orders & Bookings from Real Database
    const [reports, disputedOrders, disputedBookings] = await Promise.all([
      prisma.report.findMany({
        include: {
          reporter: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          targetUser: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          targetRequest: { select: { id: true, title: true, category: true } },
          targetRental: { select: { id: true, title: true, category: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.orderRoom.findMany({
        where: { orderStatus: "disputed" },
        include: {
          request: { select: { id: true, title: true, category: true } },
          requester: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          helper: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.rentalBooking.findMany({
        where: { bookingStatus: "disputed" },
        include: {
          rental: { select: { id: true, title: true, category: true } },
          renter: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          owner: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalDisputes: reports.length + disputedOrders.length + disputedBookings.length,
        reports: reports.map((r) => ({
          ...r,
          type: "report",
        })),
        disputedOrders: disputedOrders.map((o) => ({
          ...o,
          type: "order",
          lockedAmount: Number(o.lockedAmount),
          helperPayoutAmount: Number(o.helperPayoutAmount),
        })),
        disputedBookings: disputedBookings.map((b) => ({
          ...b,
          type: "rental",
          rentalFee: Number(b.rentalFee),
          depositFee: Number(b.depositFee),
          totalAmount: Number(b.totalAmount),
        })),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/disputes error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar sengketa." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/disputes
 * Menghapus atau membersihkan sengketa pesanan/rental/laporan oleh Admin
 */
export async function DELETE(req) {
  try {
    // 1. Auth check
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/bantuin_auth_token=([^;]+)/) || cookieHeader.match(/bantuin_token=([^;]+)/);
      if (match) token = match[1];
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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat menghapus sengketa." },
        { status: 403 }
      );
    }

    // 2. Parse ID & Type
    const { searchParams } = new URL(req.url);
    const body = req.headers.get("content-type")?.includes("application/json") ? await req.json().catch(() => ({})) : {};
    const id = searchParams.get("id") || body.id;
    const type = searchParams.get("type") || body.type || "report";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Parameter 'id' wajib disertakan." },
        { status: 400 }
      );
    }

    // A. Check if it's a Report or Report ID
    const report = await prisma.report.findUnique({ where: { id } });
    if (report || type === "report") {
      if (report) {
        await prisma.$transaction(async (tx) => {
          await tx.report.delete({ where: { id } });
          await tx.auditLog.create({
            data: {
              actorId: adminProfile.id,
              actorEmail: adminProfile.email,
              action: "report.deleted",
              targetEntity: "reports",
              targetId: id,
              payload: { category: report.category, description: report.description },
            },
          });
        });
        return NextResponse.json({
          success: true,
          message: "Laporan berhasil dihapus secara permanen.",
        });
      }
    }

    // B. Check if it's an OrderRoom dispute
    const orderRoom = await prisma.orderRoom.findUnique({ where: { id }, include: { request: true } });
    if (orderRoom) {
      await prisma.$transaction(async (tx) => {
        const restoredOrderStatus = orderRoom.completedAt
          ? "completed"
          : orderRoom.proofSubmittedAt
            ? "proof_submitted"
            : orderRoom.startedAt
              ? "item_picked_up"
              : "room_created";
        const restoredRequestStatus = orderRoom.completedAt
          ? "completed"
          : orderRoom.proofSubmittedAt
            ? "awaiting_confirmation"
            : "in_progress";
        await tx.orderRoom.update({
          where: { id },
          data: {
            orderStatus: restoredOrderStatus,
            disputeReason: null,
            disputeOpenedBy: null,
          },
        });

        // Also restore request status if it was disputed
        if (orderRoom.requestId) {
          await tx.request.update({
            where: { id: orderRoom.requestId },
            data: { status: restoredRequestStatus },
          });
        }

        // Record AuditLog
        await tx.auditLog.create({
          data: {
            actorId: adminProfile.id,
            actorEmail: adminProfile.email,
            action: "dispute.dismissed",
            targetEntity: "order_rooms",
            targetId: id,
            payload: { previousStatus: "disputed", newStatus },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Sengketa pesanan berhasil diselesaikan dan dihapus dari antrean.",
      });
    }

    // C. Check if it's a RentalBooking dispute
    const booking = await prisma.rentalBooking.findUnique({ where: { id } });
    if (booking) {
      await prisma.$transaction(async (tx) => {
        await tx.rentalBooking.update({
          where: { id },
          data: {
            bookingStatus: "verified_settled",
            depositDeductionReason: null,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId: adminProfile.id,
            actorEmail: adminProfile.email,
            action: "dispute.dismissed",
            targetEntity: "rental_bookings",
            targetId: id,
            payload: { previousStatus: "disputed", newStatus: "verified_settled" },
          },
        });
      });

      return NextResponse.json({
        success: true,
        message: "Sengketa sewa barang berhasil diselesaikan dan dihapus dari antrean.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Data sengketa atau laporan tidak ditemukan." },
      { status: 404 }
    );
  } catch (err) {
    console.error("[DELETE /api/admin/disputes error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus sengketa." },
      { status: 500 }
    );
  }
}
