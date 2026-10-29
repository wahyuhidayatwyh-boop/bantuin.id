import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, resolveRole } from "@/lib/auth/session";

/**
 * PATCH /api/profile/update
 * Update data profil, bio, domisili, dan foto profil
 */
export async function PATCH(req) {
  try {
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
      address,
      partnerAddress,
      skills,
      partnerBusinessName,
      brandTitle,
      storeName,
      payoutBank,
      payoutAccountNumber,
      payoutAccountHolder,
      packages,
      portfolioPhotos,
      bannerUrl,
      coverBanner,
      accountRole,
      verificationStatus,
    } = body;

    // SEC-02: Tolak percobaan eskalasi peran atau manipulasi status verifikasi KYC
    if (typeof accountRole === "string") {
      const requestedRole = accountRole.trim().toLowerCase();
      if (["admin", "superadmin", "super_admin"].includes(requestedRole) && !userProfile.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Eskalasi peran ke Administrator tidak diizinkan." },
          { status: 403 }
        );
      }
    }

    if (typeof verificationStatus === "string") {
      const requestedStatus = verificationStatus.trim().toLowerCase();
      if (["verified", "rejected", "suspended"].includes(requestedStatus) && !userProfile.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Status verifikasi KYC hanya dapat diubah oleh Administrator." },
          { status: 403 }
        );
      }
    }

    const updateData = {};

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
    if (partnerAddress !== undefined) {
      updateData.partnerAddress = typeof partnerAddress === "string" ? partnerAddress.trim() : "";
    } else if (address !== undefined) {
      updateData.partnerAddress = typeof address === "string" ? address.trim() : "";
    }
    if (partnerBusinessName !== undefined) {
      updateData.partnerBusinessName = typeof partnerBusinessName === "string" ? partnerBusinessName.trim() : "";
    } else if (brandTitle !== undefined) {
      updateData.partnerBusinessName = typeof brandTitle === "string" ? brandTitle.trim() : "";
    } else if (storeName !== undefined) {
      updateData.partnerBusinessName = typeof storeName === "string" ? storeName.trim() : "";
    }
    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills)
        ? skills.map((s) => String(s).trim()).filter(Boolean)
        : typeof skills === "string"
        ? skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (bio !== undefined) {
      updateData.bio = typeof bio === "string" ? bio.trim() : "";
    }
    if (avatarUrl !== undefined) {
      updateData.avatarUrl = avatarUrl ? String(avatarUrl).trim() : null;
    }
    const targetBanner = bannerUrl !== undefined ? bannerUrl : coverBanner;
    if (targetBanner !== undefined) {
      updateData.bannerUrl = targetBanner ? String(targetBanner).trim() : null;
    }
    if (packages !== undefined) {
      updateData.packages = Array.isArray(packages) ? packages : [];
    }
    if (portfolioPhotos !== undefined) {
      updateData.portfolioPhotos = Array.isArray(portfolioPhotos) ? portfolioPhotos : [];
    }
    if (payoutBank !== undefined) {
      updateData.payoutBank = typeof payoutBank === "string" ? payoutBank.trim() : "";
    }
    if (payoutAccountNumber !== undefined) {
      updateData.payoutAccountNumber = typeof payoutAccountNumber === "string" ? payoutAccountNumber.trim() : "";
    }
    if (payoutAccountHolder !== undefined) {
      updateData.payoutAccountHolder = typeof payoutAccountHolder === "string" ? payoutAccountHolder.trim().toUpperCase() : "";
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userProfile.id },
      data: updateData,
    });

    // Sinkronkan ke tabel User jika nama berubah
    if (updateData.fullName) {
      try {
        await prisma.user.updateMany({
          where: { email: userProfile.email },
          data: { name: updateData.fullName },
        });
      } catch {}
    }

    const effectiveRole = resolveRole(updatedProfile);
    const userPayload = {
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
      campusName: updatedProfile.campusName,
      address: updatedProfile.partnerAddress || updatedProfile.campusName,
      partnerAddress: updatedProfile.partnerAddress || "",
      skills: Array.isArray(updatedProfile.skills) ? updatedProfile.skills : [],
      packages: Array.isArray(updatedProfile.packages) ? updatedProfile.packages : [],
      portfolioPhotos: Array.isArray(updatedProfile.portfolioPhotos) ? updatedProfile.portfolioPhotos : [],
      avatarUrl: updatedProfile.avatarUrl,
      bannerUrl: updatedProfile.bannerUrl,
      coverBanner: updatedProfile.bannerUrl,
      bio: updatedProfile.bio,
      verificationStatus: updatedProfile.verificationStatus || "unverified",
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: "Profil pengguna berhasil diperbarui.",
      data: userPayload,
      user: userPayload,
    });
  } catch (error) {
    console.error("PATCH /api/profile/update Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui profil pengguna." },
      { status: 500 }
    );
  }
}
