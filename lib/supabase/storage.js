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
  folder = "general",
  bucket = "bantuin-assets",
  isPrivate = false,
}) {
  const targetBucket = resolveBucketName(bucket);
  const sanitizedName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "file.jpg";
  const uniqueKey = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`;

  const client = supabaseAdmin || supabase;

  const { data, error } = await client.storage
    .from(targetBucket)
    .upload(uniqueKey, buffer, {
      contentType: contentType || "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error(`Supabase Storage Upload Error to bucket [${targetBucket}]:`, error);
    throw new Error(`Gagal upload ke bucket [${targetBucket}]: ${error.message}`);
  }

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
