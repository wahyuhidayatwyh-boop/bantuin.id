import { supabaseAdmin, supabase } from "./client";

/**
 * Registry nama bucket standar (dapat langsung dioper dinamis saat upload)
 */
export const SUPABASE_BUCKETS = {
  ASSETS: "bantuin-assets",
  AVATARS: "bantuin-avatars",
  DOCUMENTS: "bantuin-documents",
  KYC: "bantuin-kyc",
  PROOFS: "bantuin-proofs",
  CHAT_ATTACHMENTS: "bantuin-chat-attachments",
};

/**
 * Helper dinamis untuk menentukan nama bucket
 * @param {string} [bucketName] - Nama bucket kustom atau identifier dari SUPABASE_BUCKETS
 */
export function resolveBucketName(bucketName) {
  if (!bucketName) return SUPABASE_BUCKETS.ASSETS;
  const upper = bucketName.toUpperCase();
  if (SUPABASE_BUCKETS[upper]) return SUPABASE_BUCKETS[upper];
  return bucketName;
}

/**
 * Helper untuk memeriksa apakah kredensial Supabase sudah terkonfigurasi
 */
export function isSupabaseConfigured() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return Boolean(key && !key.includes("your-") && !key.includes("here"));
}

/**
 * Upload buffer to Supabase Storage bucket secara dinamis
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.filename - Original file name
 * @param {string} params.contentType - MIME type
 * @param {string} [params.folder] - Target subfolder (e.g. 'requests', 'rentals', 'services', 'avatars')
 * @param {string} [params.bucket] - Nama bucket tujuan yang dinamis (default: 'bantuin-assets')
 * @param {boolean} [params.isPrivate] - Apakah file privat (jika true akan membuat signed URL)
 */
export async function uploadToSupabaseStorage({
  buffer,
  filename,
  contentType,
  folder = "",
  bucket = "bantuin-assets",
  isPrivate = false,
}) {
  const targetBucket = resolveBucketName(bucket);
  const sanitizedName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "file.jpg";
  const uniqueKey = folder?.trim()
    ? `${folder.trim()}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`
    : `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`;

  if (!isSupabaseConfigured()) {
    throw new Error(`Kunci Supabase Storage (SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY) di .env belum dikonfigurasi.`);
  }

  const client = supabaseAdmin || supabase;

  let uploadResult = await client.storage
    .from(targetBucket)
    .upload(uniqueKey, buffer, {
      contentType: contentType || "image/jpeg",
      upsert: true,
    });

  if (uploadResult.error && (uploadResult.error.message?.includes("not found") || uploadResult.error.statusCode === "404")) {
    try {
      await client.storage.createBucket(targetBucket, { public: !isPrivate });
      uploadResult = await client.storage
        .from(targetBucket)
        .upload(uniqueKey, buffer, {
          contentType: contentType || "image/jpeg",
          upsert: true,
        });
    } catch (createErr) {
      console.warn("Auto create bucket attempt:", createErr);
    }
  }

  if (uploadResult.error) {
    console.error(`Supabase Storage Upload Error to bucket [${targetBucket}]:`, uploadResult.error);
    throw new Error(`Gagal upload ke bucket [${targetBucket}]: ${uploadResult.error.message}`);
  }

  const data = uploadResult.data;

  let fileUrl = "";

  if (isPrivate) {
    const { data: signedData } = await client.storage
      .from(targetBucket)
      .createSignedUrl(uniqueKey, 3600);
    fileUrl = signedData?.signedUrl || "";
  } else {
    const { data: publicUrlData } = client.storage
      .from(targetBucket)
      .getPublicUrl(uniqueKey);
    fileUrl = publicUrlData?.publicUrl || "";
  }

  return {
    key: uniqueKey,
    path: data?.path || uniqueKey,
    url: fileUrl,
    bucket: targetBucket,
  };
}
