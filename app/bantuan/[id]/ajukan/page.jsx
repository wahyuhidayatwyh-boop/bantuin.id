"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { 
  ArrowLeft, 
  Send, 
  ShieldCheck, 
  FileText, 
  Briefcase, 
  Upload, 
  Link2, 
  Trash2, 
  Clock, 
  MapPin, 
  Plus, 
  X,
  Star,
  CheckCircle2,
  Loader2
} from "lucide-react";

export default function AjukanBantuanPage() {
  const { id } = useParams();
  const router = useRouter();
  const { requests, submitOffer, currentUser, setCurrentUser, addToast } = useApp();

  const request = requests.find((r) => r.id === id);

  // Status Verifikasi Jasa: Pengguna umum harus verifikasi jasa terlebih dahulu agar memenuhi syarat
  const isRegularUser = !currentUser || currentUser?.accountType === "user";
  const isJasaVerified = currentUser?.verificationStatus === "verified" && (currentUser?.accountType === "provider" || currentUser?.isProviderEnabled);
  const needsJasaVerification = isRegularUser && !isJasaVerified;

  const [verificationData, setVerificationData] = useState({
    idNumber: currentUser?.idNumber || "",
    idCardPreview: currentUser?.idCardUrl || null,
    idCardFileName: "",
    skill: "Tukang Antar & Errand",
    customSkill: "",
    payoutAccount: currentUser?.bankInfo?.accountNumber || "",
  });
  const [isVerifying, setIsVerifying] = useState(false);

  const [pitchMessage, setPitchMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState(request ? String(request.rewardAmount) : "25000");
  const [durationMode, setDurationMode] = useState("preset"); // 'preset' | 'custom'
  const [estimatedDuration, setEstimatedDuration] = useState("1-2 Jam");
  const [customDurationValue, setCustomDurationValue] = useState("30");
  const [customDurationUnit, setCustomDurationUnit] = useState("Menit"); // 'Menit' | 'Jam' | 'Hari'
  
  // Optional expandable attachment states
  const [showCVSection, setShowCVSection] = useState(false);
  const [cvFileName, setCvFileName] = useState("");

  const [showPortfolioSection, setShowPortfolioSection] = useState(false);
  const [portfolioFileName, setPortfolioFileName] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Permintaan Bantuan Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Mungkin permintaan sudah ditutup atau diselesaikan.</p>
          <Link href="/bantuan" className="px-5 py-2.5 bg-[#1683FF] text-white rounded-xl text-xs font-bold shadow-xs">
            Kembali ke Daftar Bantuan
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleKtpUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationData((prev) => ({
        ...prev,
        idCardPreview: URL.createObjectURL(file),
        idCardFileName: file.name,
      }));
    }
  };

  const handleJasaVerification = (e) => {
    e.preventDefault();
    if (!verificationData.idNumber || verificationData.idNumber.length < 16) {
      addToast?.("NIK Belum Valid", "Harap masukkan 16 digit NIK KTP Anda.", "error");
      return;
    }
    if (!verificationData.idCardPreview) {
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
    setTimeout(() => {
      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...prev,
          accountType: "provider",
          isProviderEnabled: true,
          verificationStatus: "verified",
          idNumber: verificationData.idNumber,
          idCardUrl: verificationData.idCardPreview,
          skills: [resolvedSkill, ...(prev?.skills || [])],
          faculty: resolvedSkill,
          bankInfo: {
            bankName: "BCA",
            accountNumber: verificationData.payoutAccount,
            accountHolder: prev?.fullName || "Penyedia Jasa",
          },
        }));
      }
      setIsVerifying(false);
      addToast?.(
        "Verifikasi Jasa Berhasil", 
        `Status akun Anda kini aktif sebagai penyedia jasa bidang ${resolvedSkill}. Anda dapat langsung mengirim proposal penawaran bantuan.`
      );
    }, 600);
  };

  const handleCVUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFileName(file.name);
    }
  };

  const handlePortfolioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPortfolioFileName(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pitchMessage.trim()) return;

    const finalDuration =
      durationMode === "preset"
        ? estimatedDuration
        : `${customDurationValue || "30"} ${customDurationUnit}`;

    setIsSubmitting(true);
    setTimeout(() => {
      submitOffer(request.id, {
        pitchMessage: pitchMessage.trim(),
        proposedPrice: Number(proposedPrice) || request.rewardAmount,
        estimatedDuration: finalDuration,
        cvName: cvFileName || null,
        portfolioName: portfolioFileName || (portfolioLink ? "Tautan Portofolio Online" : null),
        portfolioUrl: portfolioLink || null,
      });

      setIsSubmitting(false);
      // Redirect directly to the applicants list page
      router.push(`/bantuan/${request.id}/pelamar`);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* Back Navigation */}
        <Link
          href={`/bantuan/${request.id}`}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Detail Permintaan</span>
        </Link>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Formulir Pengajuan Bantuan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kirimkan proposal penawaran pengerjaan tugas kepada peminta bantuan.
          </p>
        </div>

        {/* UNIFIED COHESIVE CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Main Proposal Form or Verification Gate (8 Columns on desktop, Order-1 on mobile) */}
            <div className="lg:col-span-8 space-y-6 order-1">
              {needsJasaVerification ? (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3.5">
                    <ShieldCheck className="w-6 h-6 text-[#1683FF] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                        Verifikasi Akun Jasa Diperlukan Sebelum Mengajukan Bantuan
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Akun Anda saat ini berstatus <strong>Pengguna Umum</strong>. Sesuai aturan keamanan transaksi Bantuin, Anda perlu memverifikasi identitas dan keahlian untuk memenuhi syarat mengambil tugas dan menerima pembayaran imbalan.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleJasaVerification} className="space-y-4 bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#1683FF]" />
                      <span>Formulir Verifikasi Cepat Kualifikasi Jasa</span>
                    </h4>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={16}
                        placeholder="Masukkan 16 digit NIK KTP Anda"
                        value={verificationData.idNumber}
                        onChange={(e) => setVerificationData({ ...verificationData, idNumber: e.target.value })}
                        className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Foto KTP Asli <span className="text-red-500">*</span>
                      </label>
                      {verificationData.idCardPreview ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                          <span className="text-xs font-bold text-[#1683FF] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-[#1683FF]" />
                            <span>{verificationData.idCardFileName || "ktp_terlampir.jpg"}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setVerificationData({ ...verificationData, idCardPreview: null, idCardFileName: "" })}
                            className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                          >
                            Ganti Foto
                          </button>
                        </div>
                      ) : (
                        <label className="border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-xl p-4 text-center cursor-pointer transition bg-white block">
                          <Upload className="w-5 h-5 text-[#1683FF] mx-auto mb-1" />
                          <span className="text-xs font-bold text-slate-800 block">Pilih File Foto KTP Asli</span>
                          <input type="file" accept="image/*" onChange={handleKtpUpload} className="hidden" required />
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Bidang Keahlian Utama <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={verificationData.skill}
                          onChange={(e) => setVerificationData({ ...verificationData, skill: e.target.value, customSkill: "" })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
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
                          <option value="other">Lainnya (Isi Sendiri...)</option>
                        </select>
                        {verificationData.skill === "other" && (
                          <div className="mt-2 animate-in fade-in">
                            <input
                              type="text"
                              required
                              placeholder="Tulis bidang keahlian Anda (contoh: Barista Event, Guru Les Privat, Servis AC...)"
                              value={verificationData.customSkill}
                              onChange={(e) => setVerificationData({ ...verificationData, customSkill: e.target.value })}
                              className="w-full text-xs px-3.5 py-2 rounded-xl border border-blue-300 bg-blue-50/50 focus:outline-none focus:border-[#1683FF]"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor Rekening Bank / E-Wallet <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: BCA 8820192841"
                          value={verificationData.payoutAccount}
                          onChange={(e) => setVerificationData({ ...verificationData, payoutAccount: e.target.value })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memproses Verifikasi Kualifikasi...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verifikasi &amp; Lanjutkan Mengajukan Bantuan</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* 1. DESKRIPSI RENCANA KERJA (WAJIB) */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                      Deskripsi Tawaran &amp; Rencana Pengerjaan <span className="text-red-500">* (Wajib)</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={pitchMessage}
                      onChange={(e) => setPitchMessage(e.target.value)}
                      placeholder="Jelaskan bagaimana Anda akan menyelesaikan tugas ini, kesiapan kendaraan/alat, dan estimasi waktu ketepatan pengerjaan..."
                      className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-1 focus:ring-[#1683FF] leading-relaxed"
                    />
                  </div>

                  {/* 2. HARGA TAWARAN & ESTIMASI DURASI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                        Tawaran Imbalan (Rp)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder={String(request.rewardAmount)}
                        value={proposedPrice}
                        onChange={(e) => setProposedPrice(e.target.value)}
                        className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] font-bold text-slate-900"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Default: {formatIDR(request.rewardAmount)}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs sm:text-sm font-bold text-slate-900">
                          Estimasi Waktu Pengerjaan
                        </label>
                        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
                          <button
                            type="button"
                            onClick={() => setDurationMode("preset")}
                            className={`px-2.5 py-1 rounded-md font-bold transition ${
                              durationMode === "preset"
                                ? "bg-white text-[#1683FF] shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Pilihan Cepat
                          </button>
                          <button
                            type="button"
                            onClick={() => setDurationMode("custom")}
                            className={`px-2.5 py-1 rounded-md font-bold transition ${
                              durationMode === "custom"
                                ? "bg-[#1683FF] text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Isi Sendiri
                          </button>
                        </div>
                      </div>

                      {durationMode === "preset" ? (
                        <select
                          value={estimatedDuration}
                          onChange={(e) => setEstimatedDuration(e.target.value)}
                          className="w-full text-xs sm:text-sm px-4 py-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1683FF]"
                        >
                          <option value="15 Menit">Kilat (15 Menit)</option>
                          <option value="30 Menit">30 Menit</option>
                          <option value="1-2 Jam">Standar (1 - 2 Jam)</option>
                          <option value="4-6 Jam">4 - 6 Jam</option>
                          <option value="1 Hari (Besok)">1 Hari (Besok)</option>
                          <option value="2-3 Hari">2 - 3 Hari</option>
                        </select>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="999"
                              value={customDurationValue}
                              onChange={(e) => setCustomDurationValue(e.target.value)}
                              placeholder="Contoh: 30"
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
                          <p className="text-[11px] text-[#1683FF] bg-blue-50/70 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5 font-medium">
                            <span>Estimasi yang Diajukan: <strong>{customDurationValue || "0"} {customDurationUnit}</strong></span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. OPTIONAL ATTACHMENTS */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <div className="text-xs font-bold text-slate-500">
                      Lampiran Pendukung (Opsional):
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                      {!showCVSection && !cvFileName && (
                        <button
                          type="button"
                          onClick={() => setShowCVSection(true)}
                          className="px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tambah Lampiran CV</span>
                        </button>
                      )}

                      {!showPortfolioSection && !portfolioFileName && !portfolioLink && (
                        <button
                          type="button"
                          onClick={() => setShowPortfolioSection(true)}
                          className="px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tambah Portofolio / Link</span>
                        </button>
                      )}
                    </div>

                    {/* Expanded CV Upload Box */}
                    {(showCVSection || cvFileName) && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in duration-150 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#1683FF]" />
                            <span>Dokumen CV (PDF / DOCX)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCvFileName("");
                              setShowCVSection(false);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Tutup Lampiran CV"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {cvFileName ? (
                          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900">
                            <span className="truncate max-w-[280px]">{cvFileName}</span>
                            <button
                              type="button"
                              onClick={() => setCvFileName("")}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-3.5 text-center cursor-pointer transition bg-white block text-xs font-semibold text-[#1683FF]">
                            <span>Pilih File CV dari Perangkat</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleCVUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Expanded Portfolio Box */}
                    {(showPortfolioSection || portfolioFileName || portfolioLink) && (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in duration-150 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-[#1683FF]" />
                            <span>Tautan atau File Portofolio</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setPortfolioFileName("");
                              setPortfolioLink("");
                              setShowPortfolioSection(false);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title="Tutup Portofolio"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="relative">
                          <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="url"
                            placeholder="Link Tautan Portofolio (Behance / GitHub / Drive): https://..."
                            value={portfolioLink}
                            onChange={(e) => setPortfolioLink(e.target.value)}
                            className="w-full text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                          />
                        </div>

                        {portfolioFileName ? (
                          <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900">
                            <span className="truncate max-w-[280px]">{portfolioFileName}</span>
                            <button
                              type="button"
                              onClick={() => setPortfolioFileName("")}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="border border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-3 text-center cursor-pointer transition bg-white block text-xs font-semibold text-[#1683FF]">
                            <span>Atau Unggah File Portofolio (.PDF / .ZIP)</span>
                            <input
                              type="file"
                              accept=".pdf,.zip,.png,.jpg"
                              onChange={handlePortfolioUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <Link
                      href={`/bantuan/${request.id}`}
                      className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition text-center"
                    >
                      Batal
                    </Link>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{isSubmitting ? "Mengirimkan Proposal..." : "Kirim Ajuan Proposal"}</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                </form>
              )}
            </div>

            {/* Sidebar Task Info & Escrow (4 Columns, Order-2) */}
            <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-8 space-y-6 order-2">
              
              {/* Task Info */}
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tugas yang Diajukan
                </div>

                <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
                  <img
                    src={request.requester?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                    alt={request.requester?.name || "Peminta"}
                    className="w-11 h-11 rounded-full object-cover border border-slate-100 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{request.requester?.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{request.requester?.rating || 4.9}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 leading-snug">
                    {request.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{request.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-slate-400">Budget Peminta:</div>
                  <div className="font-extrabold text-[#1683FF] text-base">
                    {request.isVoluntary ? "Sukarela" : formatIDR(request.rewardAmount)}
                  </div>
                </div>
              </div>

              {/* Guarantee Pill (Integrated) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Garansi Pembayaran Terverifikasi</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Dana imbalan diproses aman via Payment Gateway resmi. Hak bayar otomatis dapat dicairkan setelah tugas disetujui.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
