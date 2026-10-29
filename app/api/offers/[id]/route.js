import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { formatExternalUrl } from "@/lib/utils";

function getAuthenticatedUser(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const decoded = verifyAccessToken(token);
  if (!decoded || (!decoded.id && !decoded.email)) {
    return null;
  }
  return decoded;
}

/**
 * DELETE /api/offers/[id]
 * Task 77: Helper membatalkan atau menarik tawaran bantuan
 */
export async function DELETE(req, { params }) {
  try {
    const { id: offerId } = await params;
    const authUser = getAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(authUser.id ? [{ id: authUser.id }] : []),
          ...(authUser.email ? [{ email: authUser.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profil akun tidak ditemukan." },
        { status: 404 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { request: true },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "Tawaran tidak ditemukan." },
        { status: 404 }
      );
    }

    // Anti-IDOR check
    if (offer.helperId !== profile.id && !profile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda hanya dapat menarik tawaran milik Anda sendiri." },
        { status: 403 }
      );
    }

    if (offer.status === "accepted") {
      return NextResponse.json(
        { success: false, error: "Tawaran telah diterima oleh pemohon dan tidak dapat ditarik secara sepihak." },
        { status: 400 }
      );
    }

    // Delete offer
    await prisma.offer.delete({
      where: { id: offerId },
    });

    // Check if any other offers exist for this request
    const remainingOffersCount = await prisma.offer.count({
      where: { requestId: offer.requestId },
    });

    if (remainingOffersCount === 0 && offer.request.status === "has_offers") {
      await prisma.request.update({
        where: { id: offer.requestId },
        data: { status: "published" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Tawaran bantuan berhasil ditarik.",
    });
  } catch (error) {
    console.error("DELETE /api/offers/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menarik tawaran." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/offers/[id]
 * Task 78: Helper mengubah nominal penawaran harga atau pitch
 */
export async function PATCH(req, { params }) {
  try {
    const { id: offerId } = await params;
    const authUser = getAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(authUser.id ? [{ id: authUser.id }] : []),
          ...(authUser.email ? [{ email: authUser.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profil akun tidak ditemukan." },
        { status: 404 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "Tawaran tidak ditemukan." },
        { status: 404 }
      );
    }

    // Anti-IDOR check
    if (offer.helperId !== profile.id && !profile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda hanya dapat mengubah tawaran milik Anda sendiri." },
        { status: 403 }
      );
    }

    if (offer.status === "accepted") {
      return NextResponse.json(
        { success: false, error: "Tawaran telah diterima oleh pemohon dan tidak dapat diubah." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      proposedPrice,
      pitchMessage,
      estimatedArrivalMinutes,
      cvUrl,
      cvName,
      portfolioUrl,
      portfolioName,
    } = body;

    const updateData = {};
    if (proposedPrice !== undefined) {
      const numPrice = Number(proposedPrice);
      if (isNaN(numPrice) || numPrice < 0) {
        return NextResponse.json(
          { success: false, error: "Nominal penawaran harga tidak valid." },
          { status: 400 }
        );
      }
      updateData.proposedPrice = numPrice;
    }

    if (pitchMessage !== undefined) {
      if (!pitchMessage.trim()) {
        return NextResponse.json(
          { success: false, error: "Pesan penawaran (pitch) tidak boleh kosong." },
          { status: 400 }
        );
      }
      updateData.pitchMessage = pitchMessage.trim();
    }

    if (estimatedArrivalMinutes !== undefined) {
      const mins = parseInt(estimatedArrivalMinutes);
      if (!isNaN(mins) && mins > 0) {
        updateData.estimatedArrivalMinutes = mins;
      }
    }

    if (cvUrl !== undefined) updateData.cvUrl = cvUrl ? formatExternalUrl(cvUrl) : null;
    if (cvName !== undefined) updateData.cvName = cvName || null;
    if (portfolioUrl !== undefined) updateData.portfolioUrl = portfolioUrl ? formatExternalUrl(portfolioUrl) : null;
    if (portfolioName !== undefined) updateData.portfolioName = portfolioName || null;

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Tawaran berhasil diperbarui.",
      data: updatedOffer,
    });
  } catch (error) {
    console.error("PATCH /api/offers/[id] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui tawaran." },
      { status: 500 }
    );
  }
}
