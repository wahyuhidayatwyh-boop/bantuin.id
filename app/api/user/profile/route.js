import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import bcrypt from "bcryptjs";

/**
 * GET /api/user/profile
 * Mengambil profil lengkap pengguna dari database Prisma / Neon DB
 * berdasarkan JWT Access Token yang aktif.
 */
export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Token otentikasi tidak ditemukan." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid atau telah kedaluwarsa." },
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
        { success: false, error: "Profil pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Hitung statistik transaksi riil dari database
    const [completedRequestsCount, completedBookingsCount] = await Promise.all([
      prisma.request.count({
        where: {
          OR: [
            { requesterId: userProfile.id, status: "completed" },
            { selectedHelperId: userProfile.id, status: "completed" },
          ],
        },
      }).catch(() => 0),
      prisma.rentalBooking.count({
        where: {
          OR: [
            { renterId: userProfile.id, bookingStatus: "verified_settled" },
            { ownerId: userProfile.id, bookingStatus: "verified_settled" },
          ],
        },
      }).catch(() => 0),
    ]);

    const totalCompleted = completedRequestsCount + completedBookingsCount;

    const data = {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.fullName || "",
      phoneNumber: userProfile.phoneNumber || "",
      avatarUrl: userProfile.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      bio: userProfile.bio || "",
      campusName: userProfile.campusName || "Bekasi Barat, Kota Bekasi",
      accountRole: userProfile.accountRole || "user",
      isPartner: userProfile.isPartner || false,
      isAdmin: userProfile.isAdmin || false,
      partnerBusinessName: userProfile.partnerBusinessName || "",
      partnerAddress: userProfile.partnerAddress || "",
      verificationStatus: userProfile.verificationStatus || "unverified",
      idNumber: userProfile.idNumber || "",
      idCardUrl: userProfile.idCardUrl || null,
      selfieUrl: userProfile.selfieUrl || null,
      payoutBank: userProfile.payoutBank || "BCA",
      payoutAccountNumber: userProfile.payoutAccountNumber || "",
      payoutAccountHolder: userProfile.payoutAccountHolder || userProfile.fullName || "",
      ratingAvg: Number(userProfile.ratingAvg) || 5.0,
      ratingCount: userProfile.ratingCount || 0,
      completedHelpsCount: totalCompleted > 0 ? totalCompleted : (userProfile.completedHelpsCount || 0),
      reliabilityScore: userProfile.reliabilityScore || 100,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan pada server saat memuat profil." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/profile
 * Memperbarui informasi profil, kontak, rekening pencairan, avatar, atau kata sandi di database Prisma.
 */
export async function PUT(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Token otentikasi tidak ditemukan." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid atau telah kedaluwarsa." },
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
        { success: false, error: "Profil pengguna tidak ditemukan di database." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      phoneNumber,
      campusName,
      bio,
      avatarUrl,
      payoutBank,
      payoutAccountNumber,
      payoutAccountHolder,
      idNumber,
      idCardUrl,
      selfieUrl,
      currentPassword,
      newPassword,
    } = body;

    const updateData = {};

    // 1. Update info profil umum
    if (typeof fullName === "string" && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }
    if (typeof phoneNumber === "string") {
      updateData.phoneNumber = phoneNumber.trim();
    }
    if (typeof campusName === "string") {
      updateData.campusName = campusName.trim();
    }
    if (typeof bio === "string") {
      updateData.bio = bio.trim();
    }
    if (typeof avatarUrl === "string" && avatarUrl.trim()) {
      updateData.avatarUrl = avatarUrl.trim();
    }

    // 2. Update info rekening pencairan
    if (typeof payoutBank === "string" && payoutBank.trim()) {
      updateData.payoutBank = payoutBank.trim();
    }
    if (typeof payoutAccountNumber === "string") {
      updateData.payoutAccountNumber = payoutAccountNumber.trim();
    }
    if (typeof payoutAccountHolder === "string") {
      updateData.payoutAccountHolder = payoutAccountHolder.trim();
    }

    // 3. Update info KYC jika diberikan
    if (typeof idNumber === "string" && idNumber.trim()) {
      updateData.idNumber = idNumber.trim();
    }
    if (typeof idCardUrl === "string" && idCardUrl.trim()) {
      updateData.idCardUrl = idCardUrl.trim();
    }
    if (typeof selfieUrl === "string" && selfieUrl.trim()) {
      updateData.selfieUrl = selfieUrl.trim();
    }

    // 4. Update Kata Sandi jika diminta
    if (newPassword) {
      if (!currentPassword && userProfile.password) {
        return NextResponse.json(
          { success: false, error: "Kata sandi saat ini wajib diisi untuk mengubah kata sandi." },
          { status: 400 }
        );
      }

      if (userProfile.password) {
        let isMatch = false;
        if (userProfile.password.startsWith("$2a$") || userProfile.password.startsWith("$2b$") || userProfile.password.startsWith("$2y$")) {
          isMatch = await bcrypt.compare(currentPassword, userProfile.password);
        } else {
          isMatch = currentPassword === userProfile.password;
        }

        if (!isMatch) {
          return NextResponse.json(
            { success: false, error: "Kata sandi saat ini tidak sesuai." },
            { status: 400 }
          );
        }
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "Kata sandi baru minimal harus 8 karakter." },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Simpan ke Prisma Profile
    const updatedProfile = await prisma.profile.update({
      where: { id: userProfile.id },
      data: updateData,
    });

    // Sinkronkan ke tabel User jika kolom name / password berubah
    try {
      await prisma.user.updateMany({
        where: { email: updatedProfile.email },
        data: {
          ...(updateData.fullName ? { name: updateData.fullName } : {}),
          ...(updateData.password ? { password: updateData.password } : {}),
        },
      });
    } catch (syncErr) {
      console.warn("User table sync warning:", syncErr);
    }

    const updatedUserPayload = {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.fullName,
      phone: updatedProfile.phoneNumber,
      phoneNumber: updatedProfile.phoneNumber,
      role: updatedProfile.accountRole || "user",
      accountRole: updatedProfile.accountRole || "user",
      isPartner: updatedProfile.isPartner || false,
      isAdmin: updatedProfile.isAdmin || false,
      storeName: updatedProfile.partnerBusinessName || "",
      campusName: updatedProfile.campusName || "Bekasi Barat, Kota Bekasi",
      address: updatedProfile.partnerAddress || updatedProfile.campusName || "Bekasi Barat, Kota Bekasi",
      avatarUrl: updatedProfile.avatarUrl,
      verificationStatus: updatedProfile.verificationStatus || "verified",
      authProvider: updatedProfile.authProvider || "local",
      payoutBank: updatedProfile.payoutBank || "BCA",
      payoutAccountNumber: updatedProfile.payoutAccountNumber || "",
      payoutAccountHolder: updatedProfile.payoutAccountHolder || updatedProfile.fullName || "",
      bankInfo: {
        bankName: updatedProfile.payoutBank || "BCA",
        accountNumber: updatedProfile.payoutAccountNumber || "",
        accountHolder: updatedProfile.payoutAccountHolder || updatedProfile.fullName || "",
      },
      ratingAvg: Number(updatedProfile.ratingAvg) || 5.0,
      ratingCount: updatedProfile.ratingCount || 0,
      completedHelpsCount: updatedProfile.completedHelpsCount || 0,
      reliabilityScore: updatedProfile.reliabilityScore || 100,
      bio: updatedProfile.bio || "",
      createdAt: updatedProfile.createdAt,
    };

    return NextResponse.json({
      success: true,
      message: "Profil pengguna berhasil diperbarui di database.",
      data: updatedUserPayload,
    });
  } catch (error) {
    console.error("PUT /api/user/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan perubahan profil ke database." },
      { status: 500 }
    );
  }
}
