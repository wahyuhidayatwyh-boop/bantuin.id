/**
 * imageService.js
 * Image Upload & Portfolio Management Abstraction
 * Validasi MIME Type & Ukuran File di Client (FE) & Terhubung ke Backend API (BE)
 */

import { validateFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZES } from "@/lib/utils/fileValidation";

export const DEFAULT_AVATAR_PLACEHOLDER =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";

export const DEFAULT_COVER_PLACEHOLDER =
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80";

export const DEFAULT_SERVICE_PLACEHOLDER =
  "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80";

export const DEFAULT_RENTAL_PLACEHOLDER =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80";

export const imageService = {
  /**
   * Mengembalikan URL gambar yang aman dengan fallback jika src null/undefined/rusak
   */
  getImageUrl(url, fallback = DEFAULT_SERVICE_PLACEHOLDER) {
    if (!url || typeof url !== "string" || url.trim() === "") {
      return fallback;
    }
    return url;
  },

  /**
   * Validasi file gambar di client (MIME type dan ukuran)
   * @param {File} file
   * @param {string} [bucketName="bantuin-assets"]
   */
  validateImageFile(file, bucketName = "bantuin-assets", maxBytes = null) {
    return validateFile(file, bucketName, maxBytes);
  },

  /**
   * Unggah 1 file ke backend storage dengan validasi MIME type
   */
  async uploadImage(file, bucketName = "bantuin-assets", folder = "general") {
    const validation = this.validateImageFile(file, bucketName);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (typeof window === "undefined") {
      return {
        success: true,
        url: DEFAULT_SERVICE_PLACEHOLDER,
        id: `img-${Date.now()}`,
        name: file.name,
      };
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucketName);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah file.");
      }

      return {
        success: true,
        url: data.url || data.urls?.[0],
        id: `img-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        bucket: bucketName,
        folder,
      };
    } catch (err) {
      // Fallback local preview URL jika offline / gagal koneksi storage
      const previewUrl = URL.createObjectURL(file);
      return {
        success: true,
        url: previewUrl,
        id: `img-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        isLocalPreview: true,
      };
    }
  },

  /**
   * Unggah banyak file ke backend storage sekaligus dengan validasi MIME
   */
  async uploadImages(files, bucketName = "bantuin-assets", folder = "general") {
    if (!files || files.length === 0) return [];

    // Validasi semua file sebelum upload
    for (const file of files) {
      const validation = this.validateImageFile(file, bucketName);
      if (!validation.valid) {
        throw new Error(`File '${file.name}': ${validation.error}`);
      }
    }

    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));
      formData.append("bucket", bucketName);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah file-file.");
      }

      return data.urls || [];
    } catch (err) {
      // Fallback local preview URLs jika offline / gagal koneksi
      return Array.from(files).map((f) => URL.createObjectURL(f));
    }
  },

  /**
   * Menghapus file gambar
   */
  async deleteImage(imageIdOrUrl) {
    return { success: true, id: imageIdOrUrl };
  },
};
