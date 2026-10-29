import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

function extractToken(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/bantuin_auth_token=([^;]+)/) || cookieHeader.match(/bantuin_token=([^;]+)/);
  if (match) return match[1];
  return null;
}

async function getAuthenticatedProfile(req) {
  const token = extractToken(req);
  if (!token) return null;

  const decoded = verifyAccessToken(token);
  if (!decoded || (!decoded.id && !decoded.email)) return null;

  return await prisma.profile.findFirst({
    where: {
      OR: [
        ...(decoded.id ? [{ id: decoded.id }] : []),
        ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
      ],
    },
  });
}

/**
 * PATCH /api/notifications/[id]
 * Menandai notifikasi spesifik sebagai telah dibaca
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID notifikasi diperlukan." },
        { status: 400 }
      );
    }

    const userProfile = await getAuthenticatedProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    await prisma.notification.updateMany({
      where: {
        id,
        userId: userProfile.id,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      message: "Notifikasi telah ditandai sebagai dibaca.",
    });
  } catch (err) {
    console.error("[PATCH /api/notifications/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui notifikasi." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Menghapus notifikasi spesifik milik pengguna yang terautentikasi
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID notifikasi diperlukan." },
        { status: 400 }
      );
    }

    const userProfile = await getAuthenticatedProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    await prisma.notification.deleteMany({
      where: {
        id,
        userId: userProfile.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil dihapus.",
    });
  } catch (err) {
    console.error("[DELETE /api/notifications/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus notifikasi." },
      { status: 500 }
    );
  }
}
