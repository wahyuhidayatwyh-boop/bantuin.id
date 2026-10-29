import { supabaseAdmin, supabase } from "./client.js";

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

const ALLOWED_BUCKET_SET = new Set(Object.values(SUPABASE_BUCKETS));

/**
 * Helper dinamis untuk menentukan nama bucket (dibatasi pada allowlist resmi SUPABASE_BUCKETS)
 * @param {string} [bucketName] - Nama bucket dari SUPABASE_BUCKETS
 */
export function resolveBucketName(bucketName) {
  if (!bucketName) return SUPABASE_BUCKETS.ASSETS;
  const trimmed = String(bucketName).trim();
  const upper = trimmed.toUpperCase();
  if (SUPABASE_BUCKETS[upper]) return SUPABASE_BUCKETS[upper];
  const lower = trimmed.toLowerCase();
  if (ALLOWED_BUCKET_SET.has(lower)) return lower;
  throw new Error(`Bucket penyimpanan '${trimmed}' tidak termasuk dalam daftar bucket resmi platform.`);
}

/**
 * Helper untuk memeriksa apakah kredensial Supabase sudah terkonfigurasi
 */
export function isSupabaseConfigured() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return Boolean(key && !key.includes("your-") && !key.includes("here") && !key.includes("dummy"));
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
  const effectivePrivate = Boolean(isPrivate || targetBucket === SUPABASE_BUCKETS.KYC);
  const sanitizedName = filename ? filename.replace(/[^a-zA-Z0-9.-]/g, "_") : "file.jpg";
  const safeFolder = String(folder || "")
    .replace(/\\/g, "/")
    .split("/")
    .map((seg) => seg.replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join("/");

  const uniqueKey = safeFolder
    ? `${safeFolder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedName}`
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
      await client.storage.createBucket(targetBucket, { public: !effectivePrivate });
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

  if (effectivePrivate) {
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

// ---------------------------------------------------------------------------
// Dokumen privat (KYC): disimpan sebagai referensi "storage://<bucket>/<key>"
// lalu dibuatkan signed URL baru setiap kali pemilik / admin perlu melihatnya.
// ---------------------------------------------------------------------------
const STORAGE_REF_PREFIX = "storage://";

export function toStorageRef(bucket, key) {
  return `${STORAGE_REF_PREFIX}${bucket}/${key}`;
}

export function parseStorageRef(ref) {
  if (typeof ref !== "string" || !ref.trim()) return null;
  const trimmed = ref.trim();
  if (trimmed.startsWith(STORAGE_REF_PREFIX)) {
    const rest = trimmed.slice(STORAGE_REF_PREFIX.length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const bucket = rest.slice(0, slash);
    const key = rest.slice(slash + 1);
    if (!ALLOWED_BUCKET_SET.has(bucket) || key.includes("..")) return null;
    return { bucket, key };
  }

  // Mendukung konversi otomatis dari URL objek Supabase lama (/storage/v1/object/public|sign|authenticated/<bucket>/<key>)
  // sehingga saat bucket diubah menjadi private (public=false), dokumen lama tetap bisa dibuatkan signed URL.
  const match = trimmed.match(
    /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([a-z0-9-]+)\/([^?#]+)/i
  );
  if (match) {
    const bucket = match[1].toLowerCase();
    let key = match[2];
    try {
      key = decodeURIComponent(key);
    } catch {}
    if (ALLOWED_BUCKET_SET.has(bucket) && !key.includes("..")) {
      return { bucket, key };
    }
  }

  return null;
}

/**
 * Mengonversi nilai input dokumen menjadi referensi kanonikal `storage://<bucket>/<key>`
 * apabila berasal dari bucket privat (`bantuin-kyc`) atau URL objek Supabase yang dikenali.
 */
export function normalizeToStorageRef(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = parseStorageRef(value);
  if (parsed && parsed.bucket === SUPABASE_BUCKETS.KYC) {
    return toStorageRef(parsed.bucket, parsed.key);
  }
  return value.trim();
}

/**
 * Apakah nilai ini referensi dokumen yang sah untuk disimpan di DB.
 * Menolak blob:/data: URL (hanya hidup di browser pengunggah) dan menolak public object URL untuk bucket KYC.
 */
export function isPersistableDocumentRef(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  if (value.startsWith(STORAGE_REF_PREFIX)) return Boolean(parseStorageRef(value));
  return /^https?:\/\//i.test(value);
}

/**
 * Membuat URL yang bisa dibuka untuk dokumen privat.
 * - storage://bucket/key  -> signed URL baru (default 15 menit)
 * - https://...           -> dikembalikan apa adanya (data lama)
 * - selain itu (blob:, kosong) -> null
 */
export async function resolveDocumentUrl(ref, expiresInSeconds = 900) {
  if (!ref || typeof ref !== "string") return null;
  const parsed = parseStorageRef(ref);
  if (!parsed) {
    return /^https:\/\//i.test(ref) ? ref : null;
  }
  if (!isSupabaseConfigured()) return null;
  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.key, expiresInSeconds);
    if (error) {
      console.warn(`[resolveDocumentUrl] ${parsed.bucket}/${parsed.key}:`, error.message);
      return null;
    }
    return data?.signedUrl || null;
  } catch (err) {
    console.warn("[resolveDocumentUrl] error:", err?.message || err);
    return null;
  }
}
