import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/user/activities
 * Mengambil seluruh data aktivitas & riwayat transaksi spesifik milik user yang sedang login.
 * Proteksi ketat: Memverifikasi JWT Access Token dan hanya mengembalikan data transaksi
 * di mana user bertindak sebagai pemohon (requester), penyewa (renter), penyedia jasa/helper, atau pemilik (owner).
 */
export async function GET(req) {
  try {
    // 1. Ekstraksi Token Otentikasi
    const authHeader = req.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak. Token otentikasi tidak ditemukan. Silakan login terlebih dahulu.",
        },
        { status: 401 }
      );
    }

    // 2. Verifikasi Token JWT
    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Sesi tidak valid atau telah berakhir. Silakan masuk kembali.",
        },
        { status: 401 }
      );
    }

    // 3. Resolusi Profil Pengguna yang Sedang Login
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
        {
          success: false,
          error: "Profil akun pengguna tidak ditemukan di database.",
        },
        { status: 404 }
      );
    }

    const userId = userProfile.id;

    // 4. Query Database Secara Paralel Terisolasi Hanya untuk Akun Ini
    const [rentalBookings, orderRooms, standaloneRequests] = await Promise.all([
      // a) Transaksi Sewa Alat / Barang (sebagai Penyewa atau Pemilik)
      prisma.rentalBooking.findMany({
        where: {
          OR: [{ renterId: userId }, { ownerId: userId }],
        },
        include: {
          rental: true,
          renter: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              phoneNumber: true,
              email: true,
            },
          },
          owner: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              phoneNumber: true,
              email: true,
              partnerBusinessName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // b) Bilik Transaksi Escrow (Order Room) Aktif & Riwayat (sebagai Pemohon atau Helper)
      prisma.orderRoom.findMany({
        where: {
          OR: [{ requesterId: userId }, { helperId: userId }],
        },
        include: {
          request: {
            include: {
              bantuinPoint: true,
            },
          },
          requester: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              phoneNumber: true,
              email: true,
            },
          },
          helper: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              phoneNumber: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      // c) Permintaan Bantuan / Jasa Terpublikasi yang dibuat user atau di mana user adalah helper / pelamar
      prisma.request.findMany({
        where: {
          OR: [
            { requesterId: userId },
            { selectedHelperId: userId },
            { offers: { some: { helperId: userId } } },
          ],
        },
        include: {
          requester: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              phoneNumber: true,
              email: true,
            },
          },
          selectedHelper: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              phoneNumber: true,
              email: true,
            },
          },
          bantuinPoint: true,
          offers: {
            include: {
              helper: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                  ratingAvg: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Himpun ID request yang sudah memiliki orderRoom agar tidak diduplikasi
    const handledRequestIds = new Set(orderRooms.map((r) => r.requestId));

    // 5. Transformasi & Standardisasi Format Aktivitas
    const activities = [];

    // --- A. Transformasi Rental Bookings ---
    for (const booking of rentalBookings) {
      const isOwner = booking.ownerId === userId;
      const partner = isOwner ? booking.renter : booking.owner;
      const partnerName = isOwner
        ? booking.renter?.fullName || "Penyewa"
        : booking.owner?.partnerBusinessName || booking.owner?.fullName || "Mitra Rental";

      const isCancelled = booking.bookingStatus === "cancelled";
      const isCompleted =
        booking.bookingStatus === "verified_settled" ||
        booking.bookingStatus === "returned" ||
        isCancelled;
      const isOngoing = !isCompleted && !isCancelled;

      activities.push({
        id: booking.id,
        orderType: "rental",
        categoryType: "sewa",
        categoryPill: "Sewa",
        isRental: true,
        isBantuan: false,
        isJasa: false,
        title: booking.rental?.title || "Sewa Alat",
        requestTitle: booking.rental?.title || "Sewa Alat",
        orderStatus: booking.bookingStatus,
        status: booking.bookingStatus,
        lockedAmount: Number(booking.totalAmount || 0),
        rentalFee: Number(booking.rentalFee || 0),
        depositFee: Number(booking.depositFee || 0),
        image:
          booking.rental?.photoUrls?.[0] ||
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
        partner: {
          id: partner?.id,
          name: partnerName,
          avatar: partner?.avatarUrl,
          phone: partner?.phoneNumber,
          isOwnerRole: isOwner,
        },
        rentalDetails: {
          unitName: booking.rental?.title,
          startDate: booking.startDate ? new Date(booking.startDate).toISOString().split("T")[0] : "",
          endDate: booking.endDate ? new Date(booking.endDate).toISOString().split("T")[0] : "",
          durationDays: booking.totalDays || 1,
          photoUrl: booking.rental?.photoUrls?.[0],
          depositAmount: Number(booking.depositFee || 0),
          location: booking.rental?.pickupLocation,
        },
        pickupPoint: booking.rental?.pickupLocation || "Lokasi Mitra Rental",
        isCancelled,
        isCompleted,
        isOngoing,
        chatRoomId: booking.id,
        createdAt: booking.createdAt,
      });
    }

    // --- B. Transformasi Order Rooms ---
    for (const room of orderRooms) {
      const isRequester = room.requesterId === userId;
      const partner = isRequester ? room.helper : room.requester;
      const partnerName = isRequester
        ? room.helper?.fullName || "Helper Terpilih"
        : room.requester?.fullName || "Pemohon";

      const categoryName = (room.request?.category || "").toLowerCase();
      const isJasa = categoryName.includes("jasa") || categoryName.includes("desain") || categoryName.includes("servis");
      const orderType = isJasa ? "service" : "task";
      const categoryType = isJasa ? "jasa" : "bantuan";
      const categoryPill = isJasa ? "Jasa" : "Bantuan";

      const isCancelled = room.orderStatus === "cancelled";
      const isCompleted = room.orderStatus === "completed" || isCancelled;
      const isOngoing = !isCompleted && !isCancelled;

      activities.push({
        id: room.id,
        orderRoomId: room.id,
        requestId: room.requestId,
        orderType,
        categoryType,
        categoryPill,
        isRental: false,
        isBantuan: !isJasa,
        isJasa,
        title: room.request?.title || "Bantuan Transaksi",
        requestTitle: room.request?.title || "Bantuan Transaksi",
        orderStatus: room.orderStatus,
        status: room.orderStatus,
        lockedAmount: Number(room.lockedAmount || 0),
        platformFee: Number(room.platformFee || 0),
        image:
          room.request?.attachments?.[0] ||
          (isRequester ? room.helper?.avatarUrl : room.requester?.avatarUrl) ||
          "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
        partner: {
          id: partner?.id,
          name: partnerName,
          avatar: partner?.avatarUrl,
          phone: partner?.phoneNumber,
        },
        pickupPoint:
          room.request?.bantuinPoint?.name ||
          room.request?.locationName ||
          "Titik Temu Aman",
        isCancelled,
        isCompleted,
        isOngoing,
        chatRoomId: room.id,
        createdAt: room.createdAt,
      });
    }

    // --- C. Transformasi Standalone Requests (Permintaan Bantuan yang Belum Memiliki Order Room) ---
    for (const reqItem of standaloneRequests) {
      if (handledRequestIds.has(reqItem.id)) continue;

      const isRequester = reqItem.requesterId === userId;
      const isSelectedHelper = reqItem.selectedHelperId === userId;
      const myOffer = reqItem.offers?.find((o) => o.helperId === userId);

      const categoryName = (reqItem.category || "").toLowerCase();
      const isJasa = categoryName.includes("jasa") || categoryName.includes("desain") || categoryName.includes("servis");
      const orderType = isJasa ? "service" : "task";
      const categoryType = isJasa ? "jasa" : "bantuan";
      const categoryPill = isJasa ? "Jasa" : "Bantuan";

      const isOfferRejected = myOffer && myOffer.status === "rejected" && !isSelectedHelper;
      const isCancelled = reqItem.status === "cancelled" || isOfferRejected;
      const isCompleted = reqItem.status === "completed" || isCancelled;
      const isOngoing = !isCompleted && !isCancelled;

      let partner;
      let partnerName = "Mencari Helper...";

      if (isRequester) {
        if (reqItem.selectedHelper) {
          partner = reqItem.selectedHelper;
          partnerName = reqItem.selectedHelper.fullName;
        } else if (reqItem.offers && reqItem.offers.length > 0) {
          partner = reqItem.offers[0].helper;
          partnerName = `${reqItem.offers.length} Helper Melamar`;
        }
      } else {
        // User bertindak sebagai Helper
        partner = reqItem.requester;
        partnerName = reqItem.requester?.fullName || "Pemohon";
      }

      // Tentukan status yang sesuai untuk ditampilkan di UI
      let derivedStatus = reqItem.status;
      if (isSelectedHelper && (reqItem.status === "published" || reqItem.status === "has_offers")) {
        derivedStatus = "helper_selected";
      } else if (!isRequester && myOffer && !isSelectedHelper) {
        if (myOffer.status === "accepted") {
          derivedStatus = "helper_selected";
        } else if (myOffer.status === "rejected") {
          derivedStatus = "cancelled";
        } else {
          derivedStatus = "submitted";
        }
      }

      activities.push({
        id: reqItem.id,
        requestId: reqItem.id,
        orderType,
        categoryType,
        categoryPill,
        isRental: false,
        isBantuan: !isJasa,
        isJasa,
        title: reqItem.title,
        requestTitle: reqItem.title,
        orderStatus: derivedStatus,
        status: derivedStatus,
        lockedAmount: Number(myOffer?.proposedPrice || reqItem.rewardAmount || 0),
        image:
          reqItem.attachments?.[0] ||
          (isRequester
            ? (reqItem.selectedHelper?.avatarUrl || "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80")
            : (reqItem.requester?.avatarUrl || "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80")),
        partner: {
          id: partner?.id || null,
          name: partnerName,
          avatar: partner?.avatarUrl || null,
          phone: partner?.phoneNumber || null,
        },
        pickupPoint:
          reqItem.bantuinPoint?.name ||
          reqItem.locationName ||
          "Lokasi Permintaan",
        isCancelled,
        isCompleted,
        isOngoing,
        chatRoomId: reqItem.id,
        createdAt: reqItem.createdAt,
      });
    }

    // 6. Urutkan berdasarkan waktu transaksi terbaru
    activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return NextResponse.json({
      success: true,
      count: activities.length,
      data: activities,
    });
  } catch (error) {
    console.error("GET /api/user/activities Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data aktivitas pengguna.",
      },
      { status: 500 }
    );
  }
}
