"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { authService } from "@/lib/services/authService";
import { formatIDR, formatNumberWithDots, formatExternalUrl } from "@/lib/utils";
import { validateFile, getAcceptAttribute } from "@/lib/utils/fileValidation";
import { saveFormDraft, getFormDraft, clearFormDraft, useBeforeUnload } from "@/lib/hooks/useFormDraft";
import { 
  ArrowLeft, 
  ArrowRight,
  Send, 
  ShieldCheck, 
  FileText, 
  Briefcase, 
  Upload, 
  Link2, 
  Trash2, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Star
} from "lucide-react";

export default function AjukanBantuanPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentUser, setCurrentUser, addToast } = useApp();

  const [request, setRequest] = useState(null);
  const [isLoadingRequest, setIsLoadingRequest] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Wizard Step (1: Tawaran, 2: Lampiran Opsional, 3: Ringkasan & Konfirmasi)
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields - Tawaran
  const [pitchMessage, setPitchMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState("25000");
  const [durationMode, setDurationMode] = useState("preset"); // 'preset' | 'custom'
  const [estimatedDuration, setEstimatedDuration] = useState("1-2 Jam");
  const [customDurationValue, setCustomDurationValue] = useState("30");
  const [customDurationUnit, setCustomDurationUnit] = useState("Menit"); // 'Menit' | 'Jam' | 'Hari'

  // Form Fields - Lampiran Pendukung (Opsional)
  const [cvFile, setCvFile] = useState(null);
  const [cvFileName, setCvFileName] = useState("");
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [portfolioFileName, setPortfolioFileName] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");

  // Checkbox Konfirmasi Step 3
  const [confirmReady, setConfirmReady] = useState(false);

  // Form Validation & Submission
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Verifikasi Jasa: Pengguna umum harus verifikasi jasa terlebih dahulu agar memenuhi syarat
  const isRegularUser = !currentUser || currentUser?.accountType === "user" || currentUser?.accountRole === "user";
  const hasSubmittedKyc = currentUser?.verificationStatus === "verified" || currentUser?.verificationStatus === "pending_review";
  const [justSubmittedKyc, setJustSubmittedKyc] = useState(false);
  const needsJasaVerification = isRegularUser && !hasSubmittedKyc && !justSubmittedKyc;

  const [verificationData, setVerificationData] = useState({
    idNumber: currentUser?.idNumber || "",
    idCardFile: null,
    idCardPreview: currentUser?.idCardUrl || null,
    idCardFileName: "",
    idCardType: null,
    skill: "Tukang Antar & Errand",
    customSkill: "",
    payoutAccount: currentUser?.bankInfo?.accountNumber || "",
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDraggingKtp, setIsDraggingKtp] = useState(false);

  const DRAFT_KEY = id ? `bantuin_draft_ajukan_${id}` : null;
  const hasLoadedDraftRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    if (!DRAFT_KEY || hasLoadedDraftRef.current) return;
    hasLoadedDraftRef.current = true;
    const draft = getFormDraft(DRAFT_KEY, null);
    if (draft) {
      if (draft.pitchMessage) setPitchMessage(draft.pitchMessage);
      if (draft.proposedPrice) setProposedPrice(draft.proposedPrice);
      if (draft.durationMode) setDurationMode(draft.durationMode);
      if (draft.estimatedDuration) setEstimatedDuration(draft.estimatedDuration);
      if (draft.customDurationValue) setCustomDurationValue(draft.customDurationValue);
      if (draft.customDurationUnit) setCustomDurationUnit(draft.customDurationUnit);
      if (draft.portfolioLink) setPortfolioLink(draft.portfolioLink);
      if (draft.currentStep && Number(draft.currentStep) >= 1) {
        setCurrentStep(Number(draft.currentStep));
      }
      if (draft.verificationData) {
        setVerificationData((prev) => ({ ...prev, ...draft.verificationData }));
      }
    }
  }, [DRAFT_KEY]);

  // Auto-save draft on every change
  useEffect(() => {
    if (!DRAFT_KEY || !hasLoadedDraftRef.current) return;
    if (pitchMessage || portfolioLink || currentStep > 1) {
      saveFormDraft(DRAFT_KEY, {
        pitchMessage,
        proposedPrice,
        durationMode,
        estimatedDuration,
        customDurationValue,
        customDurationUnit,
        portfolioLink,
        currentStep,
        verificationData,
      });
    }
  }, [
    DRAFT_KEY,
    pitchMessage,
    proposedPrice,
    durationMode,
    estimatedDuration,
    customDurationValue,
    customDurationUnit,
    portfolioLink,
    currentStep,
    verificationData,
  ]);

  const isFormDirty = Boolean(pitchMessage.trim().length > 0 || portfolioLink.trim().length > 0);
  useBeforeUnload(isFormDirty, "Ada pesan tawaran bantuan yang belum dikirim. Yakin ingin meninggalkan halaman?");

  const fetchRequestDetail = async () => {
    if (!id) return;
    setIsLoadingRequest(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/requests/${id}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Permintaan bantuan tidak ditemukan.");
      }
      setRequest(json.data);
      if (json.data?.rewardAmount) {
        setProposedPrice(String(json.data.rewardAmount));
      }
    } catch (err) {
      console.error("Fetch request error in ajukan page:", err);
      setErrorMsg(err.message);
    } finally {
      setIsLoadingRequest(false);
    }
  };

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  if (isLoadingRequest) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-600">Memuat rincian bantuan...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!request || errorMsg) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Permintaan Bantuan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">{errorMsg || "Mungkin permintaan sudah ditutup atau selesai."}</p>
          <Link href="/bantuan" className="px-5 py-2.5 bg-[#1683FF] text-white rounded-xl text-xs font-bold shadow-xs">
            Kembali ke Daftar Bantuan
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleKtpUpload = (file) => {
    if (!file) return;
    const validation = validateFile(file, "bantuin-kyc");
    if (!validation.valid) {
      addToast?.("Format File Ditolak", validation.error, "error");
      return;
    }
    setVerificationData((prev) => ({
      ...prev,
      idCardFile: file,
      idCardPreview: URL.createObjectURL(file),
      idCardFileName: file.name,
      idCardType: file.type,
    }));
  };

  const handleJasaVerification = async (e) => {
    e.preventDefault();
    if (!verificationData.idNumber || verificationData.idNumber.length !== 16) {
      addToast?.("NIK Belum Valid", "Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka.", "error");
      return;
    }
    if (!verificationData.idCardFile && !verificationData.idCardPreview) {
      addToast?.("KTP Belum Diunggah", "Harap unggah foto KTP asli Anda.", "error");
      return;
    }
    if (verificationData.skill === "other" && !verificationData.customSkill?.trim()) {
      addToast?.("Bidang Keahlian Belum Diisi", "Harap tuliskan bidang keahlian Anda pada kolom yang disediakan.", "error");
      return;
    }
    if (!verificationData.payoutAccount) {
      addToast?.("Rekening Belum Diisi", "Harap isi nomor rekening pencairan imbalan Anda.", "error");
      return;
    }

    const resolvedSkill = verificationData.skill === "other"
      ? verificationData.customSkill.trim()
      : verificationData.skill;

    setIsVerifying(true);
    try {
      const token = await authService.getValidAccessToken();
      if (!token) {
        throw new Error("Sesi login tidak valid. Silakan login terlebih dahulu.");
      }

      // 1. Upload KTP ke penyimpanan resmi jika ada berkas baru
      let finalKtpUrl = verificationData.idCardPreview;
      if (verificationData.idCardFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", verificationData.idCardFile);
        uploadFormData.append("bucket", "bantuin-kyc");
        uploadFormData.append("folder", "ktp");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });
        const uploadJson = await uploadRes.json();
        const uploadedRef = uploadJson.storageRef || uploadJson.url || uploadJson.data?.storageRef || uploadJson.data?.url;
        if (!uploadRes.ok || !uploadedRef) {
          throw new Error(uploadJson.error || "Gagal mengunggah foto KTP ke penyimpanan.");
        }
        finalKtpUrl = uploadedRef;
      } else if (!finalKtpUrl || finalKtpUrl.startsWith("blob:")) {
        throw new Error("Berkas KTP belum diunggah secara fisik.");
      }

      // 2. Parsing rekening bank penerima
      const bankParts = (verificationData.payoutAccount || "").trim().split(/\s+/);
      const targetBank = bankParts[0] || "BCA";
      const targetAccNum = bankParts[1] || verificationData.payoutAccount.trim();
      const targetHolder = currentUser?.fullName || "Pengguna";

      // 3. Simpan Rekening Payout
      await fetch("/api/profile/payout-account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payoutBank: targetBank,
          payoutAccountNumber: verificationData.payoutAccount.trim(),
          payoutAccountHolder: targetHolder,
        }),
      }).catch((err) => console.warn("payout-account update err:", err));

      // 4. Kirim pengajuan KYC resmi ke /api/profile/kyc (Disinkronkan ke Admin KYC)
      const kycRes = await fetch("/api/profile/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idNumber: verificationData.idNumber.trim(),
          idCardUrl: finalKtpUrl,
          skill: resolvedSkill,
          skills: [resolvedSkill],
          payoutAccount: verificationData.payoutAccount.trim(),
          payoutBank: targetBank,
          payoutAccountNumber: verificationData.payoutAccount.trim(),
          payoutAccountHolder: targetHolder,
        }),
      });

      const kycJson = await kycRes.json();
      if (!kycRes.ok || !kycJson.success) {
        throw new Error(kycJson.error || "Gagal mengirimkan pengajuan verifikasi identitas KYC.");
      }

      // 5. Update data profil ke authService & state global AppContext
      const viewableKtpUrl = kycJson.data?.idCardViewUrl || finalKtpUrl;
      const updatedProfilePayload = {
        verificationStatus: "pending_review",
        verificationNotes: "Menunggu peninjauan oleh Administrator Bantuin",
        idNumber: verificationData.idNumber.trim(),
        idCardUrl: viewableKtpUrl,
        idCardViewUrl: viewableKtpUrl,
        skills: [resolvedSkill, ...(currentUser?.skills || []).filter((s) => s !== resolvedSkill)],
        faculty: resolvedSkill,
        payoutBank: targetBank,
        payoutAccountNumber: verificationData.payoutAccount.trim(),
        payoutAccountHolder: targetHolder,
        bankInfo: {
          bankName: targetBank,
          accountNumber: verificationData.payoutAccount.trim(),
          accountHolder: targetHolder,
        },
      };

      await authService.updateProfile(updatedProfilePayload, false);

      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...prev,
          ...updatedProfilePayload,
        }));
      }

      setJustSubmittedKyc(true);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_auth_changed"));
      }

      addToast?.(
        "Verifikasi Terkirim!", 
        "Data identitas Anda telah masuk ke antrean verifikasi KYC admin. Anda sekarang aktif dan dapat langsung mengajukan formulir penawaran.",
        "success"
      );
    } catch (err) {
      console.warn("Submit KYC from ajukan error:", err);
      addToast?.("Gagal Mengirim", err.message || "Terjadi kesalahan saat mengirim berkas identitas.", "error");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCVUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file, "bantuin-documents");
      if (!validation.valid) {
        addToast?.("Format File Ditolak", validation.error, "error");
        return;
      }
      setCvFile(file);
      setCvFileName(file.name);
    }
  };

  const handlePortfolioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file, "bantuin-documents");
      if (!validation.valid) {
        addToast?.("Format File Ditolak", validation.error, "error");
        return;
      }
      setPortfolioFile(file);
      setPortfolioFileName(file.name);
    }
  };

  const validateStep1 = () => {
    const errs = {};
    if (!pitchMessage.trim() || pitchMessage.trim().length < 10) {
      errs.pitchMessage = "Jelaskan tawaran Anda minimal 10 karakter.";
    }
    if (!proposedPrice || Number(proposedPrice) < 1000) {
      errs.proposedPrice = "Nominal imbalan tawaran minimal Rp1.000";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getFinalDuration = () => {
    return durationMode === "preset"
      ? estimatedDuration
      : `${customDurationValue || "30"} ${customDurationUnit}`;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }

    if (!confirmReady) {
      setErrors((prev) => ({
        ...prev,
        confirm: "Harap centang konfirmasi kesiapan pengerjaan sebelum mengirim proposal.",
      }));
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedCvUrl = null;
      let uploadedCvName = cvFileName ? cvFileName.trim() : null;
      let uploadedPortfolioUrl = portfolioLink?.trim() ? formatExternalUrl(portfolioLink) : null;
      let uploadedPortfolioName = portfolioFileName
        ? portfolioFileName.trim()
        : (portfolioLink?.trim() ? "Tautan Portofolio Online" : null);

      // 1. Upload file CV jika ada file fisik yang dipilih
      if (cvFile) {
        try {
          const cvFormData = new FormData();
          cvFormData.append("file", cvFile);
          cvFormData.append("bucket", "bantuin-documents");
          cvFormData.append("folder", "cv");

          const cvRes = await fetch("/api/upload", {
            method: "POST",
            body: cvFormData,
          });
          const cvData = await cvRes.json();
          if (cvData.success && (cvData.url || cvData.urls?.[0])) {
            uploadedCvUrl = cvData.url || cvData.urls[0];
          }
        } catch (uploadCvErr) {
          console.warn("Upload CV error, continuing:", uploadCvErr);
        }
      }

      // 2. Upload file Portofolio jika ada file fisik yang dipilih
      if (portfolioFile) {
        try {
          const portFormData = new FormData();
          portFormData.append("file", portfolioFile);
          portFormData.append("bucket", "bantuin-documents");
          portFormData.append("folder", "portfolio");

          const portRes = await fetch("/api/upload", {
            method: "POST",
            body: portFormData,
          });
          const portData = await portRes.json();
          if (portData.success && (portData.url || portData.urls?.[0])) {
            uploadedPortfolioUrl = portData.url || portData.urls[0];
            if (!uploadedPortfolioName) {
              uploadedPortfolioName = portfolioFile.name;
            }
          }
        } catch (uploadPortErr) {
          console.warn("Upload Portfolio error, continuing:", uploadPortErr);
        }
      }

      const token = await authService.getValidAccessToken();
      const res = await fetch(`/api/requests/${request.id}/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          helperId: currentUser?.id,
          helperEmail: currentUser?.email,
          pitchMessage: pitchMessage.trim(),
          proposedPrice: Number(proposedPrice) || request.rewardAmount,
          estimatedArrivalMinutes: 15,
          cvUrl: uploadedCvUrl,
          cvName: uploadedCvName,
          portfolioUrl: uploadedPortfolioUrl,
          portfolioName: uploadedPortfolioName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirimkan tawaran bantuan.");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_activity_updated"));
      }

      if (DRAFT_KEY) {
        clearFormDraft(DRAFT_KEY);
      }
      addToast?.("Proposal Terkirim", "Tawaran bantuan Anda berhasil dikirim ke peminta.");
      router.push(`/bantuan/${request.id}`);
    } catch (err) {
      console.error("Submit offer failed:", err);
      addToast?.("Gagal Mengirim", err.message || "Terjadi kesalahan sistem.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Navigation Back */}
        <Link
          href={`/bantuan/${request.id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#1683FF] transition mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail Permintaan</span>
        </Link>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ajukan Tawaran Bantuan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kirimkan penawaran Anda kepada peminta bantuan dengan langkah-langkah di bawah ini.
          </p>
        </div>

        {/* RINGKASAN TUGAS YANG INGIN DIBANTU */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-bold text-[#1683FF] uppercase tracking-wider block">
              Permintaan Tugas dari {request.requester?.name || "Peminta"}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {request.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[200px]">{request.locationName || "Lokasi peminta"}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Batas: {request.deadline ? new Date(request.deadline).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB" : "Hari ini"}</span>
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium block">Budget Peminta:</span>
            <span className="text-base sm:text-lg font-black text-[#1683FF]">
              {request.isVoluntary ? "Sukarela" : formatIDR(request.rewardAmount)}
            </span>
          </div>
        </div>

        {/* VERIFIKASI JASA GATE (Jika Belum Terverifikasi) */}
        {needsJasaVerification ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-[#1683FF]" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Verifikasi Akun Tenaga Bantuan
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Lengkapi identitas KTP dan nomor rekening pencairan sekali saja agar Anda memenuhi syarat mengambil tugas dan menerima pembayaran.
              </p>
            </div>

            <form onSubmit={handleJasaVerification} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {verificationData.idNumber?.length || 0}/16 digit
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="Masukkan 16 digit NIK KTP Anda"
                  value={verificationData.idNumber}
                  onChange={(e) => setVerificationData({ ...verificationData, idNumber: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                  className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto KTP Asli <span className="text-red-500">*</span>
                </label>
                {verificationData.idCardPreview ? (
                  <div className="flex items-center justify-between p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {verificationData.idCardFileName || "ktp_terlampir.jpg"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVerificationData({ ...verificationData, idCardFile: null, idCardPreview: null, idCardFileName: "" })}
                      className="text-xs text-rose-600 font-semibold hover:underline"
                    >
                      Ganti File
                    </button>
                  </div>
                ) : (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingKtp(true); }}
                    onDragLeave={() => setIsDraggingKtp(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingKtp(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleKtpUpload(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 ${
                      isDraggingKtp ? "border-[#1683FF] bg-blue-50" : "border-slate-300 hover:border-[#1683FF] bg-white"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-[#1683FF] mb-1" />
                    <span className="text-xs font-bold text-slate-800">
                      Klik atau tarik foto KTP ke sini
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Format: JPG, PNG, WEBP, PDF (Maks. 10MB)
                    </span>
                    <input
                      type="file"
                      accept={getAcceptAttribute("bantuin-kyc")}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleKtpUpload(file);
                      }}
                      className="hidden"
                      required
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bidang Keahlian Utama <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={verificationData.skill}
                    onChange={(e) => setVerificationData({ ...verificationData, skill: e.target.value, customSkill: "" })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="Tukang Antar & Errand">Tukang Antar &amp; Errand</option>
                    <option value="Admin Data & Excel">Admin Data &amp; Excel</option>
                    <option value="Desain Grafis & Logo">Desain Grafis &amp; Logo</option>
                    <option value="Video Editing & Reels">Video Editing &amp; Reels</option>
                    <option value="Web & IT Development">Web &amp; IT Development</option>
                    <option value="Servis Komputer / Laptop">Servis Komputer / Laptop</option>
                    <option value="Penerjemah & Copywriting">Penerjemah &amp; Copywriting</option>
                    <option value="Teknisi AC & Tukang Listrik">Teknisi AC &amp; Tukang Listrik</option>
                    <option value="Bimbingan Belajar & Les">Bimbingan Belajar &amp; Les</option>
                    <option value="Fotografi & Liputan">Fotografi &amp; Liputan</option>
                    <option value="other">Lainnya...</option>
                  </select>
                  {verificationData.skill === "other" && (
                    <input
                      type="text"
                      required
                      placeholder="Tulis bidang keahlian Anda"
                      value={verificationData.customSkill}
                      onChange={(e) => setVerificationData({ ...verificationData, customSkill: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-blue-300 mt-2 bg-blue-50/50 focus:outline-none focus:border-[#1683FF]"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Rekening Bank / E-Wallet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BCA 8820192841 a/n Budi"
                    value={verificationData.payoutAccount}
                    onChange={(e) => setVerificationData({ ...verificationData, payoutAccount: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Verifikasi &amp; Lanjutkan ke Formulir Tawaran</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* MULTI-STEP OFFER WIZARD */
          <div>
            {/* STEPPER BAR */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs">
              {/* Mobile Stepper Header */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1683FF]">
                    Langkah {currentStep} dari 3
                  </span>
                  <span className="text-slate-500 font-medium">
                    {currentStep === 1 && "Penawaran & Waktu"}
                    {currentStep === 2 && "Lampiran (Opsional)"}
                    {currentStep === 3 && "Ringkasan & Kirim"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#1683FF] h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  />
                </div>
              </div>

              {/* Desktop Stepper */}
              <div className="hidden sm:grid grid-cols-3 gap-3">
                {/* Step 1 */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition ${
                    currentStep === 1 ? "bg-blue-50/80 border border-blue-200/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                    currentStep > 1 
                      ? "bg-emerald-500 text-white" 
                      : currentStep === 1 
                      ? "bg-[#1683FF] text-white" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-tight ${currentStep === 1 ? "text-slate-900" : "text-slate-600"}`}>
                      1. Penawaran &amp; Waktu
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">Rencana kerja &amp; harga</p>
                  </div>
                </button>

                {/* Step 2 */}
                <button
                  type="button"
                  onClick={() => { if (validateStep1()) setCurrentStep(2); }}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition ${
                    currentStep === 2 ? "bg-blue-50/80 border border-blue-200/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                    currentStep > 2 
                      ? "bg-emerald-500 text-white" 
                      : currentStep === 2 
                      ? "bg-[#1683FF] text-white" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {currentStep > 2 ? <Check className="w-4 h-4" /> : "2"}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-tight ${currentStep === 2 ? "text-slate-900" : "text-slate-600"}`}>
                      2. Lampiran Tambahan
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">CV &amp; link portofolio (opsional)</p>
                  </div>
                </button>

                {/* Step 3 */}
                <button
                  type="button"
                  onClick={() => { if (validateStep1()) setCurrentStep(3); }}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition ${
                    currentStep === 3 ? "bg-blue-50/80 border border-blue-200/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                    currentStep === 3 
                      ? "bg-[#1683FF] text-white" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    3
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-tight ${currentStep === 3 ? "text-slate-900" : "text-slate-600"}`}>
                      3. Ringkasan &amp; Kirim
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">Periksa &amp; konfirmasi proposal</p>
                  </div>
                </button>
              </div>
            </div>

            {/* STEP CONTAINER */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs">
              
              {/* ==================== STEP 1: PENAWARAN & WAKTU ==================== */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Langkah 1: Rencana Pengerjaan &amp; Tawaran Imbalan
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jelaskan kesiapan Anda, alat/kendaraan yang dipakai, dan harga yang Anda ajukan.
                    </p>
                  </div>

                  {/* Pesan Tawaran */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                      Pesan Tawaran &amp; Rencana Kerja <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={pitchMessage}
                      onChange={(e) => setPitchMessage(e.target.value)}
                      placeholder="Contoh: Halo, saya siap membantu mengambil map dokumen ini sekarang. Saya berada dekat lokasi dan menggunakan motor. Dokumen akan saya antarkan dengan aman..."
                      className={`w-full text-xs sm:text-sm p-3.5 rounded-xl border transition ${
                        errors.pitchMessage ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#1683FF]"
                      } focus:outline-none leading-relaxed text-slate-800`}
                    />
                    {errors.pitchMessage && <p className="text-[11px] text-red-500 mt-1">{errors.pitchMessage}</p>}
                  </div>

                  {/* Tawaran Imbalan & Estimasi Waktu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                        Tawaran Imbalan Anda (Rp) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none select-none">
                          Rp
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={formatNumberWithDots(proposedPrice)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            setProposedPrice(raw);
                          }}
                          placeholder={formatNumberWithDots(request.rewardAmount)}
                          className={`w-full text-xs sm:text-sm pl-10 pr-4 py-3 rounded-xl border transition ${
                            errors.proposedPrice ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#1683FF]"
                          } focus:outline-none font-bold text-slate-900`}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Budget dari peminta: {formatIDR(request.rewardAmount)}
                      </span>
                      {errors.proposedPrice && <p className="text-[11px] text-red-500 mt-1">{errors.proposedPrice}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs sm:text-sm font-bold text-slate-900">
                          Estimasi Durasi Pengerjaan
                        </label>
                        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
                          <button
                            type="button"
                            onClick={() => setDurationMode("preset")}
                            className={`px-2.5 py-1 rounded-md font-semibold transition ${
                              durationMode === "preset" ? "bg-white text-[#1683FF] shadow-2xs" : "text-slate-500"
                            }`}
                          >
                            Pilihan Cepat
                          </button>
                          <button
                            type="button"
                            onClick={() => setDurationMode("custom")}
                            className={`px-2.5 py-1 rounded-md font-semibold transition ${
                              durationMode === "custom" ? "bg-[#1683FF] text-white shadow-2xs" : "text-slate-500"
                            }`}
                          >
                            Kustom
                          </button>
                        </div>
                      </div>

                      {durationMode === "preset" ? (
                        <select
                          value={estimatedDuration}
                          onChange={(e) => setEstimatedDuration(e.target.value)}
                          className="w-full text-xs sm:text-sm px-3.5 py-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1683FF]"
                        >
                          <option value="15 Menit">Kilat (15 Menit)</option>
                          <option value="30 Menit">30 Menit</option>
                          <option value="1-2 Jam">Standar (1 - 2 Jam)</option>
                          <option value="4-6 Jam">4 - 6 Jam</option>
                          <option value="1 Hari (Besok)">1 Hari (Besok)</option>
                          <option value="2-3 Hari">2 - 3 Hari</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={customDurationValue}
                            onChange={(e) => setCustomDurationValue(e.target.value)}
                            placeholder="30"
                            className="w-1/2 text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] font-bold text-slate-900"
                          />
                          <select
                            value={customDurationUnit}
                            onChange={(e) => setCustomDurationUnit(e.target.value)}
                            className="w-1/2 text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#1683FF]"
                          >
                            <option value="Menit">Menit</option>
                            <option value="Jam">Jam</option>
                            <option value="Hari">Hari</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== STEP 2: LAMPIRAN PENDUKUNG (OPSIONAL) ==================== */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Langkah 2: Dokumen &amp; Portofolio Pendukung
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lampiran ini bersifat opsional untuk meyakinkan peminta bantuan bahwa Anda adalah orang yang tepat.
                    </p>
                  </div>

                  {/* Dokumen CV */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#1683FF]" />
                        <span>Lampiran CV / Resume</span>
                        <span className="text-[11px] font-normal text-slate-400">(Opsional)</span>
                      </label>
                      {cvFileName && (
                        <button
                          type="button"
                          onClick={() => {
                            setCvFileName("");
                            setCvFile(null);
                          }}
                          className="text-xs text-red-600 font-semibold hover:underline"
                        >
                          Hapus File
                        </button>
                      )}
                    </div>

                    {cvFileName ? (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900">
                        <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                        <span className="truncate">{cvFileName}</span>
                      </div>
                    ) : (
                      <label className="border border-dashed border-slate-300 hover:border-[#1683FF] rounded-xl p-4 text-center cursor-pointer transition bg-white block text-xs font-semibold text-slate-700">
                        <span>Klik untuk memilih file CV (.PDF atau .DOCX)</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleCVUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Portofolio / Link */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                    <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-[#1683FF]" />
                      <span>Link Tautan atau File Portofolio</span>
                      <span className="text-[11px] font-normal text-slate-400">(Opsional)</span>
                    </label>

                    <div className="relative">
                      <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="Tautan link hasil kerja: https://drive.google.com/... atau GitHub/Behance"
                        value={portfolioLink}
                        onChange={(e) => setPortfolioLink(e.target.value)}
                        className="w-full text-xs sm:text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>

                    {portfolioFileName ? (
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                          <span className="truncate">{portfolioFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPortfolioFileName("");
                            setPortfolioFile(null);
                          }}
                          className="text-red-500 hover:underline shrink-0 ml-2"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="border border-dashed border-slate-300 hover:border-[#1683FF] rounded-xl p-3 text-center cursor-pointer transition bg-white block text-xs font-semibold text-slate-500">
                        <span>Atau unggah file portofolio (.PDF / .ZIP / .PNG)</span>
                        <input
                          type="file"
                          accept=".pdf,.zip,.png,.jpg"
                          onChange={handlePortfolioUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== STEP 3: RINGKASAN & KONFIRMASI ==================== */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Langkah 3: Ringkasan &amp; Konfirmasi Proposal
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Periksa kembali rincian tawaran yang akan dikirim ke peminta bantuan.
                    </p>
                  </div>

                  {/* Summary Card - Modern & Structured */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1683FF]/10 text-[#1683FF] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            Ringkasan Tawaran Anda
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Periksa kembali data proposal sebelum dikirimkan ke peminta bantuan
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
                        Siap Kirim
                      </span>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                      <div className="space-y-1.5 pb-4 border-b border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Tugas yang Dituju
                        </span>
                        <h4 className="text-base font-bold text-slate-900">
                          {request.title}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                              Estimasi Waktu Pengerjaan
                            </span>
                            <span className="font-semibold text-slate-800 block mt-0.5">
                              {getFinalDuration()}
                            </span>
                          </div>
                        </div>

                        {(cvFileName || portfolioFileName || portfolioLink) ? (
                          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                            <Briefcase className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                Berkas Terlampir
                              </span>
                              <span className="font-semibold text-slate-800 block mt-0.5 truncate max-w-[200px]">
                                {[cvFileName && "CV", portfolioFileName && "Portofolio", portfolioLink && "Tautan"].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                Status Kelayakan
                              </span>
                              <span className="font-semibold text-slate-800 block mt-0.5">
                                Terverifikasi Siap Bantu
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {pitchMessage && (
                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                            Pesan Tawaran ke Peminta
                          </span>
                          <p className="text-xs text-slate-700 italic leading-relaxed">
                            &quot;{pitchMessage}&quot;
                          </p>
                        </div>
                      )}

                      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Imbalan yang Anda Ajukan
                          </span>
                          <div className="text-xl sm:text-2xl font-black text-[#1683FF] mt-0.5">
                            {formatIDR(Number(proposedPrice) || request.rewardAmount)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 self-start sm:self-auto">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Pencairan Aman via Escrow</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Safety & Escrow Notice */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Garansi Keamanan Pembayaran</div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Jika tawaran Anda diterima, peminta akan menyetorkan imbalan ke rekening penampung resmi. Setelah tugas selesai dan dikonfirmasi, saldo imbalan akan diteruskan ke rekening Anda.
                      </p>
                    </div>
                  </div>

                  {/* Agreement Checkbox */}
                  <div>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmReady}
                        onChange={(e) => setConfirmReady(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF]"
                      />
                      <span className="text-xs text-slate-700 leading-relaxed select-none">
                        Saya bersedia dan siap menjalankan tugas ini dengan penuh tanggung jawab dan tepat waktu sesuai deskripsi di atas. <span className="text-red-500 font-bold">*</span>
                      </span>
                    </label>
                    {errors.confirm && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1">{errors.confirm}</p>
                    )}
                  </div>
                </div>
              )}

              {/* BOTTOM NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                ) : (
                  <Link
                    href={`/bantuan/${request.id}`}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition"
                  >
                    Batal
                  </Link>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>Lanjutkan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirimkan Proposal...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim Tawaran Bantuan</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
