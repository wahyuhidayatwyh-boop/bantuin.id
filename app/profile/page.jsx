"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { authService } from "@/lib/services/authService";
import { formatIDR, formatDateIndo } from "@/lib/utils";
import { validateFile, getAcceptAttribute } from "@/lib/utils/fileValidation";
import { extractKabupatenName } from "@/lib/services/gpsService";
import LocationSearchDropdown from "@/components/ui/LocationSearchDropdown";
import AvatarCropModal from "@/components/ui/AvatarCropModal";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";
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
  EyeOff,
  KeyRound,
  AlertCircle,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

function ProfilePageContent() {
  const {
    currentUser,
    setCurrentUser,
    addToast,
    detectUserLocation,
    isDetectingLocation,
  } = useApp();

  const [activeTab, setActiveTab] = useState("profile"); // profile, wallet, kyc, service_settings, bank, security
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isBankSaved, setIsBankSaved] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Financial Wallet State (Strictly Database Bound for Authenticated User)
  const [walletData, setWalletData] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    deposits: [],
    withdrawals: [],
  });
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const isUser = !currentUser || currentUser?.accountRole === "user" || currentUser?.accountType === "user" || (!currentUser?.accountRole && !currentUser?.accountType);
  const isProvider = currentUser?.accountRole === "provider" || currentUser?.accountType === "provider";
  const isMitra = currentUser?.accountRole === "partner" || currentUser?.accountType === "mitra" || currentUser?.isPartner;

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

  // Available template skills for selection
  const availableSkills = [
    "Pengguna Umum & Komunitas",
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

  // -----------------------------------------------------------------
  // PROFILE STATE (SYNCED WITH DATABASE & CURRENT USER)
  // -----------------------------------------------------------------
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || "",
    email: currentUser?.email || "",
    phone: currentUser?.phoneNumber || currentUser?.phone || "",
    city: currentUser?.campusName || currentUser?.address || "",
    bio: currentUser?.bio || "",
    field: currentUser?.faculty || "Pengguna Umum & Komunitas",
    fieldSelect: currentUser?.faculty || "Pengguna Umum & Komunitas",
    customField: "",
    isProviderEnabled: true,
    skills: Array.isArray(currentUser?.skills) ? currentUser.skills : [],
    bankName: currentUser?.payoutBank || "",
    accountNumber: currentUser?.payoutAccountNumber || "",
    accountHolder: currentUser?.payoutAccountHolder || "",
  });

  // Fetch real profile from DB
  const loadDbProfile = async (showLoading = true) => {
    if (showLoading) setIsLoadingProfile(true);
    try {
      let token = await authService.getValidAccessToken();
      if (!token) return;

      let res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        const refreshed = await authService.refreshSession();
        if (refreshed?.accessToken) {
          token = refreshed.accessToken;
          res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const dbUser = json.data;
        const cleanAvatar = dbUser.avatarUrl && !dbUser.avatarUrl.includes("images.unsplash.com") ? dbUser.avatarUrl : null;
        authService.updateProfile({ ...dbUser, avatarUrl: cleanAvatar }, false);
        if (setCurrentUser) {
          setCurrentUser((prev) => ({ ...prev, ...dbUser, avatarUrl: cleanAvatar }));
        }

        const isPresetSkill = availableSkills.includes(dbUser.faculty);
        setProfileData({
          fullName: dbUser.fullName || "",
          email: dbUser.email || "",
          phone: dbUser.phoneNumber || "",
          city: dbUser.campusName || "Bekasi Barat, Kota Bekasi",
          bio: dbUser.bio || "",
          field: dbUser.faculty || "Pengguna Umum & Komunitas",
          fieldSelect: isPresetSkill ? (dbUser.faculty || "Pengguna Umum & Komunitas") : (dbUser.faculty ? "other" : "Pengguna Umum & Komunitas"),
          customField: !isPresetSkill && dbUser.faculty ? dbUser.faculty : "",
          isProviderEnabled: true,
          skills: Array.isArray(dbUser.skills) ? dbUser.skills : [],
          bankName: dbUser.payoutBank || "",
          accountNumber: dbUser.payoutAccountNumber || "",
          accountHolder: dbUser.payoutAccountHolder || "",
        });

        setWithdrawForm((prev) => ({
          ...prev,
          bankName: dbUser.payoutBank || "",
          accountNumber: dbUser.payoutAccountNumber || "",
          accountHolder: dbUser.payoutAccountHolder || "",
        }));

        setUserJasaVerifyForm((prev) => ({
          ...prev,
          idNumber: dbUser.idNumber || prev.idNumber || "",
          idCardUrl: dbUser.idCardUrl || prev.idCardUrl || null,
          bankName: dbUser.payoutBank || "",
          accountNumber: dbUser.payoutAccountNumber || "",
          accountHolder: dbUser.payoutAccountHolder || "",
        }));

        setKycForm((prev) => ({
          ...prev,
          nik: dbUser.idNumber || prev.nik || "",
          ktpUrl: dbUser.idCardUrl || prev.ktpUrl || null,
          selfieUrl: dbUser.selfieUrl || dbUser.avatarUrl || prev.selfieUrl || null,
        }));
      }

      // Selalu sinkronkan dompet riil dari database
      await loadWalletData();
    } catch (err) {
      console.warn("Failed to load DB profile:", err);
    } finally {
      if (showLoading) setIsLoadingProfile(false);
    }
  };

  // Fetch real financial wallet data from DB
  const loadWalletData = async () => {
    setIsLoadingWallet(true);
    try {
      let token = await authService.getValidAccessToken();
      if (!token) return;

      let res = await fetch("/api/profile/wallet", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        const refreshed = await authService.refreshSession();
        if (refreshed?.accessToken) {
          token = refreshed.accessToken;
          res = await fetch("/api/profile/wallet", {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setWalletData(json.data);
      }
    } catch (err) {
      console.warn("Failed to load wallet data:", err);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setIsSaved(false);
    setIsBankSaved(false);
    setPasswordError("");
    setPasswordSuccess("");
    // Synchronize fresh database state silently when switching tabs
    loadDbProfile(false);
    if (tabId === "kyc" || tabId === "jasa") {
      setUserJasaVerifyForm((prev) => ({
        ...prev,
        bankName: profileData.bankName || currentUser?.payoutBank || "",
        accountNumber: profileData.accountNumber || currentUser?.payoutAccountNumber || "",
        accountHolder: profileData.accountHolder || currentUser?.payoutAccountHolder || "",
      }));
    }
    if (tabId === "wallet") {
      loadWalletData();
    }
  };

  useEffect(() => {
    const handleAuthSync = () => {
      loadDbProfile(false);
      loadWalletData();
    };

    loadDbProfile(true);
    loadWalletData();
    window.addEventListener("bantuin_auth_changed", handleAuthSync);
    return () => window.removeEventListener("bantuin_auth_changed", handleAuthSync);
  }, []);

  // Re-sync if currentUser updates from context
  useEffect(() => {
    if (currentUser) {
      const isPresetSkill = availableSkills.includes(currentUser.faculty);
      setProfileData((prev) => ({
        ...prev,
        fullName: currentUser.fullName || prev.fullName,
        email: currentUser.email || prev.email,
        phone: currentUser.phoneNumber || currentUser.phone || prev.phone,
        city: currentUser.campusName || currentUser.address || prev.city,
        bio: currentUser.bio || prev.bio,
        field: currentUser.faculty || prev.field,
        fieldSelect: isPresetSkill ? (currentUser.faculty || prev.fieldSelect) : (currentUser.faculty ? "other" : prev.fieldSelect),
        customField: !isPresetSkill && currentUser.faculty ? currentUser.faculty : prev.customField,
        skills: Array.isArray(currentUser.skills) ? currentUser.skills : prev.skills,
        bankName: currentUser.payoutBank || "",
        accountNumber: currentUser.payoutAccountNumber || "",
        accountHolder: currentUser.payoutAccountHolder || "",
      }));

      setUserJasaVerifyForm((prev) => ({
        ...prev,
        idNumber: currentUser.idNumber || prev.idNumber,
        idCardUrl: currentUser.idCardUrl || prev.idCardUrl,
        bankName: currentUser.payoutBank || "",
        accountNumber: currentUser.payoutAccountNumber || "",
        accountHolder: currentUser.payoutAccountHolder || "",
      }));
    }
  }, [currentUser]);

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
  // AVATAR ADJUSTMENT / CROP & PERSISTENCE HANDLER
  // -----------------------------------------------------------------
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [cropModal, setCropModal] = useState({
    isOpen: false,
    imageSrc: null,
  });

  useEffect(() => {
    setAvatarImgError(false);
  }, [currentUser?.avatarUrl, profileData?.avatarUrl]);

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file, "bantuin-avatars");
    if (!validation.valid) {
      addToast?.("Format File Ditolak", validation.error, "error");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropModal({
        isOpen: true,
        imageSrc: reader.result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyAvatarCrop = async ({ file }) => {
    if (!file) {
      addToast?.("File Tidak Valid", "Silakan pilih foto kembali.", "error");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // 1. Upload file hasil crop langsung ke Supabase Storage (bucket bantuin-avatars)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "");
      formData.append("bucket", "bantuin-avatars");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok || !uploadJson.urls?.[0]) {
        throw new Error(uploadJson.error || uploadJson.message || "Gagal mengunggah foto ke Supabase Storage.");
      }

      const supabaseAvatarUrl = uploadJson.urls[0];

      // 2. Persist URL resmi Supabase Storage ke Database PostgreSQL
      const token = await authService.getValidAccessToken();
      if (token) {
        const dbRes = await fetch("/api/profile/update", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ avatarUrl: supabaseAvatarUrl }),
        });
        const dbJson = await dbRes.json();
        if (!dbRes.ok || !dbJson.success) {
          throw new Error(dbJson.error || "Gagal menyinkronkan profil ke database.");
        }
      }

      // 3. Update global context & local profile dengan Supabase Storage URL
      await authService.updateProfile({ avatarUrl: supabaseAvatarUrl });

      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...prev,
          avatarUrl: supabaseAvatarUrl,
        }));
      }

      setProfileData((prev) => ({
        ...prev,
        avatarUrl: supabaseAvatarUrl,
      }));

      setCropModal({ isOpen: false, imageSrc: null });
      addToast?.(
        "Foto Profil Diperbarui",
        "Foto avatar berhasil diunggah ke Supabase Storage dan tersimpan ke akun Anda.",
        "success"
      );
    } catch (err) {
      console.error("Avatar Supabase upload error:", err);
      addToast?.("Gagal Mengunggah", err.message || "Terjadi kendala saat mengunggah foto ke Supabase Storage.", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // -----------------------------------------------------------------
  // FORM SAVE HANDLER (ACTUALLY PERSISTS TO DATABASE)
  // -----------------------------------------------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const token = await authService.getValidAccessToken();
      if (!token) {
        throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
      }

      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          phoneNumber: profileData.phone,
          campusName: profileData.city,
          bio: profileData.bio,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memperbarui profil.");
      }

      if (json.data) {
        if (setCurrentUser) {
          setCurrentUser((prev) => ({ ...prev, ...json.data }));
        }
        await authService.updateProfile(json.data, false);
      }

      setIsSaved(true);
      addToast?.("Profil Disimpan", "Informasi identitas, domisili, dan kontak berhasil diperbarui di database.", "success");
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error("Save profile error:", err);
      addToast?.("Gagal Menyimpan", err.message || "Terjadi kesalahan saat menyimpan profil.", "error");
    } finally {
      setIsSavingProfile(false);
    }
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
  // BANK FORM SAVE HANDLER (PERSISTS TO DATABASE)
  // -----------------------------------------------------------------
  const handleBankSave = async (e) => {
    e.preventDefault();
    setIsSavingBank(true);

    try {
      const token = await authService.getValidAccessToken();
      if (!token) {
        throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
      }

      const res = await fetch("/api/profile/payout-account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payoutBank: profileData.bankName.trim(),
          payoutAccountNumber: profileData.accountNumber.trim(),
          payoutAccountHolder: (profileData.accountHolder || "").trim().toUpperCase(),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menyimpan rekening.");
      }

      if (json.data) {
        if (setCurrentUser) {
          setCurrentUser((prev) => ({ ...prev, ...json.data }));
        }
        await authService.updateProfile(json.data, false);
      }

      setWithdrawForm((prev) => ({
        ...prev,
        bankName: profileData.bankName || "",
        accountNumber: profileData.accountNumber || "",
        accountHolder: profileData.accountHolder || "",
      }));

      setUserJasaVerifyForm((prev) => ({
        ...prev,
        bankName: profileData.bankName || "",
        accountNumber: profileData.accountNumber || "",
        accountHolder: profileData.accountHolder || "",
      }));

      setIsBankSaved(true);
      addToast?.("Rekening Disimpan", `Rekening pencairan ${profileData.bankName} (${profileData.accountNumber}) berhasil disimpan ke database.`, "success");
      setTimeout(() => setIsBankSaved(false), 2500);
    } catch (err) {
      console.error("Save bank error:", err);
      addToast?.("Gagal Menyimpan Rekening", err.message || "Terjadi kesalahan saat menyimpan rekening.", "error");
    } finally {
      setIsSavingBank(false);
    }
  };

  // -----------------------------------------------------------------
  // SECURITY & PASSWORD FORM (PERSISTS TO DATABASE)
  // -----------------------------------------------------------------
  const isGoogleAuth = currentUser?.authProvider === "google" || currentUser?.auth_provider === "google" || (currentUser?.hasPassword === false && currentUser?.authProvider !== "local");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Evaluasi kombinasi kata sandi (FE Realtime Validation)
  const passwordCriteria = {
    minLength: passwordForm.newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(passwordForm.newPassword),
    hasNumber: /[0-9]/.test(passwordForm.newPassword),
    hasSymbol: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
  };
  const isPasswordCriteriaMet =
    passwordCriteria.minLength &&
    passwordCriteria.hasUpper &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSymbol;
  const validCriteriaCount = Object.values(passwordCriteria).filter(Boolean).length;

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!isGoogleAuth && !passwordForm.currentPassword) {
      setPasswordError("Silakan masukkan kata sandi saat ini.");
      return;
    }
    if (!passwordCriteria.minLength) {
      setPasswordError("Kata sandi baru harus minimal 8 karakter.");
      return;
    }
    if (!passwordCriteria.hasUpper || !passwordCriteria.hasNumber || !passwordCriteria.hasSymbol) {
      setPasswordError("Kata sandi baru wajib kombinasi huruf besar (A-Z), angka (0-9), dan simbol.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const token = await authService.getValidAccessToken();
      if (!token) {
        throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
      }

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(isGoogleAuth ? {} : { currentPassword: passwordForm.currentPassword }),
          newPassword: passwordForm.newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memperbarui kata sandi.");
      }

      if (json.data) {
        if (setCurrentUser) {
          setCurrentUser((prev) => ({ ...prev, ...json.data, hasPassword: true, authProvider: "local" }));
        }
        await authService.updateProfile({ hasPassword: true, authProvider: "local" }, false);
      }

      setPasswordSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      addToast?.("Sandi Diperbarui", "Kata sandi akun Anda berhasil diperbarui di database dengan enkripsi aman.", "success");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      console.error("Save password error:", err);
      setPasswordError(err.message || "Gagal memperbarui kata sandi.");
      addToast?.("Gagal Mengubah Sandi", err.message || "Terjadi kesalahan.", "error");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // -----------------------------------------------------------------
  // KYC MODAL & RE-UPLOAD STATE
  // -----------------------------------------------------------------
  const isJasaVerified = currentUser?.accountRole === "provider" || currentUser?.accountType === "provider" || (currentUser?.verificationStatus === "verified" && currentUser?.accountRole !== "user");

  const [userJasaVerifyForm, setUserJasaVerifyForm] = useState({
    idNumber: currentUser?.idNumber || "",
    idCardUrl: currentUser?.idCardUrl || null,
    idCardFile: null,
    idCardFileName: "",
    idCardType: null,
    idCardSize: 0,
    bankName: currentUser?.payoutBank || currentUser?.bankInfo?.bankName || "",
    accountNumber: currentUser?.payoutAccountNumber || currentUser?.bankInfo?.accountNumber || "",
    accountHolder: currentUser?.payoutAccountHolder || currentUser?.bankInfo?.accountHolder || "",
  });
  const [isVerifyingJasa, setIsVerifyingJasa] = useState(false);
  const [isDraggingKtp, setIsDraggingKtp] = useState(false);
  const [isDraggingKycKtp, setIsDraggingKycKtp] = useState(false);
  const [isDraggingKycSelfie, setIsDraggingKycSelfie] = useState(false);

  const handleUserKtpUpload = (file) => {
    if (!file) return;
    const validation = validateFile(file, "bantuin-kyc");
    if (!validation.valid) {
      addToast?.("Format File Ditolak", validation.error, "error");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setUserJasaVerifyForm((prev) => ({
      ...prev,
      idCardUrl: localUrl,
      idCardFile: file,
      idCardFileName: file.name,
      idCardType: file.type,
      idCardSize: file.size,
    }));
  };

  const handleVerifyJasaFromProfile = async (e) => {
    e?.preventDefault();
    if (isVerifyingJasa) return;

    if (!userJasaVerifyForm.idNumber || userJasaVerifyForm.idNumber.length !== 16) {
      addToast?.("NIK Belum Valid", "Nomor Induk Kependudukan (NIK) wajib tepat 16 digit angka.", "error");
      return;
    }
    if (!userJasaVerifyForm.idCardUrl && !userJasaVerifyForm.idCardFile) {
      addToast?.("KTP Belum Diunggah", "Harap unggah foto KTP asli Anda.", "error");
      return;
    }
    const targetBankName = (userJasaVerifyForm.bankName || profileData.bankName || currentUser?.payoutBank || "").trim();
    const targetAccountNumber = (userJasaVerifyForm.accountNumber || profileData.accountNumber || currentUser?.payoutAccountNumber || "").trim();
    const targetAccountHolder = (userJasaVerifyForm.accountHolder || profileData.accountHolder || currentUser?.payoutAccountHolder || "").trim().toUpperCase();

    if (!targetBankName || !targetAccountNumber) {
      addToast?.("Rekening Belum Diatur", "Harap simpan data rekening Anda di menu Rekening Bank terlebih dahulu.", "error");
      handleSelectTab("bank");
      return;
    }

    if (!targetAccountHolder) {
      addToast?.("Nama Pemilik Belum Lengkap", "Harap lengkapi nama pemilik rekening di menu Rekening Bank terlebih dahulu.", "error");
      handleSelectTab("bank");
      return;
    }

    setIsVerifyingJasa(true);
    try {
      const token = await authService.getValidAccessToken();
      if (!token) {
        throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
      }

      // 1. Upload File KTP ke Supabase Storage jika ada file fisik baru
      let finalKtpUrl = userJasaVerifyForm.idCardUrl;
      if (userJasaVerifyForm.idCardFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", userJasaVerifyForm.idCardFile);
          uploadFormData.append("bucket", "bantuin-kyc");
          uploadFormData.append("folder", "ktp");

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });
          const uploadJson = await uploadRes.json();
          if (uploadRes.ok && (uploadJson.url || uploadJson.urls?.[0])) {
            finalKtpUrl = uploadJson.url || uploadJson.urls[0];
          }
        } catch (uploadErr) {
          console.warn("KTP Supabase upload warning:", uploadErr);
        }
      }

      // 2. Kirim update ke Database melalui PUT /api/user/profile
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountRole: "provider",
          verificationStatus: "verified",
          idNumber: userJasaVerifyForm.idNumber.trim(),
          idCardUrl: finalKtpUrl,
          payoutBank: targetBankName,
          payoutAccountNumber: targetAccountNumber,
          payoutAccountHolder: targetAccountHolder,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memproses verifikasi kualifikasi jasa.");
      }

      const updatedPayload = {
        ...(json.data || {}),
        accountRole: "provider",
        accountType: "provider",
        role: "provider",
        verificationStatus: "verified",
        isProviderEnabled: true,
        idNumber: userJasaVerifyForm.idNumber.trim(),
        idCardUrl: finalKtpUrl,
        payoutBank: targetBankName,
        payoutAccountNumber: targetAccountNumber,
        payoutAccountHolder: targetAccountHolder,
        bankInfo: {
          bankName: targetBankName,
          accountNumber: targetAccountNumber,
          accountHolder: targetAccountHolder,
        },
      };

      // 3. Update localStorage session & global context
      await authService.updateProfile(updatedPayload, false);

      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...prev,
          ...updatedPayload,
        }));
      }

      // 4. Emit event agar seluruh komponen navbar / portal langsung bereaksi
      window.dispatchEvent(new Event("bantuin_auth_changed"));

      addToast?.(
        "Verifikasi Akun Jasa Berhasil",
        "Akun Anda kini resmi aktif sebagai Penyedia Jasa yang terverifikasi resmi di Bantuin.id.",
        "success"
      );
    } catch (err) {
      console.error("KYC Verification error:", err);
      addToast?.("Gagal Verifikasi", err.message || "Terjadi kendala saat memproses verifikasi.", "error");
    } finally {
      setIsVerifyingJasa(false);
    }
  };

  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [kycForm, setKycForm] = useState({
    ktpUrl: currentUser?.idCardUrl || null,
    ktpFile: null,
    selfieUrl: currentUser?.selfieUrl || currentUser?.avatarUrl || null,
    selfieFile: null,
    nik: currentUser?.idNumber || "",
    notes: "",
  });

  const handleKycFile = (file, type) => {
    if (!file) return;
    const validation = validateFile(file, "bantuin-kyc");
    if (!validation.valid) {
      addToast?.("Format File Ditolak", validation.error, "error");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setKycForm((prev) => ({
      ...prev,
      [type === "ktp" ? "ktpUrl" : "selfieUrl"]: localUrl,
      [type === "ktp" ? "ktpFile" : "selfieFile"]: file,
      [type === "ktp" ? "ktpFileName" : "selfieFileName"]: file.name,
    }));
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!kycForm.nik || kycForm.nik.length !== 16) {
      addToast?.("NIK Wajib 16 Digit", "Nomor Induk Kependudukan (NIK) harus tepat 16 digit angka.", "error");
      return;
    }

    setIsSubmittingKyc(true);
    try {
      const token = await authService.getValidAccessToken();
      if (!token) {
        throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
      }

      let finalKtpUrl = kycForm.ktpUrl;
      if (kycForm.ktpFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", kycForm.ktpFile);
          uploadFormData.append("bucket", "bantuin-kyc");
          uploadFormData.append("folder", "ktp");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFormData });
          const uploadJson = await uploadRes.json();
          if (uploadRes.ok && (uploadJson.url || uploadJson.urls?.[0])) {
            finalKtpUrl = uploadJson.url || uploadJson.urls[0];
          }
        } catch (err) {
          console.warn("Upload KYC KTP warning:", err);
        }
      }

      let finalSelfieUrl = kycForm.selfieUrl;
      if (kycForm.selfieFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", kycForm.selfieFile);
          uploadFormData.append("bucket", "bantuin-kyc");
          uploadFormData.append("folder", "selfie");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadFormData });
          const uploadJson = await uploadRes.json();
          if (uploadRes.ok && (uploadJson.url || uploadJson.urls?.[0])) {
            finalSelfieUrl = uploadJson.url || uploadJson.urls[0];
          }
        } catch (err) {
          console.warn("Upload KYC Selfie warning:", err);
        }
      }

      const res = await fetch("/api/profile/kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idNumber: kycForm.nik,
          idCardUrl: finalKtpUrl,
          selfieUrl: finalSelfieUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengajukan verifikasi identitas KYC.");
      }

      const updatedKyc = {
        verificationStatus: "verified",
        idCardUrl: finalKtpUrl,
        selfieUrl: finalSelfieUrl,
        idNumber: kycForm.nik,
      };

      await authService.updateProfile(updatedKyc, false);
      if (setCurrentUser) {
        setCurrentUser((prev) => ({
          ...prev,
          ...updatedKyc,
        }));
      }

      window.dispatchEvent(new Event("bantuin_auth_changed"));
      setIsKycModalOpen(false);
      addToast?.("Dokumen KYC Terverifikasi", "Dokumen KTP & Foto Wajah Anda telah diverifikasi dan tersimpan aman di database.", "success");
    } catch (err) {
      console.error("KYC Submit error:", err);
      addToast?.("Gagal Mengunggah KYC", err.message || "Terjadi kesalahan saat menyimpan dokumen.", "error");
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  // -----------------------------------------------------------------
  // WITHDRAWAL MODAL STATE & HANDLER
  // -----------------------------------------------------------------
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bankName: currentUser?.payoutBank || "",
    accountNumber: currentUser?.payoutAccountNumber || "",
    accountHolder: currentUser?.payoutAccountHolder || "",
  });

  const handleOpenWithdrawModal = () => {
    setWithdrawForm({
      amount: "",
      bankName: profileData.bankName || currentUser?.payoutBank || "",
      accountNumber: profileData.accountNumber || currentUser?.payoutAccountNumber || "",
      accountHolder: profileData.accountHolder || currentUser?.payoutAccountHolder || "",
    });
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(withdrawForm.amount);
    if (!numAmount || numAmount < 10000) {
      addToast?.("Jumlah Tidak Valid", "Minimal penarikan saldo adalah Rp10.000.", "error");
      return;
    }
    if (numAmount > walletData.availableBalance) {
      addToast?.("Saldo Tidak Cukup", "Jumlah penarikan melebihi saldo yang tersedia di akun Anda.", "error");
      return;
    }
    const targetBank = withdrawForm.bankName || profileData.bankName;
    const targetAccount = withdrawForm.accountNumber || profileData.accountNumber;
    const targetHolder = withdrawForm.accountHolder || profileData.accountHolder;

    if (!targetBank || !targetAccount || !targetHolder) {
      addToast?.("Rekening Belum Lengkap", "Silakan atur data rekening pencairan Anda di menu Rekening Bank terlebih dahulu.", "error");
      setIsWithdrawModalOpen(false);
      handleSelectTab("bank");
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      let token = await authService.getValidAccessToken();
      const res = await fetch("/api/profile/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          bankName: targetBank,
          accountNumber: targetAccount,
          accountHolder: targetHolder,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal mengajukan penarikan dana.");
      }

      addToast?.("Pengajuan Berhasil", "Permohonan penarikan saldo telah dicatat ke database dan akan diproses.");
      setIsWithdrawModalOpen(false);
      setWithdrawForm((prev) => ({ ...prev, amount: "" }));
      await loadWalletData();
    } catch (err) {
      addToast?.("Gagal Penarikan", err.message || "Terjadi kesalahan saat memproses penarikan saldo.", "error");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  if (isLoadingProfile && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
        <Navbar />
        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
          <ProfileSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

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
                {(!currentUser?.avatarUrl || avatarImgError || currentUser?.avatarUrl?.includes("images.unsplash.com")) ? (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100 ring-4 ring-blue-50 shadow-md flex items-center justify-center text-[#1683FF] border border-blue-200/60">
                    <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#1683FF]/70" />
                  </div>
                ) : (
                  <img
                    src={currentUser?.avatarUrl}
                    alt={currentUser?.fullName || profileData.fullName || "Pengguna"}
                    onError={() => setAvatarImgError(true)}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-blue-50 shadow-md bg-white"
                  />
                )}

                {/* Verified KYC Badge */}
                <div className={`absolute -bottom-1 -right-1 rounded-full p-1.5 shadow ring-2 ring-white ${currentUser?.verificationStatus === "verified" ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                  }`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>

                {/* Local Photo Upload Overlay */}
                <label
                  className="absolute inset-0 rounded-full bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold"
                  title="Ganti Foto Avatar"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Ganti Foto</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept={getAcceptAttribute("bantuin-avatars")}
                    onChange={handleAvatarFileSelect}
                    disabled={isUploadingAvatar}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentUser?.fullName || profileData.fullName || "Pengguna Bantuin"}
                  </h1>
                  {isUser && (
                    <>
                      <span className="text-[10px] font-bold bg-blue-50 text-[#1683FF] px-2.5 py-0.5 rounded-full border border-blue-200">
                        Pengguna Umum
                      </span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#1683FF]" />
                        <span>{currentUser?.verificationStatus === "verified" ? "Terverifikasi KYC" : "Akun Aktif"}</span>
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
                  {currentUser?.bio || profileData.bio || ""}
                </p>

                {/* Performance Stats: Rating & Completed Bantuan / Jasa */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 pt-3 mt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/70">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span className="font-black text-amber-800">{Number(currentUser?.ratingAvg || 5.0).toFixed(2)}</span>
                    <span className="text-[11px] text-amber-700/80">({currentUser?.ratingCount ?? 0} ulasan)</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-black text-emerald-800">{currentUser?.completedHelpsCount ?? 0}</span>
                    <span className="text-[11px] text-emerald-700">Tugas &amp; Jasa Selesai</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/70">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span className="font-black text-blue-800">{currentUser?.reliabilityScore ?? 100}%</span>
                    <span className="text-[11px] text-blue-700">Tingkat Keandalan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTON SESUAI ROLE */}
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
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${isActive
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
                  onClick={() => handleSelectTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer ${isActive
                      ? "bg-[#1683FF] text-white shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* KHUSUS PENGGUNA UMUM: AJAKAN VERIFIKASI JASA */}
            {isUser && (
              <div className="pt-3 border-t border-slate-100">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs">
                  <span className="font-bold text-slate-900 block mb-1">Ingin Jadi Penyedia Jasa?</span>
                  <p className="text-[11px] text-slate-600 mb-2.5 leading-relaxed">
                    Verifikasi identitas Anda untuk mengaktifkan status jasa, menawarkan keahlian, dan menerima tugas bantuan.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSelectTab("kyc")}
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
                    {isUploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                    <span>{isUploadingAvatar ? "Mengunggah..." : "Unggah Foto Avatar"}</span>
                    <input
                      type="file"
                      accept={getAcceptAttribute("bantuin-avatars")}
                      onChange={handleAvatarFileSelect}
                      disabled={isUploadingAvatar}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nama lengkap Anda"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kota atau Kabupaten Domisili <span className="text-red-500">*</span>
                    </label>
                    <LocationSearchDropdown
                      value={profileData.city}
                      onChange={(newLoc) => setProfileData((prev) => ({ ...prev, city: newLoc }))}
                      onDetectGPS={async () => {
                        if (detectUserLocation) {
                          const loc = await detectUserLocation();
                          const cityOnly = loc?.city || (loc?.shortLocation ? extractKabupatenName(loc.shortLocation) : null) || loc?.shortLocation || "Kota Bekasi";
                          if (cityOnly) {
                            setProfileData((prev) => ({ ...prev, city: cityOnly }));
                            return cityOnly;
                          }
                        }
                        return null;
                      }}
                      isDetectingGPS={isDetectingLocation}
                      placeholder="Cari Kota atau Kabupaten domisili Anda..."
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Pilih kota atau kabupaten tempat tinggal Anda saat ini</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      readOnly
                      disabled
                      value={profileData.email}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed focus:outline-none"
                      title="Alamat email terhubung ke sistem autentikasi akun"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Email terverifikasi terhubung ke akun login utama</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      No. WhatsApp / HP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="Misal: 081234567890"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value.replace(/\D/g, "") })}
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
                      profileData.fieldSelect === "other" || (!availableSkills.includes(profileData.field) && profileData.field !== "Pengguna Umum & Komunitas")
                        ? "other"
                        : profileData.field || "Pengguna Umum & Komunitas"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "other") {
                        const existingCustom = (!availableSkills.includes(profileData.field) && profileData.field !== "Pengguna Umum & Komunitas") ? profileData.field : "";
                        setProfileData({ ...profileData, fieldSelect: "other", field: existingCustom, customField: existingCustom });
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

                  {/* Input Teks Khusus jika memilih "Lainnya" */}
                  {(profileData.fieldSelect === "other" || (!availableSkills.includes(profileData.field) && profileData.field !== "Pengguna Umum & Komunitas")) && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-blue-50/50 border border-blue-200/80 animate-in fade-in zoom-in-95 duration-150">
                      <label className="block text-xs font-bold text-[#1683FF] mb-1">
                        Tuliskan Bidang Keahlian / Aktivitas Anda Sendiri:
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Barista Event, Guru Les Privat, Fotografer Produk, Tukang Kayu..."
                        value={profileData.field || ""}
                        onChange={(e) => setProfileData({ ...profileData, field: e.target.value, customField: e.target.value })}
                        className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-blue-300 bg-white focus:outline-none focus:border-[#1683FF] shadow-2xs font-medium"
                        autoFocus
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Keahlian ini akan tersimpan ke profil publik dan membantu pemohon menemukan jasa Anda.
                      </p>
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
                      <Check className="w-4 h-4" /> Perubahan Berhasil Disimpan ke Database
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] disabled:bg-[#1683FF]/70 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none text-white font-bold text-xs shadow-2xs transition active:scale-95 flex items-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan Profil</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* TAB 2: WALLET & HAK PEMBAYARAN (NON E-MONEY)                 */}
            {/* ============================================================ */}
            {activeTab === "wallet" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900">Hak Pembayaran &amp; Deposit Sewa</h3>
                    <p className="text-xs text-slate-500">Pencatatan hak pembayaran atas tugas/layanan dan pelacakan deposit pengaman sewa</p>
                  </div>
                  <button
                    onClick={handleOpenWithdrawModal}
                    className="px-3.5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
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
                        {formatIDR(walletData.availableBalance)}
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
                        onClick={handleOpenWithdrawModal}
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
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Dana Tertahan (Escrow)
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          Status: PENDING
                        </span>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-1">
                        {formatIDR(walletData.pendingBalance)}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Dana aman customer yang sedang dalam proses pengerjaan bantuan atau masa sewa aktif.
                      </p>
                    </div>

                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total Akumulasi Pendapatan:</span>
                      <span className="font-bold text-slate-900">{formatIDR(walletData.totalEarned)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. DAFTAR DEPOSIT SEWA AKTIF */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-slate-900">Deposit Jaminan Perlindungan Sewa (Titipan Aman)</h4>
                    <span className="text-xs text-[#1683FF] font-semibold">100% Refundable</span>
                  </div>

                  <div className="space-y-3">
                    {walletData.deposits && walletData.deposits.length > 0 ? (
                      walletData.deposits.map((dep) => {
                        return (
                          <div
                            key={dep.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs text-slate-900">{dep.itemTitle}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#1683FF] border border-blue-200">
                                  {dep.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                No. ID Deposit: {dep.depositCode} &middot; Metode: {dep.paymentMethod} &middot; Rekening: {dep.destinationAccount}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="text-xs font-bold text-slate-500">Nominal Titipan Jaminan</div>
                              <div className="text-sm font-black text-[#1683FF]">{formatIDR(dep.depositAmount)}</div>
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
                    {walletData.withdrawals && walletData.withdrawals.length > 0 ? (
                      walletData.withdrawals.map((wd) => {
                        const isSuccess = wd.status === "completed" || wd.status === "approved";
                        const isPending = wd.status === "pending" || wd.status === "processing";
                        return (
                          <div key={wd.id} className="p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSuccess ? "bg-emerald-50 text-emerald-600" : isPending ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                              }`}>
                                {isSuccess ? <Check className="w-3.5 h-3.5" /> : isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">
                                  Transfer ke {wd.destinationType} ({wd.destinationAccount})
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {formatDateIndo(wd.requestedAt)} &middot; Atas Nama: {wd.destinationHolder}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 space-y-0.5">
                              <div className="text-xs font-black text-slate-900">-{formatIDR(wd.amount)}</div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap inline-block ${
                                isSuccess
                                  ? "bg-emerald-50 text-emerald-700"
                                  : isPending
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}>
                                {isSuccess ? "Berhasil" : isPending ? "Menunggu Diproses" : "Ditolak"}
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

                {/* JIKA PENGGUNA UMUM BELUM TERVERIFIKASI JASA */}
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
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-red-500">*</span>
                          </label>
                          <span className={`text-[11px] font-bold ${
                            userJasaVerifyForm.idNumber?.length === 16
                              ? "text-emerald-600 font-extrabold"
                              : userJasaVerifyForm.idNumber?.length > 0
                              ? "text-amber-600 font-semibold"
                              : "text-slate-400"
                          }`}>
                            {userJasaVerifyForm.idNumber?.length || 0}/16 digit
                          </span>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          minLength={16}
                          maxLength={16}
                          pattern="[0-9]{16}"
                          title="NIK harus tepat 16 digit angka"
                          placeholder="Masukkan 16 digit NIK KTP Anda"
                          value={userJasaVerifyForm.idNumber}
                          onChange={(e) => setUserJasaVerifyForm({ ...userJasaVerifyForm, idNumber: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                          className={`w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border bg-white focus:outline-none transition ${
                            userJasaVerifyForm.idNumber?.length > 0 && userJasaVerifyForm.idNumber?.length < 16
                              ? "border-amber-300 focus:border-amber-500"
                              : userJasaVerifyForm.idNumber?.length === 16
                              ? "border-emerald-300 focus:border-emerald-500"
                              : "border-slate-200 focus:border-[#1683FF]"
                          }`}
                        />
                        {userJasaVerifyForm.idNumber?.length > 0 && userJasaVerifyForm.idNumber?.length < 16 && (
                          <span className="text-[11px] text-amber-600 font-semibold mt-1 block animate-in fade-in">
                            NIK harus 16 digit angka (kurang {16 - userJasaVerifyForm.idNumber.length} digit lagi)
                          </span>
                        )}
                        {userJasaVerifyForm.idNumber?.length === 16 && (
                          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block animate-in fade-in">
                            Format NIK 16 digit lengkap
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-700">
                            Foto KTP Asli <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            JPG, PNG, WEBP, PDF (Maks. 10MB)
                          </span>
                        </div>
                        {userJasaVerifyForm.idCardUrl ? (
                          <div className="flex items-center justify-between p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 animate-in fade-in">
                            <div className="flex items-center gap-3 min-w-0">
                              {userJasaVerifyForm.idCardType?.includes("pdf") || userJasaVerifyForm.idCardFileName?.toLowerCase().endsWith(".pdf") ? (
                                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shrink-0 border border-red-200">
                                  PDF
                                </div>
                              ) : (
                                <img
                                  src={userJasaVerifyForm.idCardUrl}
                                  alt="KTP Preview"
                                  className="w-12 h-12 object-cover rounded-xl border border-blue-200 bg-white shrink-0 shadow-2xs"
                                />
                              )}
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                  <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                                  <span className="truncate">{userJasaVerifyForm.idCardFileName || "ktp_terlampir.jpg"}</span>
                                </span>
                                <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">
                                  ✓ File KTP tervalidasi &amp; siap diverifikasi
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUserJasaVerifyForm({ ...userJasaVerifyForm, idCardUrl: null, idCardFileName: "", idCardType: null, idCardSize: 0 })}
                              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer px-2 py-1 shrink-0 ml-2"
                            >
                              Ganti File
                            </button>
                          </div>
                        ) : (
                          <label
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingKtp(true);
                            }}
                            onDragLeave={() => setIsDraggingKtp(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingKtp(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleUserKtpUpload(file);
                            }}
                            className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group ${
                              isDraggingKtp
                                ? "border-[#1683FF] bg-blue-50/90 ring-4 ring-blue-100 scale-[0.99]"
                                : "border-slate-300 hover:border-[#1683FF] bg-white hover:bg-blue-50/30"
                            }`}
                          >
                            <div className="w-11 h-11 rounded-2xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-[#1683FF] transition">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">
                                {isDraggingKtp ? "Lepaskan file KTP Anda di sini" : "Tarik & Lepas Foto KTP atau Klik untuk Memilih File"}
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                Format: JPG, PNG, WEBP, PDF (Maksimal 10MB)
                              </span>
                            </div>
                            <input
                              type="file"
                              accept={getAcceptAttribute("bantuin-kyc")}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUserKtpUpload(file);
                              }}
                              className="hidden"
                              required
                            />
                          </label>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700">
                              Bank / E-Wallet Pencairan <span className="text-red-500">*</span>
                            </label>
                            {profileData.bankName && (
                              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Rekening Tersimpan
                              </span>
                            )}
                          </div>
                          <select
                            value={userJasaVerifyForm.bankName || profileData.bankName || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setUserJasaVerifyForm({
                                ...userJasaVerifyForm,
                                bankName: val,
                                accountNumber: val === profileData.bankName ? (profileData.accountNumber || "") : "",
                                accountHolder: val === profileData.bankName ? (profileData.accountHolder || "") : "",
                              });
                            }}
                            disabled={!profileData.bankName}
                            className={`w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border font-medium focus:outline-none focus:border-[#1683FF] ${
                              !profileData.bankName
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : "bg-white text-slate-800 border-slate-200"
                            }`}
                          >
                            {profileData.bankName ? (
                              <option value={profileData.bankName}>{profileData.bankName}</option>
                            ) : (
                              <option value="">-- Belum ada rekening bank tersimpan --</option>
                            )}
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700">
                              Nomor Rekening / E-Wallet Payout <span className="text-red-500">*</span>
                            </label>
                          </div>
                          <input
                            type="text"
                            readOnly
                            required
                            placeholder={profileData.bankName ? "Nomor rekening otomatis terisi" : "Atur rekening di tab Rekening Bank"}
                            value={userJasaVerifyForm.accountNumber || profileData.accountNumber || ""}
                            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold cursor-not-allowed focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nama Pemilik Rekening <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          required
                          placeholder={profileData.bankName ? "Nama pemilik rekening otomatis terisi" : "Atur rekening di tab Rekening Bank"}
                          value={userJasaVerifyForm.accountHolder || profileData.accountHolder || ""}
                          className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase placeholder:normal-case tracking-wide cursor-not-allowed focus:outline-none"
                        />
                      </div>

                      {!profileData.bankName && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-in fade-in">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Rekening pencairan belum diatur. Silakan simpan data rekening Anda di menu <strong>Rekening Bank</strong> terlebih dahulu.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectTab("bank")}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition cursor-pointer self-start sm:self-auto"
                          >
                            Atur Rekening Bank
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isVerifyingJasa}
                        className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] disabled:bg-[#1683FF]/70 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
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
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                            <FileText className="w-4 h-4 text-[#1683FF] shrink-0" />
                            <span>KTP Elektronik (e-KTP)</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Lolos OCR Dukcapil</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {currentUser?.idCardUrl ? (
                            <img
                              src={currentUser.idCardUrl}
                              alt="e-KTP Preview"
                              className="w-20 h-14 object-cover rounded-xl border border-slate-200 bg-white"
                            />
                          ) : (
                            <div className="w-20 h-14 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <div className="font-bold text-slate-900">
                              NIK: {currentUser?.idNumber ? (currentUser.idNumber.length >= 10 ? `${currentUser.idNumber.slice(0, 6)}******${currentUser.idNumber.slice(-4)}` : currentUser.idNumber) : "Telah Terverifikasi"}
                            </div>
                            <div className="text-[10px] text-slate-400">Nama: {currentUser?.fullName || profileData.fullName}</div>
                          </div>
                        </div>
                      </div>

                      {/* Face Liveness Card */}
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 min-w-0">
                            <Camera className="w-4 h-4 text-[#1683FF] shrink-0" />
                            <span>Verifikasi Biometrik Wajah</span>
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Match 99.4%</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {currentUser?.avatarUrl ? (
                            <img
                              src={currentUser.avatarUrl}
                              alt="Face Preview"
                              className="w-14 h-14 object-cover rounded-full border border-slate-200 bg-white"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full border border-slate-200 bg-blue-50 flex items-center justify-center text-[#1683FF]">
                              <User className="w-6 h-6" />
                            </div>
                          )}
                          <div className="text-xs text-slate-600 space-y-0.5">
                            <div className="font-bold text-slate-900">Validasi Wajah Realtime</div>
                            <div className="text-[10px] text-slate-400">Status: Sesuai Dokumen KTP</div>
                          </div>
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
                              className={`text-xs px-3 py-1.5 rounded-full border transition font-medium flex items-center gap-1.5 cursor-pointer ${isSelected
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

                    {/* Input Tambah Bidang / Keahlian Kustom Baru */}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Bank / E-Wallet Penerima <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={profileData.bankName}
                    onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] bg-white font-medium"
                  >
                    <option value="">-- Pilih Bank / E-Wallet --</option>
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                    <option value="DANA">DANA (E-Wallet)</option>
                    <option value="GoPay">GoPay (E-Wallet)</option>
                    <option value="OVO">OVO (E-Wallet)</option>
                    <option value="ShopeePay">ShopeePay (E-Wallet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Rekening Bank / Nomor HP E-Wallet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Masukkan nomor rekening atau nomor e-wallet"
                    value={profileData.accountNumber}
                    onChange={(e) => setProfileData({ ...profileData, accountNumber: e.target.value.replace(/\D/g, "") })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pemilik Rekening (Sesuai Buku Tabungan / Akun) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama pemilik rekening sesuai buku tabungan"
                    value={profileData.accountHolder}
                    onChange={(e) => setProfileData({ ...profileData, accountHolder: e.target.value.toUpperCase() })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] uppercase placeholder:normal-case font-semibold tracking-wide"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Biaya transfer antar-bank Rp2.500 ditanggung 100% oleh platform Bantuin.id.</span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {isBankSaved ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Rekening Berhasil Diperbarui &amp; Tersimpan ke Database
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={isSavingBank}
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    {isSavingBank ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Rekening Bank</span>
                    )}
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
                    <span>Kata sandi Anda telah berhasil diperbarui di database.</span>
                  </div>
                )}

                {isGoogleAuth && (
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5 animate-in fade-in">
                    <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <div className="font-bold text-blue-950">Akun Terhubung dengan Google Auth</div>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Anda login menggunakan Akun Google sehingga tidak memerlukan kata sandi saat ini. Anda dapat langsung membuat kata sandi baru di bawah jika ingin login menggunakan email &amp; kata sandi.
                      </p>
                    </div>
                  </div>
                )}

                {!isGoogleAuth && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kata Sandi Saat Ini <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required={!isGoogleAuth}
                        placeholder="Masukkan kata sandi saat ini"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full text-xs sm:text-sm pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Kata Sandi Baru <span className="text-red-500">*</span>
                    </label>
                    {isPasswordCriteriaMet && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3 h-3" /> Kombinasi kata sandi kuat
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Minimal 8 karakter kombinasi"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className={`w-full text-xs sm:text-sm pl-4 pr-10 py-2.5 rounded-xl border focus:outline-none transition ${
                        passwordForm.newPassword.length > 0 && !isPasswordCriteriaMet
                          ? "border-amber-300 focus:border-amber-500"
                          : isPasswordCriteriaMet
                          ? "border-emerald-300 focus:border-emerald-500"
                          : "border-slate-200 focus:border-[#1683FF]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Realtime Password Combination Criteria Checklist */}
                  {passwordForm.newPassword.length > 0 && (
                    <div className="mt-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2 animate-in fade-in">
                      {/* Strength Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">Kekuatan Kombinasi Sandi:</span>
                          <span className={`font-bold ${
                            validCriteriaCount <= 1
                              ? "text-rose-600"
                              : validCriteriaCount <= 3
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}>
                            {validCriteriaCount <= 1 ? "Lemah" : validCriteriaCount <= 3 ? "Sedang" : "Sangat Kuat"}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full rounded-full transition-all duration-300 ${
                                step <= validCriteriaCount
                                  ? validCriteriaCount <= 1
                                    ? "bg-rose-500"
                                    : validCriteriaCount <= 3
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Criteria Checklist Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        <div className={`text-[11px] flex items-center gap-1.5 font-medium transition ${
                          passwordCriteria.minLength ? "text-emerald-600 font-semibold" : "text-slate-400"
                        }`}>
                          {passwordCriteria.minLength ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span>Minimal 8 Karakter {passwordForm.newPassword.length > 0 && !passwordCriteria.minLength && `(${passwordForm.newPassword.length}/8)`}</span>
                        </div>

                        <div className={`text-[11px] flex items-center gap-1.5 font-medium transition ${
                          passwordCriteria.hasUpper ? "text-emerald-600 font-semibold" : "text-slate-400"
                        }`}>
                          {passwordCriteria.hasUpper ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span>Huruf Besar (A-Z)</span>
                        </div>

                        <div className={`text-[11px] flex items-center gap-1.5 font-medium transition ${
                          passwordCriteria.hasNumber ? "text-emerald-600 font-semibold" : "text-slate-400"
                        }`}>
                          {passwordCriteria.hasNumber ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span>Angka (0-9)</span>
                        </div>

                        <div className={`text-[11px] flex items-center gap-1.5 font-medium transition ${
                          passwordCriteria.hasSymbol ? "text-emerald-600 font-semibold" : "text-slate-400"
                        }`}>
                          {passwordCriteria.hasSymbol ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                          )}
                          <span>Simbol Karakter (!@#$%^&*)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
                    </label>
                    {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword === passwordForm.confirmPassword && (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                        <Check className="w-3 h-3" /> Kata sandi cocok
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Ulangi kata sandi baru"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className={`w-full text-xs sm:text-sm pl-4 pr-10 py-2.5 rounded-xl border focus:outline-none transition ${
                        passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword
                          ? "border-rose-300 focus:border-rose-500"
                          : passwordForm.confirmPassword.length > 0 && passwordForm.newPassword === passwordForm.confirmPassword
                          ? "border-emerald-300 focus:border-emerald-500"
                          : "border-slate-200 focus:border-[#1683FF]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword && (
                    <span className="text-[11px] text-rose-600 font-medium mt-1 block animate-in fade-in">
                      Konfirmasi kata sandi belum cocok dengan kata sandi baru
                    </span>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Menyimpan Sandi...</span>
                      </>
                    ) : (
                      <span>Perbarui Kata Sandi</span>
                    )}
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
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full my-auto max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Foto e-KTP Asli (Jelas &amp; Tidak Terpotong) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    JPG, PNG, WEBP, PDF (Maks. 10MB)
                  </span>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingKycKtp(true);
                  }}
                  onDragLeave={() => setIsDraggingKycKtp(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingKycKtp(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleKycFile(file, "ktp");
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isDraggingKycKtp
                      ? "border-[#1683FF] bg-blue-50/90 ring-2 ring-[#1683FF]/30"
                      : "border-slate-200 bg-slate-50/60 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={kycForm.ktpUrl}
                      alt="Preview KTP"
                      className="w-16 h-11 object-cover rounded-xl border border-slate-200 bg-white shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {kycForm.ktpFileName || "e-KTP Siap Terlampir"}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isDraggingKycKtp ? "Lepaskan file KTP di sini" : "Tarik & lepas file atau pilih manual"}
                      </span>
                    </div>
                  </div>
                  <label className="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#1683FF] border border-blue-200 font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih KTP</span>
                    <input
                      type="file"
                      accept={getAcceptAttribute("bantuin-kyc")}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleKycFile(file, "ktp");
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Selfie Upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Foto Selfie Wajah Jelas / Pegang KTP <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    JPG, PNG, WEBP (Maks. 10MB)
                  </span>
                </div>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingKycSelfie(true);
                  }}
                  onDragLeave={() => setIsDraggingKycSelfie(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingKycSelfie(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleKycFile(file, "selfie");
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isDraggingKycSelfie
                      ? "border-[#1683FF] bg-blue-50/90 ring-2 ring-[#1683FF]/30"
                      : "border-slate-200 bg-slate-50/60 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={kycForm.selfieUrl}
                      alt="Preview Selfie"
                      className="w-12 h-12 object-cover rounded-full border border-slate-200 bg-white shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block truncate">
                        {kycForm.selfieFileName || "Foto Selfie Terlampir"}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {isDraggingKycSelfie ? "Lepaskan file foto di sini" : "Tarik & lepas file atau pilih manual"}
                      </span>
                    </div>
                  </div>
                  <label className="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#1683FF] border border-blue-200 font-bold text-xs cursor-pointer transition flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Pilih Foto</span>
                    <input
                      type="file"
                      accept={getAcceptAttribute("bantuin-kyc")}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleKycFile(file, "selfie");
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-bold ${
                    kycForm.nik?.length === 16
                      ? "text-emerald-600 font-extrabold"
                      : kycForm.nik?.length > 0
                      ? "text-amber-600 font-semibold"
                      : "text-slate-400"
                  }`}>
                    {kycForm.nik?.length || 0}/16 digit
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  minLength={16}
                  maxLength={16}
                  pattern="[0-9]{16}"
                  title="NIK harus tepat 16 digit angka"
                  placeholder="Masukkan 16 digit NIK KTP Anda"
                  value={kycForm.nik}
                  onChange={(e) => setKycForm({ ...kycForm, nik: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                  className={`w-full text-xs p-2.5 rounded-xl border font-bold focus:outline-none transition ${
                    kycForm.nik?.length > 0 && kycForm.nik?.length < 16
                      ? "border-amber-300 focus:border-amber-500"
                      : kycForm.nik?.length === 16
                      ? "border-emerald-300 focus:border-emerald-500"
                      : "border-slate-200 focus:border-[#1683FF]"
                  }`}
                />
                {kycForm.nik?.length > 0 && kycForm.nik?.length < 16 && (
                  <span className="text-[11px] text-amber-600 font-semibold mt-1 block animate-in fade-in">
                    NIK harus 16 digit angka (kurang {16 - kycForm.nik.length} digit lagi)
                  </span>
                )}
                {kycForm.nik?.length === 16 && (
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block animate-in fade-in">
                    Format NIK 16 digit lengkap
                  </span>
                )}
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
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
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
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full my-auto max-h-[calc(100vh-3rem)] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Tarik Saldo ke Rekening / E-Wallet</h3>
                <p className="text-[11px] text-slate-500">Pencairan dana langsung ke rekening bank atau e-wallet Anda</p>
              </div>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <span className="text-xs text-blue-950 font-medium">Saldo Tersedia:</span>
                <span className="text-sm font-extrabold text-[#1683FF]">{formatIDR(walletData.availableBalance)}</span>
              </div>

              {walletData.availableBalance <= 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">
                    Saldo akun Anda saat ini <strong>{formatIDR(walletData.availableBalance)}</strong>. Anda belum memiliki penghasilan dari tugas atau sewa yang dapat dicairkan.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Penarikan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  disabled={walletData.availableBalance <= 0}
                  placeholder="Masukkan nominal (contoh: 50000)"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value.replace(/\D/g, "") })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#1683FF] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Minimal Rp10.000</span>
                  <button
                    type="button"
                    disabled={walletData.availableBalance <= 0}
                    onClick={() => setWithdrawForm({ ...withdrawForm, amount: walletData.availableBalance.toString() })}
                    className="text-[#1683FF] font-bold hover:underline disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    Tarik Semua ({formatIDR(walletData.availableBalance)})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Bank / E-Wallet <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <select
                    value={withdrawForm.bankName || profileData.bankName || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWithdrawForm({
                        ...withdrawForm,
                        bankName: val,
                        accountNumber: val === profileData.bankName ? (profileData.accountNumber || "") : "",
                        accountHolder: val === profileData.bankName ? (profileData.accountHolder || "") : "",
                      });
                    }}
                    disabled={!profileData.bankName}
                    className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-[#1683FF] ${
                      !profileData.bankName
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-800 border-slate-200"
                    }`}
                  >
                    {profileData.bankName ? (
                      <option value={profileData.bankName}>{profileData.bankName}</option>
                    ) : (
                      <option value="">-- Belum ada rekening tersimpan --</option>
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Nomor Rekening / HP <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    readOnly
                    required
                    placeholder={profileData.bankName ? "Nomor rekening otomatis" : "Atur di tab Rekening Bank"}
                    value={withdrawForm.accountNumber || profileData.accountNumber || ""}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nama Pemilik Rekening <span className="text-red-500">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  readOnly
                  required
                  placeholder={profileData.bankName ? "Nama pemilik rekening otomatis" : "Atur di tab Rekening Bank"}
                  value={withdrawForm.accountHolder || profileData.accountHolder || ""}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold uppercase placeholder:normal-case tracking-wide cursor-not-allowed focus:outline-none"
                />
              </div>

              {!profileData.bankName && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Rekening pencairan belum diatur di akun Anda.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsWithdrawModalOpen(false);
                      handleSelectTab("bank");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition cursor-pointer self-start sm:self-auto"
                  >
                    Atur Rekening Bank
                  </button>
                </div>
              )}

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
                  disabled={isSubmittingWithdraw}
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || walletData.availableBalance <= 0}
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingWithdraw ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengajukan Penarikan...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Pengajuan Penarikan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* AVATAR CROP / ADJUSTMENT MODAL                                */}
      {/* ============================================================ */}
      <AvatarCropModal
        isOpen={cropModal.isOpen}
        imageSrc={cropModal.imageSrc}
        isProcessing={isUploadingAvatar}
        onClose={() => setCropModal({ isOpen: false, imageSrc: null })}
        onApplyCrop={handleApplyAvatarCrop}
      />

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePageContent />
    </Suspense>
  );
}
