"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import { INDONESIA_REGION_DATA, PROVINCE_LIST } from "@/lib/data/indonesiaRegions";
import { detectRealtimeLocation } from "@/lib/services/gpsService";
import CustomSelect from "@/components/ui/CustomSelect";
import GoogleIcon from "@/components/common/GoogleIcon";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";
import { authService, CANONICAL_ROLES } from "@/lib/services/authService";
import { validateFile, getAcceptAttribute } from "@/lib/utils/fileValidation";
import AuthSkeleton from "@/components/skeletons/AuthSkeleton";
import { RENTAL_STORE_CATEGORIES } from "@/lib/categories";
import CategoryIcon from "@/components/common/CategoryIcon";
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Upload,
  CheckCircle2,
  Briefcase,
  Users,
  Check,
  Plus,
  Trash2,
  FileBadge,
  Navigation,
  Loader2,
  AlertCircle,
  CreditCard,
  Building2,
  CheckCircle,
  Info,
  Store,
  HelpCircle,
  Clock
} from "lucide-react";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentUser, setIsAuthenticated, addToast } = useApp();
  const hasNotifiedGoogleRef = useRef(false);

  const [step, setStep] = useState(1);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Progressive KYC Mode for Provider: 'later' (default: Daftar Cepat) or 'now' (Lengkapi Sekarang)
  const [providerKycChoice, setProviderKycChoice] = useState("later");

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Data Akun & Peran (3 Role: user, provider, mitra)
    fullName: "",
    email: "",
    phone: "",
    password: "",
    avatarUrl: null,
    authProvider: "local", // 'local' | 'google'
    accountType: "user", // 'user', 'provider', 'mitra'

    // Khusus Mitra jika dipilih di Step 1
    storeName: "",
    storeCategory: RENTAL_STORE_CATEGORIES[0],
    customStoreCategory: "",
    operatingHours: "08.00 - 21.00 WIB",

    // Step 2: Domisili & Wilayah
    address: "",
    province: "Kalimantan Selatan",
    city: "Kota Banjarmasin",
    district: "Banjarmasin Tengah",

    // Step 3: Keahlian & KYC Bertahap (Progressive KYC)
    idNumber: "",
    idCardFile: null,
    idCardPreview: null,
    idCardFileName: "",
    userWantsOptionalKyc: false,
    selectedSkills: ["Desain Grafis & Logo"],
    customSkill: "",
    showCustomSkillInput: false,
    serviceBio: "",
    bankName: "BCA",
    accountNumber: "",
    accountHolder: "",

    agreeToS: true,
  });

  // Handle auto-fill & notification from Google register or login redirect
  useEffect(() => {
    let emailParam = searchParams.get("email");
    let nameParam = searchParams.get("name");
    let avatarParam = searchParams.get("avatar");
    let noticeParam = searchParams.get("notice");
    let connectedParam = searchParams.get("connected");
    let fromParam = searchParams.get("from");
    let roleParam = searchParams.get("role");

    // Fallback dari storage jika query params hilang
    if (typeof window !== "undefined") {
      try {
        const storedGoogle = JSON.parse(
          sessionStorage.getItem("bantuin_google_profile") || 
          localStorage.getItem("bantuin_google_profile") || 
          "{}"
        );
        if (storedGoogle.email && !emailParam) emailParam = storedGoogle.email;
        if (storedGoogle.fullName && !nameParam) nameParam = storedGoogle.fullName;
        if (storedGoogle.avatarUrl && !avatarParam) avatarParam = storedGoogle.avatarUrl;
        if (storedGoogle.role && !roleParam) roleParam = storedGoogle.role;
        if (storedGoogle.email) connectedParam = "google";
        if (storedGoogle.googleAuthToken || storedGoogle.supabaseToken) {
          setFormData((prev) => ({
            ...prev,
            googleAuthToken: storedGoogle.googleAuthToken || prev.googleAuthToken || null,
            supabaseToken: storedGoogle.supabaseToken || prev.supabaseToken || null,
          }));
        }
      } catch {}
    }

    const isFromGoogle = connectedParam === "google" || fromParam === "google";

    if (emailParam || nameParam || avatarParam || isFromGoogle) {
      setFormData((prev) => ({
        ...prev,
        email: emailParam || prev.email,
        fullName: nameParam || prev.fullName,
        avatarUrl: avatarParam || prev.avatarUrl,
        authProvider: isFromGoogle ? "google" : prev.authProvider,
        accountType: (roleParam && roleParam !== "undefined") ? roleParam : prev.accountType,
      }));
    }

    if ((connectedParam === "google" || fromParam === "google" || noticeParam === "unregistered") && !hasNotifiedGoogleRef.current) {
      hasNotifiedGoogleRef.current = true;
      addToast?.(
        "Akun Google Terhubung",
        "Data profil Google Anda berhasil disinkronkan. Silakan tentukan peran dan lengkapi data Anda.",
        "success"
      );
    }
  }, [searchParams, addToast]);

  const skillOptions = [
    "Desain Grafis & Logo",
    "Fotografi & Liputan",
    "Web & IT Development",
    "Video Editing & Reels",
    "Servis Komputer / Laptop",
    "Penerjemah & Copywriting",
    "Teknisi AC & Tukang Listrik",
    "Admin Data & Excel",
    "Tukang Antar & Errand",
    "Bimbingan Belajar & Les"
  ];

  // Dynamic Cities from selected Province
  const currentProvinceData = INDONESIA_REGION_DATA[formData.province] || INDONESIA_REGION_DATA["Kalimantan Selatan"] || {};
  const cityOptions = Object.keys(currentProvinceData);

  // Dynamic Districts (Kecamatan) from selected City
  const districtOptions = currentProvinceData[formData.city] || currentProvinceData[cityOptions[0]] || [];


  // Handle Realtime GPS Activation with concurrency guard
  const handleActivateGPS = async () => {
    if (isDetectingGps) return;
    setIsDetectingGps(true);
    setGpsSuccessMsg("");
    setGpsErrorMsg("");

    try {
      const loc = await detectRealtimeLocation();
      setFormData((prev) => ({
        ...prev,
        province: loc.province,
        city: loc.city,
        district: loc.district,
      }));
      setGpsSuccessMsg(`GPS Aktif: ${loc.district}, ${loc.city}, ${loc.province}`);
    } catch (err) {
      setGpsErrorMsg(err.message || "Gagal mendeteksi lokasi GPS. Pastikan izin lokasi browser telah diaktifkan.");
    } finally {
      setIsDetectingGps(false);
    }
  };

  const [isDraggingKtp, setIsDraggingKtp] = useState(false);

  // Local File Upload Handler for Foto KTP
  const handleKTPUpload = (file) => {
    if (!file) return;
    const validation = validateFile(file, "bantuin-kyc");
    if (!validation.valid) {
      addToast?.("Format File Ditolak", validation.error, "error");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      idCardFile: file,
      idCardPreview: previewUrl,
      idCardFileName: file.name,
      idCardType: file.type,
    }));
  };

  const handleNext = async (e) => {
    e.preventDefault();

    // Validasi Step 2: Data Akun & Kontak
    if (step === 2) {
      if (!formData.fullName.trim()) {
        addToast?.("Nama Lengkap Wajib Diisi", "Harap masukkan nama lengkap Anda.", "error");
        return;
      }
      if (!formData.email.trim() || !formData.email.includes("@")) {
        addToast?.("Email Belum Valid", "Harap masukkan alamat email aktif yang benar.", "error");
        return;
      }
      if (!formData.phone.trim()) {
        addToast?.("Nomor WhatsApp Wajib Diisi", "Harap masukkan nomor WhatsApp aktif Anda.", "error");
        return;
      }
      // Validasi password hanya jika metode pendaftaran biasa (bukan Google)
      if (formData.authProvider !== "google") {
        if (!formData.password || formData.password.length < 8) {
          addToast?.("Kata Sandi Kurang", "Kata sandi minimal 8 karakter.", "error");
          return;
        }
      }
      if (formData.accountType === "mitra" && !formData.storeName.trim()) {
        addToast?.("Nama Toko Wajib Diisi", "Harap masukkan nama usaha/outlet rental Anda.", "error");
        return;
      }
    }

    // Validasi Step 3 untuk Provider HANYA JIKA memilih opsi 'now' (Lengkapi Sekarang)
    if (step === 3 && formData.accountType === "provider" && providerKycChoice === "now") {
      if (!formData.idNumber || formData.idNumber.length !== 16) {
        addToast?.("NIK Belum Valid", "Nomor Induk Kependudukan (NIK) wajib tepat 16 digit angka sesuai KTP.", "error");
        return;
      }
      if (!formData.idCardPreview) {
        addToast?.("Dokumen Belum Diunggah", "Harap unggah foto KTP resmi Anda.", "error");
        return;
      }
      if (!formData.accountNumber || !formData.accountHolder) {
        addToast?.("Rekening Belum Lengkap", "Harap isi nomor rekening dan nama pemilik untuk pencairan dana.", "error");
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      if (!formData.agreeToS) {
        addToast?.("Persetujuan Diperlukan", "Harap centang persetujuan Dokumen Syarat & Ketentuan.", "error");
        return;
      }

      const allSkills = [...formData.selectedSkills];
      if (formData.customSkill.trim()) {
        allSkills.push(formData.customSkill.trim());
      }

      const isProvider = formData.accountType === "provider";
      const isMitra = formData.accountType === "mitra";
      const hasKtpToUpload = formData.idCardFile && (isProvider ? providerKycChoice === "now" : formData.userWantsOptionalKyc);

      setIsSubmitting(true);
      try {
        const selectedStoreCategory = formData.storeCategory?.startsWith("Lainnya")
          ? (formData.customStoreCategory?.trim() || "Rental Umum")
          : formData.storeCategory;

        const authResult = await authService.register({
          fullName: formData.fullName || (isProvider ? "Penyedia Jasa Baru" : isMitra ? "Mitra Toko Sewa" : "Pengguna Baru"),
          email: formData.email,
          phone: formData.phone,
          role: formData.accountType,
          password: formData.password || undefined,
          authProvider: formData.authProvider || "local",
          googleAuthToken: formData.googleAuthToken || undefined,
          supabaseToken: formData.supabaseToken || undefined,
          avatarUrl: formData.avatarUrl || null,
          address: formData.address,
          province: formData.province,
          city: formData.city,
          district: formData.district,
          storeName: formData.storeName,
          storeCategory: selectedStoreCategory,
          operatingHours: formData.operatingHours || "08.00 - 21.00 WIB",
          skills: allSkills,
          idNumber: formData.idNumber || "",
          bankInfo: {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            accountHolder: formData.accountHolder || formData.fullName,
          },
          verificationStatus: "unverified",
        });

        let uploadedIdCardUrl = "";
        if (hasKtpToUpload && authResult?.accessToken) {
          addToast?.("Mengunggah Dokumen", "Mengenkripsi dan mengunggah foto KTP ke brankas KYC aman...", "info");
          const uploadBody = new FormData();
          uploadBody.append("file", formData.idCardFile);
          uploadBody.append("bucket", "bantuin-kyc");

          const upRes = await fetch("/api/upload", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authResult.accessToken}`,
            },
            body: uploadBody,
          });
          const upJson = await upRes.json();
          if (!upRes.ok || !upJson.success) {
            throw new Error(upJson.error || "Gagal mengunggah foto KTP ke server.");
          }
          uploadedIdCardUrl = upJson.storageRef || upJson.url || upJson.data?.storageRef || upJson.data?.url || "";
          if (uploadedIdCardUrl) {
            await fetch("/api/profile/kyc", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authResult.accessToken}`,
              },
              body: JSON.stringify({
                idNumber: formData.idNumber || "",
                idCardUrl: uploadedIdCardUrl,
                skills: allSkills,
                payoutBank: formData.bankName,
                payoutAccountNumber: formData.accountNumber,
                payoutAccountHolder: formData.accountHolder || formData.fullName,
              }),
            });
          }
        }

        const registeredUser = authResult?.user;
        if (registeredUser) {
          setCurrentUser(registeredUser);
        }
        setIsAuthenticated?.(true);

        try {
          sessionStorage.removeItem("bantuin_google_profile");
          localStorage.removeItem("bantuin_google_profile");
          sessionStorage.removeItem("bantuin_oauth_role");
          localStorage.removeItem("bantuin_oauth_role");
          sessionStorage.removeItem("bantuin_oauth_mode");
          localStorage.removeItem("bantuin_oauth_mode");
        } catch {}

        if (isProvider) {
          addToast?.(
            "Pendaftaran Berhasil",
            uploadedIdCardUrl
              ? "Profil jasa aktif. Dokumen KTP Anda sedang diproses verifikasi prioritas oleh Admin."
              : "Profil jasa aktif! Anda dapat mulai menawarkan keahlian dan melengkapi KTP saat penarikan saldo."
          );
          setSubmitSuccess(true);
          window.location.href = "/jasa/dashboard";
        } else if (isMitra) {
          addToast?.(
            "Selamat Datang Mitra Toko",
            uploadedIdCardUrl
              ? "Outlet sewa berhasil didaftarkan. Dokumen identitas sedang ditinjau admin."
              : "Outlet sewa Anda berhasil didaftarkan. Anda dapat mulai menambahkan unit rental."
          );
          setSubmitSuccess(true);
          window.location.href = "/mitra/dashboard";
        } else {
          addToast?.(
            "Selamat Datang di Bantuin",
            uploadedIdCardUrl
              ? "Pendaftaran berhasil. Dokumen identitas Anda sedang diverifikasi admin."
              : "Akun aktif tanpa KTP. Anda langsung dapat mencari bantuan dan memesan jasa."
          );
          setSubmitSuccess(true);
          window.location.href = "/";
        }
      } catch (err) {
        setIsSubmitting(false);
        addToast?.("Pendaftaran Gagal", err.message || "Terjadi kesalahan saat mendaftarkan akun.", "error");
      }
    }
  };

  const toggleSkill = (skill) => {
    if (formData.selectedSkills.includes(skill)) {
      setFormData({
        ...formData,
        selectedSkills: formData.selectedSkills.filter((s) => s !== skill),
      });
    } else {
      setFormData({
        ...formData,
        selectedSkills: [...formData.selectedSkills, skill],
      });
    }
  };

  return (
    <div className="min-h-[100dvh] relative flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 lg:p-8 pb-10 sm:pb-8 overflow-x-hidden font-sans bg-gradient-to-br from-[#EBF3FE] via-[#F0F6FF] to-[#DEEEFC]">
      {/* 1. Subtle Dot Grid Matrix Motif Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(#1683FF 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 2. Ambient Soft Glow Orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-300/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Logo Centered */}
      <div className="w-full max-w-2xl mx-auto pt-2 pb-2 flex justify-center">
        <Link href="/" className="inline-block">
          <Image
            src={logoImg}
            alt="BantuinAja.id"
            height={44}
            className="h-8 sm:h-11 w-auto object-contain mix-blend-multiply"
          />
        </Link>
      </div>

      {/* Centered Main Card */}
      <div className="w-full max-w-2xl mx-auto my-auto py-1 sm:py-3">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/80 p-4 sm:p-8 shadow-[0_20px_50px_rgba(16,42,67,0.12)]">

          {/* Top Segmented Tab Switcher: Masuk vs Daftar */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl sm:rounded-2xl mb-4 sm:mb-5 border border-slate-200/60 shadow-2xs">
            <Link
              href="/auth/login"
              className="flex-1 py-2 sm:py-2.5 text-center rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Masuk
            </Link>
            <Link
              href="/auth/register"
              className="flex-1 py-2 sm:py-2.5 text-center rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold bg-white text-[#1683FF] shadow-xs border border-slate-200/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Daftar
            </Link>
          </div>

          {/* Header: Step Indicator & Login Link Inside Card */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="min-w-0 flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#1683FF]/10 text-[#1683FF] text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider shrink-0">
                Langkah {step} dari 4
              </span>
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                • {
                  step === 1 ? "Pilih Peran Akun" :
                    step === 2 ? "Informasi Akun & Kontak" :
                      step === 3 ? (
                        formData.accountType === "provider"
                          ? "Domisili & Keahlian Jasa"
                          : formData.accountType === "mitra"
                            ? "Domisili & Lokasi Outlet"
                            : "Domisili & Wilayah"
                      ) :
                        "Konfirmasi & Ketentuan"
                }
              </span>
            </div>
            <Link
              href="/auth/login"
              className="shrink-0 text-[11px] sm:text-xs font-semibold text-slate-600 hover:text-[#1683FF] transition text-right"
            >
              <span className="hidden sm:inline">Sudah punya akun? </span>
              <span className="text-[#1683FF] font-extrabold underline">Masuk</span>
            </Link>
          </div>

          {/* Slim, Integrated Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3 mb-5 sm:mb-6">
            <div
              className="h-full bg-[#1683FF] transition-all duration-300 rounded-full"
              style={{ width: `${step * 25}%` }}
            />
          </div>

          <form onSubmit={handleNext} className="space-y-4 sm:space-y-5">

            {/* ============================================================ */}
            {/* STEP 1: LANGSUNG 3 CARD PILIHAN PERAN (BERSIH & KONSISTEN)    */}
            {/* ============================================================ */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Pilih Peran Akun Anda
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tentukan bagaimana Anda ingin berpartisipasi di ekosistem BantuinAja.id
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">

                  {/* ROLE 1: USER / PENGGUNA UMUM */}
                  <div
                    onClick={() => setFormData({ ...formData, accountType: "user" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${formData.accountType === "user"
                        ? "border-[#1683FF] bg-blue-50/50 shadow-2xs ring-2 ring-[#1683FF]/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      {formData.accountType === "user" ? (
                        <CheckCircle2 className="w-5 h-5 text-[#1683FF]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Pengguna Umum</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">
                        Cari bantuan tugas, titip errand, order jasa keahlian, &amp; sewa perlengkapan.
                      </p>
                      <span className="inline-block mt-3 text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        Bebas KTP di Awal
                      </span>
                    </div>
                  </div>

                  {/* ROLE 2: PENYEDIA JASA (TANPA PRO) */}
                  <div
                    onClick={() => setFormData({ ...formData, accountType: "provider" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${formData.accountType === "provider"
                        ? "border-[#1683FF] bg-blue-50/50 shadow-2xs ring-2 ring-[#1683FF]/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      {formData.accountType === "provider" ? (
                        <CheckCircle2 className="w-5 h-5 text-[#1683FF]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Penyedia Jasa</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">
                        Tawarkan keahlian mandiri (desain, web, foto, servis) &amp; terima pembayaran resmi terverifikasi.
                      </p>
                      <span className="inline-block mt-3 text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        Peluang Mandiri
                      </span>
                    </div>
                  </div>

                  {/* ROLE 3: MITRA TOKO SEWA */}
                  <div
                    onClick={() => setFormData({ ...formData, accountType: "mitra" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${formData.accountType === "mitra"
                        ? "border-[#1683FF] bg-blue-50/50 shadow-2xs ring-2 ring-[#1683FF]/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                        <Store className="w-5 h-5" />
                      </div>
                      {formData.accountType === "mitra" ? (
                        <CheckCircle2 className="w-5 h-5 text-[#1683FF]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Mitra Toko Sewa</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-snug">
                        Daftarkan outlet rental &amp; sewakan kamera, multimedia, atau alat fisik.
                      </p>
                      <span className="inline-block mt-3 text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        Khusus Toko Rental
                      </span>
                    </div>
                  </div>

                </div>

                {/* Status Terhubung Google vs Tombol Google Register */}
                {formData.authProvider === "google" && formData.email ? (
                  <div className="mt-3 p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3 min-w-0">
                      {formData.avatarUrl ? (
                        <img
                          src={formData.avatarUrl}
                          alt={formData.fullName || "Akun Google"}
                          className="w-10 h-10 rounded-full object-cover border border-emerald-300 shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-xs shrink-0">
                          <GoogleIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>Akun Google Terhubung</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                        <div className="text-[11px] text-emerald-800 font-medium truncate">
                          {formData.fullName} ({formData.email})
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          authProvider: "local",
                          email: "",
                          fullName: "",
                          avatarUrl: null,
                        }));
                        try {
                          sessionStorage.removeItem("bantuin_google_profile");
                          localStorage.removeItem("bantuin_google_profile");
                        } catch {}
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline shrink-0 px-2 py-1"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative my-2 pt-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-slate-500 font-medium">atau daftar dengan</span>
                      </div>
                    </div>

                    <GoogleSignInButton
                      role={formData.accountType || formData.role || "user"}
                      mode="register"
                      label="Daftar dengan Google"
                      className="rounded-2xl py-3"
                      onSuccess={(result) => {
                        setFormData((prev) => ({
                          ...prev,
                          authProvider: "google",
                          email: result.email,
                          fullName: result.fullName,
                          avatarUrl: result.avatarUrl,
                        }));
                        addToast?.(
                          "Akun Google Terhubung",
                          `Halo ${result.fullName}! Data akun Anda berhasil dimuat. Silakan lanjutkan pendaftaran.`,
                          "success"
                        );
                      }}
                    />
                  </>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 2: INFORMASI AKUN & KONTAK                             */}
            {/* ============================================================ */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Informasi Akun &amp; Kontak
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Lengkapi identitas dasar untuk mengakses platform
                  </p>
                </div>

                {/* Form Input Dasar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Nama Lengkap Anda <span className="text-rose-500 font-bold">*</span>
                    </label>
                    {formData.authProvider === "google" && (
                      <span className="text-[10px] font-bold text-slate-500">
                        Dari Google (Bisa disesuaikan)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rian Prasetya"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Alamat Email Aktif <span className="text-rose-500 font-bold">*</span>
                      </label>
                      {formData.authProvider === "google" && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Google Terhubung
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={formData.email}
                        readOnly={formData.authProvider === "google"}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl border ${
                          formData.authProvider === "google"
                            ? "bg-slate-50/80 border-slate-200 text-slate-700 cursor-not-allowed"
                            : "border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor WhatsApp / HP Aktif <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        placeholder="Misal: 081234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                        className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                      />
                    </div>
                  </div>
                </div>

                {formData.authProvider === "google" ? (
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0">
                        <GoogleIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <span>Otentikasi Akun Google Aktif</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          Masuk instan tanpa perlu membuat kata sandi manual Bantuin.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, authProvider: "local" }))}
                      className="text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline shrink-0"
                    >
                      Ganti ke Sandi
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Kata Sandi Akun <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          placeholder="Minimal 8 karakter"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                        />
                      </div>
                    </div>

                    <div className="relative my-2 pt-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-slate-500 font-medium">atau daftar dengan</span>
                      </div>
                    </div>

                    <GoogleSignInButton
                      role={formData.accountType || formData.role || "user"}
                      mode="register"
                      label="Daftar dengan Google"
                      className="rounded-2xl py-2.5"
                    />
                  </>
                )}

                {/* Khusus jika Mitra Toko Sewa dipilih */}
                {formData.accountType === "mitra" && (
                  <div className="pt-3 border-t border-slate-100 space-y-3.5 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Toko / Usaha Rental Anda <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Sentra Sewa Kamera & Multimedia"
                        value={formData.storeName}
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Kategori Utama Barang Rental <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <select
                        value={formData.storeCategory}
                        onChange={(e) => setFormData({ ...formData, storeCategory: e.target.value })}
                        className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                      >
                        {RENTAL_STORE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.storeCategory?.startsWith("Lainnya") && (
                      <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 animate-in fade-in space-y-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tuliskan Kategori Usaha Anda: <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Rental Jas & Kostum, Rental Sepeda Listrik, dll."
                          value={formData.customStoreCategory}
                          onChange={(e) => setFormData({ ...formData, customStoreCategory: e.target.value })}
                          className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                        />
                        {formData.customStoreCategory?.trim() && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl text-xs font-semibold text-[#1683FF] border border-blue-100 shadow-2xs">
                            <CategoryIcon category={formData.customStoreCategory} className="w-4 h-4 text-[#1683FF] shrink-0" />
                            <span>Icon otomatis: {formData.customStoreCategory}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Jam Operasional Toko
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="08.00 - 21.00 WIB"
                          value={formData.operatingHours}
                          onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                          className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 3: DOMISILI LOKASI & DETAIL KREDENSIAL PERAN            */}
            {/* ============================================================ */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-[#1683FF]" />
                    <span>Domisili &amp; Wilayah Operasional</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tentukan wilayah aktivitas Anda agar kami dapat menampilkan bantuan, rental, dan jasa terdekat.
                  </p>
                </div>

                {/* GPS Realtime Detector Banner */}
                <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1683FF] text-white flex items-center justify-center shrink-0 shadow-sm relative">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Deteksi Lokasi Otomatis (GPS)</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Otomatis mengisi Provinsi, Kabupaten/Kota, dan Kecamatan Anda saat ini.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleActivateGPS}
                    disabled={isDetectingGps}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-[#1683FF] font-bold text-xs shadow-2xs transition flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isDetectingGps ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mendeteksi Lokasi...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Gunakan Lokasi GPS Saya</span>
                      </>
                    )}
                  </button>
                </div>

                {gpsSuccessMsg && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                    <span>{gpsSuccessMsg}</span>
                  </div>
                )}

                {gpsErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-semibold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{gpsErrorMsg}</span>
                  </div>
                )}

                {/* Dropdowns Wilayah */}
                <div>
                  <CustomSelect
                    label="Provinsi Domisili (38 Provinsi Indonesia)"
                    icon={MapPin}
                    required={true}
                    value={formData.province}
                    options={PROVINCE_LIST}
                    placeholder="Pilih Provinsi..."
                    onChange={(selectedProv) => {
                      const newProvData = INDONESIA_REGION_DATA[selectedProv] || {};
                      const newCities = Object.keys(newProvData);
                      const defaultCity = newCities[0] || "";
                      const defaultDistricts = newProvData[defaultCity] || [];
                      setFormData({
                        ...formData,
                        province: selectedProv,
                        city: defaultCity,
                        district: defaultDistricts[0] || "",
                      });
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomSelect
                    label="Kabupaten / Kota"
                    required={true}
                    value={formData.city}
                    options={cityOptions}
                    placeholder="Pilih Kabupaten/Kota..."
                    onChange={(selectedCity) => {
                      const newDistricts = currentProvinceData[selectedCity] || [];
                      setFormData({
                        ...formData,
                        city: selectedCity,
                        district: newDistricts[0] || "",
                      });
                    }}
                  />

                  <CustomSelect
                    label="Kecamatan"
                    required={true}
                    value={formData.district}
                    options={districtOptions}
                    placeholder="Pilih Kecamatan..."
                    onChange={(selectedDistrict) => {
                      setFormData({
                        ...formData,
                        district: selectedDistrict,
                      });
                    }}
                  />
                </div>

                {/* DETAIL KHUSUS PENYEDIA JASA */}
                {formData.accountType === "provider" && (
                  <div className="pt-3 border-t border-slate-100 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Pilih Keahlian Jasa yang Anda Kuasai:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {skillOptions.map((skill) => {
                          const isSelected = formData.selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className={`text-xs px-3.5 py-2 rounded-full border transition font-medium flex items-center gap-1.5 cursor-pointer ${isSelected
                                  ? "bg-[#1683FF] text-white border-[#1683FF] shadow-2xs"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                              <span>{skill}</span>
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, showCustomSkillInput: !formData.showCustomSkillInput })}
                          className={`text-xs px-3.5 py-2 rounded-full border transition font-bold flex items-center gap-1.5 cursor-pointer ${formData.showCustomSkillInput || formData.customSkill
                              ? "bg-blue-50 text-[#1683FF] border-blue-300"
                              : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                            }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Keahlian Lainnya...</span>
                        </button>
                      </div>

                      {formData.showCustomSkillInput && (
                        <div className="mt-2.5 p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                          <input
                            type="text"
                            placeholder="Contoh: Barista Event, Guru Les Privat, Servis AC..."
                            value={formData.customSkill}
                            onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                            className="w-full text-xs px-3.5 py-2 rounded-lg border border-blue-200 bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Opsi Verifikasi Identitas (KYC) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        Pilihan Verifikasi Identitas:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setProviderKycChoice("later")}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${providerKycChoice === "later"
                              ? "border-[#1683FF] bg-blue-50/50 shadow-2xs ring-1 ring-[#1683FF]/30"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1683FF] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#1683FF]" />
                              Rekomendasi Cepat
                            </span>
                            {providerKycChoice === "later" && <CheckCircle2 className="w-4 h-4 text-[#1683FF]" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">Verifikasi Nanti Saat Tarik Saldo</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                              Langsung tawarkan jasa hari ini. KTP baru diperlukan saat pencairan saldo.
                            </p>
                          </div>
                        </div>

                        <div
                          onClick={() => setProviderKycChoice("now")}
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${providerKycChoice === "now"
                              ? "border-[#1683FF] bg-blue-50/50 shadow-2xs ring-1 ring-[#1683FF]/30"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1683FF] flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-[#1683FF]" />
                              Centang Biru
                            </span>
                            {providerKycChoice === "now" && <CheckCircle2 className="w-4 h-4 text-[#1683FF]" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">Unggah KTP &amp; Rekening Sekarang</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                              Langsung dapatkan badge verified helper terpercaya di profil Anda.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form KTP jika memilih 'now' */}
                    {providerKycChoice === "now" && (
                      <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3 animate-in fade-in">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700">
                              Nomor Induk Kependudukan (NIK 16 Digit) <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <span className={`text-[11px] font-bold ${
                              formData.idNumber?.length === 16
                                ? "text-emerald-600 font-extrabold"
                                : formData.idNumber?.length > 0
                                ? "text-amber-600 font-semibold"
                                : "text-slate-400"
                            }`}>
                              {formData.idNumber?.length || 0}/16 digit
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
                            placeholder="Contoh: 3201234567890001"
                            value={formData.idNumber}
                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-white focus:outline-none transition ${
                              formData.idNumber?.length > 0 && formData.idNumber?.length < 16
                                ? "border-amber-300 focus:border-amber-500"
                                : formData.idNumber?.length === 16
                                ? "border-emerald-300 focus:border-emerald-500"
                                : "border-slate-200 focus:border-[#1683FF]"
                            }`}
                          />
                          {formData.idNumber?.length > 0 && formData.idNumber?.length < 16 && (
                            <span className="text-[11px] text-amber-600 font-semibold mt-1 block animate-in fade-in">
                              NIK harus 16 digit angka (kurang {16 - formData.idNumber.length} digit lagi)
                            </span>
                          )}
                          {formData.idNumber?.length === 16 && (
                            <span className="text-[11px] text-emerald-600 font-semibold mt-1 block animate-in fade-in">
                              Format NIK 16 digit lengkap
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700">
                              Foto KTP Asli <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              JPG, PNG, WEBP, PDF (Maks. 10MB)
                            </span>
                          </div>
                          {formData.idCardPreview ? (
                            <div className="flex items-center justify-between p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 animate-in fade-in">
                              <div className="flex items-center gap-3 min-w-0">
                                {formData.idCardType?.includes("pdf") || formData.idCardFileName?.toLowerCase().endsWith(".pdf") ? (
                                  <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-xs shrink-0 border border-red-200">
                                    PDF
                                  </div>
                                ) : (
                                  <img
                                    src={formData.idCardPreview}
                                    alt="KTP Preview"
                                    className="w-12 h-12 object-cover rounded-xl border border-blue-200 bg-white shrink-0 shadow-2xs"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                    <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                                    <span className="truncate">{formData.idCardFileName || "ktp_provider.jpg"}</span>
                                  </div>
                                  <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                                    ✓ KTP tervalidasi &amp; siap diverifikasi
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, idCardPreview: null, idCardFileName: "", idCardType: null })}
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
                                if (file) handleKTPUpload(file);
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
                                  {isDraggingKtp ? "Lepaskan file KTP Anda di sini" : "Tarik & Lepas Foto KTP atau Klik untuk Memilih"}
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
                                  if (file) handleKTPUpload(file);
                                }}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Bank Payout <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <select
                              value={formData.bankName}
                              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                            >
                              <option value="BCA">BCA</option>
                              <option value="Mandiri">Mandiri</option>
                              <option value="BRI">BRI</option>
                              <option value="BNI">BNI</option>
                              <option value="DANA">DANA</option>
                              <option value="GoPay">GoPay</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              No. Rekening / E-Wallet <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Nomor rekening"
                              value={formData.accountNumber}
                              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 4: KONFIRMASI DATA & KOTAK DOKUMEN ATURAN SK (SCROLLABLE) */}
            {/* ============================================================ */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Konfirmasi &amp; Persetujuan Ketentuan
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tinjau data Anda dan setujui aturan transaksi terlindungi Bantuin
                  </p>
                </div>

                {/* Ringkasan Data Akun Terpilih - Responsive Mobile-First Card */}
                <div className="bg-gradient-to-br from-blue-50/70 via-slate-50/60 to-blue-50/40 p-3.5 sm:p-5 rounded-2xl border border-blue-100/90 shadow-2xs space-y-3">
                  {/* Header Ringkasan: Badge Peran & Status */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#1683FF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        {formData.accountType === "provider" ? (
                          <Briefcase className="w-4 h-4" />
                        ) : formData.accountType === "mitra" ? (
                          <Store className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Peran Terpilih
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-[#1683FF] truncate block">
                          {formData.accountType === "provider"
                            ? "Penyedia Jasa Keahlian"
                            : formData.accountType === "mitra"
                              ? `Mitra Toko Sewa (${formData.storeName || "Toko Rental"})`
                              : "Pengguna Umum"}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold shrink-0">
                      Siap Didaftarkan
                    </span>
                  </div>

                  {/* Data Rows: Grid responsif, rapi di HP sempit tanpa text tabrakan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {/* Nama Akun */}
                    <div className="bg-white/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/70">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Nama Lengkap
                      </div>
                      <div className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                        {formData.fullName || "Pengguna Baru"}
                      </div>
                    </div>

                    {/* Kontak (Email & WhatsApp) */}
                    <div className="bg-white/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/70">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        Email &amp; WhatsApp
                      </div>
                      <div className="font-bold text-slate-900 break-all text-[11px] sm:text-xs leading-snug">
                        <span>{formData.email}</span>
                        <span className="text-slate-400 mx-1.5">&bull;</span>
                        <span className="text-slate-700 font-semibold">{formData.phone}</span>
                      </div>
                    </div>

                    {/* Domisili (Full Width) */}
                    <div className="sm:col-span-2 bg-white/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                          Domisili Operasional
                        </div>
                        <div className="font-semibold text-slate-800 text-[11px] sm:text-xs leading-relaxed">
                          {formData.district}, {formData.city}, {formData.province}
                        </div>
                      </div>
                    </div>

                    {/* Khusus Provider dengan KTP */}
                    {formData.accountType === "provider" && providerKycChoice === "now" && (
                      <div className="sm:col-span-2 bg-white/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 truncate">
                            KTP Dilampirkan ({formData.bankName} - {formData.accountNumber})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          KTP Siap
                        </span>
                      </div>
                    )}

                    {/* Khusus Mitra Toko Sewa */}
                    {formData.accountType === "mitra" && (
                      <div className="sm:col-span-2 bg-white/90 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Store className="w-4 h-4 text-[#1683FF] shrink-0" />
                          <span className="text-[11px] sm:text-xs font-semibold text-slate-700 truncate">
                            Kategori: {formData.storeCategory}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* KOTAK DOKUMEN ATURAN SK (SCROLLABLE DOCUMENT BOX DENGAN CUE VISUAL) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 leading-snug">
                      <FileBadge className="w-4 h-4 text-[#1683FF] shrink-0" />
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                        Tata Tertib Transaksi
                      </span>
                    </span>
                    <span className="text-[10px] text-[#1683FF] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-semibold shrink-0">
                      Gulir ke bawah &darr;
                    </span>
                  </div>

                  <div className="max-h-36 sm:max-h-48 overflow-y-auto rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4 text-xs text-slate-600 leading-relaxed space-y-3 shadow-inner font-sans">
                    <div className="text-center pb-2 border-b border-slate-200">
                      <div className="font-extrabold text-slate-900 text-[11px] sm:text-xs uppercase tracking-wide">
                        SURAT KESEPAKATAN &amp; ATURAN TRANSAKSI TERLINDUNGI
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Platform BantuinAja.id &middot; Tata Tertib Transaksi Aman &amp; Terlindungi
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-black uppercase">Pasal 1</span>
                        <span>Ketentuan Umum &amp; Kategori Peran</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-1 leading-relaxed">
                        1.1. Pengguna Umum adalah pihak pencari jasa, peminta bantuan, atau penyewa alat yang berhak mendapatkan jaminan pengerjaan sesuai deskripsi.<br />
                        1.2. Penyedia Jasa adalah pengguna mandiri yang bersedia menyelesaikan tugas bantuan atau proyek keahlian secara bertanggung jawab.<br />
                        1.3. Mitra Toko Sewa adalah pemilik outlet rental terdaftar yang menyediakan unit alat fisik berkualitas.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-black uppercase">Pasal 2</span>
                        <span>Sistem Pembayaran Terverifikasi &amp; Penahanan Sementara</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-1 leading-relaxed">
                        2.1. Seluruh dana pembayaran pemesanan jasa, imbalan tugas, dan deposit sewa wajib disetorkan melalui gateway pembayaran resmi Bantuin.<br />
                        2.2. Dana dijamin 100% aman dan baru diteruskan kepada penyedia jasa atau mitra rental setelah pemohon/penyewa mengonfirmasi penyelesaian tugas atau pengembalian unit.<br />
                        2.3. Deposit jaminan rental otomatis dikembalikan seketika setelah unit diverifikasi utuh oleh pihak mitra.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-black uppercase">Pasal 3</span>
                        <span>Larangan Transaksi di Luar Platform (Bypass)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-1 leading-relaxed">
                        3.1. Pengguna dilarang keras melakukan pembayaran tunai langsung atau transfer pribadi di luar platform demi menghindari risiko penipuan dan wanprestasi.<br />
                        3.2. Kerugian transaksi yang terjadi di luar sistem pembayaran resmi platform berada di luar cakupan garansi BantuinAja.id.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-black uppercase">Pasal 4</span>
                        <span>Standar Privasi &amp; Perlindungan Data (UU PDP)</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-1 leading-relaxed">
                        4.1. Dokumen identitas (KTP) dan data kontak disimpan dengan standar enkripsi tinggi dan hanya digunakan untuk validasi kepatuhan hukum transaksi.<br />
                        4.2. Bantuin berkomitmen menjaga kerahasiaan data pribadi pengguna tanpa diperjualbelikan kepada pihak ketiga.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-black uppercase">Pasal 5</span>
                        <span>Resolusi Sengketa &amp; Refund</span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-1 leading-relaxed">
                        5.1. Apabila tugas tidak diselesaikan sesuai kesepakatan, kedua pihak berhak mengajukan eskalasi arbitrase kepada tim penengah Bantuin.<br />
                        5.2. Keputusan tim penengah bersifat final berdasarkan riwayat kesepakatan chat dan bukti serah terima digital di platform.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checkbox Persetujuan Dokumen - Touch-Friendly Card */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl bg-blue-50/70 hover:bg-blue-50/90 border border-blue-200/80 p-3 sm:p-3.5 text-xs text-slate-700 cursor-pointer leading-snug sm:leading-relaxed transition active:scale-[0.99]">
                    <input
                      type="checkbox"
                      checked={formData.agreeToS}
                      onChange={(e) => setFormData({ ...formData, agreeToS: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF] shrink-0 cursor-pointer"
                      required
                    />
                    <span className="text-[11px] sm:text-xs">
                      Saya telah membaca, memahami, dan menyetujui seluruh <strong className="text-slate-900">Dokumen Kesepakatan &amp; Tata Tertib Transaksi BantuinAja.id</strong> di atas.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons - Mobile-Optimized Layout */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-3">
              {step > 1 && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setStep(step - 1)}
                  className="w-full sm:w-auto justify-center px-5 py-3 rounded-xl sm:rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 sm:px-8 py-3.5 rounded-xl sm:rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/15 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                  step === 1 ? "w-full justify-center" : "w-full sm:w-auto sm:ml-auto justify-center"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Mendaftarkan Akun ke Database...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {step === 4
                        ? (formData.accountType === "provider"
                          ? "Selesaikan & Buka Dashboard Jasa"
                          : formData.accountType === "mitra"
                            ? "Selesaikan & Buka Dashboard Mitra"
                            : "Selesaikan & Mulai Jelajah")
                        : "Lanjutkan"}
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Immersive Brand Loading Screen saat Pendaftaran Akun */}
      {isSubmitting && (
        <AuthLoadingScreen
          status={submitSuccess ? "success" : "loading"}
          title={
            submitSuccess
              ? "Pendaftaran Berhasil!"
              : "Mendaftarkan Akun Anda..."
          }
          subtitle={
            submitSuccess
              ? "Menyiapkan akun Anda dan mengarahkan ke beranda..."
              : "Sedang memproses verifikasi dan menyimpan data profil Anda..."
          }
        />
      )}

      {/* Subtle Bottom Footer */}
      <div className="w-full max-w-2xl mx-auto text-center text-[11px] text-slate-600 font-medium py-3 drop-shadow-2xs">
        &copy; {new Date().getFullYear()} BantuinAja.id &middot; Platform Bantuan, Jasa &amp; Sewa Komunitas
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <RegisterPageContent />
    </Suspense>
  );
}
