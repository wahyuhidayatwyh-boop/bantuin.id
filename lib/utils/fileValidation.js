/**
 * fileValidation.js
 * Centralized MIME Type & File Size Validation Helper
 * Dapat digunakan di Frontend (FE) & Backend (BE)
 */

export const ALLOWED_MIME_TYPES = {
  // 1. bantuin-assets (Katalog Sewa, Jasa, Banner, Aset Umum)
  "bantuin-assets": [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ],

  // 2. bantuin-avatars (Foto Profil User / Mitra / Provider)
  "bantuin-avatars": [
    "image/jpeg",
    "image/png",
    "image/webp",
  ],

  // 3. bantuin-proofs (Foto Bukti Pengerjaan Tugas & Checkpoint)
  "bantuin-proofs": [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],

  // 4. bantuin-documents (File Tugas, Skripsi, Dokumen Print/Fotokopi)
  "bantuin-documents": [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/webp",
  ],

  // 5. bantuin-kyc (KTP, KTM, Selfie KYC)
  "bantuin-kyc": [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],

  // Default / General fallback
  general: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ],
};

export const MAX_FILE_SIZES = {
  "bantuin-assets": 10 * 1024 * 1024, // 10MB
  "bantuin-avatars": 5 * 1024 * 1024, // 5MB
  "bantuin-proofs": 10 * 1024 * 1024, // 10MB
  "bantuin-documents": 25 * 1024 * 1024, // 25MB
  "bantuin-kyc": 10 * 1024 * 1024, // 10MB
  general: 10 * 1024 * 1024, // 10MB
};

/**
 * Mendapatkan string `accept` untuk tag <input type="file" accept="..." />
 * @param {string} bucketName
 * @returns {string}
 */
export function getAcceptAttribute(bucketName = "bantuin-assets") {
  const allowed = ALLOWED_MIME_TYPES[bucketName] || ALLOWED_MIME_TYPES.general;
  return allowed.join(", ");
}

/**
 * Validasi MIME Type dan Ukuran File
 * @param {File|Blob|{type: string, size?: number, name?: string}} file
 * @param {string} [bucketName="bantuin-assets"]
 * @param {number} [customMaxSize]
 * @returns {{ valid: boolean, error?: string, mimeType: string }}
 */
export function validateFile(file, bucketName = "bantuin-assets", customMaxSize = null) {
  if (!file) {
    return { valid: false, error: "File tidak ditemukan atau kosong.", mimeType: "" };
  }

  const mimeType = (file.type || "").toLowerCase().trim();
  const allowedTypes = ALLOWED_MIME_TYPES[bucketName] || ALLOWED_MIME_TYPES.general;

  // 1. Validasi MIME Type
  const isMimeValid = allowedTypes.includes(mimeType) || allowedTypes.some((allowed) => {
    if (allowed.endsWith("/*")) {
      const prefix = allowed.replace("/*", "");
      return mimeType.startsWith(prefix);
    }
    return false;
  });

  if (!isMimeValid) {
    const readableAllowed = allowedTypes
      .map((t) => t.split("/")[1] || t)
      .join(", ");
    return {
      valid: false,
      error: `Format file tidak didukung (${mimeType || "tidak terdeteksi"}). Format yang diperbolehkan: ${readableAllowed}.`,
      mimeType,
    };
  }

  // 2. Validasi Ukuran File (jika ada size)
  const maxSize = customMaxSize || MAX_FILE_SIZES[bucketName] || MAX_FILE_SIZES.general;
  if (file.size && file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `Ukuran file melebihi batas maksimal ${maxSizeMB}MB.`,
      mimeType,
    };
  }

  return { valid: true, mimeType };
}
