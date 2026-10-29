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
    return { error: "Akses ditolak. Hanya Administrator yang dapat mengelola pengumuman.", status: 403 };
  }

  return { profile };
}

/**
 * PATCH /api/admin/announcements/[id]
 * Toggle status pengumuman (active / inactive)
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json().catch(() => ({}));
    const updateData = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content.trim();

    const updated = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil diperbarui.",
      data: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/announcements/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui pengumuman." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/announcements/[id]
 * Hapus pengumuman resmi platform
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil dihapus.",
    });
  } catch (err) {
    console.error("[DELETE /api/admin/announcements/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus pengumuman." },
      { status: 500 }
    );
  }
}
