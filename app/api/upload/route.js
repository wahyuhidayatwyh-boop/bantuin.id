import { NextResponse } from "next/server";
import { uploadToSupabaseStorage } from "@/lib/supabase/storage";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");
    const singleFile = formData.get("file");
    const folder = formData.get("folder") || "general";
    const bucket = formData.get("bucket") || formData.get("bucketName") || "bantuin-assets";
    const isPrivate = formData.get("isPrivate") === "true" || formData.get("private") === "true";

    const allFiles = files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (allFiles.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada file yang diunggah." },
        { status: 400 }
      );
    }

    const uploadedUrls = [];
    const uploadedDetails = [];

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
