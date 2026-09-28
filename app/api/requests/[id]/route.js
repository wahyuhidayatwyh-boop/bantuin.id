import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            campusName: true,
            ratingAvg: true,
            ratingCount: true,
            completedHelpsCount: true,
            reliabilityScore: true,
            verificationStatus: true,
          },
        },
        selectedHelper: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            ratingAvg: true,
            completedHelpsCount: true,
            reliabilityScore: true,
            verificationStatus: true,
          },
        },
        offers: {
          include: {
            helper: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                campusName: true,
                ratingAvg: true,
                completedHelpsCount: true,
                reliabilityScore: true,
                verificationStatus: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        bantuinPoint: true,
        orderRoom: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    const formatted = {
      id: request.id,
      requesterId: request.requesterId,
      requester: {
        id: request.requester?.id || request.requesterId,
        name: request.requester?.fullName || "Pengguna Bantuin",
        fullName: request.requester?.fullName || "Pengguna Bantuin",
        role: request.requester?.accountRole === "user" ? "Pengguna Terverifikasi" : (request.requester?.accountRole || "Pengguna Terverifikasi"),
        campus: request.requester?.campusName && request.requester.campusName !== "Universitas Indonesia"
          ? request.requester.campusName
          : (request.locationName ? request.locationName.split(",").slice(1, 3).join(", ").trim() : "Bekasi, Jawa Barat"),
        avatar: request.requester?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        avatarUrl: request.requester?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        rating: Number(request.requester?.ratingAvg) || 5.0,
        ratingCount: request.requester?.ratingCount || 0,
        completedHelps: request.requester?.completedHelpsCount || 0,
        reliability: request.requester?.reliabilityScore || 100,
        verified: request.requester?.verificationStatus === "verified",
      },
      userName: request.requester?.fullName || "Pengguna Bantuin",
      userRole: "Pengguna Terverifikasi",
      userAvatar: request.requester?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      userRating: Number(request.requester?.ratingAvg) || 5.0,
      userRatingCount: request.requester?.ratingCount || 0,
      userHelpsCount: request.requester?.completedHelpsCount || 0,
      userReliability: request.requester?.reliabilityScore || 100,
      userVerified: request.requester?.verificationStatus === "verified",
      title: request.title,
      description: request.description,
      category: request.category,
      mode: request.mode,
      location: request.locationName,
      locationName: request.locationName,
      latitude: request.latitude,
      longitude: request.longitude,
      bantuinPointId: request.bantuinPointId,
      bantuinPoint: request.bantuinPoint,
      isPublicLocation: request.isPublicLocation,
      deadline: request.deadline,
      reward: Number(request.rewardAmount),
      rewardAmount: Number(request.rewardAmount),
      isVoluntary: request.isVoluntary,
      status: request.status,
      selectedHelperId: request.selectedHelperId,
      selectedHelper: request.selectedHelper,
      photos: request.attachments || [],
      attachments: request.attachments || [],
      offers: request.offers.map((o) => ({
        id: o.id,
        helperId: o.helperId,
        helperName: o.helper?.fullName || "Helper Terverifikasi",
        helperAvatar: o.helper?.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        helperRating: Number(o.helper?.ratingAvg) || 5.0,
        helperHelpsCount: o.helper?.completedHelpsCount || 0,
        helperVerified: o.helper?.verificationStatus === "verified",
        pitch: o.pitchMessage,
        pitchMessage: o.pitchMessage,
        proposedPrice: o.proposedPrice ? Number(o.proposedPrice) : null,
        estimatedArrivalMinutes: o.estimatedArrivalMinutes,
        status: o.status,
        createdAt: o.createdAt,
      })),
      orderRoom: request.orderRoom,
      createdAt: request.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/requests/[id] Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil detail permintaan bantuan." },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.request.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("PATCH /api/requests/[id] Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui status permintaan bantuan." },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: "cancelled",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Permintaan bantuan berhasil dibatalkan.",
      data: updated,
    });
  } catch (error) {
    console.error("DELETE /api/requests/[id] Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal membatalkan permintaan bantuan." },
      { status: 500 }
    );
  }
}
