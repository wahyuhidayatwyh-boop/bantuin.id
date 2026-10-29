import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * Task 46: Permintaan reset sandi via email
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const userProfile = await prisma.profile.findFirst({
      where: { email: cleanEmail },
    });

    // Return success to avoid email enumeration even if user does not exist
    if (!userProfile) {
      return NextResponse.json({
        success: true,
        message: "Jika email terdaftar, instruksi pemulihan kata sandi telah dikirimkan ke kotak masuk Anda.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Record audit log for password reset request
    await prisma.auditLog.create({
      data: {
        actorId: userProfile.id,
        actorEmail: cleanEmail,
        action: "auth.forgot_password_requested",
        targetEntity: "profiles",
        targetId: userProfile.id,
        payload: { email: cleanEmail, resetTokenPrefix: resetToken.slice(0, 8) },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Instruksi pemulihan kata sandi telah dikirimkan ke alamat email Anda.",
    });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memproses permintaan reset kata sandi." },
      { status: 500 }
    );
  }
}
