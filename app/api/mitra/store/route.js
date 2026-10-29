import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/session";

/**
 * PATCH /api/mitra/store
 * Task 72: Update data toko mitra (nama usaha, alamat fisik, banner/avatar toko)
 * 
 * Rules:
 * 1. Strict JWT Authentication.
 * 2. Updates partner store profile.
 */
export async function PATCH(req) {
  try {
    // 1. Auth check
    const token = extractBearerToken(req);

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

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      partnerBusinessName,
      partnerAddress,
      bio,
      avatarUrl,
      bannerUrl,
      phoneNumber,
      payoutBank,
      payoutAccountNumber,
      payoutAccountHolder,
      responseTimeMinutes,
      isAcceptingRentals,
      requirePhysicalId,
      securityDepositPolicy,
    } = body;

    const updateData = {};
    if (partnerBusinessName !== undefined) {
      updateData.partnerBusinessName = partnerBusinessName.trim();
      updateData.isPartner = true;
    }
    if (partnerAddress !== undefined) updateData.partnerAddress = partnerAddress.trim();
    if (bio !== undefined) updateData.bio = bio.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl.trim();
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl.trim();
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber.trim();
    if (payoutBank !== undefined) updateData.payoutBank = payoutBank.trim();
    if (payoutAccountNumber !== undefined) updateData.payoutAccountNumber = payoutAccountNumber.trim();
    if (payoutAccountHolder !== undefined) updateData.payoutAccountHolder = payoutAccountHolder.trim();
    if (responseTimeMinutes !== undefined) updateData.responseTimeMinutes = parseInt(responseTimeMinutes);
    if (isAcceptingRentals !== undefined) updateData.isAcceptingRentals = Boolean(isAcceptingRentals);
    if (requirePhysicalId !== undefined) updateData.requirePhysicalId = Boolean(requirePhysicalId);
    if (securityDepositPolicy !== undefined) updateData.securityDepositPolicy = securityDepositPolicy.trim();

    const updated = await prisma.profile.update({
      where: { id: userProfile.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Data toko mitra berhasil diperbarui.",
      data: {
        id: updated.id,
        partnerBusinessName: updated.partnerBusinessName,
        partnerAddress: updated.partnerAddress,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        bannerUrl: updated.bannerUrl,
        phoneNumber: updated.phoneNumber,
        payoutBank: updated.payoutBank,
        payoutAccountNumber: updated.payoutAccountNumber,
        payoutAccountHolder: updated.payoutAccountHolder,
        isPartner: updated.isPartner,
        isAcceptingRentals: updated.isAcceptingRentals,
        requirePhysicalId: updated.requirePhysicalId,
        securityDepositPolicy: updated.securityDepositPolicy,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/mitra/store error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui data toko mitra." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mitra/store
 * Mengambil profil toko mitra aktif dari database
 */
export async function GET(req) {
  try {
    const token = extractBearerToken(req);

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

    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
      include: {
        rentals: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profil toko mitra tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        avatarUrl: profile.avatarUrl,
        bannerUrl: profile.bannerUrl,
        bio: profile.bio,
        campusName: profile.campusName,
        isPartner: profile.isPartner,
        partnerBusinessName: profile.partnerBusinessName,
        partnerAddress: profile.partnerAddress,
        isAcceptingRentals: profile.isAcceptingRentals ?? true,
        requirePhysicalId: profile.requirePhysicalId ?? true,
        securityDepositPolicy: profile.securityDepositPolicy || "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
        verificationStatus: profile.verificationStatus,
        verificationNotes: profile.verificationNotes,
        payoutBank: profile.payoutBank,
        payoutAccountNumber: profile.payoutAccountNumber,
        payoutAccountHolder: profile.payoutAccountHolder,
        portfolioPhotos: profile.portfolioPhotos || [],
        ratingAvg: Number(profile.ratingAvg),
        ratingCount: profile.ratingCount,
        reliabilityScore: profile.reliabilityScore,
        rentals: profile.rentals.map((r) => {
          let parsedExtra = {};
          if (r.termsAndConditions) {
            try {
              if (r.termsAndConditions.trim().startsWith("{") || r.termsAndConditions.trim().startsWith("[")) {
                parsedExtra = JSON.parse(r.termsAndConditions);
              }
            } catch (_) {}
          }
          return {
            ...r,
            packages: parsedExtra.packages || [],
            pricingMode: parsedExtra.pricingMode || (parsedExtra.packages?.length ? "tiered" : "single"),
            tag: parsedExtra.tag || undefined,
            stockCount: parsedExtra.stockCount !== undefined ? Number(parsedExtra.stockCount) : 1,
            stockStatus: parsedExtra.stockStatus || (r.isAvailable ? "Siap Sewa" : "Sedang Disewa"),
            includedItems: parsedExtra.includedItems || "",
            securityDeposit: parsedExtra.securityDeposit || "",
            dailyPrice: Number(r.dailyPrice),
            depositAmount: Number(r.depositAmount),
            ratingAvg: Number(r.ratingAvg),
          };
        }),
      },
    });
  } catch (err) {
    console.error("[GET /api/mitra/store error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil data toko mitra." },
      { status: 500 }
    );
  }
}
