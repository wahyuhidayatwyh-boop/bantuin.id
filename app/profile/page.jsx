"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDateIndo } from "@/lib/utils";
import { 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  Clock, 
  Award, 
  FileBadge, 
  MapPin, 
  Settings, 
  User, 
  Briefcase, 
  CreditCard, 
  Lock, 
  LogOut, 
  Upload, 
  Check, 
  Edit, 
  PlusCircle, 
  ExternalLink,
  Phone,
  Mail,
  ArrowUpRight,
  DollarSign,
  X,
  Plus,
  QrCode,
  Building2,
  Wallet,
  Loader2,
  Camera,
  Store,
  Eye,
  KeyRound,
  AlertCircle,
  FileText
} from "lucide-react";

export default function ProfilePage() {
  const { 
    currentUser, 
    setCurrentUser,
    addToast,
    mitraAvailableBalance, 
    mitraPendingBalance, 
    mitraTotalEarned,
    withdrawals, 
    withdrawFunds, 
    customerDeposits,
    submitKYC
  } = useApp();

  const [activeTab, setActiveTab] = useState("profile"); // profile, wallet, kyc, service_settings, bank, security
  const [isSaved, setIsSaved] = useState(false);
  const [isBankSaved, setIsBankSaved] = useState(false);

  const isUser = !currentUser || currentUser?.accountType === "user";
  const isProvider = currentUser?.accountType === "provider";
  const isMitra = currentUser?.accountType === "mitra";

  const tabsList = isUser
    ? [
        { id: "profile", label: "Profil & Kontak", icon: User },
        { id: "wallet", label: "Dompet & Transaksi", icon: CreditCard },
        { id: "kyc", label: "Verifikasi Akun Jasa", icon: ShieldCheck },
        { id: "bank", label: "Rekening Bank", icon: Building2 },
        { id: "security", label: "Keamanan & Sandi", icon: Lock },
      ]
    : isProvider
    ? [
        { id: "profile", label: "Profil & Kontak", icon: User },
        { id: "wallet", label: "Dompet & Payout", icon: CreditCard },
        { id: "kyc", label: "Verifikasi KYC", icon: ShieldCheck },
        { id: "service_settings", label: "Pengaturan Jasa", icon: Briefcase },
        { id: "bank", label: "Rekening Bank", icon: Building2 },
        { id: "security", label: "Keamanan & Sandi", icon: Lock },
      ]
    : [
        { id: "profile", label: "Profil & Kontak", icon: User },
        { id: "wallet", label: "Dompet Toko", icon: CreditCard },
        { id: "kyc", label: "Verifikasi Pemilik", icon: ShieldCheck },
        { id: "bank", label: "Rekening Bank", icon: Building2 },
        { id: "security", label: "Keamanan & Sandi", icon: Lock },
      ];

  // -----------------------------------------------------------------
  // PROFILE STATE (SYNCED WITH CURRENT USER)
  // -----------------------------------------------------------------
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || "Rian Prasetya",
    email: currentUser?.email || "rian.prasetya@gmail.com",
    phone: currentUser?.phoneNumber || "081298765432",
    city: currentUser?.campusName || "Banjarmasin Tengah, Kalimantan Selatan",
    bio: currentUser?.bio || "Pegiat kreatif & tech enthusiast. Siap membantu kebutuhan dokumen, errand, dan jasa profesional.",
    field: currentUser?.faculty || "Penyedia Jasa & Komunitas",
    fieldSelect: currentUser?.faculty || "Penyedia Jasa & Komunitas",
    customField: "",
    isProviderEnabled: true,
    skills: currentUser?.skills || ["Desain Grafis & Logo", "Video Editing & Reels", "Admin Data & Excel"],
    bankName: currentUser?.bankInfo?.bankName || "BCA",
    accountNumber: currentUser?.bankInfo?.accountNumber || "8820192841",
    accountHolder: currentUser?.bankInfo?.accountHolder || currentUser?.fullName || "Rian Prasetya",
  });

  // Re-sync if currentUser updates
  useEffect(() => {
    if (currentUser) {
      setProfileData((prev) => ({
        ...prev,
        fullName: currentUser.fullName || prev.fullName,
        email: currentUser.email || prev.email,
        phone: currentUser.phoneNumber || prev.phone,
        city: currentUser.campusName || prev.city,
        bio: currentUser.bio || prev.bio,
        field: currentUser.faculty || prev.field,
        fieldSelect: currentUser.faculty || prev.fieldSelect,
        skills: currentUser.skills || prev.skills,
        bankName: currentUser.bankInfo?.bankName || prev.bankName,
        accountNumber: currentUser.bankInfo?.accountNumber || prev.accountNumber,
        accountHolder: currentUser.bankInfo?.accountHolder || currentUser.fullName || prev.accountHolder,
      }));
    }
  }, [currentUser]);

  // Available template skills for selection
  const availableSkills = [
    "Desain Grafis & Logo",
    "Fotografi & Liputan",
    "Web & IT Development",
    "Video Editing & Reels",
    "Servis Komputer / Laptop",
    "Penerjemah & Copywriting",
    "Teknisi AC & Tukang Listrik",
    "Admin Data & Excel",
    "Tukang Antar & Errand",
    "Bimbingan Belajar"
  ];

  // State untuk input keahlian kustom di tab service_settings
  const [newCustomSkill, setNewCustomSkill] = useState("");
  const handleAddNewSkill = (e) => {
    e?.preventDefault();
    const trimmed = newCustomSkill.trim();
    if (!trimmed) return;
    if (!profileData.skills.includes(trimmed)) {
      const updated = [...profileData.skills, trimmed];
      setProfileData((prev) => ({ ...prev, skills: updated }));
      if (setCurrentUser) {
        setCurrentUser((prev) => ({ ...prev, skills: updated }));
      }
      if (addToast) {
        addToast("Keahlian Ditambahkan", `Bidang "${trimmed}" berhasil ditambahkan ke keahlian aktif Anda.`);
      }
    }
    setNewCustomSkill("");
  };

  // -----------------------------------------------------------------
  // AVATAR LOCAL UPLOAD HANDLER
  // -----------------------------------------------------------------
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...prev,
          avatarUrl: localUrl,
        }));
      }
      if (addToast) {
        addToast("Foto Profil Diperbarui", "Foto avatar berhasil diunggah dari file lokal dan tersimpan di akun Anda.");
      }
    }
  };

  // -----------------------------------------------------------------
  // FORM SAVE HANDLER (ACTUALLY PERSISTS TO CURRENT USER)
  // -----------------------------------------------------------------
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const resolvedField = profileData.field?.trim() || "Pengguna Komunitas";
    if (setCurrentUser) {
      setCurrentUser((prev) => ({
        ...prev,
        fullName: profileData.fullName,
        email: profileData.email,
        phoneNumber: profileData.phone,
        campusName: profileData.city,
        faculty: resolvedField,
        bio: profileData.bio,
        skills: profileData.skills,
      }));
    }
    setIsSaved(true);
    if (addToast) {
      addToast("Profil Disimpan", "Informasi identitas, bidang keahlian, dan kontak berhasil diperbarui.");
    }
    setTimeout(() => setIsSaved(false), 2500);
  };

  const toggleSkill = (skill) => {
    const updatedSkills = profileData.skills.includes(skill)
      ? profileData.skills.filter((s) => s !== skill)
      : [...profileData.skills, skill];

    setProfileData({ ...profileData, skills: updatedSkills });
    if (setCurrentUser) {
      setCurrentUser((prev) => ({ ...prev, skills: updatedSkills }));
    }
  };

  // -----------------------------------------------------------------
  // BANK FORM SAVE HANDLER
  // -----------------------------------------------------------------
  const handleBankSave = (e) => {
    e.preventDefault();
    if (setCurrentUser) {
      setCurrentUser((prev) => ({
        ...prev,
        bankInfo: {
          bankName: profileData.bankName,
          accountNumber: profileData.accountNumber,
          accountHolder: profileData.accountHolder,
        },
      }));
    }
    setWithdrawForm((prev) => ({
      ...prev,
      bankName: profileData.bankName,
      accountNumber: profileData.accountNumber,
      accountHolder: profileData.accountHolder,
    }));
    setIsBankSaved(true);
    if (addToast) {
      addToast("Rekening Disimpan", `Rekening pencairan dana ${profileData.bankName} (${profileData.accountNumber}) an ${profileData.accountHolder} berhasil disimpan.`);
    }
    setTimeout(() => setIsBankSaved(false), 2500);
  };

  // -----------------------------------------------------------------
  // SECURITY & PASSWORD FORM
  // -----------------------------------------------------------------
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!passwordForm.currentPassword) {
      setPasswordError("Silakan masukkan kata sandi saat ini.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Kata sandi baru harus minimal 8 karakter.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    // Success
    setPasswordSuccess(true);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    if (addToast) {
      addToast("Sandi Diperbarui", "Kata sandi akun Anda berhasil diperbarui dengan standar keamanan terenkripsi.");
    }
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  // -----------------------------------------------------------------
  // KYC MODAL & RE-UPLOAD STATE
  // -----------------------------------------------------------------
  const isJasaVerified = currentUser?.accountType === "provider" || (currentUser?.verificationStatus === "verified" && currentUser?.accountType !== "user");

  const [userJasaVerifyForm, setUserJasaVerifyForm] = useState({
    idNumber: currentUser?.idNumber || "",
    idCardUrl: currentUser?.idCardUrl || null,
    idCardFileName: "",
    skill: "Tukang Antar & Errand",
    customSkill: "",
    bankName: currentUser?.bankInfo?.bankName || "BCA",
    accountNumber: currentUser?.bankInfo?.accountNumber || "",
    accountHolder: currentUser?.fullName || "",
  });
  const [isVerifyingJasa, setIsVerifyingJasa] = useState(false);

  const handleUserKtpUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setUserJasaVerifyForm((prev) => ({
        ...prev,
        idCardUrl: localUrl,
        idCardFileName: file.name,
      }));
    }
  };

  const handleVerifyJasaFromProfile = (e) => {
    e.preventDefault();
    if (!userJasaVerifyForm.idNumber || userJasaVerifyForm.idNumber.length < 16) {
      addToast?.("NIK Belum Valid", "Harap masukkan 16 digit NIK KTP Anda.", "error");
      return;
    }
    if (!userJasaVerifyForm.idCardUrl) {
      addToast?.("KTP Belum Diunggah", "Harap unggah foto KTP asli Anda.", "error");
      return;
    }
    if (userJasaVerifyForm.skill === "other" && !userJasaVerifyForm.customSkill?.trim()) {
      addToast?.("Bidang Keahlian Belum Diisi", "Harap tuliskan bidang keahlian Anda pada kolom yang disediakan.", "error");
      return;
    }
    if (!userJasaVerifyForm.accountNumber) {
      addToast?.("Rekening Belum Diisi", "Harap isi nomor rekening pencairan imbalan Anda.", "error");
      return;
    }

    const resolvedSkill = userJasaVerifyForm.skill === "other"
      ? userJasaVerifyForm.customSkill.trim()
      : userJasaVerifyForm.skill;

    setIsVerifyingJasa(true);
    setTimeout(() => {
      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...prev,
          accountType: "provider",
          isProviderEnabled: true,
          verificationStatus: "verified",
          idNumber: userJasaVerifyForm.idNumber,
          idCardUrl: userJasaVerifyForm.idCardUrl,
          skills: [resolvedSkill, ...(prev?.skills || [])],
          faculty: resolvedSkill,
          bankInfo: {
            bankName: userJasaVerifyForm.bankName,
            accountNumber: userJasaVerifyForm.accountNumber,
            accountHolder: userJasaVerifyForm.accountHolder || prev?.fullName || "Penyedia Jasa",
          },
        }));
      }
      setIsVerifyingJasa(false);
      addToast?.(
        "Verifikasi Akun Jasa Berhasil",
        `Akun Anda kini resmi aktif sebagai Penyedia Jasa bidang ${resolvedSkill} yang terverifikasi resmi.`
      );
    }, 600);
  };

  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycForm, setKycForm] = useState({
    ktpUrl: currentUser?.idCardUrl || "https://images.unsplash.com/photo-1578836537282-3171d77f8632?auto=format&fit=crop&w=600&q=80",
    selfieUrl: currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    nik: "3302198902840001",
    notes: "",
  });

  const handleKycFile = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setKycForm((prev) => ({
        ...prev,
        [type === "ktp" ? "ktpUrl" : "selfieUrl"]: localUrl,
      }));
    }
  };

  const handleKycSubmit = (e) => {
    e.preventDefault();
    if (submitKYC) {
      submitKYC(kycForm.ktpUrl, kycForm.selfieUrl);
    } else if (setCurrentUser) {
      setCurrentUser((prev) => ({
        ...prev,
        verificationStatus: "pending_review",
        idCardUrl: kycForm.ktpUrl,
      }));
    }
    setIsKycModalOpen(false);
    if (addToast) {
      addToast("Dokumen KYC Terkirim", "Dokumen KTP & Foto Wajah Anda telah diunggah dan sedang diproses verifikasi 1x24 jam.");
    }
  };

  // -----------------------------------------------------------------
  // WITHDRAWAL MODAL STATE & HANDLER
  // -----------------------------------------------------------------
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "100000",
    bankName: currentUser?.bankInfo?.bankName || "BCA",
    accountNumber: currentUser?.bankInfo?.accountNumber || "8820192841",
    accountHolder: currentUser?.bankInfo?.accountHolder || currentUser?.fullName || "Rian Prasetya",
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        
        {/* ============================================================ */}
        {/* TOP PROFILE BANNER & SUMMARY CARD (INTERCONNECTED)           */}
        {/* ============================================================ */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 text-center lg:text-left">
            
            {/* Avatar & User Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              
              {/* Profile Avatar with Real Local Upload Trigger */}
              <div className="relative group shrink-0">
                <img
                  src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                  alt={currentUser?.fullName || profileData.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-blue-50 shadow-md bg-white"
                />
                
                {/* Verified KYC Badge */}
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow ring-2 ring-white">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>

                {/* Local Photo Upload Overlay */}
                <label 
                  className="absolute inset-0 rounded-full bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold"
                  title="Ganti Foto Avatar dari File Lokal"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span>Ganti Foto</span>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentUser?.fullName || profileData.fullName}
                  </h1>
                  {isUser && (
                    <>
                      <span className="text-[10px] font-bold bg-blue-50 text-[#1683FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                        Pengguna Umum
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1683FF]" />
                        <span>{currentUser?.verificationStatus === "verified" ? "Terverifikasi" : "Akun Aktif"}</span>
                      </span>
                    </>
                  )}
                  {isProvider && (
                    <>
                      <span className="text-[10px] font-bold bg-blue-50 text-[#1683FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                        Penyedia Jasa
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{currentUser?.verificationStatus === "verified" ? "KTP Terverifikasi" : "Menunggu Review KYC"}</span>
                      </span>
                    </>
                  )}
                  {isMitra && (
                    <>
                      <span className="text-[10px] font-bold bg-blue-50 text-[#1683FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                        Mitra Toko Sewa
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Outlet Terdaftar</span>
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                  <span>{currentUser?.campusName || profileData.city} &middot; Pengguna Aktif Bantuin</span>
                </p>

                <p className="text-xs text-slate-600 mt-2 max-w-xl line-clamp-2">
                  {currentUser?.bio || profileData.bio}
                </p>

                {/* Performance Stats: Rating & Completed Bantuan / Jasa */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 pt-3 mt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/70">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span className="font-black text-amber-800">{Number(currentUser?.ratingAvg || 4.95).toFixed(2)}</span>
                    <span className="text-[11px] text-amber-700/80">({currentUser?.ratingCount || 34} ulasan)</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-black text-emerald-800">{currentUser?.completedHelpsCount || 28}</span>
                    <span className="text-[11px] text-emerald-700">Tugas &amp; Jasa Selesai</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/70">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span className="font-black text-blue-800">{currentUser?.reliabilityScore || 98}%</span>
                    <span className="text-[11px] text-blue-700">Tingkat Keandalan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON SESUAI ROLE (UMUM TIDAK MEMILIKI LINK MITRA ATAU JASA) */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full sm:w-auto shrink-0">
              {isUser && (
                <button
                  type="button"
                  onClick={() => setActiveTab("kyc")}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] font-bold text-xs border border-blue-200 shadow-2xs transition active:scale-98 cursor-pointer"
                  title="Verifikasi Akun Jasa"
                >
                  <ShieldCheck className="w-4 h-4 text-[#1683FF]" />
                  <span>Verifikasi Akun Jasa</span>
                </button>
              )}

              {isProvider && (
                <Link
                  href="/jasa/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] font-bold text-xs border border-blue-200 shadow-2xs transition active:scale-98"
                  title="Buka Dashboard Penyedia Jasa"
                >
                  <Briefcase className="w-4 h-4 text-[#1683FF]" />
                  <span>Dashboard Jasa</span>
                  <ExternalLink className="w-3 h-3 text-[#1683FF]/60" />
                </Link>
              )}

              {isMitra && (
                <Link
                  href="/mitra/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] font-bold text-xs border border-blue-200 shadow-2xs transition active:scale-98"
                  title="Buka Dashboard Mitra Toko Sewa"
                >
                  <Store className="w-4 h-4 text-[#1683FF]" />
                  <span>Dashboard Mitra Sewa</span>
                  <ExternalLink className="w-3 h-3 text-[#1683FF]/60" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE HORIZONTAL SCROLLABLE TABS (< lg)                     */}
        {/* ============================================================ */}
        <div className="lg:hidden flex items-center gap-1.5 pb-2 mb-4 overflow-x-auto no-scrollbar">
          {tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                  isActive
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* MAIN PROFILE & PORTAL NAVIGATION GRID                        */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar Menu (Desktop Only) */}
          <div className="hidden lg:block bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1 self-start">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
              Pengaturan Akun
            </div>

            {tabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${
                    isActive
                      ? "bg-[#1683FF] text-white shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* KHUSUS PENGGUNA UMUM: AJAKAN VERIFIKASI JASA (TANPA LINK MITRA / DASHBOARD) */}
            {isUser && (
              <div className="pt-3 border-t border-slate-100">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs">
                  <span className="font-bold text-slate-900 block mb-1">Ingin Jadi Penyedia Jasa?</span>
                  <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
                    Verifikasi identitas Anda untuk mengaktifkan status jasa, menawarkan keahlian, dan menerima tugas bantuan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("kyc")}
                    className="w-full py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verifikasi Akun Jasa</span>
                  </button>
                </div>
              </div>
            )}

            {/* KHUSUS PROVIDER: HANYA DASHBOARD JASA */}
            {isProvider && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                  Portal Penyedia Jasa
                </div>
                <Link
                  href="/jasa/dashboard"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1683FF] hover:bg-blue-50/60 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-[#1683FF]" />
                    <span>Dashboard Jasa</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            )}

            {/* KHUSUS MITRA: HANYA DASHBOARD MITRA */}
            {isMitra && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                  Portal Mitra Toko
                </div>
                <Link
                  href="/mitra/dashboard"
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1683FF] hover:bg-blue-50/60 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4 text-[#1683FF]" />
                    <span>Dashboard Mitra Sewa</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/auth/logout"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun (Logout)</span>
              </Link>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-8 shadow-2xs">
            
            {/* ============================================================ */}
            {/* TAB 1: PROFIL & BIODATA                                      */}
            {/* ============================================================ */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Informasi Pribadi &amp; Kontak</h3>
                    <p className="text-xs text-slate-500">Perbarui data profil yang ditampilkan kepada pengguna lain di Bantuin</p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs font-bold cursor-pointer transition self-start sm:self-auto">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Unggah Foto Avatar</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kota / Domisili Lengkap</label>
                    <input
                      type="text"
                      required
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email</label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / HP</label>
                    <input
                      type="tel"
                      required
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>
                </div>

                {/* Bidang Keahlian / Aktivitas Utama */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bidang Keahlian / Kategori Aktivitas
                  </label>
                  <select
                    value={
                      profileData.fieldSelect === "other"
                        ? "other"
                        : availableSkills.includes(profileData.field)
                        ? profileData.field
                        : "other"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "other") {
                        setProfileData({ ...profileData, fieldSelect: "other", customField: profileData.field || "" });
                      } else {
                        setProfileData({ ...profileData, fieldSelect: val, field: val, customField: "" });
                      }
                    }}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] bg-white font-medium"
                  >
                    <option value="Pengguna Umum & Komunitas">Pengguna Umum &amp; Komunitas</option>
                    <option value="Tukang Antar & Errand">Tukang Antar &amp; Errand</option>
                    <option value="Admin Data & Excel">Admin Data &amp; Excel</option>
                    <option value="Desain Grafis & Logo">Desain Grafis &amp; Logo</option>
                    <option value="Fotografi & Liputan">Fotografi &amp; Liputan</option>
                    <option value="Video Editing & Reels">Video Editing &amp; Reels</option>
                    <option value="Web & IT Development">Web &amp; IT Development</option>
                    <option value="Servis Komputer / Laptop">Servis Komputer / Laptop</option>
                    <option value="Teknisi AC & Tukang Listrik">Teknisi AC &amp; Tukang Listrik</option>
                    <option value="Penerjemah & Copywriting">Penerjemah &amp; Copywriting</option>
                    <option value="Bimbingan Belajar">Bimbingan Belajar</option>
                    <option value="other">Lainnya (Isi Sendiri...)</option>
                  </select>

                  {(profileData.fieldSelect === "other" || (!availableSkills.includes(profileData.field) && profileData.field !== "Pengguna Umum & Komunitas")) && (
                    <div className="mt-2.5 animate-in fade-in">
                      <label className="block text-[11px] font-bold text-[#1683FF] mb-1">
                        Tuliskan Bidang Keahlian / Aktivitas Anda Sendiri:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Barista Event, Guru Les Privat, Fotografer Produk, Tukang Kayu..."
                        value={profileData.field}
                        onChange={(e) => setProfileData({ ...profileData, field: e.target.value, customField: e.target.value })}
                        className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50/40 focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bio Profil Singkat</label>
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    placeholder="Ceritakan keahlian atau jenis bantuan yang sering Anda lakukan..."
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {isSaved ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Perubahan Berhasil Disimpan ke Akun
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* TAB 2: WALLET & HAK PEMBAYARAN (NON E-MONEY)                 */}
            {/* ============================================================ */}
            {activeTab === "wallet" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Hak Pembayaran &amp; Deposit Sewa</h3>
                    <p className="text-xs text-slate-500">Pencatatan hak pembayaran atas tugas/layanan dan pelacakan deposit pengaman sewa</p>
                  </div>
                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Tarik Dana</span>
                  </button>
                </div>

                {/* 1. KARTU FINANSIAL PENYEDIA / MITRA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Saldo Dapat Dicairkan */}
                  <div className="bg-gradient-to-br from-[#102A43] to-[#0B1E32] text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                          Saldo Dapat Dicairkan
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Status: AVAILABLE
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
                        {formatIDR(mitraAvailableBalance)}
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Hak bersih dari tugas/layanan jasa yang telah dikonfirmasi selesai oleh customer.
                      </p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Biaya transfer Rp2.500 ditanggung Bantuin.id</span>
                      </span>
                      <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Tarik Sekarang</span>
                      </button>
                    </div>
                  </div>

                  {/* Dana Sedang Diproses / Tertahan */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Dana Sedang Diproses / Tertahan
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          Status: PENDING
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-1">
                        {formatIDR(mitraPendingBalance)}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Dana dari customer yang masih dalam proses pengerjaan atau masa sewa aktif. Otomatis beralih ke <strong>AVAILABLE</strong> setelah serah terima selesai.
                      </p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Tertahan sementara dalam proses pengerjaan</span>
                    </div>
                  </div>
                </div>

                {/* Banner Informasi Non E-Money */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#1683FF] shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-950 space-y-0.5">
                    <p className="font-bold">Ketentuan Hak Pembayaran &amp; Penarikan:</p>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Saldo di dashboard ini adalah buku catatan hak pembayaran (ledger entitlement), bukan saldo uang elektronik (e-money). Biaya transfer bank admin sebesar Rp2.500 ditanggung penuh oleh platform Bantuin.id, sehingga Anda menerima nominal penarikan 100% utuh tanpa potongan.
                    </p>
                  </div>
                </div>

                {/* 2. DAFTAR DEPOSIT SEWA BARANG CUSTOMER */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Deposit Jaminan Sewa Barang (Customer)</h4>
                      <p className="text-[11px] text-slate-500">Dana pengaman sewa (0% komisi) yang dikembalikan ke rekening bank Anda setelah alat selesai diperiksa</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {customerDeposits?.length || 0} Data
                    </span>
                  </div>

                  <div className="space-y-3">
                    {customerDeposits && customerDeposits.length > 0 ? (
                      customerDeposits.map((dep) => {
                        const isRefunded = dep.status === "REFUNDED";
                        const isPendingRefund = dep.status === "REFUND_PENDING";
                        const isWaitingReturn = dep.status === "WAITING_RETURN";
                        const isDispute = dep.status === "DISPUTE";

                        return (
                          <div key={dep.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900">{dep.rentalTitle}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isRefunded
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isPendingRefund
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : isDispute
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-blue-50 text-[#1683FF] border border-blue-200"
                                }`}>
                                  {isRefunded && "Deposit Telah Dikembalikan"}
                                  {isPendingRefund && "Menunggu Transfer Manual Admin"}
                                  {isWaitingReturn && "Masa Sewa Berjalan"}
                                  {isDispute && "Ada Klaim Kerusakan"}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                Rekening Tujuan: {dep.customerBank} ({dep.customerAccountNumber}) an {dep.customerAccountHolder}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs text-slate-400">Nominal Deposit:</div>
                              <div className="text-base font-black text-slate-900">{formatIDR(dep.depositAmount)}</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        Belum ada riwayat transaksi deposit jaminan sewa aktif.
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. RIWAYAT PENARIKAN DANA */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-slate-900">Riwayat Pengajuan Penarikan Saldo</h4>
                    <span className="text-xs text-slate-400">Diproses transfer manual oleh admin</span>
                  </div>

                  <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100 bg-white">
                    {withdrawals && withdrawals.length > 0 ? (
                      withdrawals.map((wd) => {
                        const isSuccess = wd.status === "SUCCESS";
                        return (
                          <div key={wd.id} className="p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                              }`}>
                                {isSuccess ? <Check className="w-3.5 h-3.5" /> : <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">
                                  Transfer ke {wd.bankName} ({wd.accountNumber})
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {formatDateIndo(wd.requestedAt)} &middot; Atas Nama: {wd.accountHolder}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-xs font-black text-slate-900">-{formatIDR(wd.amount)}</div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isSuccess
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}>
                                {isSuccess ? "Berhasil Ditransfer" : "Menunggu Transfer Admin"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-5 text-center text-xs text-slate-400">
                        Belum ada riwayat penarikan dana.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: VERIFIKASI IDENTITAS (KYC INTERAKTIF)                 */}
            {/* ============================================================ */}
            {activeTab === "kyc" && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {isUser && !isJasaVerified
                        ? "Verifikasi Akun Jasa (Kualifikasi Helper)"
                        : "Status Verifikasi Identitas Resmi (KYC)"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isUser && !isJasaVerified
                        ? "Verifikasi KTP dan keahlian untuk mengaktifkan status penyedia jasa & menerima tugas bantuan"
                        : "Identitas resmi yang menjamin keamanan transaksi di Bantuin"}
                    </p>
                  </div>
                  {(!isUser || isJasaVerified) && (
                    <button
                      onClick={() => setIsKycModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer self-start sm:self-auto"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Perbarui Dokumen KYC</span>
                    </button>
                  )}
                </div>

                {/* JIKA PENGGUNA UMUM BELUM TERVERIFIKASI JASA: TAMPILKAN FORMULIR VERIFIKASI JASA */}
                {isUser && !isJasaVerified ? (
                  <div className="space-y-5">
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                      <ShieldCheck className="w-6 h-6 text-[#1683FF] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>Status Akun Saat Ini: Pengguna Umum</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1683FF] text-[9px] font-bold border border-blue-200">
                            Belum Terverifikasi Jasa
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Sesuai aturan kepatuhan keamanan Bantuin.id, akun umum yang ingin mengajukan penawaran bantuan atau membuka jasa keahlian diwajibkan melakukan verifikasi KTP (NIK 16 digit), keahlian, dan rekening pencairan dana.
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyJasaFromProfile} className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-[#1683FF]" />
                        <span>Formulir Verifikasi Kualifikasi Jasa</span>
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
                          value={userJasaVerifyForm.idNumber}
                          onChange={(e) => setUserJasaVerifyForm({ ...userJasaVerifyForm, idNumber: e.target.value })}
                          className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Foto KTP Asli <span className="text-red-500">*</span>
                        </label>
                        {userJasaVerifyForm.idCardUrl ? (
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <span className="text-xs font-bold text-[#1683FF] flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#1683FF]" />
                              <span>{userJasaVerifyForm.idCardFileName || "ktp_terlampir.jpg"}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setUserJasaVerifyForm({ ...userJasaVerifyForm, idCardUrl: null, idCardFileName: "" })}
                              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                            >
                              Ganti Foto
                            </button>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-xl p-4 text-center cursor-pointer transition bg-white block">
                            <Upload className="w-5 h-5 text-[#1683FF] mx-auto mb-1" />
                            <span className="text-xs font-bold text-slate-800 block">Pilih File Foto KTP Asli</span>
                            <input type="file" accept="image/*" onChange={handleUserKtpUpload} className="hidden" required />
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Bidang Keahlian Utama <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={userJasaVerifyForm.skill}
                            onChange={(e) => setUserJasaVerifyForm({ ...userJasaVerifyForm, skill: e.target.value })}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                          >
                            <option value="Tukang Antar & Errand">Tukang Antar &amp; Errand</option>
                            <option value="Admin Data & Excel">Admin Data &amp; Excel</option>
                            <option value="Desain Grafis & Logo">Desain Grafis &amp; Logo</option>
                            <option value="Video Editing & Reels">Video Editing &amp; Reels</option>
                            <option value="Web & IT Development">Web &amp; IT Development</option>
                            <option value="Servis Komputer / Laptop">Servis Komputer / Laptop</option>
                            <option value="Penerjemah & Copywriting">Penerjemah &amp; Copywriting</option>
                            <option value="other">Lainnya (Isi Sendiri...)</option>
                          </select>
                          {userJasaVerifyForm.skill === "other" && (
                            <div className="mt-2 animate-in fade-in">
                              <input
                                type="text"
                                required
                                placeholder="Tulis bidang keahlian Anda (contoh: Barista Event, Guru Les Privat, Servis AC...)"
                                value={userJasaVerifyForm.customSkill}
                                onChange={(e) => setUserJasaVerifyForm({ ...userJasaVerifyForm, customSkill: e.target.value })}
                                className="w-full text-xs px-3.5 py-2 rounded-xl border border-blue-300 bg-blue-50/50 focus:outline-none focus:border-[#1683FF]"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Bank / E-Wallet Pencairan <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={userJasaVerifyForm.bankName}
                            onChange={(e) => setUserJasaVerifyForm({ ...userJasaVerifyForm, bankName: e.target.value })}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                          >
                            <option value="BCA">BCA</option>
                            <option value="Mandiri">Mandiri</option>
                            <option value="BRI">BRI</option>
                            <option value="BNI">BNI</option>
                            <option value="DANA">DANA</option>
                            <option value="GoPay">GoPay</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor Rekening / E-Wallet Payout <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Nomor rekening untuk menerima pencairan imbalan"
                          value={userJasaVerifyForm.accountNumber}
                          onChange={(e) => setUserJasaVerifyForm({ ...userJasaVerifyForm, accountNumber: e.target.value })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingJasa}
                        className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isVerifyingJasa ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Memproses Verifikasi Kualifikasi Jasa...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Kirim &amp; Verifikasi Akun Jasa Sekarang</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                      <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                          <span>Identitas KTP &amp; No. HP Anda Telah Terverifikasi Penuh</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                            Level 3 (Maksimal)
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                          Akun Anda memiliki badge <strong>Verified Helper &amp; Partner</strong>. Anda memiliki kuota transaksi tanpa batas, hak menerima tugas bantuan, dan membuka jasa atau outlet sewa di Bantuin.
                        </div>
                      </div>
                    </div>

                    {/* Document Preview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {/* KTP Digital Card */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-[#1683FF]" />
                            <span>KTP Elektronik (e-KTP)</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Disetujui Dukcapil</span>
                          </span>
                        </div>

                        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-200 group">
                          <img
                            src={currentUser?.idCardUrl || kycForm.ktpUrl}
                            alt="Foto KTP Pengguna"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                            <span>Pratinjau Dokumen</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                          <div>NIK: <strong>3302**********01</strong> (Tersensor)</div>
                          <div>Nama: <strong>{currentUser?.fullName || profileData.fullName}</strong></div>
                        </div>
                      </div>

                      {/* Foto Wajah / Selfie Card */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-emerald-600" />
                            <span>Foto Selfie Pemegang KTP</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Biometrik Cocok</span>
                          </span>
                        </div>

                        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-200 group">
                          <img
                            src={currentUser?.avatarUrl || kycForm.selfieUrl}
                            alt="Foto Wajah Biometrik"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                            <span>Pratinjau Foto</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                          <div>Status Biometrik: <strong>Lolos AI Face Match (99.2%)</strong></div>
                          <div>Terakhir Diperiksa: <strong>14 Januari 2024</strong></div>
                        </div>
                      </div>
                    </div>

                    {/* Table Details */}
                    <div className="border border-slate-200/90 rounded-2xl p-4 bg-white space-y-2 text-xs">
                      <div className="font-bold text-slate-900 mb-2">Informasi Validasi Identitas:</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Status Akun:</span>
                          <span className="font-bold text-emerald-600">Aktif &amp; Terverifikasi</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Metode Validasi:</span>
                          <span className="font-bold text-slate-800">OCR e-KTP + Face Liveness</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Batas Penarikan:</span>
                          <span className="font-bold text-slate-800">Tidak Terbatas</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Layanan Terbuka:</span>
                          <span className="font-bold text-slate-800">Bantuan, Jasa &amp; Sewa</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: PENGATURAN JASA (HANYA UNTUK PENYEDIA JASA)           */}
            {/* ============================================================ */}
            {isProvider && activeTab === "service_settings" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Pengaturan Layanan Jasa</h3>
                    <p className="text-xs text-slate-500">Kelola spesialisasi keahlian dan status tayang profil jasa Anda</p>
                  </div>
                </div>

                {/* PORTAL JASA */}
                <div className="p-5 rounded-2xl border border-blue-200/80 bg-blue-50/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#1683FF] text-white flex items-center justify-center font-bold shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Status Penyedia Jasa Aktif</div>
                        <div className="text-[11px] text-slate-500">Keahlian Anda ditayangkan di katalog publik dan siap menerima tawaran pekerjaan</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileData.isProviderEnabled}
                          onChange={(e) => setProfileData({ ...profileData, isProviderEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1683FF]"></div>
                      </label>
                      <Link
                        href="/jasa/dashboard"
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs"
                      >
                        <span>Ke Dashboard Jasa</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Skill Selection Tags */}
                  <div className="pt-2 border-t border-blue-100 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Keahlian &amp; Spesialisasi Aktif (Klik untuk mengaktifkan/menonaktifkan):
                        </label>
                        <span className="text-[11px] text-slate-400">Total: {profileData.skills.length} keahlian</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {Array.from(new Set([...availableSkills, ...profileData.skills])).map((skill) => {
                          const isSelected = profileData.skills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className={`text-xs px-3 py-1.5 rounded-full border transition font-medium flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? "bg-[#1683FF] text-white border-[#1683FF] shadow-2xs font-bold"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <span>{skill}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Input Tambah Bidang / Keahlian Kustom Baru (Isi Sendiri) */}
                    <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-[#1683FF]" />
                        <span>Tambah Bidang / Keahlian Baru (Isi Sendiri):</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Ketikkan spesialisasi atau keahlian unik Anda di luar template yang tersedia.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Contoh: Barista Event, Guru Les Privat, Fotografer Produk, Servis AC..."
                          value={newCustomSkill}
                          onChange={(e) => setNewCustomSkill(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddNewSkill();
                            }
                          }}
                          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                        />
                        <button
                          type="button"
                          onClick={handleAddNewSkill}
                          className="px-5 py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer shrink-0"
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 5: REKENING BANK & E-WALLET                              */}
            {/* ============================================================ */}
            {activeTab === "bank" && (
              <form onSubmit={handleBankSave} className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-base font-black text-slate-900">Rekening Bank Pencairan Hak Pembayaran</h3>
                  <p className="text-xs text-slate-500">Penghasilan dari bantuan dan jasa akan otomatis dicairkan ke rekening ini</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank / E-Wallet Penerima</label>
                  <select
                    value={profileData.bankName}
                    onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] bg-white font-medium"
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                    <option value="DANA">DANA (E-Wallet)</option>
                    <option value="GoPay">GoPay (E-Wallet)</option>
                    <option value="OVO">OVO (E-Wallet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening Bank / Nomor HP E-Wallet</label>
                  <input
                    type="text"
                    required
                    value={profileData.accountNumber}
                    onChange={(e) => setProfileData({ ...profileData, accountNumber: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Rekening (Sesuai Buku Tabungan / Akun)</label>
                  <input
                    type="text"
                    required
                    value={profileData.accountHolder}
                    onChange={(e) => setProfileData({ ...profileData, accountHolder: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Biaya transfer antar-bank Rp2.500 ditanggung 100% oleh platform Bantuin.id.</span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {isBankSaved ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Rekening Berhasil Diperbarui &amp; Tersimpan
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    Simpan Rekening
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* TAB 6: KEAMANAN & SANDI (VALIDASI AKTIF)                      */}
            {/* ============================================================ */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-base font-black text-slate-900">Keamanan Akun &amp; Sandi</h3>
                  <p className="text-xs text-slate-500">Perbarui kata sandi untuk mengamankan hak pencairan saldo dan akun Anda</p>
                </div>

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Kata sandi Anda telah berhasil diperbarui.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Baru</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 8 karakter kombinasi"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                  <input
                    type="password"
                    required
                    placeholder="Ulangi kata sandi baru"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    Perbarui Kata Sandi
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </main>

      {/* ============================================================ */}
      {/* MODAL: PERBARUI DOKUMEN KYC RESMI                            */}
      {/* ============================================================ */}
      {isKycModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Perbarui Dokumen Verifikasi KYC</h3>
                <p className="text-[11px] text-slate-500">Unggah foto KTP dan foto selfie wajah terbaru Anda</p>
              </div>
              <button onClick={() => setIsKycModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleKycSubmit} className="space-y-4">
              {/* KTP Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto e-KTP Asli (Jelas &amp; Tidak Terpotong)</label>
                <div className="flex items-center gap-3">
                  <img
                    src={kycForm.ktpUrl}
                    alt="Preview KTP"
                    className="w-20 h-14 object-cover rounded-lg border border-slate-200 bg-slate-100"
                  />
                  <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto KTP</span>
                    <input type="file" accept="image/*" onChange={(e) => handleKycFile(e, "ktp")} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Selfie Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto Selfie Memegang KTP / Wajah Jelas</label>
                <div className="flex items-center gap-3">
                  <img
                    src={kycForm.selfieUrl}
                    alt="Preview Selfie"
                    className="w-14 h-14 object-cover rounded-full border border-slate-200 bg-slate-100"
                  />
                  <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Pilih Foto Wajah</span>
                    <input type="file" accept="image/*" onChange={(e) => handleKycFile(e, "selfie")} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK)</label>
                <input
                  type="text"
                  required
                  value={kycForm.nik}
                  onChange={(e) => setKycForm({ ...kycForm, nik: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                <span>Dokumen Anda dienkripsi AES-256 dan hanya digunakan untuk kepatuhan hukum transaksi terverifikasi di Bantuin.id.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsKycModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition"
                >
                  Kirim Verifikasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: TARIK SALDO DARI PROFIL (REAL WITHDRAW FUNDS)          */}
      {/* ============================================================ */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Tarik Saldo ke Rekening / E-Wallet</h3>
                <p className="text-[11px] text-slate-500">Pencairan dana langsung ke rekening bank atau e-wallet Anda</p>
              </div>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const success = withdrawFunds({
                  amount: withdrawForm.amount,
                  bankName: withdrawForm.bankName,
                  accountNumber: withdrawForm.accountNumber,
                  accountHolder: withdrawForm.accountHolder,
                });
                if (success) {
                  setIsWithdrawModalOpen(false);
                }
              }}
              className="space-y-4"
            >
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <span className="text-xs text-blue-950 font-medium">Saldo Tersedia:</span>
                <span className="text-sm font-extrabold text-[#1683FF]">{formatIDR(mitraAvailableBalance)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  required
                  min={20000}
                  max={mitraAvailableBalance}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#1683FF]"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Minimal Rp20.000</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawForm({ ...withdrawForm, amount: mitraAvailableBalance.toString() })}
                    className="text-[#1683FF] font-bold hover:underline"
                  >
                    Tarik Semua ({formatIDR(mitraAvailableBalance)})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank / E-Wallet</label>
                  <select
                    value={withdrawForm.bankName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF] bg-white"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="BSI">BSI</option>
                    <option value="DANA">DANA</option>
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                    <option value="ShopeePay">ShopeePay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening / HP</label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  required
                  value={withdrawForm.accountHolder}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Biaya Transfer Admin (Rp2.500):</span>
                  <span className="font-bold text-emerald-700">GRATIS (Ditanggung Bantuin.id)</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-emerald-200">
                  <span>Total Ditransfer ke Rekening Anda:</span>
                  <span className="text-emerald-700 font-black text-sm">
                    {formatIDR(Number(withdrawForm.amount) || 0)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  Konfirmasi Pengajuan Penarikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
