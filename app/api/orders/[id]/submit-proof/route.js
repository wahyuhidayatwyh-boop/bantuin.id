import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/orders/[id]/submit-proof
 * Task 28: Upload bukti pengerjaan tugas & checkpoint penyelesaian oleh Helper
 * 
 * Rules:
 * 1. Strict JWT Authentication: Only the assigned helper can submit completion proof.
 * 2. Escrow Validation: Order paymentStatus must be 'PAID'.
 * 3. Terminal Status Guard: Cannot submit proof for cancelled/completed orders.
 * 4. Updates orderStatus to 'proof_submitted' and sets a 24-hour auto-approval deadline.
 * 5. Sends automatic chat notification and user notification.
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
      },
    });

    if (!orderRoom) {
      return NextResponse.json(
        { success: false, error: "Bilik transaksi pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    // 3. Authorization (Must be assigned helper)
    if (orderRoom.helperId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya helper yang ditugaskan yang dapat mengunggah bukti pengerjaan." },
        { status: 403 }
      );
    }

    // 4. Payment Escrow Guard
    if (orderRoom.paymentStatus !== "PAID") {
      return NextResponse.json(
        {
          success: false,
          error: "Bukti pengerjaan belum dapat diunggah karena dana pembayaran escrow belum dilunasi oleh pemohon.",
        },
        { status: 400 }
      );
    }

    // 5. Terminal State Guard
    if (orderRoom.orderStatus === "completed" || orderRoom.orderStatus === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: `Pesanan sudah dalam status '${orderRoom.orderStatus}' dan tidak dapat menerima bukti pengerjaan lagi.`,
        },
        { status: 400 }
      );
    }

    // 6. Parse Body
    const body = await req.json().catch(() => ({}));
    const { proofPhotoUrls = [], proofNotes = "" } = body;

    const urls = Array.isArray(proofPhotoUrls) ? proofPhotoUrls : proofPhotoUrls ? [proofPhotoUrls] : [];

    // 7. Atomic Update
    const autoApproveDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam ke depan

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.orderRoom.update({
        where: { id: orderRoom.id },
        data: {
          proofPhotoUrls: urls,
          proofNotes: proofNotes ? proofNotes.trim() : null,
          proofSubmittedAt: new Date(),
          autoApproveDeadline: autoApproveDeadline,
          orderStatus: "proof_submitted",
        },
      });

      // Update Request status to awaiting_confirmation
      await tx.request.update({
        where: { id: orderRoom.requestId },
        data: { status: "awaiting_confirmation" },
      });

      // System Chat Message
      await tx.chatMessage.create({
        data: {
          orderRoomId: orderRoom.id,
          senderId: userProfile.id,
          message: `Helper telah mengirimkan bukti penyelesaian tugas! Pemohon harap meninjau dan menekan tombol 'Konfirmasi Selesai' untuk melepaskan dana escrow. (Batas auto-approve: 24 jam).`,
          attachmentUrls: urls,
          hasWarningFlag: false,
        },
      });

      // Notification for Requester
      await tx.notification.create({
        data: {
          userId: orderRoom.requesterId,
          title: "Tugas Selesai Dikerjakan!",
          message: `Helper telah mengunggah bukti pengerjaan untuk '${orderRoom.request?.title || "tugas Anda"}'. Silakan periksa dan konfirmasi selesai.`,
          type: "order",
          link: `/chat?room=${orderRoom.id}`,
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      message: "Bukti pengerjaan tugas berhasil diunggah. Menunggu konfirmasi pemohon.",
      data: updatedOrder,
    });
  } catch (err) {
    console.error("[POST /api/orders/[id]/submit-proof error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengunggah bukti pengerjaan." },
      { status: 500 }
    );
  }
}
