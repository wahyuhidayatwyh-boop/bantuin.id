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
 * GET /api/admin/announcements
 * Mengambil seluruh pengumuman resmi platform (aktif & nonaktif) untuk Admin
 */
export async function GET(req) {
  try {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: announcements,
    });
  } catch (err) {
    console.error("[GET /api/admin/announcements error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar pengumuman." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/announcements
 * Task 87: Admin mempublikasikan pengumuman resmi platform
 */
export async function POST(req) {
  try {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const adminProfile = authResult.profile;

    const body = await req.json().catch(() => ({}));
    const { title, content, type = "info", audience = "all" } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Field 'title' dan 'content' wajib diisi." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        type,
        audience,
        status: "active",
      },
    });

    // Record AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: adminProfile.id,
        actorEmail: adminProfile.email,
        action: "announcement.published",
        targetEntity: "announcements",
        targetId: announcement.id,
        payload: { title, type, audience },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pengumuman berhasil dipublikasikan.",
        data: announcement,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/announcements error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mempublikasikan pengumuman." },
      { status: 500 }
    );
  }
}
