import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, buildUserPayload } from "@/lib/auth/session";
import { isPersistableDocumentRef, normalizeToStorageRef, resolveDocumentUrl } from "@/lib/supabase/storage";

/**
 * POST /api/profile/kyc
 * Pengajuan verifikasi identitas (Upload KTP & NIK)
 * Status diset ke pending_review untuk diperiksa oleh Administrator
 */
export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const userProfile = auth.profile;

    if (userProfile.verificationStatus === "verified") {
      return NextResponse.json(
        { success: false, error: "Identitas akun Anda sudah terverifikasi resmi oleh Administrator." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      idNumber,
      idCardUrl,
      selfieUrl,
      skill,
      skills,
      payoutAccount,
      payoutBank,
      payoutAccountNumber,
      payoutAccountHolder,
    } = body;

    const cleanNik = String(idNumber || "").replace(/\D/g, "");
    if (!cleanNik || cleanNik.length !== 16) {
      return NextResponse.json(
        { success: false, error: "Nomor Induk Kependudukan (NIK) wajib tepat 16 digit angka sesuai KTP." },
        { status: 400 }
      );
    }

    if (!idCardUrl || !isPersistableDocumentRef(idCardUrl)) {
      return NextResponse.json(
        { success: false, error: "Foto dokumen KTP wajib diunggah ke penyimpanan sistem terlebih dahulu." },
        { status: 400 }
      );
    }

    const canonicalIdCardRef = normalizeToStorageRef(idCardUrl);
    const cleanSelfie = selfieUrl && isPersistableDocumentRef(selfieUrl) ? normalizeToStorageRef(selfieUrl) : null;

    // Persiapkan update data (simpan sebagai referensi storage://bantuin-kyc/<key>, bukan public URL)
    const updateData = {
      idNumber: cleanNik,
      idCardUrl: canonicalIdCardRef,
      selfieUrl: cleanSelfie,
      verificationStatus: "pending_review",
      verificationNotes: "Menunggu peninjauan oleh Administrator Bantuin",
    };

    // Parsing Rekening Pencairan jika dikirim
    let resolvedBank = payoutBank ? String(payoutBank).trim() : null;
    let resolvedAccNum = payoutAccountNumber ? String(payoutAccountNumber).trim() : null;
    let resolvedHolder = payoutAccountHolder ? String(payoutAccountHolder).trim() : (userProfile.fullName || "Pengguna");

    if (payoutAccount && typeof payoutAccount === "string") {
      const rawPayout = payoutAccount.trim();
      const anMatch = rawPayout.match(/\s+a\/?n\s+(.+)$/i);
      if (anMatch) {
        resolvedHolder = anMatch[1].trim();
      }
      const withoutHolder = anMatch ? rawPayout.slice(0, anMatch.index).trim() : rawPayout;
      const parts = withoutHolder.split(/\s+/);
      if (parts.length >= 2) {
        resolvedBank = parts[0].toUpperCase();
        resolvedAccNum = parts.slice(1).join(" ");
      } else if (!resolvedAccNum) {
        resolvedAccNum = withoutHolder;
      }
    }

    if (resolvedBank) updateData.payoutBank = resolvedBank;
    if (resolvedAccNum) updateData.payoutAccountNumber = resolvedAccNum;
    if (resolvedHolder) updateData.payoutAccountHolder = resolvedHolder;

    // Resolving Skills
    const newSkillItems = [];
    if (skill && typeof skill === "string" && skill.trim()) {
      newSkillItems.push(skill.trim());
    }
    if (Array.isArray(skills)) {
      skills.forEach((s) => {
        if (s && typeof s === "string" && s.trim()) newSkillItems.push(s.trim());
      });
    }
    if (newSkillItems.length > 0) {
      const mergedSkills = Array.from(new Set([...(userProfile.skills || []), ...newSkillItems]));
      updateData.skills = mergedSkills;
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userProfile.id },
      data: updateData,
    });

    // Buat notifikasi in-app untuk pengguna
    try {
      await prisma.notification.create({
        data: {
          userId: userProfile.id,
          title: "Pengajuan KYC Sedang Ditinjau",
          message: "Dokumen KTP dan NIK Anda telah diterima dan masuk antrean verifikasi Admin Bantuin.",
          type: "verification",
          link: "/profile",
        },
      });
    } catch {}

    const userPayload = buildUserPayload(updatedProfile);
    const [idCardViewUrl, selfieViewUrl] = await Promise.all([
      resolveDocumentUrl(updatedProfile.idCardUrl, 900),
      resolveDocumentUrl(updatedProfile.selfieUrl, 900),
    ]);

    return NextResponse.json({
      success: true,
      message: "Pengajuan verifikasi KYC berhasil dikirim. Menunggu peninjauan admin.",
      data: {
        ...userPayload,
        idCardViewUrl: idCardViewUrl || null,
        selfieViewUrl: selfieViewUrl || null,
      },
      user: {
        ...userPayload,
        idCardViewUrl: idCardViewUrl || null,
        selfieViewUrl: selfieViewUrl || null,
      },
    });
  } catch (error) {
    console.error("POST /api/profile/kyc Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengajukan verifikasi identitas KYC." },
      { status: 500 }
    );
  }
}
