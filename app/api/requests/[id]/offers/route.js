import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req, { params }) {
  try {
    const { id: requestId } = await params;
    const body = await req.json();
    const {
      helperId,
      helperEmail,
      pitchMessage,
      proposedPrice,
      estimatedArrivalMinutes,
    } = body;

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

    // Tentukan helperId yang valid
    let validHelperId = helperId;
    if (!validHelperId && helperEmail) {
      const helperProfile = await prisma.profile.findUnique({
        where: { email: helperEmail.toLowerCase() },
      });
      if (helperProfile) validHelperId = helperProfile.id;
    }

    if (!validHelperId) {
      // Buat profile fallback jika belum ada
      const anyHelper = await prisma.profile.findFirst({
        where: { NOT: { id: targetRequest.requesterId } },
      });
      if (anyHelper) {
        validHelperId = anyHelper.id;
      } else {
        const newHelper = await prisma.profile.create({
          data: {
            email: "helper@bantuin.id",
            fullName: "Helper Komunitas",
            accountRole: "user",
          },
        });
        validHelperId = newHelper.id;
      }
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

    let offer;
    if (existingOffer) {
      offer = await prisma.offer.update({
        where: { id: existingOffer.id },
        data: {
          pitchMessage: pitchMessage.trim(),
          proposedPrice: proposedPrice ? Number(proposedPrice) : null,
          estimatedArrivalMinutes: estimatedArrivalMinutes ? Number(estimatedArrivalMinutes) : 15,
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
