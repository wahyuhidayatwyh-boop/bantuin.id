import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/reports
 * Task 36: Pengajuan laporan pelanggaran / pembukaan sengketa transaksi
 */
export async function POST(req) {
  try {
    // 1. Auth check from Authorization header or Cookie
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

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      targetUserId,
      targetRoomId,
      targetRequestId,
      targetRentalId,
      targetName,
      category = "penipuan",
      description,
      evidenceUrls = [],
    } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "Deskripsi rincian laporan wajib diisi." },
        { status: 400 }
      );
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = (val) => typeof val === "string" && UUID_REGEX.test(val.trim());

    let resolvedTargetUserId = isValidUuid(targetUserId) ? targetUserId.trim() : null;
    let resolvedTargetRequestId = isValidUuid(targetRequestId) ? targetRequestId.trim() : null;
    let resolvedTargetRentalId = isValidUuid(targetRentalId) ? targetRentalId.trim() : null;
    let isAuthorizedTransactionParticipant = Boolean(userProfile.isAdmin);

    // Jika diberikan targetRoomId atau orderId, cari relasi di order_rooms atau rental_bookings
    const orderId = body.orderId || targetRoomId;
    if (orderId && isValidUuid(orderId)) {
      const room = await prisma.orderRoom.findUnique({
        where: { id: orderId.trim() },
        include: { request: true },
      }).catch(() => null);

      if (room) {
        if (room.requesterId === userProfile.id || room.helperId === userProfile.id) {
          isAuthorizedTransactionParticipant = true;
        }
        if (!resolvedTargetRequestId && room.requestId) {
          resolvedTargetRequestId = room.requestId;
        }
        if (!resolvedTargetUserId) {
          resolvedTargetUserId = room.requesterId === userProfile.id ? room.helperId : room.requesterId;
        }
      } else {
        const booking = await prisma.rentalBooking.findUnique({
          where: { id: orderId.trim() },
          include: { rental: true },
        }).catch(() => null);

        if (booking) {
          if (booking.renterId === userProfile.id || booking.ownerId === userProfile.id) {
            isAuthorizedTransactionParticipant = true;
          }
          if (!resolvedTargetRentalId) {
            resolvedTargetRentalId = booking.rentalId;
          }
          if (!resolvedTargetUserId) {
            resolvedTargetUserId = booking.ownerId === userProfile.id ? booking.renterId : booking.ownerId;
          }
        }
      }
    }

    if (!isAuthorizedTransactionParticipant && resolvedTargetRequestId) {
      const reqRecord = await prisma.request.findUnique({
        where: { id: resolvedTargetRequestId },
        select: { requesterId: true, selectedHelperId: true },
      }).catch(() => null);
      if (
        reqRecord &&
        (reqRecord.requesterId === userProfile.id || reqRecord.selectedHelperId === userProfile.id)
      ) {
        isAuthorizedTransactionParticipant = true;
      }
    }

    let finalDescription = description.trim();
    if (targetName && targetName.trim() && !finalDescription.startsWith("[Pihak Terlapor:")) {
      finalDescription = `[Pihak Terlapor: ${targetName.trim()}]\n${finalDescription}`;
    }

    const evidences = Array.isArray(evidenceUrls) ? evidenceUrls : evidenceUrls ? [evidenceUrls] : [];

    // 3. Create Report in DB
    const report = await prisma.$transaction(async (tx) => {
      const rep = await tx.report.create({
        data: {
          reporterId: userProfile.id,
          targetUserId: resolvedTargetUserId,
          targetRequestId: resolvedTargetRequestId,
          targetRentalId: resolvedTargetRentalId,
          category,
          description: finalDescription,
          evidenceUrls: evidences,
          status: "pending",
        },
        include: {
          reporter: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          targetUser: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          targetRequest: { select: { id: true, title: true, category: true } },
          targetRental: { select: { id: true, title: true, category: true } },
        },
      });

      // If tied to an active order room or request AND caller is an actual participant/admin, flag as disputed
      if (resolvedTargetRequestId && isAuthorizedTransactionParticipant) {
        await tx.orderRoom.updateMany({
          where: { requestId: resolvedTargetRequestId },
          data: {
            orderStatus: "disputed",
            disputeReason: description.trim(),
            disputeOpenedBy: userProfile.id,
          },
        }).catch(() => null);
        await tx.request.updateMany({
          where: { id: resolvedTargetRequestId },
          data: { status: "disputed" },
        }).catch(() => null);
      }

      // If tied to a rental booking AND caller is an actual participant/admin, flag as disputed
      if (orderId && isValidUuid(orderId) && isAuthorizedTransactionParticipant) {
        await tx.rentalBooking.updateMany({
          where: { id: orderId.trim() },
          data: { bookingStatus: "disputed" },
        }).catch(() => null);
      }

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: userProfile.id,
          actorEmail: userProfile.email,
          action: "report.created",
          targetEntity: "reports",
          targetId: rep.id,
          payload: {
            category,
            targetUserId: resolvedTargetUserId,
            targetRequestId: resolvedTargetRequestId,
            targetRentalId: resolvedTargetRentalId,
          },
        },
      });

      return rep;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Laporan berhasil dikirimkan. Tim operasional dan kepatuhan Bantuin akan segera meninjau dalam 1x24 jam.",
        data: report,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/reports error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengirimkan laporan." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports
 * Mengambil daftar laporan sengketa yang diajukan oleh atau terkait pengguna login
 * Disertai status real-time dan catatan/balasan Admin
 */
