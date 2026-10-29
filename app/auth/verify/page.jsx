"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { authService } from "@/lib/services/authService";
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  FileBadge, 
  Trash2,
  ArrowRight,
  Clock,
  Loader2,
  Briefcase,
  Wallet
} from "lucide-react";
import { validateFile, getAcceptAttribute } from "@/lib/utils/fileValidation";

export default function VerifyPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, addToast } = useApp();

  const isVerified = currentUser?.verificationStatus === "verified";
  const isPendingReview = currentUser?.verificationStatus === "pending_review";

  const [submitted, setSubmitted] = useState(isVerified || isPendingReview);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingKtp, setIsDraggingKtp] = useState(false);

  const [verificationData, setVerificationData] = useState({
    idNumber: currentUser?.idNumber || "",
    idCardFile: null,
    idCardPreview: currentUser?.idCardUrl || null,
    idCardFileName: "",
    idCardType: null,
    skill: currentUser?.skills?.[0] || currentUser?.faculty || "Tukang Antar & Errand",
    customSkill: "",
    payoutAccount: currentUser?.bankInfo?.accountNumber || (currentUser?.payoutBank ? `${currentUser.payoutBank} ${currentUser.payoutAccountNumber || ""}` : ""),
  });

  useEffect(() => {
    if (currentUser) {
      if (currentUser.verificationStatus === "verified" || currentUser.verificationStatus === "pending_review") {
        setSubmitted(true);
      }
      setVerificationData((prev) => ({
        ...prev,
        idNumber: prev.idNumber || currentUser.idNumber || "",
        idCardPreview: prev.idCardPreview || currentUser.idCardUrl || null,
        skill: prev.skill || currentUser.skills?.[0] || currentUser.faculty || "Tukang Antar & Errand",
        payoutAccount: prev.payoutAccount || currentUser.bankInfo?.accountNumber || (currentUser.payoutBank ? `${currentUser.payoutBank} ${currentUser.payoutAccountNumber || ""}` : ""),
      }));
    }
  }, [currentUser]);

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

  const handleSubmit = async (e) => {
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
    if (!verificationData.payoutAccount?.trim()) {
      addToast?.("Rekening Belum Diisi", "Harap isi nomor rekening pencairan imbalan Anda.", "error");
      return;
    }

    const resolvedSkill = verificationData.skill === "other"
      ? verificationData.customSkill.trim()
      : verificationData.skill;

    setIsSubmitting(true);
    try {
      const token = await authService.getValidAccessToken();
      if (!token) {
        throw new Error("Sesi login tidak valid. Silakan login terlebih dahulu.");
      }

      // 1. Upload KTP ke penyimpanan bucket bantuin-kyc jika ada berkas baru
      let finalKtpUrl = verificationData.idCardPreview;
      if (verificationData.idCardFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", verificationData.idCardFile);
        uploadFormData.append("bucket", "bantuin-kyc");
        uploadFormData.append("folder", "ktp");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

      setSubmitted(true);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_auth_changed"));
      }

      addToast?.(
        "Verifikasi Terkirim!", 
        "Data identitas Anda telah masuk ke antrean verifikasi KYC admin. Tim Administrator Bantuin akan segera meninjau.",
        "success"
      );
    } catch (err) {
      console.warn("Submit KYC error:", err);
      addToast?.("Gagal Mengirim", err.message || "Terjadi kesalahan saat mengirim berkas identitas.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 md:px-6 py-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#1683FF] flex items-center justify-center mx-auto mb-3 shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Verifikasi Identitas &amp; Akun Jasa (KYC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Lengkapi identitas KTP, keahlian, dan nomor rekening pencairan sekali saja agar Anda memenuhi syarat mengambil tugas dan menerima pembayaran.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-10 shadow-[0_12px_40px_rgba(22,131,255,0.06)]">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* NIK Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-bold ${
                    verificationData.idNumber?.length === 16 ? "text-emerald-600 font-extrabold" : "text-slate-400"
                  }`}>
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

              {/* KTP Upload Field */}
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
                      className="text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
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

              {/* Bidang Keahlian & Nomor Rekening */}
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

              {/* Security Privacy Notice */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong>Privasi &amp; Keamanan Terenkripsi (UU PDP):</strong> Dokumen KTP Anda dienkripsi dan hanya digunakan untuk validasi identitas resmi akun Anda. Tidak akan pernah disebarluaskan ke pihak luar.
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#1683FF] text-white text-xs sm:text-sm font-black hover:bg-[#0F6FE5] shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Verifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Dokumen &amp; Ajukan Verifikasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              {isVerified ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
              )}

              <h3 className="font-bold text-xl text-slate-900">
                {isVerified ? "Akun Anda Terverifikasi Resmi!" : "Dokumen KTP Telah Diterima!"}
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                {isVerified ? (
                  <>
                    Status akun Anda: <strong className="text-emerald-600 font-bold">Terverifikasi Trusted User &amp; Helper</strong>. Anda dapat langsung menggunakan seluruh layanan bantuan, sewa alat, dan jasa.
                  </>
                ) : (
                  <>
                    Data identitas Anda sedang dalam antrean peninjauan oleh <strong>Administrator Bantuin</strong>. Anda tetap dapat mengajukan tawaran bantuan pada tugas yang tersedia.
                  </>
                )}
              </p>

              {/* Summary box */}
              <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="text-[11px] text-slate-400">Status Pengajuan:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                  }`}>
                    {isVerified ? "Terverifikasi (Disetujui Admin)" : "Menunggu Review Admin"}
                  </span>
                </div>
                {verificationData.idNumber && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[11px] text-slate-400">NIK:</span>
                    <span className="font-bold text-slate-800">
                      {verificationData.idNumber.slice(0, 4)}********{verificationData.idNumber.slice(-4)}
                    </span>
                  </div>
                )}
                {verificationData.skill && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[11px] text-slate-400">Bidang Keahlian:</span>
                    <span className="font-bold text-slate-800">{verificationData.skill}</span>
                  </div>
                )}
                {verificationData.payoutAccount && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[11px] text-slate-400">Rekening Payout:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]">{verificationData.payoutAccount}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/bantuan"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-xs"
                >
                  Cari Permintaan Bantuan
                </Link>
                <Link
                  href="/profile"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Lihat Profil
                </Link>
                {!isVerified && (
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-slate-500 hover:text-[#1683FF] font-semibold underline mt-2 sm:mt-0"
                  >
                    Perbarui Data Form
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
