import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyActionToken } from "@/lib/auth/jwt";
import { supabaseAdmin, supabase } from "@/lib/supabase/client";

/**
 * POST /api/auth/verify-email
 * Task 47: Verifikasi email akun baru (Wajib menggunakan token verifikasi kriptografis yang valid)
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, token } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Token verifikasi email wajib disertakan." },
        { status: 401 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // SEC-08: Verifikasi token verifikasi email (JWT action token atau Supabase verification token)
    let verifiedEmail = null;
    const actionPayload = verifyActionToken(token.trim(), "verify_email");
    if (actionPayload?.email) {
      verifiedEmail = String(actionPayload.email).trim().toLowerCase();
    } else {
      try {
        const client = supabaseAdmin || supabase;
        const { data: userData, error: verifyErr } = await client.auth.getUser(token.trim());
        if (!verifyErr && userData?.user?.email) {
          verifiedEmail = userData.user.email.trim().toLowerCase();
        }
      } catch {}
    }

    if (!verifiedEmail || verifiedEmail !== cleanEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Token verifikasi email tidak valid, kedaluwarsa, atau tidak sesuai dengan alamat email.",
        },
        { status: 401 }
      );
    }

    const userProfile = await prisma.profile.findFirst({
      where: { email: cleanEmail },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akun dengan email tersebut tidak ditemukan." },
        { status: 404 }
      );
    }

    // Update User table if present (Hanya status email verified, TIDAK mengubah verificationStatus KYC)
    await prisma.user.updateMany({
      where: { email: cleanEmail },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      message: "Alamat email Anda berhasil diverifikasi. Silakan login ke akun Bantuin Anda.",
    });
  } catch (err) {
    console.error("[POST /api/auth/verify-email error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memverifikasi email." },
      { status: 500 }
    );
  }
}
