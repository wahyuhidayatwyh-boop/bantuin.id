import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

/**
 * GET /api/user/activities
 * Mengambil seluruh data aktivitas & riwayat transaksi spesifik milik user yang sedang login.
 * Proteksi ketat: Memverifikasi JWT Access Token (header/cookie) dan hanya mengembalikan data transaksi
 * di mana user bertindak sebagai pemohon (requester), penyewa (renter), penyedia jasa/helper, atau pemilik (owner).
 */
export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;
    const userProfile = auth.profile;
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
          "/logotab.png",
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
      const isSelfOrder = room.requesterId === room.helperId;
      const isRequester = room.requesterId === userId;
      const isHelper = room.helperId === userId;
      const userRole = isSelfOrder ? "helper" : (isRequester ? "requester" : "helper");

      const partner = isSelfOrder
        ? (room.helper || room.requester)
        : (isRequester ? room.helper : room.requester);
      const partnerName = partner?.fullName || (isRequester ? "Helper Terpilih" : "Pemohon");

      const categoryName = (room.request?.category || "").toLowerCase();
      const reqTitle = (room.request?.title || "").toLowerCase();
      const isJasa =
        categoryName.includes("jasa") ||
        categoryName.includes("desain") ||
        categoryName.includes("servis") ||
        categoryName.includes("logo") ||
        categoryName.includes("grafis") ||
        categoryName.includes("web") ||
        categoryName.includes("foto") ||
        categoryName.includes("video") ||
        categoryName.includes("edit") ||
        categoryName.includes("3d") ||
        categoryName.includes("program") ||
        reqTitle.includes("jasa") ||
        reqTitle.includes("desain") ||
        reqTitle.includes("layanan");
      const orderType = isJasa ? "service" : "task";
      const categoryType = isJasa ? "jasa" : "bantuan";
      const categoryPill = isJasa ? "Jasa" : "Bantuan";

      const isCancelled = room.orderStatus === "cancelled" || room.request?.status === "cancelled";
      const isCompleted = room.orderStatus === "completed" || room.request?.status === "completed" || isCancelled;
      const isOngoing = !isCompleted && !isCancelled;
      const resolvedStatus = isCancelled ? "cancelled" : room.orderStatus;

      activities.push({
        id: room.id,
        orderRoomId: room.id,
        requestId: room.requestId,
        requesterId: room.requesterId,
        helperId: room.helperId,
        providerId: room.helperId,
        orderType,
        categoryType,
        categoryPill,
        isRental: false,
        isBantuan: !isJasa,
        isJasa,
        title: room.request?.title || "Bantuan Transaksi",
        requestTitle: room.request?.title || "Bantuan Transaksi",
        orderStatus: resolvedStatus,
        status: resolvedStatus,
        userRole,
        isRequester: Boolean(isRequester),
        isHelper: Boolean(isHelper || isSelfOrder),
        paymentStatus: isCancelled && room.paymentStatus !== "PAID" ? "CANCELLED" : (room.paymentStatus || "UNPAID"),
        lockedAmount: Number(room.lockedAmount || 0),
        platformFee: Number(room.platformFee || 0),
        image:
          room.request?.attachments?.[0] ||
          (isRequester ? room.helper?.avatarUrl : room.requester?.avatarUrl) ||
          "/logotab.png",
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
      if (reqItem.status === "cancelled") {
        derivedStatus = "cancelled";
      } else if (isSelectedHelper && (reqItem.status === "published" || reqItem.status === "has_offers")) {
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
        userRole: isRequester ? "requester" : "helper",
        isRequester: Boolean(isRequester),
        isHelper: !isRequester,
        offersCount: reqItem.offers?.length || 0,
        paymentStatus: "UNPAID",
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

/**
 * DELETE /api/user/activities
 * Menghapus aktivitas yang DIBATALKAN (cancelled & belum dibayar) dari database.
 * Aturan ketat (SEC-04 Ledger Integrity):
 * - Transaksi yang masih berjalan TIDAK DAPAT DIHAPUS.
 * - Transaksi yang SUDAH SELESAI / DIBAYAR (completed / PAID / verified_settled / returned)
 *   merupakan bukti buku besar (ledger) finansial dan TIDAK BOLEH DIHAPUS dari database.
 */
export async function DELETE(req) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;
    const userProfile = auth.profile;
    const userId = userProfile.id;

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const id = searchParams.get("id") || body.id;
    const isAllCompleted = searchParams.get("allCompleted") === "true" || body.allCompleted === true;

    // A. Bersihkan seluruh aktivitas yang dibatalkan & belum memiliki penyelesaian finansial (Bulk Cleanup)
    if (isAllCompleted) {
      // 1. Hanya OrderRooms yang statusnya cancelled dan belum PAID (SEC-04: jangan hapus completed/PAID!)
      const cancelledUnpaidRooms = await prisma.orderRoom.findMany({
        where: {
          OR: [{ requesterId: userId }, { helperId: userId }],
          orderStatus: "cancelled",
          paymentStatus: { not: "PAID" },
        },
        select: { id: true, requestId: true },
      });

      const cancelledRoomIds = cancelledUnpaidRooms.map((r) => r.id);
      if (cancelledRoomIds.length > 0) {
        await prisma.chatMessage.deleteMany({
          where: { orderRoomId: { in: cancelledRoomIds } },
        });
        await prisma.orderRoom.deleteMany({
          where: { id: { in: cancelledRoomIds } },
        });
      }

      // 2. Hanya RentalBookings yang statusnya cancelled dan belum PAID (SEC-04: jangan hapus verified_settled/returned/PAID!)
      await prisma.rentalBooking.deleteMany({
        where: {
          OR: [{ renterId: userId }, { ownerId: userId }],
          bookingStatus: "cancelled",
          paymentStatus: { not: "PAID" },
        },
      });

      // 3. Hanya Requests milik user yang statusnya cancelled dan tidak punya OrderRoom berstatus PAID/completed
      const userCancelledRequests = await prisma.request.findMany({
        where: {
          requesterId: userId,
          status: "cancelled",
          orderRooms: {
            none: {
              OR: [{ orderStatus: "completed" }, { paymentStatus: "PAID" }],
            },
          },
        },
        select: { id: true },
      });

      const cancelledReqIds = userCancelledRequests.map((r) => r.id);
      if (cancelledReqIds.length > 0) {
        await prisma.report.deleteMany({
          where: { targetRequestId: { in: cancelledReqIds } },
        });
        await prisma.chatMessage.deleteMany({
          where: { orderRoom: { requestId: { in: cancelledReqIds } } },
        });
        await prisma.orderRoom.deleteMany({
          where: {
            requestId: { in: cancelledReqIds },
            orderStatus: "cancelled",
            paymentStatus: { not: "PAID" },
          },
        });
        await prisma.offer.deleteMany({
          where: { requestId: { in: cancelledReqIds } },
        });
        await prisma.request.deleteMany({
          where: { id: { in: cancelledReqIds } },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Seluruh riwayat aktivitas yang dibatalkan berhasil dibersihkan. Catatan transaksi selesai tetap disimpan sebagai bukti buku besar.",
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID aktivitas atau pesanan yang ingin dihapus diperlukan." },
        { status: 400 }
      );
    }

    // B. Hapus satu aktivitas spesifik berdasarkan ID
    // 1. Cek apakah ada di OrderRoom
    const orderRoom = await prisma.orderRoom.findFirst({
      where: {
        id,
        OR: [{ requesterId: userId }, { helperId: userId }],
      },
    });

    if (orderRoom) {
      if (orderRoom.orderStatus === "completed" || orderRoom.paymentStatus === "PAID") {
        return NextResponse.json(
          {
            success: false,
            error: "Transaksi yang telah selesai atau memiliki pembayaran terverifikasi merupakan catatan buku besar (ledger) dan tidak dapat dihapus dari database.",
          },
          { status: 403 }
        );
      }

      if (orderRoom.orderStatus !== "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "Pesanan ini masih aktif. Hanya pesanan yang telah dibatalkan (cancelled) yang dapat dihapus dari database.",
          },
          { status: 400 }
        );
      }

      await prisma.chatMessage.deleteMany({ where: { orderRoomId: orderRoom.id } });
      await prisma.orderRoom.delete({ where: { id: orderRoom.id } });

      return NextResponse.json({
        success: true,
        message: "Riwayat pesanan yang dibatalkan berhasil dihapus dari database.",
      });
    }

    // 2. Cek apakah ada di RentalBooking
    const rentalBooking = await prisma.rentalBooking.findFirst({
      where: {
        id,
        OR: [{ renterId: userId }, { ownerId: userId }],
      },
    });

    if (rentalBooking) {
      if (
        rentalBooking.paymentStatus === "PAID" ||
        ["verified_settled", "returned", "payment_held", "handed_over", "in_use"].includes(rentalBooking.bookingStatus)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Transaksi sewa yang telah dibayar atau selesai merupakan catatan buku besar (ledger) dan tidak dapat dihapus dari database.",
          },
          { status: 403 }
        );
      }

      if (rentalBooking.bookingStatus !== "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "Transaksi sewa ini masih aktif. Hanya sewa yang telah dibatalkan yang dapat dihapus dari database.",
          },
          { status: 400 }
        );
      }

      await prisma.rentalBooking.delete({ where: { id: rentalBooking.id } });

      return NextResponse.json({
        success: true,
        message: "Riwayat sewa yang dibatalkan berhasil dihapus dari database.",
      });
    }

    // 3. Cek apakah ada di Request
    const standaloneReq = await prisma.request.findFirst({
      where: {
        id,
        OR: [{ requesterId: userId }, { selectedHelperId: userId }],
      },
      include: { orderRooms: true },
    });

    if (standaloneReq) {
      const hasSettledOrderRoom = standaloneReq.orderRooms?.some(
        (r) => r.orderStatus === "completed" || r.paymentStatus === "PAID"
      );
      if (standaloneReq.status === "completed" || hasSettledOrderRoom) {
        return NextResponse.json(
          {
            success: false,
            error: "Permintaan yang telah selesai merupakan catatan buku besar (ledger) dan tidak dapat dihapus dari database.",
          },
          { status: 403 }
        );
      }

      if (standaloneReq.status !== "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "Permintaan bantuan ini masih berjalan. Hanya permintaan yang telah dibatalkan yang dapat dihapus.",
          },
          { status: 400 }
        );
      }

      // Hapus relasi anak sebelum menghapus request
      await prisma.report.deleteMany({ where: { targetRequestId: standaloneReq.id } });
      await prisma.chatMessage.deleteMany({ where: { orderRoom: { requestId: standaloneReq.id } } });
      await prisma.orderRoom.deleteMany({
        where: {
          requestId: standaloneReq.id,
          orderStatus: "cancelled",
          paymentStatus: { not: "PAID" },
        },
      });
      await prisma.offer.deleteMany({ where: { requestId: standaloneReq.id } });
      await prisma.request.delete({ where: { id: standaloneReq.id } });

      return NextResponse.json({
        success: true,
        message: "Riwayat aktivitas yang dibatalkan berhasil dihapus dari database.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Aktivitas tidak ditemukan atau Anda tidak memiliki akses." },
      { status: 404 }
    );
  } catch (error) {
    console.error("DELETE /api/user/activities Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus aktivitas." },
      { status: 500 }
    );
  }
}
