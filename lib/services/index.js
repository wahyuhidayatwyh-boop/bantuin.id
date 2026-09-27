/**
 * lib/services/index.js
 * Central barrel export for Bantuin Service & API Abstraction Layer
 * Complies with Section 5, 53, 54 of requirements.
 */

export { authService, CANONICAL_ROLES, ROLE_LABELS } from "./authService";
export { userService } from "./userService";
export { providerService } from "./providerService";
export { partnerService } from "./partnerService";
export { serviceService } from "./serviceService";
export { rentalService } from "./rentalService";
export { orderService, ORDER_FLOW_STATUS } from "./orderService";
export { categoryService, resolveCategoryIcon, PLATFORM_CATEGORIES, CategoryIcon, normalizeCategoryName } from "./categoryService";
export { locationService, LocationErrorCode, createCurrentLocation, createMeetingLocation, createServiceLocation, createSelectedArea } from "./locationService";
export { reviewService } from "./reviewService";
export { promotionService, PROMOTION_PACKAGES } from "./promotionService";
export { paymentService, PAYMENT_METHODS } from "./paymentService";
export { payoutService } from "./payoutService";
export { refundService } from "./refundService";
export { withdrawalService } from "./withdrawalService";
export { verificationService } from "./verificationService";
export { voucherService } from "./voucherService";
export { announcementService } from "./announcementService";
export { auditService } from "./auditService";
export { notificationService } from "./notificationService";
export { chatService } from "./chatService";
export { reportService } from "./reportService";
export { adminService } from "./adminService";
export { landingService } from "./landingService";
export { imageService } from "./imageService";

