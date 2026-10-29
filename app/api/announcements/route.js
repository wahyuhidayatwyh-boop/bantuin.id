import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/announcements
 * Task 86: Ambil broadcast pengumuman resmi platform yang aktif
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const audience = searchParams.get("audience") || "all";

    const where = { status: "active" };
    if (audience !== "all") {
      where.OR = [{ audience: "all" }, { audience }];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: announcements,
    });
  } catch (err) {
    console.error("[GET /api/announcements error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil pengumuman platform." },
      { status: 500 }
    );
  }
}
