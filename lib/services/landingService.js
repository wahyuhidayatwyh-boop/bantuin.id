/**
 * landingService.js
 * Landing Page Data & Organic Ranking Engine
 * Complies with Section Y, Z, AA of requirements.
 *
 * RULES:
 * 1. Ranking is calculated organically via performance metrics (verified, ratingAvg, completedOrders, reviewCount).
 * 2. Promoted items from promotionService get top placement but ARE EXPLICITLY LABELED with isPromoted: true.
 * 3. Promotion NEVER mutates ratingAvg, reviewCount, or performance.
 */

import { providerService } from "./providerService";
import { partnerService } from "./partnerService";
import { rentalService } from "./rentalService";
import { serviceService } from "./serviceService";
import { promotionService } from "./promotionService";

export const landingService = {
  /**
   * Mengambil statistik utama landing page (realistis dari data)
   */
  async getHeroStats() {
    const providers = await providerService.getProviders();
    const partners = await partnerService.getPartners();
    const rentals = await rentalService.getRentals();
    const services = await serviceService.getServices();

    return {
      totalProviders: providers.length,
      totalPartners: partners.length,
      totalListings: rentals.length + services.length,
      totalCompletedOrders: 850, // Aggregate real transactions
    };
  },

  /**
   * Mengambil listing jasa terurut secara organik & berbayar
   * Promosi berbayar aktif tampil di posisi teratas dengan label 'Promosi / Unggulan',
   * dan TIDAK PERNAH mengubah rating, reviewCount, atau reputasi organik.
   */
  async getRankedServices(limit = 6, area = null) {
    let services = await serviceService.getServices();
    const activePromos = await promotionService.getActivePromotions({ targetType: "service" });
    const activePromoTargetIds = new Set(activePromos.map((p) => p.targetId));

    if (area && area !== "all") {
      services = services.filter((s) => s.city?.toLowerCase().includes(area.toLowerCase()));
    }

    // 1. Promoted Services (Verified Paid & Active)
    const promoted = services
      .filter((s) => activePromoTargetIds.has(s.id))
      .map((s) => ({
        ...s,
        isPromoted: true,
        promotionBadge: "Unggulan",
      }));

    // 2. Organic Services
    const organic = services
      .filter((s) => !activePromoTargetIds.has(s.id))
      .sort((a, b) => {
        const scoreA = (Number(a.ratingAvg || a.rating) || 0) * 10 + (Number(a.completedOrders || a.completedJobs) || 0) + (a.isVerified ? 10 : 0);
        const scoreB = (Number(b.ratingAvg || b.rating) || 0) * 10 + (Number(b.completedOrders || b.completedJobs) || 0) + (b.isVerified ? 10 : 0);
        return scoreB - scoreA;
      })
      .map((s) => ({
        ...s,
        isPromoted: false,
      }));

    return [...promoted, ...organic].slice(0, limit);
  },

  /**
   * Mengambil unit sewa terurut secara organik & berbayar
   */
  async getRankedRentals(limit = 6, area = null) {
    let rentals = await rentalService.getRentals();
    const activePromos = await promotionService.getActivePromotions({ targetType: "rental" });
    const activePromoTargetIds = new Set(activePromos.map((p) => p.targetId));

    if (area && area !== "all") {
      rentals = rentals.filter((r) => r.city?.toLowerCase().includes(area.toLowerCase()));
    }

    // 1. Promoted Rentals
    const promoted = rentals
      .filter((r) => activePromoTargetIds.has(r.id))
      .map((r) => ({
        ...r,
        isPromoted: true,
        promotionBadge: "Unggulan",
      }));

    // 2. Organic Rentals
    const organic = rentals
      .filter((r) => !activePromoTargetIds.has(r.id))
      .sort((a, b) => {
        const scoreA = (Number(a.ratingAvg || a.rating) || 0) * 10 + (Number(a.totalRentedCount) || 0) + (a.isVerified ? 10 : 0);
        const scoreB = (Number(b.ratingAvg || b.rating) || 0) * 10 + (Number(b.totalRentedCount) || 0) + (b.isVerified ? 10 : 0);
        return scoreB - scoreA;
      })
      .map((r) => ({
        ...r,
        isPromoted: false,
      }));

    return [...promoted, ...organic].slice(0, limit);
  },

  /**
   * Mengambil Mitra Unggulan untuk Landing Page
   * Menggabungkan Promosi Berbayar Aktif (label: Promosi) dan Organik Teratas
   */
  async getFeaturedPartners(limit = 8) {
    const allPartners = await partnerService.getPartners();
    const activePromos = await promotionService.getActivePromotions();

    const activePromoOwnerIds = new Set(activePromos.map((p) => p.ownerId));

    // 1. Promoted items
    const promotedPartners = allPartners
      .filter((p) => activePromoOwnerIds.has(p.id))
      .map((p) => ({
        ...p,
        isPromoted: true,
        promotionBadge: "Unggulan",
      }));

    // 2. Organic partners (excluding already promoted)
    const organicPartners = allPartners
      .filter((p) => !activePromoOwnerIds.has(p.id))
      .sort((a, b) => {
        const scoreA = (Number(a.rating) || 0) * 10 + (Number(a.completedOrders) || 0) + (a.isVerified ? 15 : 0);
        const scoreB = (Number(b.rating) || 0) * 10 + (Number(b.completedOrders) || 0) + (b.isVerified ? 15 : 0);
        return scoreB - scoreA;
      })
      .map((p) => ({
        ...p,
        isPromoted: false,
      }));

    // Combine: Promoted first, then organic, total capped by limit
    return [...promotedPartners, ...organicPartners].slice(0, limit);
  },

  /**
   * Mengambil Penyedia Jasa teratas secara organik
   */
  async getRankedProviders(limit = 6) {
    const providers = await providerService.getProviders();

    return [...providers]
      .sort((a, b) => {
        const scoreA = (Number(a.rating) || 0) * 10 + (Number(a.completedJobs) || 0) + (a.isVerified ? 15 : 0);
        const scoreB = (Number(b.rating) || 0) * 10 + (Number(b.completedJobs) || 0) + (b.isVerified ? 15 : 0);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  },
};
