/**
 * verificationService.js
 * Identity & KYC Verification Queue Service Abstraction
 * Complies with Section 27 & 62 of requirements.
 *
 * Mengelola antrean pemeriksaan identitas (KTP, KTM, NIB) bagi Provider dan Partner.
 * Status: pending -> approved -> rejected -> resubmission_required
 */

const KYC_STORAGE_KEY = "bantuin_verifications_state";

const INITIAL_VERIFICATIONS = [
  {
    id: "kyc-001",
    applicantId: "fajar-ramadhan-desain",
    applicantName: "Fajar Ramadhan, S.Ds",
    applicantType: "provider",
    roleLabel: "Penyedia Jasa Desain",
    documentType: "KTP",
    nik: "3276012409950001",
    idCardUrl: "https://images.unsplash.com/photo-1578836537282-3171d77f8632?auto=format&fit=crop&w=600&q=80",
    city: "Jakarta Selatan",
    submittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    documentStatus: "valid",
    verificationStatus: "approved", // pending, approved, rejected, resubmission_required
    reviewer: "Admin Pusat",
    reviewedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    reason: "NIK dan foto KTP terverifikasi sah.",
  },
  {
    id: "kyc-002",
    applicantId: "ptr-001",
    applicantName: "Focus Nusantara Rental (Budi Santoso)",
    applicantType: "partner",
    roleLabel: "Mitra Rental Kamera",
    documentType: "KTP & NIB",
    nik: "3171021508880003",
    idCardUrl: "https://images.unsplash.com/photo-1578836537282-3171d77f8632?auto=format&fit=crop&w=600&q=80",
    city: "Jakarta Pusat",
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    documentStatus: "pending_review",
    verificationStatus: "pending",
    reviewer: null,
    reviewedAt: null,
    reason: "",
  },
  {
    id: "kyc-003",
    applicantId: "usr-009",
    applicantName: "Ahmad Zaki",
    applicantType: "provider",
    roleLabel: "Penyedia Jasa Servis AC",
    documentType: "KTP",
    nik: "3275031904990005",
    idCardUrl: "https://images.unsplash.com/photo-1578836537282-3171d77f8632?auto=format&fit=crop&w=600&q=80",
    city: "Bekasi Barat",
    submittedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    documentStatus: "pending_review",
    verificationStatus: "pending",
    reviewer: null,
    reviewedAt: null,
    reason: "",
  },
];

function getStoredVerifications() {
  if (typeof window === "undefined") return INITIAL_VERIFICATIONS;
  try {
    const raw = localStorage.getItem(KYC_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_VERIFICATIONS;
}

function saveVerifications(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_verifications_updated"));
  } catch {}
}

export const verificationService = {
  /**
   * Mengambil antrean verifikasi dengan filter
   */
  async getVerifications(filter = {}) {
    let list = getStoredVerifications();
    if (filter.status && filter.status !== "all") {
      list = list.filter((k) => k.verificationStatus === filter.status);
    }
    if (filter.applicantType && filter.applicantType !== "all") {
      list = list.filter((k) => k.applicantType === filter.applicantType);
    }
    return list;
  },

  /**
   * Mengambil detail verifikasi berdasarkan ID
   */
  async getVerificationById(id) {
    const list = getStoredVerifications();
    return list.find((k) => k.id === id) || null;
  },

  /**
   * Mengajukan verifikasi KYC baru
   */
  async submitVerification({ applicantId, applicantName, applicantType, documentType = "KTP", nik, idCardUrl, city }) {
    if (!applicantId || !nik || !idCardUrl) {
      throw new Error("Data NIK dan foto KTP wajib disertakan.");
    }

    const newKyc = {
      id: `kyc-${Date.now().toString().slice(-6)}`,
      applicantId,
      applicantName: applicantName || "Pendaftar",
      applicantType: applicantType || "provider",
      roleLabel: applicantType === "partner" ? "Mitra Rental" : "Penyedia Jasa",
      documentType,
      nik,
      idCardUrl,
      city: city || "Kota Terdaftar",
      submittedAt: new Date().toISOString(),
      documentStatus: "pending_review",
      verificationStatus: "pending",
      reviewer: null,
      reviewedAt: null,
      reason: "",
    };

    const current = getStoredVerifications();
    saveVerifications([newKyc, ...current]);
    return newKyc;
  },

  /**
   * Admin: Melakukan review verifikasi KYC (Approve, Reject, Resubmit)
   */
  async reviewVerification(id, { status, reason = "", reviewer = "Admin Pusat" }) {
    const list = getStoredVerifications();
    const updated = list.map((k) => {
      if (k.id === id) {
        return {
          ...k,
          verificationStatus: status,
          documentStatus: status === "approved" ? "valid" : "reviewed",
          reason,
          reviewer,
          reviewedAt: new Date().toISOString(),
        };
      }
      return k;
    });

    saveVerifications(updated);
    return updated.find((k) => k.id === id);
  },
};
