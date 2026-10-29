import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/orders/[id]
 * Task 52: Detail lengkap status bilik transaksi untuk tracking order
 * 
 * Rules:
 * 1. Strict JWT Authentication & Anti-IDOR:
 *    - Only the requester, the assigned helper, or platform admin can view order room details.
 * 2. Fetches full transaction state including escrow status, payment proof, and timeline.
 */
export async function GET(req, { params }) {
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
          { midtransOrderId: id },
        ],
      },
      include: {
        request: {
          include: {
            bantuinPoint: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            campusName: true,
            ratingAvg: true,
            verificationStatus: true,
          },
        },
        helper: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            campusName: true,
            ratingAvg: true,
            completedHelpsCount: true,
            verificationStatus: true,
          },
        },
        chatMessages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
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

    // 3. Anti-IDOR Authorization Check
    const isRequester = orderRoom.requesterId === userProfile.id;
    const isHelper = orderRoom.helperId === userProfile.id;
    const isAdmin = userProfile.isAdmin;

    if (!isRequester && !isHelper && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda tidak terdaftar dalam transaksi ini." },
        { status: 403 }
      );
    }

    // 4. Return Order Details
    return NextResponse.json({
      success: true,
      data: {
        ...orderRoom,
        userRoleInOrder: isRequester ? "requester" : isHelper ? "helper" : "admin",
        isPaid: orderRoom.paymentStatus === "PAID",
        canSubmitProof: isHelper && orderRoom.paymentStatus === "PAID" && orderRoom.orderStatus !== "completed",
        canConfirmCompletion: (isRequester || isAdmin) && orderRoom.paymentStatus === "PAID" && orderRoom.orderStatus !== "completed",
      },
    });
  } catch (err) {
    console.error("[GET /api/orders/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil data pesanan." },
      { status: 500 }
    );
  }
}
