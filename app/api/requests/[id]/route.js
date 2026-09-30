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
                email: true,
                fullName: true,
                avatarUrl: true,
                campusName: true,
                accountRole: true,
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
        avatar: request.requester?.avatarUrl && !request.requester.avatarUrl.includes("images.unsplash.com") ? request.requester.avatarUrl : null,
        avatarUrl: request.requester?.avatarUrl && !request.requester.avatarUrl.includes("images.unsplash.com") ? request.requester.avatarUrl : null,
        rating: Number(request.requester?.ratingAvg) || 5.0,
        ratingCount: request.requester?.ratingCount || 0,
        completedHelps: request.requester?.completedHelpsCount || 0,
        reliability: request.requester?.reliabilityScore || 100,
        verified: request.requester?.verificationStatus === "verified",
      },
      userName: request.requester?.fullName || "Pengguna Bantuin",
      userRole: "Pengguna Terverifikasi",
      userAvatar: request.requester?.avatarUrl && !request.requester.avatarUrl.includes("images.unsplash.com") ? request.requester.avatarUrl : null,
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
      offers: request.offers.map((o) => {
        const helper = o.helper;
        const helperAvatar = helper?.avatarUrl && !helper.avatarUrl.includes("images.unsplash.com") ? helper.avatarUrl : null;
        const helperName = helper?.fullName || "Helper Terverifikasi";
        const helperRole = helper?.accountRole === "provider" 
          ? "Penyedia Jasa" 
          : (helper?.accountRole === "partner" ? "Mitra Toko" : (helper?.verificationStatus === "verified" ? "Helper Terverifikasi" : "Pengguna Komunitas"));
        const helperCampus = helper?.campusName || null;
        const helperRating = helper?.ratingAvg !== null && helper?.ratingAvg !== undefined ? Number(helper.ratingAvg) : null;
        const completedHelps = typeof helper?.completedHelpsCount === "number" ? helper.completedHelpsCount : 0;

        return {
          id: o.id,
          helperId: o.helperId,
          helperEmail: helper?.email || null,
          helperName,
          helperRole,
          helperCampus,
          helperAvatar,
          helperRating,
          helperHelpsCount: completedHelps,
          completedHelps,
          helperVerified: helper?.verificationStatus === "verified",
          pitch: o.pitchMessage,
          pitchMessage: o.pitchMessage,
          proposedPrice: o.proposedPrice ? Number(o.proposedPrice) : null,
          estimatedArrivalMinutes: o.estimatedArrivalMinutes,
          status: o.status,
          createdAt: o.createdAt,
        };
      }),
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

    // Destructure custom fields that are not in Prisma Request model
    const { startMessage, ...dataToUpdate } = body;

    const updated = await prisma.request.update({
      where: { id },
      data: dataToUpdate,
      include: {
        requester: true,
        selectedHelper: true,
      },
    });

    // Jika helper dipilih / status helper_selected / in_progress, buatkan record OrderRoom & ChatMessage resmi di database
    if ((body.status === "helper_selected" || body.status === "in_progress" || body.selectedHelperId) && (updated.selectedHelperId || body.selectedHelperId)) {
      try {
        const helperId = body.selectedHelperId || updated.selectedHelperId;
        const reward = Number(updated.rewardAmount) || 0;
        const platformFee = Math.round(reward * 0.08);
        const helperPayout = reward - platformFee;

        const existingRoom = await prisma.orderRoom.findUnique({
          where: { requestId: updated.id },
        });

        let currentRoom = existingRoom;
        if (!existingRoom) {
          currentRoom = await prisma.orderRoom.create({
            data: {
              requestId: updated.id,
              requesterId: updated.requesterId,
              helperId: helperId,
              lockedAmount: reward,
              platformFee: platformFee,
              helperPayoutAmount: helperPayout,
              orderStatus: body.status === "in_progress" ? "in_progress" : "room_created",
            },
          });

          // Insert verified escrow message to chat_messages table
          await prisma.chatMessage.create({
            data: {
              orderRoomId: currentRoom.id,
              senderId: updated.requesterId,
              message: `Dana sebesar Rp${reward.toLocaleString("id-ID")} telah aman terverifikasi di Rekening Bersama Bantuin.id. Helper dapat segera mulai pengerjaan tugas!`,
            },
          });

          // Insert template pesan penerimaan helper resmi
          await prisma.chatMessage.create({
            data: {
              orderRoomId: currentRoom.id,
              senderId: updated.requesterId,
              message: `Halo! Anda telah resmi diterima sebagai Helper untuk tugas "${updated.title}". Dana imbalan telah diamankan di Rekening Bersama Bantuin. Silakan mulai koordinasi dan bantu saya mengerjakan tugas ini.`,
            },
          });
        } else {
          currentRoom = await prisma.orderRoom.update({
            where: { id: existingRoom.id },
            data: {
              helperId: helperId,
              lockedAmount: reward,
              platformFee: platformFee,
              helperPayoutAmount: helperPayout,
              orderStatus: body.status === "in_progress" ? "in_progress" : existingRoom.orderStatus,
            },
          });

          // Insert template pesan penerimaan helper jika belum ada
          await prisma.chatMessage.create({
            data: {
              orderRoomId: currentRoom.id,
              senderId: updated.requesterId,
              message: `Halo! Anda telah resmi diterima sebagai Helper untuk tugas "${updated.title}". Dana imbalan telah diamankan di Rekening Bersama Bantuin. Silakan mulai koordinasi dan bantu saya mengerjakan tugas ini.`,
            },
          }).catch(() => null);
        }

        // Jika ada startMessage dari helper (misal saat Mulai Kerjakan diklik)
        if (startMessage && helperId) {
          await prisma.chatMessage.create({
            data: {
              orderRoomId: currentRoom.id,
              senderId: helperId,
              message: startMessage,
            },
          }).catch(() => null);
        }

        // Tandai tawaran pelamar menjadi accepted di tabel offers
        await prisma.offer.updateMany({
          where: {
            requestId: updated.id,
            helperId: helperId,
          },
          data: {
            status: "accepted",
          },
        });
      } catch (orderRoomErr) {
        console.warn("Could not sync OrderRoom to database:", orderRoomErr);
      }
    }

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
