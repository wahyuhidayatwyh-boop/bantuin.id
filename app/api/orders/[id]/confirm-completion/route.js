import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/orders/[id]/confirm-completion
 * Task 29: Konfirmasi selesai oleh pemohon & pelepasan saldo escrow ke Helper
 * 
 * Rules:
 * 1. Strict JWT Authentication & Anti-IDOR:
 *    - Only the requester (order owner) or platform admin can confirm completion.
 * 2. Escrow Validation:
 *    - Order paymentStatus must be 'PAID'.
 * 3. Terminal State Guard:
 *    - Cannot complete orders that are already completed or cancelled.
 * 4. Atomic Transaction:
 *    - Marks OrderRoom as 'completed', sets completedAt.
 *    - Updates Request status to 'completed'.
 *    - Increments helper's completedHelpsCount.
 *    - Writes immutable audit log for escrow release.
 *    - Sends system chat message and push notification to helper.
 */
export async function POST(req, { params }) {
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

    // 2. Query OrderRoom
    const orderRoom = await prisma.orderRoom.findFirst({
      where: {
        OR: [
          { id },
          { requestId: id },
        ],
      },
      include: {
        request: true,
        helper: {
          select: {
            id: true,
            fullName: true,
            email: true,
            completedHelpsCount: true,
          },
        },
      },
    });

    if (!orderRoom) {
      return NextResponse.json(
        { success: false, error: "Bilik transaksi pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    // 3. Authorization (Requester or Admin)
    const isRequester = orderRoom.requesterId === userProfile.id;
    const isAdmin = userProfile.isAdmin;

    if (!isRequester && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya pemohon tugas atau admin yang dapat mengonfirmasi penyelesaian." },
        { status: 403 }
      );
    }

    // 4. Escrow Guard
    if (orderRoom.paymentStatus !== "PAID") {
      return NextResponse.json(
        {
          success: false,
          error: "Penyelesaian tugas tidak dapat dikonfirmasi karena pembayaran escrow belum dilunasi.",
        },
        { status: 400 }
      );
    }

    // 5. Terminal State Guard
    if (orderRoom.orderStatus === "completed") {
      return NextResponse.json({
        success: true,
        message: "Pesanan ini sudah dikonfirmasi selesai sebelumnya.",
        data: orderRoom,
      });
    }

    if (orderRoom.orderStatus === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Pesanan telah dibatalkan dan tidak dapat dikonfirmasi selesai.",
        },
        { status: 400 }
      );
    }

    // 5.5. Rental Handover Guard (if this OrderRoom is linked to a RentalBooking)
    const bookingIdMatch = orderRoom.request?.description?.match(/\[BOOKING_ID:([0-9a-f-]{36})\]/i);
    if (bookingIdMatch?.[1] && !isAdmin) {
      const linkedBooking = await prisma.rentalBooking.findUnique({
        where: { id: bookingIdMatch[1] },
      }).catch(() => null);
      if (
        linkedBooking &&
        !["handed_over", "in_use", "returned", "verified_settled"].includes(linkedBooking.bookingStatus) &&
        !["item_picked_up", "task_delivered", "proof_submitted", "completed"].includes(orderRoom.orderStatus)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Pesanan sewa tidak dapat diselesaikan sebelum tahapan serah terima barang terpenuhi.",
          },
          { status: 400 }
        );
      }
    }

    const completedAt = new Date();
    const helperPayout = Number(orderRoom.helperPayoutAmount || orderRoom.lockedAmount || 0);
    const serviceIdMatch = orderRoom.request?.description?.match(/\[SERVICE_ID:([0-9a-f-]{36})\]/i);

    // 6. Atomic Transaction for Escrow Release (with row-level lock to prevent concurrent completion races)
    const txOutcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM order_rooms WHERE id = ${orderRoom.id}::uuid FOR UPDATE`;

      const freshRoom = await tx.orderRoom.findUnique({
        where: { id: orderRoom.id },
      });

      if (!freshRoom) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (freshRoom.orderStatus === "completed") {
        return { alreadyCompleted: true, order: freshRoom };
      }

      if (freshRoom.orderStatus === "cancelled") {
        throw new Error("ORDER_CANCELLED");
      }

      // a. Update OrderRoom status
      const updatedOrder = await tx.orderRoom.update({
        where: { id: orderRoom.id },
        data: {
          orderStatus: "completed",
          completedAt: completedAt,
        },
      });

      // b. Update Request status
      await tx.request.update({
        where: { id: orderRoom.requestId },
        data: { status: "completed" },
      });

      // c. Increment Helper completedHelpsCount
      await tx.profile.update({
        where: { id: orderRoom.helperId },
        data: {
          completedHelpsCount: { increment: 1 },
        },
      });

      // c2. Increment Service completedOrders only upon actual completion
      if (serviceIdMatch?.[1]) {
        await tx.service.update({
          where: { id: serviceIdMatch[1] },
          data: { completedOrders: { increment: 1 } },
        }).catch(() => null);
      }

      // d. Record immutable AuditLog
      await tx.auditLog.create({
        data: {
          actorId: userProfile.id,
          actorEmail: userProfile.email,
          action: "order.escrow_released",
          targetEntity: "order_rooms",
          targetId: orderRoom.id,
          payload: {
            requestId: orderRoom.requestId,
            helperId: orderRoom.helperId,
            lockedAmount: Number(orderRoom.lockedAmount),
            platformFee: Number(orderRoom.platformFee),
            helperPayoutAmount: helperPayout,
            confirmedBy: isRequester ? "requester" : "admin",
          },
        },
      });

      // e. System Chat Message
      await tx.chatMessage.create({
        data: {
          orderRoomId: orderRoom.id,
          senderId: userProfile.id,
          message: `Tugas resmi diselesaikan! Pemohon telah mengonfirmasi penyelesaian. Dana pengerjaan sebesar Rp ${helperPayout.toLocaleString("id-ID")} telah resmi dilepaskan ke saldo dompet helper. Terima kasih!`,
          hasWarningFlag: false,
        },
      });

      // f. Notification for Helper
      await tx.notification.create({
        data: {
          userId: orderRoom.helperId,
          title: "Dana Escrow Dilepaskan!",
          message: `Selamat! Tugas '${orderRoom.request?.title || "Pesanan"}' telah selesai dikonfirmasi. Saldo sebesar Rp ${helperPayout.toLocaleString("id-ID")} telah ditambahkan ke dompet Anda dan siap ditarik.`,
          type: "payment",
          link: `/activity`,
        },
      });

      return { alreadyCompleted: false, order: updatedOrder };
    });

    if (txOutcome.alreadyCompleted) {
      return NextResponse.json({
        success: true,
        idempotent: true,
        message: "Pesanan ini sudah dikonfirmasi selesai sebelumnya.",
        data: txOutcome.order,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil diselesaikan dan dana escrow telah dilepaskan ke helper.",
      data: txOutcome.order,
    });
  } catch (err) {
    console.error("[POST /api/orders/[id]/confirm-completion error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengonfirmasi penyelesaian pesanan." },
      { status: 500 }
    );
  }
}
