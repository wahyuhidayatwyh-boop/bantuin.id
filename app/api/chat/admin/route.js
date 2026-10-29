import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

export function extractThreadMessages(ticket) {
  if (!ticket) return [];
  const msgItems = Array.isArray(ticket.evidenceUrls)
    ? ticket.evidenceUrls.filter((u) => typeof u === "string" && u.startsWith("msg::"))
    : [];

  if (msgItems.length > 0) {
    const parsed = [];
    for (const item of msgItems) {
      try {
        const m = JSON.parse(item.slice(5));
        if (m && m.text !== undefined) parsed.push(m);
      } catch (e) {}
    }
    if (parsed.length > 0) return parsed;
  }

  // Fallback to legacy single message + adminNotes
  const firstPhoto = Array.isArray(ticket.evidenceUrls)
    ? ticket.evidenceUrls.find((u) => typeof u === "string" && !u.startsWith("msg::"))
    : null;

  const list = [
    {
      id: `usr-${ticket.id}`,
      from: "user",
      text: ticket.description,
      image: firstPhoto || null,
      time: ticket.createdAt ? new Date(ticket.createdAt).toISOString() : new Date().toISOString(),
    },
  ];

  if (ticket.adminNotes) {
    list.push({
      id: `adm-${ticket.id}`,
      from: "admin",
      text: ticket.adminNotes,
      image: null,
      time: ticket.resolvedAt ? new Date(ticket.resolvedAt).toISOString() : (ticket.createdAt ? new Date(ticket.createdAt).toISOString() : new Date().toISOString()),
    });
  }

  return list;
}

/**
 * GET /api/chat/admin
 * Task 102: Ambil riwayat tiket chat bantuan pengguna ke Admin CS beserta pesan percakapan
 */
export async function GET(req) {
  try {
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

    // If Admin: view active user reports and support inquiry tickets
    if (userProfile.isAdmin) {
      const supportTickets = await prisma.report.findMany({
        include: {
          reporter: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      const formatted = supportTickets.map((t) => ({
        ...t,
        messages: extractThreadMessages(t),
      }));

      return NextResponse.json({
        success: true,
        isAdmin: true,
        data: formatted,
      });
    }

    // Normal User: view own support inquiries
    const myInquiries = await prisma.report.findMany({
      where: {
        reporterId: userProfile.id,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedInquiries = myInquiries.map((t) => ({
      ...t,
      messages: extractThreadMessages(t),
    }));

    return NextResponse.json({
      success: true,
      isAdmin: false,
      data: formattedInquiries,
    });
  } catch (err) {
    console.error("[GET /api/chat/admin error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil data tiket bantuan CS." },
      { status: 500 }
    );
  }
}
