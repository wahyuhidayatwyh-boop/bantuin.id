import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/prisma";

// Global presence tracker (timestamp in milliseconds)
if (!globalThis.__bantuin_presence_map) {
  globalThis.__bantuin_presence_map = new Map();
}

function extractUserId(req) {
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
  if (!token) return null;
  const decoded = verifyAccessToken(token);
  return decoded?.id || null;
}

/**
 * POST /api/chat/presence
 * Heartbeat untuk mencatat bahwa user saat ini aktif (online).
 */
export async function POST(req) {
  try {
    const userId = extractUserId(req);
    let targetUserId = userId;

    try {
      const body = await req.json();
      if (body?.userId && !targetUserId) {
        targetUserId = body.userId;
      }
    } catch (_) {}

    if (targetUserId) {
      globalThis.__bantuin_presence_map.set(targetUserId, Date.now());
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      timestamp: Date.now(),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/chat/presence?userId=...
 * Mengecek status online/offline dan timestamp terakhir aktif pengguna.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    const now = Date.now();
    const memTime = globalThis.__bantuin_presence_map?.get(targetUserId) || 0;

    let dbTime = 0;
    if (now - memTime > 90000) {
      const p = await prisma.profile.findUnique({
        where: { id: targetUserId },
        select: { updatedAt: true },
      }).catch(() => null);
      if (p?.updatedAt) {
        dbTime = new Date(p.updatedAt).getTime();
      }
    }

    const lastActive = Math.max(memTime, dbTime);
    const isOnline = lastActive > 0 && (now - lastActive) <= 90000;

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      isOnline,
      lastActiveAt: lastActive > 0 ? new Date(lastActive).toISOString() : null,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