export async function GET(req) {
  try {
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'rental', 'sewa', 'service', 'jasa', 'all'

    const baseOr = [
      { reporterId: userProfile.id },
      { targetUserId: userProfile.id },
    ];

    const andConditions = [{ OR: baseOr }];

    if (type === "rental" || type === "sewa") {
      andConditions.push({
        OR: [
          { targetRentalId: { not: null } },
          { category: { in: ["barang_rusak", "deposit", "unit_sewa", "klaim_deposit"] } },
        ],
      });
    } else if (type === "service" || type === "jasa" || type === "request" || type === "bantuan") {
      andConditions.push({ targetRequestId: { not: null } });
    }

    const where = { AND: andConditions };

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        targetUser: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        targetRequest: { select: { id: true, title: true, category: true } },
        targetRental: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: reports.map((r) => {
        const targetNameMatch = r.description?.match(/^\[Pihak Terlapor:\s*([^\]]+)\]/);
        const cleanDescription = targetNameMatch
          ? r.description.replace(/^\[Pihak Terlapor:\s*([^\]]+)\]\n?/, "")
          : r.description;
        const targetName = targetNameMatch
          ? targetNameMatch[1]
          : (r.targetUser?.fullName || r.targetRequest?.title || r.targetRental?.title || "Pihak Terlapor");

        return {
          id: r.id,
          category: r.category,
          reason: r.category === "penipuan" ? "Indikasi Penipuan / Pembayaran" : r.category,
          description: cleanDescription,
          status: r.status, // 'pending', 'investigating', 'resolved', 'dismissed'
          adminNotes: r.adminNotes || "",
          resolvedAt: r.resolvedAt,
          createdAt: r.createdAt,
          evidenceUrls: r.evidenceUrls || [],
          reporterId: r.reporterId,
          reporterName: r.reporter?.fullName || "Pengguna",
          targetId: r.targetUserId || r.targetRequestId || r.targetRentalId,
          targetName,
        };
      }),
    });
  } catch (err) {
    console.error("[GET /api/reports error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar laporan." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports
 * Menghapus laporan sengketa yang SUDAH SELESAI / DIMEDIASI (resolved / dismissed / closed) dari database.
 * Laporan yang statusnya 'pending' / 'investigating' (masih dalam investigasi tim admin) TIDAK DAPAT DIHAPUS.
 */
export async function DELETE(req) {
  try {
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

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const id = searchParams.get("id") || body.id;
    const allResolved = searchParams.get("allResolved") === "true" || body.allResolved === true;

    // Bersihkan semua laporan yang selesai
    if (allResolved) {
      await prisma.report.deleteMany({
        where: {
          reporterId: userProfile.id,
          status: { in: ["resolved", "dismissed", "closed"] },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Seluruh laporan sengketa yang telah selesai berhasil dibersihkan dari database.",
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID laporan sengketa diperlukan." },
        { status: 400 }
      );
    }

    const report = await prisma.report.findFirst({
      where: {
        id,
        reporterId: userProfile.id,
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Laporan tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    if (report.status === "pending" || report.status === "investigating" || report.status === "open") {
      return NextResponse.json(
        {
          success: false,
          error: "Laporan yang masih dalam proses investigasi oleh Tim Admin Bantuin tidak dapat dihapus sebelum selesai ditindaklanjuti.",
        },
        { status: 400 }
      );
    }

    await prisma.report.delete({ where: { id: report.id } });

    return NextResponse.json({
      success: true,
      message: "Laporan sengketa berhasil dihapus dari database.",
    });
  } catch (err) {
    console.error("[DELETE /api/reports error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus laporan." },
      { status: 500 }
    );
  }
}

