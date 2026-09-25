"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoImg from "@/components/image/logo.png";
import bgLoginImg from "@/components/image/bgroundlogin.png";
import { useApp } from "@/lib/context/AppContext";
import { INDONESIA_REGION_DATA, PROVINCE_LIST } from "@/lib/data/indonesiaRegions";
import { detectRealtimeLocation } from "@/lib/services/gpsService";
import CustomSelect from "@/components/ui/CustomSelect";
import GoogleIcon from "@/components/common/GoogleIcon";
import { authService, CANONICAL_ROLES } from "@/lib/services/authService";
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

export default function RegisterPage() {
  const router = useRouter();
  const { setCurrentUser, addToast } = useApp();

  const [step, setStep] = useState(1);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isGoogleRegistering, setIsGoogleRegistering] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");

  // Progressive KYC Mode for Provider: 'later' (default: Daftar Cepat) or 'now' (Lengkapi Sekarang)
  const [providerKycChoice, setProviderKycChoice] = useState("later");

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Data Akun & Peran (3 Role: user, provider, mitra)
    fullName: "",
    email: "",
    phone: "",
    password: "",
    authProvider: "local", // 'local' | 'google'
    accountType: "user", // 'user', 'provider', 'mitra'
    
    // Khusus Mitra jika dipilih di Step 1
    storeName: "",
    storeCategory: "Rental Kamera & Multimedia",

    // Step 2: Domisili & Wilayah
    address: "",
    province: "Kalimantan Selatan",
    city: "Kota Banjarmasin",
    district: "Banjarmasin Tengah",

    // Step 3: Keahlian & KYC Bertahap (Progressive KYC)
    idNumber: "",
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

  // Google Register Flow
  const handleGoogleRegister = async () => {
    if (isGoogleRegistering) return;
    setIsGoogleRegistering(true);

    try {
      const { user } = await authService.loginWithGoogle();
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName || "Pengguna Google",
        email: user.email || prev.email || "user.google@gmail.com",
        authProvider: "google",
        password: "",
      }));

      addToast?.(
        "Google Terhubung",
        "Akun Google berhasil diverifikasi. Lanjutkan melengkapi kontak, domisili, dan data akun Anda."
      );

      // Otomatis maju ke step berikutnya jika masih di step 1
      if (step === 1) {
        setStep(2);
      }
    } catch (err) {
      addToast?.("Google Register Gagal", err.message || "Gagal menghubungkan Google.", "error");
    } finally {
      setIsGoogleRegistering(false);
    }
  };

  // Handle Realtime GPS Activation
  const handleActivateGPS = async () => {
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

  // Local File Upload Handler for Foto KTP
  const handleKTPUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({ 
        ...formData, 
        idCardPreview: previewUrl,
        idCardFileName: file.name
      });
    }
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
      if (!formData.idNumber || formData.idNumber.length < 16) {
        addToast?.("NIK Belum Valid", "Harap masukkan 16 digit NIK sesuai kartu identitas KTP Anda.", "error");
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
      const hasUploadedKyc = formData.idCardPreview && (isProvider ? providerKycChoice === "now" : formData.userWantsOptionalKyc);

      let authResult;
      if (formData.authProvider === "google") {
        authResult = await authService.registerWithGoogle({
          fullName: formData.fullName || (isProvider ? "Penyedia Jasa Baru" : isMitra ? "Mitra Toko Sewa" : "Pengguna Baru"),
          email: formData.email,
          phone: formData.phone,
          role: formData.accountType,
          address: formData.address,
          province: formData.province,
          city: formData.city,
          district: formData.district,
          storeName: formData.storeName,
          storeCategory: formData.storeCategory,
          skills: allSkills,
          idNumber: formData.idNumber || "",
          idCardUrl: formData.idCardPreview || "",
          bankInfo: {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            accountHolder: formData.accountHolder || formData.fullName,
          },
          verificationStatus: hasUploadedKyc ? "pending_review" : "verified",
        });
      } else {
        authResult = await authService.register({
          fullName: formData.fullName || (isProvider ? "Penyedia Jasa Baru" : isMitra ? "Mitra Toko Sewa" : "Pengguna Baru"),
          email: formData.email,
          phone: formData.phone,
          role: formData.accountType,
          password: formData.password,
          address: formData.address,
          province: formData.province,
          city: formData.city,
          district: formData.district,
          storeName: formData.storeName,
          storeCategory: formData.storeCategory,
          skills: allSkills,
          idNumber: formData.idNumber || "",
          idCardUrl: formData.idCardPreview || "",
          bankInfo: {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            accountHolder: formData.accountHolder || formData.fullName,
          },
          verificationStatus: hasUploadedKyc ? "pending_review" : "verified",
        });
      }

      const registeredUser = authResult?.user || {
        id: `user-${Date.now()}`,
        fullName: formData.fullName || (isProvider ? "Penyedia Jasa Baru" : isMitra ? "Mitra Toko Sewa" : "Pengguna Baru"),
        email: formData.email,
        phoneNumber: formData.phone,
        campusName: formData.address || `${formData.district}, ${formData.city}`,
        faculty: isProvider ? "Penyedia Jasa Lepas" : isMitra ? "Mitra Rental Resmi" : "Pengguna Komunitas",
        accountType: formData.accountType,
        avatarUrl: isProvider 
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
          : isMitra
          ? "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
        verificationStatus: hasUploadedKyc ? "pending_review" : "verified",
        idNumber: formData.idNumber || "",
        idCardUrl: formData.idCardPreview || "",
        bankInfo: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder || formData.fullName,
        },
        skills: allSkills,
        ratingAvg: 5.0,
        ratingCount: 0,
        completedHelpsCount: 0,
        reliabilityScore: 100,
      };
      
      setCurrentUser(registeredUser);

      if (isProvider) {
        addToast?.(
          "Pendaftaran Berhasil", 
          hasUploadedKyc 
            ? "Profil jasa aktif. Dokumen KTP Anda sedang diproses verifikasi prioritas."
            : "Profil jasa aktif. Anda dapat mulai menawarkan keahlian dan melengkapi KTP saat penarikan saldo."
        );
        router.push("/jasa/dashboard");
      } else if (isMitra) {
        addToast?.("Selamat Datang Mitra Toko", "Outlet sewa Anda berhasil didaftarkan. Anda dapat mulai menambahkan unit rental.");
        router.push("/mitra/dashboard");
      } else {
        addToast?.("Selamat Datang di Bantuin", "Akun aktif tanpa KTP. Anda langsung dapat mencari bantuan dan memesan jasa.");
        router.push("/bantuan");
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
    <div className="min-h-screen relative flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 overflow-x-hidden font-sans">
      {/* Background Image */}
      <Image
        src={bgLoginImg}
        alt="Bantuin Register Background"
        fill
        priority
        className="object-cover object-center -z-10"
      />
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-slate-900/10 -z-10" />

      {/* Top Brand Logo Centered */}
      <div className="w-full max-w-2xl mx-auto pt-2 pb-2 flex justify-center">
        <Link href="/" className="inline-block">
          <Image
            src={logoImg}
            alt="Bantuin.id"
            height={44}
            className="h-9 sm:h-11 w-auto object-contain mix-blend-multiply"
          />
        </Link>
      </div>

      {/* Centered Main Card */}
      <div className="w-full max-w-2xl mx-auto my-auto">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-white/80 p-5 sm:p-8 shadow-[0_20px_50px_rgba(16,42,67,0.12)]">
          
          {/* Header: Step Indicator & Login Link Inside Card */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#1683FF]/10 text-[#1683FF] text-[11px] font-extrabold uppercase tracking-wider">
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
              className="text-xs font-bold text-slate-600 hover:text-[#1683FF] transition"
            >
              Sudah punya akun? <span className="text-[#1683FF] font-extrabold underline">Masuk</span>
            </Link>
          </div>

          {/* Slim, Integrated Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3 mb-6">
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
                    Tentukan bagaimana Anda ingin berpartisipasi di ekosistem Bantuin.id
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  
                  {/* ROLE 1: USER / PENGGUNA UMUM */}
                  <div
                    onClick={() => setFormData({ ...formData, accountType: "user" })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      formData.accountType === "user"
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
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      formData.accountType === "provider"
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
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      formData.accountType === "mitra"
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

                {/* Divider & Google Register */}
                <div className="relative my-2 pt-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-500 font-medium">atau daftar dengan</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGoogleRegistering}
                  onClick={handleGoogleRegister}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-bold shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                >
                  {isGoogleRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
                      <span>Menghubungkan ke Google...</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon className="w-4 h-4 shrink-0" />
                      <span>Daftar dengan Google</span>
                    </>
                  )}
                </button>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap Anda
                  </label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Alamat Email Aktif
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor WhatsApp / HP Aktif
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="081234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                        Kata Sandi Akun
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

                    <button
                      type="button"
                      disabled={isGoogleRegistering}
                      onClick={handleGoogleRegister}
                      className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-xs sm:text-sm font-bold shadow-2xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                    >
                      {isGoogleRegistering ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
                          <span>Menghubungkan ke Google...</span>
                        </>
                      ) : (
                        <>
                          <GoogleIcon className="w-4 h-4 shrink-0" />
                          <span>Daftar dengan Google</span>
                        </>
                      )}
                    </button>
                  </>
                )}

                {/* Khusus jika Mitra Toko Sewa dipilih */}
                {formData.accountType === "mitra" && (
                  <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Nama Toko / Usaha Rental Anda
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
                        Kategori Utama Barang Rental
                      </label>
                      <select
                        value={formData.storeCategory}
                        onChange={(e) => setFormData({ ...formData, storeCategory: e.target.value })}
                        className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF]"
                      >
                        <option value="Rental Kamera & Multimedia">Rental Kamera &amp; Multimedia</option>
                        <option value="Rental Audio, Mic & Podcast">Rental Audio, Mic &amp; Podcast</option>
                        <option value="Rental Proyektor & Layar Screen">Rental Proyektor &amp; Layar Screen</option>
                        <option value="Alat Camping & Outdoor">Alat Camping &amp; Outdoor</option>
                        <option value="Perkakas & Pertukangan">Perkakas &amp; Pertukangan</option>
                        <option value="Vendor Event & Bazar">Vendor Event &amp; Bazar</option>
                      </select>
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
                              className={`text-xs px-3.5 py-2 rounded-full border transition font-medium flex items-center gap-1.5 cursor-pointer ${
                                isSelected
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
                          className={`text-xs px-3.5 py-2 rounded-full border transition font-bold flex items-center gap-1.5 cursor-pointer ${
                            formData.showCustomSkillInput || formData.customSkill
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
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                            providerKycChoice === "later"
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
                          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                            providerKycChoice === "now"
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
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nomor Induk Kependudukan (NIK 16 Digit)
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={16}
                            placeholder="Contoh: 3201234567890001"
                            value={formData.idNumber}
                            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Foto KTP Asli
                          </label>
                          {formData.idCardPreview ? (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                              <div className="flex items-center gap-3">
                                <img
                                  src={formData.idCardPreview}
                                  alt="KTP Preview"
                                  className="w-16 h-11 object-cover rounded-lg border border-slate-200"
                                />
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                                    <span>KTP Siap Diverifikasi</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    {formData.idCardFileName || "ktp_provider.jpg"}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, idCardPreview: null, idCardFileName: "" })}
                                className="text-xs text-rose-600 font-bold hover:underline"
                              >
                                Ganti
                              </button>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-xl p-4 text-center cursor-pointer transition bg-white block">
                              <Upload className="w-5 h-5 text-[#1683FF] mx-auto mb-1" />
                              <span className="text-xs font-bold text-slate-800 block">Pilih File Foto KTP Asli</span>
                              <input type="file" accept="image/*" onChange={handleKTPUpload} className="hidden" />
                            </label>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Bank Payout</label>
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
                            <label className="block text-xs font-bold text-slate-700 mb-1">No. Rekening / E-Wallet</label>
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

                {/* Ringkasan Data */}
                <div className="bg-[#F8FBFF] p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Nama Akun:</span>
                    <span className="font-bold text-slate-900">{formData.fullName || "Pengguna Baru"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Email &amp; WhatsApp:</span>
                    <span className="font-bold text-slate-900">{formData.email} &middot; {formData.phone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Peran Akun:</span>
                    <span className="font-bold text-[#1683FF]">
                      {formData.accountType === "provider" 
                        ? "Penyedia Jasa" 
                        : formData.accountType === "mitra"
                        ? `Mitra Toko Sewa (${formData.storeName || "Toko Rental"})`
                        : "Pengguna Umum"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Domisili:</span>
                    <span className="font-bold text-slate-900">{formData.district}, {formData.city}, {formData.province}</span>
                  </div>
                </div>

                {/* KOTAK DOKUMEN ATURAN SK (SCROLLABLE DOCUMENT BOX) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <FileBadge className="w-4 h-4 text-[#1683FF]" />
                      <span>Dokumen Syarat, Ketentuan &amp; Tata Tertib Transaksi</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Gulir untuk membaca seluruhnya</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-xs text-slate-600 leading-relaxed space-y-3 shadow-inner font-sans">
                    <div className="text-center pb-2 border-b border-slate-200">
                      <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                        SURAT KESEPAKATAN &amp; ATURAN TRANSAKSI TERLINDUNGI
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Platform Bantuin.id &middot; Tata Tertib Transaksi Aman &amp; Terlindungi
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 mb-1">PASAL 1: KETENTUAN UMUM &amp; KATEGORI PERAN</h5>
                      <p className="text-[11px] text-slate-600">
                        1.1. Pengguna Umum adalah pihak pencari jasa, peminta bantuan, atau penyewa alat yang berhak mendapatkan jaminan pengerjaan sesuai deskripsi.<br />
                        1.2. Penyedia Jasa adalah pengguna mandiri yang bersedia menyelesaikan tugas bantuan atau proyek keahlian secara bertanggung jawab.<br />
                        1.3. Mitra Toko Sewa adalah pemilik outlet rental terdaftar yang menyediakan unit alat fisik berkualitas.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 mb-1">PASAL 2: SISTEM PEMBAYARAN TERVERIFIKASI &amp; PENAHANAN SEMENTARA</h5>
                      <p className="text-[11px] text-slate-600">
                        2.1. Seluruh dana pembayaran pemesanan jasa, imbalan tugas, dan deposit sewa wajib disetorkan melalui gateway pembayaran resmi Bantuin.<br />
                        2.2. Dana dijamin 100% aman dan baru diteruskan kepada penyedia jasa atau mitra rental setelah pemohon/penyewa mengonfirmasi penyelesaian tugas atau pengembalian unit.<br />
                        2.3. Deposit jaminan rental otomatis dikembalikan seketika setelah unit diverifikasi utuh oleh pihak mitra.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 mb-1">PASAL 3: LARANGAN TRANSAKSI DI LUAR PLATFORM (BYPASS)</h5>
                      <p className="text-[11px] text-slate-600">
                        3.1. Pengguna dilarang keras melakukan pembayaran tunai langsung atau transfer pribadi di luar platform demi menghindari risiko penipuan dan wanprestasi.<br />
                        3.2. Kerugian transaksi yang terjadi di luar sistem pembayaran resmi platform berada di luar cakupan garansi Bantuin.id.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 mb-1">PASAL 4: STANDAR PRIVASI &amp; PERLINDUNGAN DATA (UU PDP)</h5>
                      <p className="text-[11px] text-slate-600">
                        4.1. Dokumen identitas (KTP) dan data kontak disimpan dengan standar enkripsi tinggi dan hanya digunakan untuk validasi kepatuhan hukum transaksi.<br />
                        4.2. Bantuin berkomitmen menjaga kerahasiaan data pribadi pengguna tanpa diperjualbelikan kepada pihak ketiga.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-900 mb-1">PASAL 5: RESOLUSI SENGKETA &amp; REFUND</h5>
                      <p className="text-[11px] text-slate-600">
                        5.1. Apabila tugas tidak diselesaikan sesuai kesepakatan, kedua pihak berhak mengajukan eskalasi arbitrase kepada tim penengah Bantuin.<br />
                        5.2. Keputusan tim penengah bersifat final berdasarkan riwayat kesepakatan chat dan bukti serah terima digital di platform.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checkbox Persetujuan Dokumen */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToS}
                      onChange={(e) => setFormData({ ...formData, agreeToS: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF] shrink-0 cursor-pointer"
                      required
                    />
                    <span>
                      Saya telah membaca, memahami, dan menyetujui seluruh <strong className="text-slate-900">Dokumen Kesepakatan &amp; Tata Tertib Transaksi Bantuin.id</strong> di atas.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                type="submit"
                className={`ml-auto px-8 py-3.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95 flex items-center gap-2 cursor-pointer ${
                  step === 1 ? "w-full justify-center" : ""
                }`}
              >
                <span>
                  {step === 4 
                    ? (formData.accountType === "provider" 
                        ? "Selesaikan & Buka Dashboard Jasa" 
                        : formData.accountType === "mitra"
                        ? "Selesaikan & Buka Dashboard Mitra"
                        : "Selesaikan & Mulai Jelajah") 
                    : "Lanjutkan"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            </form>
        </div>
      </div>

      {/* Subtle Bottom Footer */}
      <div className="w-full max-w-2xl mx-auto text-center text-[11px] text-slate-600 font-medium py-3 drop-shadow-2xs">
        &copy; {new Date().getFullYear()} Bantuin.id &middot; Platform Bantuan, Jasa &amp; Sewa Komunitas
      </div>
    </div>
  );
}
