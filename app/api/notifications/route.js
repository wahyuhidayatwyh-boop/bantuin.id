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
 * GET /api/notifications
 * Mengambil daftar notifikasi in-app pengguna
 */
export async function GET(req) {
  try {
    const userProfile = await getAuthenticatedProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: userProfile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      data: {
        unreadCount,
        notifications,
      },
    });
  } catch (err) {
    console.error("[GET /api/notifications error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil notifikasi." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Membuat notifikasi baru secara programatik
 */
export async function POST(req) {
  try {
    const userProfile = await getAuthenticatedProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, title, message, link, type = "order" } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { success: false, error: "userId, title, dan message diperlukan." },
        { status: 400 }
      );
    }

    // Hanya diizinkan membuat notifikasi untuk diri sendiri atau oleh Admin
    if (userId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda tidak dapat mengirim notifikasi ke pengguna lain." },
        { status: 403 }
      );
    }

    const safeLink =
      typeof link === "string" && link.startsWith("/") && !link.startsWith("//")
        ? link
        : "/activity";

    const notif = await prisma.notification.create({
      data: {
        userId,
        title: String(title).slice(0, 150),
        message: String(message).slice(0, 1000),
        link: safeLink,
        type,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: notif,
    });
  } catch (err) {
    console.error("[POST /api/notifications error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal membuat notifikasi." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications?id=... atau DELETE /api/notifications?all=true
 * Menghapus satu atau semua notifikasi milik pengguna
 */
export async function DELETE(req) {
  try {
    const userProfile = await getAuthenticatedProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const isAll = searchParams.get("all") === "true";

    if (isAll) {
      await prisma.notification.deleteMany({
        where: { userId: userProfile.id },
      });
      return NextResponse.json({
        success: true,
        message: "Semua notifikasi berhasil dihapus.",
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID notifikasi atau parameter all=true diperlukan." },
        { status: 400 }
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
    console.error("[DELETE /api/notifications error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus notifikasi." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Menandai satu atau semua notifikasi sebagai telah dibaca (isRead = true)
 */
export async function PATCH(req) {
  try {
    const userProfile = await getAuthenticatedProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { id, all = false } = body;

    if (all || !id) {
      await prisma.notification.updateMany({
        where: { userId: userProfile.id, isRead: false },
        data: { isRead: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { id, userId: userProfile.id },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Status notifikasi berhasil diperbarui.",
    });
  } catch (err) {
    console.error("[PATCH /api/notifications error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui notifikasi." },
      { status: 500 }
    );
  }
}
