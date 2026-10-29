import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/profile/change-password
 * Task 50: Ubah kata sandi lama ke kata sandi baru
 */
export async function POST(req) {
  try {
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

    const body = await req.json().catch(() => ({}));
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Kata sandi lama dan kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Kata sandi baru minimal harus terdiri dari 6 karakter." },
        { status: 400 }
      );
    }

    // Verify Old Password
    if (userProfile.password) {
      let isMatch = false;
      if (userProfile.password.startsWith("$2a$") || userProfile.password.startsWith("$2b$")) {
        isMatch = await bcrypt.compare(oldPassword, userProfile.password);
      } else {
        isMatch = userProfile.password === oldPassword;
      }

      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "Kata sandi lama yang Anda masukkan salah." },
          { status: 401 }
        );
      }
    }

    // Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.profile.update({
      where: { id: userProfile.id },
      data: { password: hashedPassword },
    });

    // Record AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: userProfile.id,
        actorEmail: userProfile.email,
        action: "profile.password_changed",
        targetEntity: "profiles",
        targetId: userProfile.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kata sandi Anda berhasil diperbarui.",
    });
  } catch (err) {
    console.error("[POST /api/profile/change-password error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengubah kata sandi." },
      { status: 500 }
    );
  }
}
