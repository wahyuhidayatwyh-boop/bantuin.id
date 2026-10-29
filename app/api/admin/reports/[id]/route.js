import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PATCH /api/admin/reports/[id]
 * Task 96: Update status penanganan laporan (investigating, resolved, dismissed)
 */
export async function PATCH(req, { params }) {
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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat memperbarui laporan." },
        { status: 403 }
      );
    }

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const { status, adminNotes } = body;

    const validStatuses = ["pending", "investigating", "resolved", "dismissed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Status wajib berupa salah satu dari: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Laporan tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const rep = await tx.report.update({
        where: { id },
        data: {
          status,
          adminNotes: adminNotes ? adminNotes.trim() : report.adminNotes,
          resolvedBy: adminProfile.id,
          resolvedAt: status === "resolved" || status === "dismissed" ? new Date() : null,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminProfile.id,
          actorEmail: adminProfile.email,
          action: `report.${status}`,
          targetEntity: "reports",
          targetId: report.id,
          payload: { status, adminNotes },
        },
      });

      // Notify reporter
      await tx.notification.create({
        data: {
          userId: report.reporterId,
          title: "Pembaruan Penanganan Laporan",
          message: `Laporan Anda (#${report.id.slice(0, 8)}) telah diperbarui ke status: '${status}'. ${adminNotes ? `Catatan: ${adminNotes}` : ""}`,
          type: "report",
          link: `/activity`,
        },
      });

      return rep;
    });

    return NextResponse.json({
      success: true,
      message: `Status laporan berhasil diperbarui menjadi '${updated.status}'.`,
      data: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/reports/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui status laporan." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reports/[id]
 * Menghapus laporan dari sistem database secara permanen
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat menghapus laporan." },
        { status: 403 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Laporan tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.report.delete({
        where: { id },
      });

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
  } catch (err) {
    console.error("[DELETE /api/admin/reports/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus laporan." },
      { status: 500 }
    );
  }
}
