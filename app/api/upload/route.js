import { NextResponse } from "next/server";
import { uploadToSupabaseStorage, isSupabaseConfigured, SUPABASE_BUCKETS, resolveBucketName } from "@/lib/supabase/storage";
import { validateFile } from "@/lib/utils/fileValidation";
import { requireAuth } from "@/lib/auth/session";

const ALLOWED_BUCKET_VALUES = new Set(Object.values(SUPABASE_BUCKETS));

export async function POST(req) {
  try {
    // SEC-06: Wajib autentikasi sesi aktif untuk seluruh unggahan file
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const formData = await req.formData();
    const files = formData.getAll("files");
    const singleFile = formData.get("file");
    const rawFolder = formData.get("folder") !== null ? String(formData.get("folder")) : "";
    const rawBucket = String(formData.get("bucket") || formData.get("bucketName") || "bantuin-assets").trim();
    const isPrivate = formData.get("isPrivate") === "true" || formData.get("private") === "true";

    // SEC-06: Batasi bucket hanya ke allowlist resmi SUPABASE_BUCKETS
    let bucket;
    try {
      bucket = resolveBucketName(rawBucket);
    } catch {
      return NextResponse.json(
        { error: `Bucket penyimpanan '${rawBucket}' tidak diizinkan.` },
        { status: 400 }
      );
    }
    if (!ALLOWED_BUCKET_VALUES.has(bucket)) {
      return NextResponse.json(
        { error: `Bucket penyimpanan '${rawBucket}' tidak diizinkan.` },
        { status: 400 }
      );
    }

    // Sanitasi parameter folder untuk mencegah path traversal
    const folder = rawFolder
      .replace(/\\/g, "/")
      .split("/")
      .map((seg) => seg.replace(/[^a-zA-Z0-9_-]/g, ""))
      .filter(Boolean)
      .join("/");

    const allFiles = files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada file yang diunggah." },
        { status: 400 }
      );
    }

    // Jika Supabase credentials belum diisi di .env, fallback aman tanpa 500 crash
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: "Supabase Storage API key belum dikonfigurasi di .env. Menggunakan penyimpanan data lokal.",
        urls: [],
      });
    }

    // 1. Validasi MIME Type & Ukuran File untuk semua file input
    for (const file of allFiles) {
      if (!(file instanceof Blob)) continue;

      const validation = validateFile(file, bucket);
      if (!validation.valid) {
        return NextResponse.json(
          { error: `File '${file.name || "upload"}': ${validation.error}` },
          { status: 400 }
        );
      }
    }

    const isKyc = bucket === "bantuin-kyc";
    const forcePrivate = isPrivate || isKyc;

    const { toStorageRef } = await import("@/lib/supabase/storage");

    const uploadedUrls = [];
    const uploadedRefs = [];
    const uploadedDetails = [];

    // 2. Lakukan upload setelah lolos verifikasi MIME type
    for (const file of allFiles) {
      if (!(file instanceof Blob)) continue;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filename = file.name || "upload.jpg";
      const contentType = file.type || "image/jpeg";

      const result = await uploadToSupabaseStorage({
        buffer,
        filename,
        contentType,
        folder,
        bucket,
        isPrivate: forcePrivate,
      });

      const storageRef = toStorageRef(result.bucket, result.key);

      uploadedUrls.push(result.url);
      uploadedRefs.push(storageRef);
      uploadedDetails.push({ ...result, storageRef });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedUrls.length} file berhasil diunggah ke bucket [${bucket}].`,
      urls: uploadedUrls,
      url: uploadedUrls[0] || null,
      storageRef: uploadedRefs[0] || null,
      storageRefs: uploadedRefs,
      details: uploadedDetails,
      data: {
        url: uploadedUrls[0] || null,
        urls: uploadedUrls,
        storageRef: uploadedRefs[0] || null,
        storageRefs: uploadedRefs,
      },
      bucket,
    });
  } catch (error) {
    console.error("POST /api/upload Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengunggah file ke Supabase Storage." },
      { status: 500 }
    );
  }
}
