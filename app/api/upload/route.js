import { NextResponse } from "next/server";
import { uploadToSupabaseStorage, isSupabaseConfigured } from "@/lib/supabase/storage";
import { validateFile } from "@/lib/utils/fileValidation";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const singleFile = formData.get("file");
    const folder = formData.get("folder") !== null ? formData.get("folder") : "";
    const bucket = formData.get("bucket") || formData.get("bucketName") || "bantuin-assets";
    const isPrivate = formData.get("isPrivate") === "true" || formData.get("private") === "true";

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

    const uploadedUrls = [];
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
        isPrivate,
      });

      uploadedUrls.push(result.url);
      uploadedDetails.push(result);
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedUrls.length} file berhasil diunggah ke bucket [${bucket}].`,
      urls: uploadedUrls,
      url: uploadedUrls[0] || null,
      details: uploadedDetails,
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
