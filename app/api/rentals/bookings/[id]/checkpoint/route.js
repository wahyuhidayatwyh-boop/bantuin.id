import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/rentals/bookings/[id]/checkpoint
 * Task 21: Checkpoint foto kondisi fisik serah-terima & pengembalian unit
 * 
 * Rules:
 * 1. Strict JWT Authentication: Caller must be the renter, owner, or platform admin.
 * 2. checkpointType:
 *    - 'initial': Foto kondisi saat serah terima barang ke penyewa
 *    - 'return': Foto kondisi saat pengembalian barang ke pemilik
 * 3. Saves uploaded photos and notes to RentalBooking table.
 */
export async function POST(req, { params }) {
  try {
    const { id } = await params;

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

    // 2. Query Booking
    const booking = await prisma.rentalBooking.findUnique({
      where: { id },
      include: {
        rental: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Data booking sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    const isRenter = booking.renterId === userProfile.id;
    const isOwner = booking.ownerId === userProfile.id;
    const isAdmin = userProfile.isAdmin;

    if (!isRenter && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pihak yang bertransaksi dalam sewa ini." },
        { status: 403 }
      );
    }

    // 3. Parse Body
    const body = await req.json().catch(() => ({}));
    const { checkpointType = "initial", photos = [], notes = "" } = body;

    const photoList = Array.isArray(photos) ? photos : photos ? [photos] : [];
    const updateData = {};

    if (checkpointType === "return") {
      updateData.returnConditionPhotos = photoList;
      if (notes) updateData.returnConditionNotes = notes.trim();
    } else {
      updateData.initialConditionPhotos = photoList;
      if (notes) updateData.initialConditionNotes = notes.trim();
    }

    const updated = await prisma.rentalBooking.update({
      where: { id },
      data: updateData,
    });

    // Notify other party
    const targetUserId = isRenter ? booking.ownerId : booking.renterId;
    await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: `Checkpoint Kondisi Barang Diunggah`,
        message: `${userProfile.fullName} telah mengunggah dokumentasi kondisi fisik (${checkpointType === "return" ? "Pengembalian" : "Serah Terima"}) untuk '${booking.rental.title}'.`,
        type: "order",
        link: `/activity`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Dokumentasi kondisi fisik (${checkpointType}) berhasil disimpan.`,
      data: updated,
    });
  } catch (err) {
    console.error("[POST /api/rentals/bookings/[id]/checkpoint error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyimpan checkpoint kondisi sewa." },
      { status: 500 }
    );
  }
}
