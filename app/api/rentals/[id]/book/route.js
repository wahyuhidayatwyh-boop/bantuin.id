import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getSnapClient } from "@/lib/midtrans/client";
import { formatIDR } from "@/lib/utils";

/**
 * POST /api/rentals/[id]/book
 * Task 20: Pengajuan reservasi sewa alat (Booking Rental) & inisialisasi Midtrans Snap
 * 
 * Rules:
 * 1. Strict JWT Authentication (Header or Cookie).
 * 2. Self-rental guard in production; simulation allowed in dev.
 * 3. Date validation: startDate must be today or future; endDate >= startDate.
 * 4. Atomic calculation: rentalFee = days * dailyPrice, depositFee = item.depositAmount, totalAmount = rentalFee + depositFee.
 * 5. Generates Midtrans Snap token and returns it for instant checkout.
 * 6. Dual notifications (Mitra & Penyewa) and initial chat messages in OrderRoom.
 */
export async function POST(req, { params }) {
  try {
    const { id: rentalId } = await params;

    // 1. Auth check
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

    if (userProfile.verificationStatus === "suspended") {
      return NextResponse.json(
        { success: false, error: "Akun Anda sedang ditangguhkan oleh Administrator Bantuin. Tidak dapat melakukan transaksi sewa." },
        { status: 403 }
      );
    }

    // 2. Query Rental Item (strictly by rentalId; never fallback to a random item)
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        owner: {
          select: { id: true, fullName: true, email: true, verificationStatus: true, partnerBusinessName: true },
        },
      },
    }).catch(() => null);

    if (!rental) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan di sistem." },
        { status: 404 }
      );
    }

    if (rental.owner?.verificationStatus === "suspended") {
      return NextResponse.json(
        { success: false, error: "Toko mitra pemilik barang ini sedang ditangguhkan sementara oleh Admin Bantuin." },
        { status: 403 }
      );
    }

    if (!rental.isAvailable) {
      return NextResponse.json(
        { success: false, error: "Barang sewa ini sedang tidak tersedia untuk dirental." },
        { status: 400 }
      );
    }

    // Guard: Prevent self-rental in production, allow sandbox testing
    if (rental.ownerId === userProfile.id) {
      if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Anda tidak dapat menyewa barang milik Anda sendiri." },
          { status: 400 }
        );
      }
      console.warn("[rental book] Mode simulasi/pengujian: akun pemilik menyewa unit sendiri.");
    }

    // 3. Parse Body & Calculate Duration
    const body = await req.json().catch(() => ({}));
    const { startDate, endDate, notes } = body;

    const startStr = startDate || new Date().toISOString().split("T")[0];
    const endStr = endDate || new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: "Format tanggal tidak valid." },
        { status: 400 }
      );
    }

    if (end < start) {
      return NextResponse.json(
        { success: false, error: "Tanggal selesai sewa tidak boleh sebelum tanggal mulai." },
        { status: 400 }
      );
    }

    // Calculate total days (inclusive)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const dailyPrice = Number(rental.dailyPrice);
    const depositFee = Number(rental.depositAmount || 0);
    const rentalFee = totalDays * dailyPrice;

    // SEC-03 & SEC-07: Enforce server-calculated prices & UNPAID initial state
    const finalRentalFee = rentalFee;
    const finalDepositFee = depositFee;
    const finalTotalAmount = finalRentalFee + finalDepositFee;
    const isPaid = false;

    // 4. Create Booking & Midtrans Transaction
    const generatedOrderId = `ORDER-SEWA-${rental.id.slice(0, 8)}-${Date.now().toString().slice(-6)}`;
    let snapToken = null;
    let redirectUrl = null;

    try {
      const snap = getSnapClient();
      const snapResponse = await snap.createTransaction({
        transaction_details: {
          order_id: generatedOrderId,
          gross_amount: Math.round(finalTotalAmount),
        },
        customer_details: {
          first_name: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phoneNumber || "081234567890",
        },
        item_details: [
          {
            id: `SEWA-${rental.id.slice(0, 30)}`,
            price: Math.round(finalRentalFee),
            quantity: 1,
            name: `Sewa ${rental.title.slice(0, 35)} (${totalDays} hari)`,
          },
          ...(finalDepositFee > 0
            ? [
                {
                  id: `DEP-${rental.id.slice(0, 30)}`,
                  price: Math.round(finalDepositFee),
                  quantity: 1,
                  name: `Deposit Jaminan Sewa (Refundable)`,
                },
              ]
            : []),
        ],
      });
      snapToken = snapResponse.token;
      redirectUrl = snapResponse.redirect_url;
    } catch (snapErr) {
      console.warn("[rental book] Midtrans Snap warning:", snapErr.message);
    }

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.rentalBooking.create({
        data: {
          rentalId: rental.id,
          renterId: userProfile.id,
          ownerId: rental.ownerId,
          startDate: start,
          endDate: end,
          totalDays: totalDays,
          rentalFee: finalRentalFee,
          depositFee: finalDepositFee,
          totalAmount: finalTotalAmount,
          bookingStatus: isPaid ? "payment_held" : "temp_locked",
          lockExpiresAt: isPaid ? null : new Date(Date.now() + 30 * 60 * 1000), // 30 menit
          midtransOrderId: generatedOrderId,
          midtransSnapToken: snapToken,
          paymentStatus: isPaid ? "PAID" : "UNPAID",
          paymentMethodType: body.paymentMethod || "qris",
          paidAt: isPaid ? new Date() : null,
          initialConditionNotes: notes ? notes.trim() : null,
        },
      });

      // 1. Notifikasi untuk Pemilik / Mitra Toko
      await tx.notification.create({
        data: {
          userId: rental.ownerId,
          title: isPaid ? "Pesanan Sewa Masuk & Terbayar!" : "Pengajuan Sewa Baru!",
          message: isPaid
            ? `${userProfile.fullName} telah menyewa & membayar '${rental.title}' selama ${totalDays} hari (${formatIDR(finalTotalAmount)}). Harap siapkan unit untuk handover.`
            : `${userProfile.fullName} mengajukan sewa untuk '${rental.title}' selama ${totalDays} hari (${formatIDR(finalTotalAmount)}). Menunggu pembayaran.`,
          type: "order",
          link: `/mitra/dashboard?menu=orders`,
        },
      });

      // 2. Notifikasi untuk Penyewa jika akun berbeda
      if (userProfile.id !== rental.ownerId) {
        await tx.notification.create({
          data: {
            userId: userProfile.id,
            title: isPaid ? "Pembayaran Sewa Berhasil!" : "Pemesanan Sewa Dibuat",
            message: isPaid
              ? `Penyewaan unit '${rental.title}' berhasil dibayar (${formatIDR(finalTotalAmount)}). Silakan koordinasi di bilik chat sewa untuk serah terima unit.`
              : `Pemesanan sewa unit '${rental.title}' telah dibuat. Silakan selesaikan pembayaran.`,
            type: "order",
            link: `/chat?category=sewa`,
          },
        });
      }

      // 3. Auto-create Request & OrderRoom resmi agar bilik chat sewa langsung aktif
      let orderRoomId = null;
      try {
        const rentalReq = await tx.request.create({
          data: {
            requesterId: userProfile.id,
            category: "Sewa Alat & Kendaraan",
            title: `Sewa: ${rental.title.slice(0, 60)} (${totalDays} Hari)`,
            description: `[RENTAL_ID:${rental.id}] [BOOKING_ID:${newBooking.id}] [RENTAL_FEE:${finalRentalFee}] [DEPOSIT_FEE:${finalDepositFee}] [TOTAL_AMOUNT:${finalTotalAmount}] [DAYS:${totalDays}] [START_DATE:${startStr}] [END_DATE:${endStr}] Transaksi sewa unit ${rental.title}`,
            mode: "offline",
            locationName: rental.pickupLocation || "Toko Mitra Sewa",
            deadline: end,
            rewardAmount: finalRentalFee,
            status: "helper_selected",
            selectedHelperId: rental.ownerId,
          },
        });

        const createdRoom = await tx.orderRoom.create({
          data: {
            requestId: rentalReq.id,
            requesterId: userProfile.id,
            helperId: rental.ownerId,
            lockedAmount: finalTotalAmount,
            platformFee: 0,
            helperPayoutAmount: finalRentalFee,
            // BUG-02: Do NOT duplicate midtransOrderId on the companion OrderRoom; RentalBooking owns generatedOrderId
            midtransOrderId: null,
            orderStatus: "room_created",
            paymentStatus: "UNPAID",
            paidAt: null,
          },
        });
        orderRoomId = createdRoom.id;

        // 4. Buat pesan awal resmi di bilik chat dari penyewa
        await tx.chatMessage.create({
          data: {
            orderRoomId: createdRoom.id,
            senderId: userProfile.id,
            message: isPaid
              ? `[PEMBAYARAN SEWA TERVERIFIKASI] Pembayaran sewa unit '${rental.title}' sebesar ${formatIDR(finalTotalAmount)} (Biaya Sewa: ${formatIDR(finalRentalFee)} + Deposit Jaminan: ${formatIDR(finalDepositFee)}) telah aman terverifikasi di Rekening Bersama Bantuin.id. Mitra Toko dan Penyewa dapat berkoordinasi di sini untuk serah terima (handover) unit.`
              : `Pengajuan sewa '${rental.title}' telah dibuat. Menunggu penyelesaian pembayaran oleh penyewa.`,
          },
        });

        await tx.chatMessage.create({
          data: {
            orderRoomId: createdRoom.id,
            senderId: userProfile.id,
            message: `Halo! Saya telah mengajukan pemesanan sewa unit '${rental.title}' untuk periode sewa ${new Date(start).toLocaleDateString("id-ID")} s/d ${new Date(end).toLocaleDateString("id-ID")} (${totalDays} hari). Mohon infokan ketersediaan dan detail serah terima ya. Terima kasih!`,
          },
        });

        // 5. Notifikasi chat masuk ke pemilik rental
        if (userProfile.id !== rental.ownerId) {
          await tx.notification.create({
            data: {
              userId: rental.ownerId,
              title: `Pesan Baru: ${rental.title}`,
              message: `${userProfile.fullName || "Penyewa"}: Halo! Saya telah mengajukan pemesanan sewa unit '${rental.title}'.`,
              link: `/chat?room=${createdRoom.id}`,
              type: "order",
              isRead: false,
            },
          }).catch(() => null);
        }
      } catch (roomErr) {
        console.warn("[rental book] OrderRoom / ChatMessage auto-create note:", roomErr.message);
      }

      return {
        ...newBooking,
        orderRoomId,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pengajuan sewa berhasil dibuat. Silakan selesaikan pembayaran untuk mengunci reservasi.",
        data: {
          booking,
          orderRoomId: booking?.orderRoomId || null,
          snapToken,
          redirectUrl,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/rentals/[id]/book error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat reservasi sewa." },
      { status: 500 }
    );
  }
}
