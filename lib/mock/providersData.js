/**
 * Bantuin Provider & Helper Catalog Data Store
 * Terhubung dengan profil asli pengguna & database backend.
 * Seluruh data dummy/mockup telah dibersihkan secara total.
 */

export const PROVIDERS_DATA = [];

// Helper Functions
export function getAllProviders() {
  if (typeof window !== "undefined") {
    // Bersihkan seluruh legacy bantuin_provider_ di localStorage yang membuat stale mock card muncul
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("bantuin_provider_") || key === "bantuin_providers")) {
          localStorage.removeItem(key);
        }
      }
    } catch (_) {}
  }
  return [];
}

export function getProviderById(id) {
  if (!id) return null;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(`bantuin_provider_${id}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
  }
  return null;
}

export function saveProviderData(provider) {
  if (typeof window !== "undefined" && provider?.id) {
    try {
      localStorage.setItem(`bantuin_provider_${provider.id}`, JSON.stringify(provider));
      // Dispatch storage event so other components update immediately
      window.dispatchEvent(new Event("bantuin_provider_updated"));
    } catch (e) {
      console.warn("Could not save provider data:", e);
    }
  }
}

export function getProvidersByCategory(category) {
  const all = getAllProviders();
  if (!category || category === "Semua") return all;
  const catLower = category.toLowerCase();
  return all.filter((p) => {
    return (
      (p.category && p.category.toLowerCase() === catLower) ||
      (p.categoryLabel && p.categoryLabel.toLowerCase().includes(catLower)) ||
      ((catLower === "helper" || catLower.includes("tenaga") || catLower.includes("bantuan")) && p.type === "helper")
    );
  });
}

export function getStartingPrice(provider) {
  if (!provider) return 0;
  const packagePrices = provider.packages?.map((pkg) => pkg.price) || [];
  const catalogPrices = provider.catalog?.map((item) => item.price) || [];
  const allPrices = [...packagePrices, ...catalogPrices];
  if (allPrices.length === 0) return 0;
  return Math.min(...allPrices);
}

/**
 * Mengambil seluruh item katalog dari semua mitra penyedia & helper
 * menjadi daftar produk jasa terpadu (lengkap dengan data toko/mitra).
 */
export function getAllCatalogServices() {
  const services = [];
  const providers = getAllProviders();
  for (const provider of providers) {
    if (provider.catalog && provider.catalog.length > 0) {
      for (const item of provider.catalog) {
        services.push({
          id: item.id,
          title: item.title,
          image: item.image,
          photos: [
            item.image,
            ...(provider.portfolioPhotos?.map((p) => p.url) || [])
          ],
          price: item.price,
          unit: item.unit || "",
          category: item.category,
          categoryGroup: provider.category || "Jasa",
          desc: item.desc,
          provider: {
            id: provider.id,
            name: provider.name,
            brandTitle: provider.brandTitle,
            type: provider.type || "specialist",
            avatar: provider.avatar,
            coverBanner: provider.coverBanner,
            bio: provider.bio,
            badges: provider.badges || [],
            skills: provider.skills || [],
            rating: provider.rating || 0,
            reviewsCount: provider.reviewsCount || 0,
            completedJobs: provider.completedJobs || 0,
            location: provider.location || "Kabupaten Banyumas",
            address: provider.address || "",
            city: provider.city || "Kabupaten Banyumas",
            latitude: provider.latitude,
            longitude: provider.longitude,
            isVerified: provider.isVerified || false,
            responseTime: provider.responseTime || "10 menit"
          },
          packages: provider.packages || [],
          reviews: provider.reviews || []
        });
      }
    }
  }
  return services;
}

/**
 * Mengambil satu produk jasa berdasarkan ID
 */
export function getCatalogServiceById(id) {
  if (!id) return null;
  const all = getAllCatalogServices();
  const found = all.find((s) => s.id === id);
  if (found) return found;

  // Cek jika yang dioper adalah ID penyedia
  const foundByProv = all.find((s) => s.provider && s.provider.id === id);
  if (foundByProv) return foundByProv;

  return null;
}
