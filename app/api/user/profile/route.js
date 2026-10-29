import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, normalizePublicRole, resolveRole, maskIdNumber } from "@/lib/auth/session";
import { isPersistableDocumentRef, normalizeToStorageRef, resolveDocumentUrl } from "@/lib/supabase/storage";
import bcrypt from "bcryptjs";

/**
 * GET /api/user/profile
 * Mengambil profil lengkap pengguna dari database Prisma / Neon DB
 * berdasarkan JWT Access Token yang aktif.
 */
export async function GET(req) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const userProfile = auth.profile;

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
    const effectiveRole = resolveRole(userProfile);
    const [idCardViewUrl, selfieViewUrl] = await Promise.all([
      resolveDocumentUrl(userProfile.idCardUrl, 900),
      resolveDocumentUrl(userProfile.selfieUrl, 900),
    ]);

    const data = {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.fullName || "",
      phoneNumber: userProfile.phoneNumber || "",
      avatarUrl: userProfile.avatarUrl && !userProfile.avatarUrl.includes("images.unsplash.com") ? userProfile.avatarUrl : null,
      bio: userProfile.bio || "",
      campusName: userProfile.campusName || "",
      role: effectiveRole,
      accountRole: effectiveRole,
      isPartner: effectiveRole === "partner" || Boolean(userProfile.isPartner),
      isAdmin: Boolean(userProfile.isAdmin),
      partnerBusinessName: userProfile.partnerBusinessName || "",
      partnerAddress: userProfile.partnerAddress || "",
      verificationStatus: userProfile.verificationStatus || "unverified",
      idNumber: maskIdNumber(userProfile.idNumber),
      idNumberMasked: maskIdNumber(userProfile.idNumber),
      hasKycDocument: Boolean(userProfile.idCardUrl),
      hasSelfie: Boolean(userProfile.selfieUrl),
      idCardViewUrl: idCardViewUrl || null,
      selfieViewUrl: selfieViewUrl || null,
      payoutBank: userProfile.payoutBank || "",
      payoutAccountNumber: userProfile.payoutAccountNumber || "",
      payoutAccountHolder: userProfile.payoutAccountHolder || "",
      bannerUrl: userProfile.bannerUrl || null,
      coverBanner: userProfile.bannerUrl || null,
      portfolioPhotos: Array.isArray(userProfile.portfolioPhotos) ? userProfile.portfolioPhotos : [],
      packages: Array.isArray(userProfile.packages) ? userProfile.packages : [],
      skills: Array.isArray(userProfile.skills) ? userProfile.skills : [],
      authProvider: userProfile.authProvider || (userProfile.password ? "local" : "google"),
      hasPassword: Boolean(userProfile.password),
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
    // SEC-02: Gunakan requireAuth untuk menolak token tidak valid maupun akun suspended
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const userProfile = auth.profile;

    const body = await req.json();
    const {
      fullName,
      phoneNumber,
      phone,
      campusName,
      city,
      bio,
      avatarUrl,
      payoutBank,
      payoutAccountNumber,
      payoutAccountHolder,
      idNumber,
      idCardUrl,
      selfieUrl,
      accountRole,
      verificationStatus,
      partnerBusinessName,
      brandTitle,
      storeName,
      partnerAddress,
      address,
      bannerUrl,
      coverBanner,
      portfolioPhotos,
      packages,
      skills,
      currentPassword,
      newPassword,
    } = body;

    // SEC-02: Cegah eskalasi hak akses menjadi admin melalui endpoint profil publik
    if (typeof accountRole === "string") {
      const requestedRole = accountRole.trim().toLowerCase();
      if (["admin", "superadmin", "super_admin"].includes(requestedRole) && !userProfile.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Eskalasi peran ke Administrator tidak diizinkan." },
          { status: 403 }
        );
      }
    }

    // SEC-02: Cegah manipulasi status verifikasi KYC secara mandiri
    if (typeof verificationStatus === "string") {
      const requestedStatus = verificationStatus.trim().toLowerCase();
      if (["verified", "rejected", "suspended"].includes(requestedStatus) && !userProfile.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Status verifikasi KYC hanya dapat disetujui oleh Administrator." },
          { status: 403 }
        );
      }
    }

    const updateData = {};

    // 1. Update info profil umum
    if (fullName !== undefined) {
      updateData.fullName = typeof fullName === "string" ? fullName.trim() : "";
    }
    const targetPhone = phoneNumber !== undefined ? phoneNumber : phone;
    if (targetPhone !== undefined) {
      updateData.phoneNumber = typeof targetPhone === "string" ? targetPhone.trim() : "";
    }
    const targetCampus = campusName !== undefined ? campusName : city;
    if (targetCampus !== undefined) {
      updateData.campusName = typeof targetCampus === "string" ? targetCampus.trim() : "";
    }
    if (bio !== undefined) {
      updateData.bio = typeof bio === "string" ? bio.trim() : "";
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
    }
    if (partnerBusinessName !== undefined) {
      updateData.partnerBusinessName = typeof partnerBusinessName === "string" ? partnerBusinessName.trim() : "";
    } else if (brandTitle !== undefined) {
      updateData.partnerBusinessName = typeof brandTitle === "string" ? brandTitle.trim() : "";
    } else if (storeName !== undefined) {
      updateData.partnerBusinessName = typeof storeName === "string" ? storeName.trim() : "";
    }
    if (partnerAddress !== undefined) {
      updateData.partnerAddress = typeof partnerAddress === "string" ? partnerAddress.trim() : "";
    } else if (address !== undefined) {
      updateData.partnerAddress = typeof address === "string" ? address.trim() : "";
    }
    const resolvedBanner = bannerUrl !== undefined ? bannerUrl : coverBanner;
    if (resolvedBanner !== undefined) {
      updateData.bannerUrl = resolvedBanner ? String(resolvedBanner).trim() : null;
    }
    if (portfolioPhotos !== undefined) {
      updateData.portfolioPhotos = Array.isArray(portfolioPhotos) ? portfolioPhotos : [];
    }
    if (packages !== undefined) {
      updateData.packages = Array.isArray(packages) ? packages : [];
    }
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills)
        ? skills.map((s) => String(s).trim()).filter(Boolean)
        : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }

    // 2. Update info rekening pencairan
    if (payoutBank !== undefined) {
      updateData.payoutBank = typeof payoutBank === "string" ? payoutBank.trim() : "";
    }
    if (payoutAccountNumber !== undefined) {
      updateData.payoutAccountNumber = typeof payoutAccountNumber === "string" ? payoutAccountNumber.trim() : "";
    }
    if (payoutAccountHolder !== undefined) {
      updateData.payoutAccountHolder = typeof payoutAccountHolder === "string" ? payoutAccountHolder.trim().toUpperCase() : "";
    }

    // 3. Update info KYC dan Role Akun Publik secara aman
    let hasNewKycDoc = false;
    if (typeof idNumber === "string" && idNumber.trim() && !idNumber.includes("*")) {
      const cleanNik = idNumber.replace(/\D/g, "");
      if (cleanNik.length === 16) {
        updateData.idNumber = cleanNik;
      }
    }
    if (typeof idCardUrl === "string" && isPersistableDocumentRef(idCardUrl)) {
      const canonicalIdCardRef = normalizeToStorageRef(idCardUrl);
      if (canonicalIdCardRef !== userProfile.idCardUrl) {
        updateData.idCardUrl = canonicalIdCardRef;
        hasNewKycDoc = true;
      }
    }
    if (typeof selfieUrl === "string" && isPersistableDocumentRef(selfieUrl)) {
      updateData.selfieUrl = normalizeToStorageRef(selfieUrl);
    }
    if (typeof accountRole === "string" && accountRole.trim() && !userProfile.isAdmin) {
      const safeRole = normalizePublicRole(accountRole);
      updateData.accountRole = safeRole;
      if (safeRole === "partner") {
        updateData.isPartner = true;
      }
    }
    if (
      hasNewKycDoc &&
      userProfile.verificationStatus !== "verified" &&
      userProfile.verificationStatus !== "suspended"
    ) {
      updateData.verificationStatus = "pending_review";
    }

    // 4. Update Kata Sandi jika diminta
    if (newPassword) {
      const isGoogleAuth = userProfile.authProvider === "google" || !userProfile.password;
      if (!isGoogleAuth) {
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
      }

      if (newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "Kata sandi baru minimal harus 8 karakter." },
          { status: 400 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
      updateData.authProvider = "local";
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

    const effectiveRole = resolveRole(updatedProfile);
    const updatedUserPayload = {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.fullName,
      phone: updatedProfile.phoneNumber,
      phoneNumber: updatedProfile.phoneNumber,
      role: effectiveRole,
      accountRole: effectiveRole,
      isPartner: effectiveRole === "partner" || Boolean(updatedProfile.isPartner),
      isAdmin: Boolean(updatedProfile.isAdmin),
      storeName: updatedProfile.partnerBusinessName || "",
      partnerBusinessName: updatedProfile.partnerBusinessName || "",
      campusName: updatedProfile.campusName || "",
      address: updatedProfile.partnerAddress || updatedProfile.campusName || "",
      partnerAddress: updatedProfile.partnerAddress || "",
      avatarUrl: updatedProfile.avatarUrl,
      verificationStatus: updatedProfile.verificationStatus || "unverified",
      authProvider: updatedProfile.authProvider || "local",
      payoutBank: updatedProfile.payoutBank || "",
      payoutAccountNumber: updatedProfile.payoutAccountNumber || "",
      payoutAccountHolder: updatedProfile.payoutAccountHolder || "",
      bankInfo: {
        bankName: updatedProfile.payoutBank || "",
        accountNumber: updatedProfile.payoutAccountNumber || "",
        accountHolder: updatedProfile.payoutAccountHolder || "",
      },
      ratingAvg: Number(updatedProfile.ratingAvg) || 5.0,
      ratingCount: updatedProfile.ratingCount || 0,
      completedHelpsCount: updatedProfile.completedHelpsCount || 0,
      reliabilityScore: updatedProfile.reliabilityScore || 100,
      bio: updatedProfile.bio || "",
      bannerUrl: updatedProfile.bannerUrl || null,
      coverBanner: updatedProfile.bannerUrl || null,
      portfolioPhotos: Array.isArray(updatedProfile.portfolioPhotos) ? updatedProfile.portfolioPhotos : [],
      packages: Array.isArray(updatedProfile.packages) ? updatedProfile.packages : [],
      skills: Array.isArray(updatedProfile.skills) ? updatedProfile.skills : [],
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

export const PATCH = PUT;

