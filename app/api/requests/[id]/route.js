import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedContext, requireAuth } from "@/lib/auth/session";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_REQUEST_STATUSES = new Set([
  "draft",
  "published",
  "has_offers",
  "helper_selected",
  "in_progress",
  "completed",
  "disputed",
  "cancelled",
]);

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    const auth = await getAuthenticatedContext(req);
    const viewer = auth?.profile || null;

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
            accountRole: true,
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
        orderRooms: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    const isParticipantOrAdmin = Boolean(
      viewer &&
        (viewer.isAdmin ||
          viewer.id === request.requesterId ||
          viewer.id === request.selectedHelperId ||
          request.offers?.some((o) => o.helperId === viewer.id))
    );

    const sanitizedSelectedHelper = request.selectedHelper
      ? {
          id: request.selectedHelper.id,
          fullName: request.selectedHelper.fullName,
          avatarUrl: request.selectedHelper.avatarUrl,
          ratingAvg: request.selectedHelper.ratingAvg,
          completedHelpsCount: request.selectedHelper.completedHelpsCount,
          reliabilityScore: request.selectedHelper.reliabilityScore,
          verificationStatus: request.selectedHelper.verificationStatus,
          ...(isParticipantOrAdmin
            ? {
                email: request.selectedHelper.email,
                phoneNumber: request.selectedHelper.phoneNumber,
              }
            : {}),
        }
      : null;

    const sanitizedOrderRooms = isParticipantOrAdmin
      ? (request.orderRooms || []).map((room) => ({
          id: room.id,
          requestId: room.requestId,
          requesterId: room.requesterId,
          helperId: room.helperId,
          lockedAmount: room.lockedAmount,
          platformFee: room.platformFee,
          helperPayoutAmount: room.helperPayoutAmount,
          orderStatus: room.orderStatus,
          paymentStatus: room.paymentStatus,
          midtransOrderId: room.midtransOrderId,
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        }))
      : [];

    const formatted = {
      id: request.id,
      requesterId: request.requesterId,
      requester: {
        id: request.requester?.id || request.requesterId,
        name: request.requester?.fullName || "Pengguna Bantuin",
        fullName: request.requester?.fullName || "Pengguna Bantuin",
        role:
          request.requester?.accountRole === "user"
            ? "Pengguna Terverifikasi"
            : request.requester?.accountRole || "Pengguna Terverifikasi",
        campus:
          request.requester?.campusName && request.requester.campusName !== "Universitas Indonesia"
            ? request.requester.campusName
            : request.locationName
            ? request.locationName.split(",").slice(1, 3).join(", ").trim()
            : "Bekasi, Jawa Barat",
        avatar:
          request.requester?.avatarUrl && !request.requester.avatarUrl.includes("images.unsplash.com")
            ? request.requester.avatarUrl
            : null,
        avatarUrl:
          request.requester?.avatarUrl && !request.requester.avatarUrl.includes("images.unsplash.com")
            ? request.requester.avatarUrl
            : null,
        rating: Number(request.requester?.ratingAvg) || 5.0,
        ratingCount: request.requester?.ratingCount || 0,
        completedHelps: request.requester?.completedHelpsCount || 0,
        reliability: request.requester?.reliabilityScore || 100,
        verified: request.requester?.verificationStatus === "verified",
      },
      userName: request.requester?.fullName || "Pengguna Bantuin",
      userRole: "Pengguna Terverifikasi",
      userAvatar:
        request.requester?.avatarUrl && !request.requester.avatarUrl.includes("images.unsplash.com")
          ? request.requester.avatarUrl
          : null,
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
      selectedHelper: sanitizedSelectedHelper,
      photos: request.attachments || [],
      attachments: request.attachments || [],
      offers: request.offers.map((o) => {
        const helper = o.helper;
        const helperAvatar =
          helper?.avatarUrl && !helper.avatarUrl.includes("images.unsplash.com") ? helper.avatarUrl : null;
        const helperName = helper?.fullName || "Helper Terverifikasi";
        const helperRole =
          helper?.accountRole === "provider"
            ? "Penyedia Jasa"
            : helper?.accountRole === "partner"
            ? "Mitra Toko"
            : helper?.verificationStatus === "verified"
            ? "Helper Terverifikasi"
            : "Pengguna Komunitas";
        const helperCampus = helper?.campusName || null;
        const helperRating =
          helper?.ratingAvg !== null && helper?.ratingAvg !== undefined ? Number(helper.ratingAvg) : null;
        const completedHelps = typeof helper?.completedHelpsCount === "number" ? helper.completedHelpsCount : 0;

        return {
          id: o.id,
          helperId: o.helperId,
          ...(isParticipantOrAdmin ? { helperEmail: helper?.email || null } : {}),
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
          cvUrl: isParticipantOrAdmin ? o.cvUrl || null : null,
          cvName: o.cvName || null,
          portfolioUrl: o.portfolioUrl || null,
          portfolioName: o.portfolioName || null,
          status: o.status,
          createdAt: o.createdAt,
        };
      }),
      orderRoom:
        sanitizedOrderRooms.find((r) => r.helperId === request.selectedHelperId) ||
        sanitizedOrderRooms[0] ||
        null,
      orderRooms: sanitizedOrderRooms,
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
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;
    const caller = auth.profile;

    const { id } = await params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: {
        offers: true,
        orderRooms: true,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { startMessage } = body;

    const isRequester = existingRequest.requesterId === caller.id;
    const isAdmin = Boolean(caller.isAdmin);
    const isSelectedHelper = Boolean(
      existingRequest.selectedHelperId && existingRequest.selectedHelperId === caller.id
    );
    const hasSubmittedOffer = Boolean(
      existingRequest.offers?.some((o) => o.helperId === caller.id)
    );

    // Otorisasi ketat:
    // - Pemohon (requester) atau Admin dapat memperbarui detail/status permintaan.
    // - Helper hanya diizinkan memperbarui status ke "in_progress" (untuk dirinya sendiri) jika ia adalah selectedHelper atau pelamar pada tugas yang masih terbuka.
    const isAllowedHelperAction =
      !isRequester &&
      !isAdmin &&
      (isSelectedHelper ||
        (hasSubmittedOffer &&
          ["published", "has_offers", "helper_selected"].includes(existingRequest.status))) &&
      body.status === "in_progress" &&
      (!body.selectedHelperId || body.selectedHelperId === caller.id);

    if (!isRequester && !isAdmin && !isAllowedHelperAction) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak. Anda tidak memiliki hak untuk mengubah permintaan bantuan ini.",
        },
        { status: 403 }
      );
    }

    const dataToUpdate = {};

    if (isRequester || isAdmin) {
      if (typeof body.title === "string" && body.title.trim()) {
        dataToUpdate.title = body.title.trim();
      }
      if (typeof body.description === "string" && body.description.trim()) {
        dataToUpdate.description = body.description.trim();
      }
      if (typeof body.category === "string" && body.category.trim()) {
        dataToUpdate.category = body.category.trim();
      }
      if (body.mode === "online" || body.mode === "offline") {
        dataToUpdate.mode = body.mode;
      }
      if (typeof body.locationName === "string") {
        dataToUpdate.locationName = body.locationName;
      }
      if (body.latitude !== undefined) {
        dataToUpdate.latitude = body.latitude !== null ? Number(body.latitude) : null;
      }
      if (body.longitude !== undefined) {
        dataToUpdate.longitude = body.longitude !== null ? Number(body.longitude) : null;
      }
      if (body.deadline) {
        dataToUpdate.deadline = new Date(body.deadline);
      }
      if (body.rewardAmount !== undefined) {
        const parsedReward = Number(body.rewardAmount);
        if (!Number.isNaN(parsedReward) && parsedReward >= 0) {
          dataToUpdate.rewardAmount = parsedReward;
        }
      }
      if (body.isVoluntary !== undefined) {
        dataToUpdate.isVoluntary = Boolean(body.isVoluntary);
      }
      if (Array.isArray(body.attachments)) {
        dataToUpdate.attachments = body.attachments;
      }
      if (body.selectedHelperId && UUID_REGEX.test(String(body.selectedHelperId))) {
        dataToUpdate.selectedHelperId = String(body.selectedHelperId);
      }
    } else if (isAllowedHelperAction) {
      dataToUpdate.selectedHelperId = caller.id;
    }

    if (body.status !== undefined) {
      if (!ALLOWED_REQUEST_STATUSES.has(body.status)) {
        return NextResponse.json(
          { success: false, error: "Status permintaan tidak valid." },
          { status: 400 }
        );
      }

      if (body.status === "cancelled" && !isAdmin) {
        const hasPaidOrCompletedOrder = existingRequest.orderRooms?.some(
          (room) => room.paymentStatus === "PAID" || room.orderStatus === "completed"
        );
        if (hasPaidOrCompletedOrder) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Permintaan bantuan yang sudah memiliki pembayaran terverifikasi (PAID) atau telah selesai tidak dapat dibatalkan secara sepihak.",
              code: "ALREADY_PAID",
            },
            { status: 400 }
          );
        }
      }

      // SEC-03 & BUG-05 guard: Jangan izinkan penyelesaian ("completed") pada tugas berbayar tanpa OrderRoom berstatus PAID & completed
      if (body.status === "completed" && !isAdmin) {
        const isVoluntaryTask =
          Boolean(existingRequest.isVoluntary) || Number(existingRequest.rewardAmount) === 0;
        const hasCompletedPaidOrderRoom = existingRequest.orderRooms?.some(
          (room) => room.paymentStatus === "PAID" && room.orderStatus === "completed"
        );
        if (!isVoluntaryTask && !hasCompletedPaidOrderRoom) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Permintaan bantuan berbayar tidak dapat diselesaikan sebelum pembayaran escrow terverifikasi (PAID) dan pengerjaan dikonfirmasi selesai.",
            },
            { status: 400 }
          );
        }
      }

      dataToUpdate.status = body.status;
    }

    const updated = await prisma.request.update({
      where: { id },
      data: dataToUpdate,
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            campusName: true,
            ratingAvg: true,
            verificationStatus: true,
          },
        },
        selectedHelper: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            ratingAvg: true,
            verificationStatus: true,
          },
        },
      },
    });

    // Jika helper dipilih / status helper_selected / in_progress, sinkronkan OrderRoom TANPA memalsukan paymentStatus = "PAID" (SEC-03)
    if (
      (body.status === "helper_selected" || body.status === "in_progress" || dataToUpdate.selectedHelperId) &&
      updated.selectedHelperId
    ) {
      try {
        const helperId = updated.selectedHelperId;
        const reward = Number(updated.rewardAmount) || 0;
        const platformFee = Math.round(reward * 0.08);
        const helperPayout = reward - platformFee;

        const existingRoom = await prisma.orderRoom.findFirst({
          where: { requestId: updated.id, helperId },
        });

        let currentRoom = existingRoom;
        if (!existingRoom) {
          currentRoom = await prisma.orderRoom.create({
            data: {
              requestId: updated.id,
              requesterId: updated.requesterId,
              helperId,
              lockedAmount: reward,
              platformFee,
              helperPayoutAmount: helperPayout,
              orderStatus: "room_created",
              paymentStatus: "UNPAID",
            },
          });

          await prisma.chatMessage.create({
            data: {
              orderRoomId: currentRoom.id,
              senderId: updated.requesterId,
              message: `Ruang diskusi untuk tugas "${updated.title}". Diskusikan teknis pelaksanaan dan selesaikan pembayaran escrow resmi sebelum penyelesaian tugas.`,
            },
          });
        } else {
          const isAlreadyPaid = existingRoom.paymentStatus === "PAID";
          currentRoom = await prisma.orderRoom.update({
            where: { id: existingRoom.id },
            data: {
              helperId,
              lockedAmount: reward,
              platformFee,
              helperPayoutAmount: helperPayout,
              orderStatus:
                isAlreadyPaid && body.status === "in_progress"
                  ? "item_picked_up"
                  : existingRoom.orderStatus,
            },
          });
        }

        // Jika ada startMessage dari helper (misal saat Mulai Kerjakan diklik)
        if (startMessage && helperId && currentRoom) {
          await prisma.chatMessage
            .create({
              data: {
                orderRoomId: currentRoom.id,
                senderId: caller.id,
                message: String(startMessage).slice(0, 1000),
              },
            })
            .catch(() => null);
        }

        // Tandai tawaran pelamar menjadi accepted di tabel offers hanya jika pemohon/admin yang memilih
        if (isRequester || isAdmin) {
          await prisma.offer.updateMany({
            where: {
              requestId: updated.id,
              helperId,
            },
            data: {
              status: "accepted",
            },
          });
        }
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
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;
    const caller = auth.profile;

    const { id } = await params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    const existingRequest = await prisma.request.findUnique({
      where: { id },
      include: { orderRooms: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (existingRequest.requesterId !== caller.id && !caller.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak. Hanya pemohon tugas atau Admin yang dapat membatalkan permintaan ini.",
        },
        { status: 403 }
      );
    }

    const hasPaidOrCompletedRoom = existingRequest.orderRooms?.some(
      (r) => r.paymentStatus === "PAID" || r.orderStatus === "completed"
    );

    if (hasPaidOrCompletedRoom && !caller.isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Permintaan bantuan yang sudah dibayar di escrow atau sudah selesai tidak dapat dibatalkan secara sepihak. Silakan ajukan pengembalian dana / sengketa.",
        },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Request
      const requestRes = await tx.request.update({
        where: { id },
        data: {
          status: "cancelled",
        },
      });

      // 2. Update all associated unpaid OrderRooms to cancelled
      await tx.orderRoom.updateMany({
        where: {
          requestId: id,
          orderStatus: { notIn: ["completed", "cancelled"] },
          paymentStatus: { not: "PAID" },
        },
        data: {
          orderStatus: "cancelled",
          paymentStatus: "CANCELLED",
        },
      });

      // 3. Update all Offers for this request to cancelled
      await tx.offer.updateMany({
        where: {
          requestId: id,
          status: { notIn: ["accepted"] },
        },
        data: {
          status: "cancelled",
        },
      });

      return requestRes;
    });

    // 4. Send cancellation message to all associated chat rooms
    try {
      const associatedRooms = await prisma.orderRoom.findMany({
        where: { requestId: id },
      });

      for (const room of associatedRooms) {
        await prisma.chatMessage
          .create({
            data: {
              orderRoomId: room.id,
              senderId: room.requesterId,
              message:
                "Permintaan bantuan ini telah resmi dibatalkan oleh pemohon. Seluruh proses pengerjaan dan pembayaran ditutup.",
            },
          })
          .catch(() => null);
      }
    } catch (msgErr) {
      console.warn("Could not post cancellation message to order room:", msgErr);
    }

    return NextResponse.json({
      success: true,
      message: "Permintaan bantuan berhasil dibatalkan beserta seluruh bilik transaksinya.",
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
