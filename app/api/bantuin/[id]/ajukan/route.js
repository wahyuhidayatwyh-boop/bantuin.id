import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { formatExternalUrl } from "@/lib/utils";

/**
 * GET /api/bantuin/[id]/ajukan
 * Task 15: Tampilan chat & status penawaran antara peminta dan penerima jasa
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    // Check optional caller identity so private chatMessages are only returned to authorized participants (SEC-05)
    let callerId = null;
    let isCallerAdmin = false;
    const authHeader = req.headers.get("authorization");
    let token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/bantuin_auth_token=([^;]+)/) || cookieHeader.match(/bantuin_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]).trim();
    }
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded?.id || decoded?.email) {
        const callerProfile = await prisma.profile.findFirst({
          where: {
            OR: [
              ...(decoded.id ? [{ id: decoded.id }] : []),
              ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
            ],
          },
          select: { id: true, isAdmin: true },
        });
        if (callerProfile) {
          callerId = callerProfile.id;
          isCallerAdmin = Boolean(callerProfile.isAdmin);
        }
      }
    }

    // BUG-03: Use relation name 'orderRooms' matching prisma/schema.prisma
    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, fullName: true, avatarUrl: true, campusName: true },
        },
        offers: {
          include: {
            helper: {
              select: { id: true, fullName: true, avatarUrl: true, ratingAvg: true },
            },
          },
        },
        orderRooms: {
          include: {
            chatMessages: {
              orderBy: { createdAt: "asc" },
              take: 50,
            },
          },
        },
      },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    const visibleRooms = (request.orderRooms || []).filter(
      (r) => isCallerAdmin || (callerId && (r.requesterId === callerId || r.helperId === callerId))
    );

    return NextResponse.json({
      success: true,
      data: {
        ...request,
        orderRooms: visibleRooms,
        orderRoom: visibleRooms[0] || null,
      },
    });
  } catch (err) {
    console.error("[GET /api/bantuin/[id]/ajukan error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil data pengajuan bantuan." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bantuin/[id]/ajukan
 * Task 16: Proses pengajuan bantuan / penawaran pengerjaan dari penerima ke peminta
 */
export async function POST(req, { params }) {
  try {
    const { id: requestId } = await params;

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

    // 2. Query Request
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (request.requesterId === userProfile.id) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat mengajukan penawaran pada permintaan Anda sendiri." },
        { status: 400 }
      );
    }

    // 3. Parse Body (BUG-03: parse JSON body before destructuring)
    const body = await req.json().catch(() => ({}));
    const {
      pitchMessage,
      proposedPrice,
      estimatedArrivalMinutes = 15,
      cvUrl,
      cvName,
      portfolioUrl,
      portfolioName,
    } = body;

    if (!pitchMessage) {
      return NextResponse.json(
        { success: false, error: "Pesan pengajuan tawaran (pitchMessage) wajib diisi." },
        { status: 400 }
      );
    }

    const price = proposedPrice ? Number(proposedPrice) : Number(request.rewardAmount);
    const cleanPortfolioUrl = portfolioUrl ? formatExternalUrl(portfolioUrl) : undefined;
    const cleanCvUrl = cvUrl ? formatExternalUrl(cvUrl) : undefined;

    // Upsert offer
    const offer = await prisma.offer.upsert({
      where: {
        requestId_helperId: {
          requestId: request.id,
          helperId: userProfile.id,
        },
      },
      update: {
        pitchMessage: pitchMessage.trim(),
        proposedPrice: price,
        estimatedArrivalMinutes: parseInt(estimatedArrivalMinutes) || 15,
        cvUrl: cleanCvUrl || undefined,
        cvName: cvName || undefined,
        portfolioUrl: cleanPortfolioUrl || undefined,
        portfolioName: portfolioName || undefined,
        status: "submitted",
      },
      create: {
        requestId: request.id,
        helperId: userProfile.id,
        pitchMessage: pitchMessage.trim(),
        proposedPrice: price,
        estimatedArrivalMinutes: parseInt(estimatedArrivalMinutes) || 15,
        cvUrl: cleanCvUrl || null,
        cvName: cvName || null,
        portfolioUrl: cleanPortfolioUrl || null,
        portfolioName: portfolioName || null,
        status: "submitted",
      },
    });

    // Update Request status to has_offers
    if (request.status === "published") {
      await prisma.request.update({
        where: { id: request.id },
        data: { status: "has_offers" },
      });
    }

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: request.requesterId,
        title: "Tawaran Bantuan Baru!",
        message: `${userProfile.fullName} mengirimkan penawaran untuk '${request.title}'. Periksa tawarannya sekarang.`,
        type: "order",
        link: `/bantuan/${request.id}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pengajuan tawaran bantuan berhasil dikirimkan.",
      data: offer,
    });
  } catch (err) {
    console.error("[POST /api/bantuin/[id]/ajukan error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengajukan bantuan." },
      { status: 500 }
    );
  }
}
