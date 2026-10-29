import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { formatExternalUrl } from "@/lib/utils";

export async function POST(req, { params }) {
  try {
    const { id: requestId } = await params;

    // 1. Ekstraksi Token Otentikasi
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

    let authUserId = null;
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded && (decoded.id || decoded.email)) {
        const profile = await prisma.profile.findFirst({
          where: {
            OR: [
              ...(decoded.id ? [{ id: decoded.id }] : []),
              ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
            ],
          },
        });
        if (profile) {
          if (profile.verificationStatus === "suspended") {
            return NextResponse.json(
              { error: "Akun Anda sedang ditangguhkan oleh Administrator Bantuin. Anda tidak dapat mengajukan tawaran bantuan." },
              { status: 403 }
            );
          }
          authUserId = profile.id;
        }
      }
    }

    const body = await req.json();
    const {
      helperId,
      pitchMessage,
      proposedPrice,
      estimatedArrivalMinutes,
      cvUrl,
      cvName,
      portfolioUrl,
      portfolioName,
    } = body;

    // SEC-03: Require authenticated user; never trust unverified helperId from request body
    const validHelperId = authUserId;

    if (!validHelperId) {
      return NextResponse.json(
        { error: "Harap login terlebih dahulu untuk mengajukan tawaran bantuan." },
        { status: 401 }
      );
    }

    if (!pitchMessage || !pitchMessage.trim()) {
      return NextResponse.json(
        { error: "Pesan penawaran (pitch message) wajib diisi." },
        { status: 400 }
      );
    }

    // Pastikan request ada
    const targetRequest = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!targetRequest) {
      return NextResponse.json(
        { error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Pengguna dilarang melamar permintaan bantuan miliknya sendiri
    if (validHelperId === targetRequest.requesterId) {
      return NextResponse.json(
        { error: "Anda tidak dapat mengajukan lamaran pada permintaan bantuan Anda sendiri." },
        { status: 400 }
      );
    }

    // Cek apakah helper sudah pernah mengajukan tawaran
    const existingOffer = await prisma.offer.findUnique({
      where: {
        requestId_helperId: {
          requestId,
          helperId: validHelperId,
        },
      },
    });

    const cleanPortfolioUrl = portfolioUrl ? formatExternalUrl(portfolioUrl) : null;
    const cleanCvUrl = cvUrl ? formatExternalUrl(cvUrl) : null;

    let offer;
    if (existingOffer) {
      offer = await prisma.offer.update({
        where: { id: existingOffer.id },
        data: {
          pitchMessage: pitchMessage.trim(),
          proposedPrice: proposedPrice ? Number(proposedPrice) : null,
          estimatedArrivalMinutes: estimatedArrivalMinutes ? Number(estimatedArrivalMinutes) : 15,
          cvUrl: cleanCvUrl || existingOffer.cvUrl || null,
          cvName: cvName || existingOffer.cvName || null,
          portfolioUrl: cleanPortfolioUrl || existingOffer.portfolioUrl || null,
          portfolioName: portfolioName || existingOffer.portfolioName || null,
          status: "submitted",
        },
      });
    } else {
      offer = await prisma.offer.create({
        data: {
          requestId,
          helperId: validHelperId,
          pitchMessage: pitchMessage.trim(),
          proposedPrice: proposedPrice ? Number(proposedPrice) : null,
          estimatedArrivalMinutes: estimatedArrivalMinutes ? Number(estimatedArrivalMinutes) : 15,
          cvUrl: cleanCvUrl || null,
          cvName: cvName || null,
          portfolioUrl: cleanPortfolioUrl || null,
          portfolioName: portfolioName || null,
          status: "submitted",
        },
      });
    }

    // Update status request ke 'has_offers' jika masih 'published'
    if (targetRequest.status === "published") {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "has_offers" },
      });
    }

    // Buat Notifikasi In-App untuk Pembuat Permintaan (Requester)
    try {
      const helper = await prisma.profile.findUnique({
        where: { id: validHelperId },
        select: { fullName: true },
      });
      const helperName = helper?.fullName || "Seseorang";
      await prisma.notification.create({
        data: {
          userId: targetRequest.requesterId,
          title: "Tawaran Bantuan Baru!",
          message: `${helperName} telah mengajukan tawaran bantuan untuk: "${targetRequest.title}".`,
          type: "order",
          link: `/bantuan/${requestId}#pelamar`,
        },
      });
    } catch (notifErr) {
      console.warn("Failed to create offer notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Tawaran bantuan berhasil dikirim.",
      data: offer,
    });
  } catch (error) {
    console.error("POST /api/requests/[id]/offers Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengirimkan tawaran bantuan." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/requests/[id]/offers
 * Task 76: Ambil daftar pelamar/tawaran pada suatu request (/bantuan/[id]/pelamar)
 */
export async function GET(req, { params }) {
  try {
    const { id: requestId } = await params;

    const targetRequest = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        title: true,
        status: true,
        requesterId: true,
        rewardAmount: true,
      },
    });

    if (!targetRequest) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    // BUG-03: Profile uses 'verificationStatus' in prisma/schema.prisma (not 'isKycVerified')
    const rawOffers = await prisma.offer.findMany({
      where: { requestId },
      include: {
        helper: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            campusName: true,
            ratingAvg: true,
            completedHelpsCount: true,
            verificationStatus: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const offers = rawOffers.map((o) => ({
      ...o,
      helper: o.helper
        ? {
            ...o.helper,
            isKycVerified: o.helper.verificationStatus === "verified",
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: offers,
      meta: {
        total: offers.length,
        requestTitle: targetRequest.title,
        requestStatus: targetRequest.status,
      },
    });
  } catch (error) {
    console.error("GET /api/requests/[id]/offers Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil daftar tawaran." },
      { status: 500 }
    );
  }
}

