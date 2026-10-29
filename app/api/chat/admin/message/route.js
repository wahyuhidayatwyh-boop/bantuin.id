import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/chat/admin/message
 * Task 103: Kirim balasan bantuan live chat ke Admin CS
 */
export async function POST(req) {
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

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const { message, ticketId, targetUserId, image } = body;

    if (!message && !image) {
      return NextResponse.json(
        { success: false, error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    // Helper to format legacy messages to thread format
    const formatLegacyMessages = (t) => {
      const list = [
        {
          id: `usr-${t.id}`,
          from: "user",
          text: t.description || "",
          image: null,
          time: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        },
      ];
      if (t.adminNotes) {
        list.push({
          id: `adm-${t.id}`,
          from: "admin",
          text: t.adminNotes,
          image: null,
          time: t.resolvedAt ? new Date(t.resolvedAt).toISOString() : new Date().toISOString(),
        });
      }
      return list;
    };

    // If Admin replying to a ticket
    if (userProfile.isAdmin && ticketId) {
      const ticket = await prisma.report.findUnique({
        where: { id: ticketId },
      });

      if (ticket) {
        const newMsg = {
          id: Date.now(),
          from: "admin",
          text: message ? message.trim() : "",
          image: image || null,
          time: new Date().toISOString(),
        };

        let existingUrls = Array.isArray(ticket.evidenceUrls) ? [...ticket.evidenceUrls] : [];
        const hasMsgEntries = existingUrls.some((u) => typeof u === "string" && u.startsWith("msg::"));
        if (!hasMsgEntries) {
          const legacy = formatLegacyMessages(ticket);
          existingUrls = [
            ...existingUrls.filter((u) => typeof u === "string" && !u.startsWith("msg::")),
            ...legacy.map((m) => "msg::" + JSON.stringify(m)),
          ];
        }

        existingUrls.push("msg::" + JSON.stringify(newMsg));

        await prisma.report.update({
          where: { id: ticketId },
          data: {
            adminNotes: message ? message.trim() : ticket.adminNotes,
            status: "resolved",
            resolvedBy: userProfile.id,
            resolvedAt: new Date(),
            evidenceUrls: existingUrls,
          },
        });

        // Notify user with DIRECT link to /chat/admin
        await prisma.notification.create({
          data: {
            userId: ticket.reporterId,
            title: "Balasan dari Tim CS Bantuin",
            message: message ? message.trim() : "Admin mengirimkan lampiran foto.",
            type: "report",
            link: "/chat/admin",
          },
        });

        return NextResponse.json({
          success: true,
          message: "Balasan CS berhasil dikirimkan ke pengguna.",
          data: {
            ticketId: ticket.id,
            newMessage: newMsg,
          },
        });
      }
    }

    // User replying to an existing ticket or starting a new message
    let targetTicket = null;
    if (ticketId) {
      targetTicket = await prisma.report.findFirst({
        where: { id: ticketId, reporterId: userProfile.id },
      });
    }

    if (!targetTicket) {
      // Find latest report for this user to continue the active thread
      targetTicket = await prisma.report.findFirst({
        where: { reporterId: userProfile.id },
        orderBy: { createdAt: "desc" },
      });
    }

    const newMsg = {
      id: Date.now(),
      from: "user",
      text: message ? message.trim() : "",
      image: image || null,
      time: new Date().toISOString(),
    };

    if (targetTicket) {
      let existingUrls = Array.isArray(targetTicket.evidenceUrls) ? [...targetTicket.evidenceUrls] : [];
      const hasMsgEntries = existingUrls.some((u) => typeof u === "string" && u.startsWith("msg::"));
      if (!hasMsgEntries) {
        const legacy = formatLegacyMessages(targetTicket);
        existingUrls = [
          ...existingUrls.filter((u) => typeof u === "string" && !u.startsWith("msg::")),
          ...legacy.map((m) => "msg::" + JSON.stringify(m)),
        ];
      }

      existingUrls.push("msg::" + JSON.stringify(newMsg));

      const updated = await prisma.report.update({
        where: { id: targetTicket.id },
        data: {
          status: "pending",
          description: message ? message.trim() : targetTicket.description,
          evidenceUrls: existingUrls,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Pesan Anda telah diterima oleh Admin CS.",
        data: {
          ticketId: targetTicket.id,
          newMessage: newMsg,
          ticket: updated,
        },
      });
    }

    // Brand new ticket
    const newTicket = await prisma.report.create({
      data: {
        reporterId: userProfile.id,
        category: "bantuan_cs",
        description: message ? message.trim() : "Lampiran foto bukti",
        status: "pending",
        evidenceUrls: ["msg::" + JSON.stringify(newMsg)],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pesan Anda telah diterima oleh Admin CS. Kami akan membalas segera.",
      data: {
        ticketId: newTicket.id,
        newMessage: newMsg,
        ticket: newTicket,
      },
    });
  } catch (err) {
    console.error("[POST /api/chat/admin/message error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengirim pesan ke CS." },
      { status: 500 }
    );
  }
}
