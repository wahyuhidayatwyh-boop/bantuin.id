/**
 * imageService.js
 * Image Upload & Portfolio Management Abstraction
 * Complies with Section 16 & 17 of requirements.
 *
 * Provides a clean abstraction layer:
 * - Current implementation: Mock Adapter (local data URL / safe fallback images)
 * - Future implementation: Cloudinary / S3 / Supabase Storage REST API Adapter
 *
 * PREVENTS runtime exceptions:
 * - Safe image URL resolution (never returns null/undefined to <img src>)
 * - File size and mime-type validation
 * - SSR safety for browser-only APIs (FileReader / URL.createObjectURL)
 */

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
   * Validasi file gambar di client sebelum diunggah
   */
  validateImageFile(file, maxBytes = 5 * 1024 * 1024) {
    if (!file) {
      return { valid: false, error: "File tidak dipilih." };
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.",
      };
    }

    if (file.size > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      return {
        valid: false,
        error: `Ukuran file terlalu besar (maksimal ${maxMb}MB).`,
      };
    }

    return { valid: true, error: null };
  },

  /**
   * Unggah file gambar (Frontend Mock Adapter -> Backend API Ready)
   * Mengembalikan data URL / temporary preview URL yang aman
   */
  async uploadImage(file, folder = "general") {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // SSR Guard
    if (typeof window === "undefined") {
      return {
        success: true,
        url: DEFAULT_SERVICE_PLACEHOLDER,
        id: `img-${Date.now()}`,
        name: file.name,
      };
    }

    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result;
          resolve({
            success: true,
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: dataUrl || DEFAULT_SERVICE_PLACEHOLDER,
            name: file.name,
            size: file.size,
            type: file.type,
            folder,
            createdAt: new Date().toISOString(),
          });
        };
        reader.onerror = () => {
          reject(new Error("Gagal membaca file gambar"));
        };
        reader.readAsDataURL(file);
      } catch (err) {
        reject(new Error("Terjadi kesalahan saat memproses gambar"));
      }
    });
  },

  /**
   * Menghapus file gambar (Mock abstraction)
   */
  async deleteImage(imageIdOrUrl) {
    // Pada mock frontend, return true. Backend nantinya menghapus dari storage bucket.
    return { success: true, id: imageIdOrUrl };
  },
};
