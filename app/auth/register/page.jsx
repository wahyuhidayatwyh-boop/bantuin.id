"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import { INDONESIA_REGION_DATA, PROVINCE_LIST } from "@/lib/data/indonesiaRegions";
import { detectRealtimeLocation } from "@/lib/services/gpsService";
import CustomSelect from "@/components/ui/CustomSelect";
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
  Sparkles,
  AlertCircle,
  CreditCard,
  Building2,
  CheckCircle,
  Info,
  Store
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setCurrentUser, addToast } = useApp();

  const [step, setStep] = useState(1);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Data Akun & Peran
    fullName: "",
    email: "",
    phone: "",
    password: "",
    accountType: "user", // 'user' (Mahasiswa/Klien) atau 'provider' (Penyedia Jasa)
    
    // Step 2: Domisili & Wilayah
    address: "",
    province: "Kalimantan Selatan",
    city: "Kota Banjarmasin",
    district: "Banjarmasin Tengah",

    // Step 3 (Khusus Provider / Opsional User): KYC & Payout
    idNumber: "",
    idCardPreview: null,
    idCardFileName: "",
    userWantsOptionalKyc: false, // User biasa bisa pilih unggah KTP/KTM secara sukarela
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
  ];

  // Dynamic Cities from selected Province
  const currentProvinceData = INDONESIA_REGION_DATA[formData.province] || INDONESIA_REGION_DATA["Kalimantan Selatan"] || {};
  const cityOptions = Object.keys(currentProvinceData);

  // Dynamic Districts (Kecamatan) from selected City
  const districtOptions = currentProvinceData[formData.city] || currentProvinceData[cityOptions[0]] || [];

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

  // Local File Upload Handler for Foto KTP / KTM
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

  const handleNext = (e) => {
    e.preventDefault();

    // Validasi Step 3 untuk Provider
    if (step === 3 && formData.accountType === "provider") {
      if (!formData.idNumber || formData.idNumber.length < 16) {
        addToast?.("NIK Belum Valid", "Harap masukkan 16 digit NIK sesuai kartu identitas KTP Anda.", "error");
        return;
      }
      if (!formData.idCardPreview) {
        addToast?.("Dokumen Belum Diunggah", "Harap unggah foto KTP atau KTM resmi untuk verifikasi KYC.", "error");
        return;
      }
      if (!formData.accountNumber || !formData.accountHolder) {
        addToast?.("Rekening Payout Belum Lengkap", "Harap isi nomor rekening dan nama pemilik untuk pencairan dana transfer admin.", "error");
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      const allSkills = [...formData.selectedSkills];
      if (formData.customSkill.trim()) {
        allSkills.push(formData.customSkill.trim());
      }

      const isProvider = formData.accountType === "provider";
      const hasKyc = isProvider || (formData.userWantsOptionalKyc && formData.idCardPreview);

      const newUser = {
        id: `user-${Date.now()}`,
        fullName: formData.fullName || (isProvider ? "Penyedia Jasa Baru" : "Pengguna Baru"),
        email: formData.email,
        phoneNumber: formData.phone,
        campusName: formData.address || `${formData.district}, ${formData.city}`,
        faculty: isProvider ? "Penyedia Jasa Terverifikasi" : "Pengguna Komunitas",
        accountType: formData.accountType,
        avatarUrl: isProvider 
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
        verificationStatus: hasKyc ? (isProvider ? "pending_review" : "verified") : "unverified",
        idNumber: formData.idNumber,
        idCardUrl: formData.idCardPreview,
        payoutBank: formData.bankName,
        payoutAccountNumber: formData.accountNumber,
        payoutAccountHolder: formData.accountHolder || formData.fullName,
        ratingAvg: 5.0,
        ratingCount: 0,
        completedHelpsCount: 0,
      };
      
      setCurrentUser(newUser);

      if (isProvider) {
        addToast?.("Pendaftaran Berhasil!", "Profil penyedia jasa aktif. Dokumen KYC sedang ditinjau admin.");
        router.push("/jasa/dashboard");
      } else {
        addToast?.("Selamat Datang di Bantuin!", "Akun Anda telah aktif dan siap digunakan.");
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
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8 font-sans text-slate-800">
      
      {/* Top Bar Navigation */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between mb-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoImg}
            alt="Bantuin"
            height={38}
            className="h-8 sm:h-9 w-auto object-contain mix-blend-multiply"
          />
        </Link>
        <Link
          href="/auth/login"
          className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition"
        >
          Sudah punya akun? <strong className="text-[#1683FF]">Masuk</strong>
        </Link>
      </div>

      {/* Center Large Stepper Container */}
      <div className="max-w-2xl w-full mx-auto my-auto">
        
        {/* Step Progress Bar */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 mb-2 gap-2">
            <span className="truncate">
              Langkah {step} dari 4: {
                step === 1 ? "Informasi Akun & Peran" :
                step === 2 ? "Domisili & Wilayah (38 Provinsi)" :
                step === 3 ? (formData.accountType === "provider" ? "KYC KTP & Rekening Payout" : "Status Identitas") :
                "Konfirmasi & Privasi"
              }
            </span>
            <span className="text-[#1683FF] font-extrabold shrink-0">{step * 25}%</span>
          </div>
          <div className="w-full h-2 sm:h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#1683FF] to-[#0F6FE5] transition-all duration-300 rounded-full"
              style={{ width: `${step * 25}%` }}
            />
          </div>
        </div>

        {/* Large Step Form Card */}
        <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-200/90 p-5 sm:p-8 md:p-10 shadow-[0_16px_45px_rgba(22,131,255,0.08)]">
          <form onSubmit={handleNext} className="space-y-4 sm:space-y-5">
            
            {/* STEP 1: INFORMASI AKUN & PILIHAN PERAN */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Pendaftaran Akun Baru
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Silakan isi data akun Anda dan tentukan peran utama dalam platform Bantuin.
                  </p>
                </div>

                {/* PILIHAN PERAN UTAMA: USER vs PENYEDIA JASA */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Pilih Peran Akun Anda:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div
                      onClick={() => setFormData({ ...formData, accountType: "user" })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        formData.accountType === "user"
                          ? "border-[#1683FF] bg-blue-50/50 shadow-2xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        {formData.accountType === "user" ? (
                          <CheckCircle2 className="w-5 h-5 text-[#1683FF]" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">Paling Populer</span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Pengguna &amp; Penyewa</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Mencari bantuan harian, titip errand, sewa barang/kamera, atau memesan jasa pro.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, accountType: "provider" })}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        formData.accountType === "provider"
                          ? "border-[#1683FF] bg-blue-50/50 shadow-2xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center">
                          <Briefcase className="w-5 h-5" />
                        </div>
                        {formData.accountType === "provider" ? (
                          <CheckCircle2 className="w-5 h-5 text-[#1683FF]" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full">
                            Buka Jasa
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Penyedia Jasa (Pro / Helper)</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Menawarkan keahlian spesialis (desain, web, foto, servis) &amp; terima penghasilan.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Banner Link Khusus untuk Toko / Rental Merchant */}
                  <div className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#1683FF]" />
                      <span>Pemilik Toko Rental Fisik / Usaha Sewa Alat?</span>
                    </span>
                    <Link
                      href="/mitra/register"
                      className="font-bold text-[#1683FF] hover:underline flex items-center gap-1"
                    >
                      <span>Daftar Mitra Toko &rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* Form Input Dasar */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap (Sesuai KTP / Identitas Asli)
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
              </div>
            )}

            {/* STEP 2: DOMISILI LOKASI & WILAYAH (38 PROVINSI + GPS) */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-[#1683FF]" />
                    <span>Domisili &amp; Wilayah Operasional</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tentukan wilayah aktivitas Anda agar kami dapat menampilkan bantuan, rental, dan jasa terdekat.
                  </p>
                </div>

                {/* GPS REALTIME DETECTOR BANNER */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1683FF] text-white flex items-center justify-center shrink-0 shadow-sm relative">
                      <Navigation className="w-5 h-5 animate-pulse" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>Deteksi Lokasi Otomatis (GPS Realtime)</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Otomatis mengisi Provinsi, Kabupaten/Kota, dan Kecamatan Anda saat ini.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isDetectingGps}
                    onClick={handleActivateGPS}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-60 cursor-pointer"
                  >
                    {isDetectingGps ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mencari Sinyal GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Nyalakan GPS Saya</span>
                      </>
                    )}
                  </button>
                </div>

                {/* GPS Status Notice */}
                {gpsSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{gpsSuccessMsg}</span>
                  </div>
                )}
                {gpsErrorMsg && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-semibold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{gpsErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Lengkap / Patokan Wilayah (Jalan, RT/RW, atau Patokan)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jl. Ahmad Yani No. 45, Dekat Alun-alun / Kantor Pos"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                  />
                </div>

                {/* 1. Custom Select Provinsi */}
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

                {/* 2 & 3: Kabupaten/Kota and Kecamatan Dropdowns */}
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
              </div>
            )}

            {/* STEP 3: LOGIKA BERBEDA SESUAI PERAN (USER vs PROVIDER) */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                
                {/* 3A. JIKA USER BIASA: KTP TIDAK WAJIB (OPSIONAL) */}
                {formData.accountType === "user" ? (
                  <div className="space-y-4">
                    <div className="mb-2">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                        <span>Status Identitas Pengguna</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Kemudahan mendaftar tanpa hambatan administratif yang rumit.
                      </p>
                    </div>

                    {/* Banner Edukasi Hak Bebas KTP Awal */}
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
                      <Info className="w-5 h-5 text-[#1683FF] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block font-bold mb-0.5">
                          KTP Bersifat Opsional Saat Ini:
                        </strong>
                        Untuk mencari bantuan tugas, titip belanjaan, dan memesan jasa keahlian, Anda **tidak diwajibkan** mengunggah KTP saat mendaftar. Anda bisa langsung bertransaksi aman melalui Rekening Bersama Escrow resmi Bantuin.
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Kapan Verifikasi KTP Diperlukan?</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Verifikasi kartu identitas resmi hanya diwajibkan apabila Anda melakukan **Penyewaan Alat Bernilai Tinggi (Rental Kamera, Drone, Laptop)** demi proteksi unit pemilik toko rental.
                      </p>
                    </div>

                    {/* Opsi Sukarela jika ingin verifikasi KTP sekarang */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mb-3">
                        <input
                          type="checkbox"
                          checked={formData.userWantsOptionalKyc}
                          onChange={(e) => setFormData({ ...formData, userWantsOptionalKyc: e.target.checked })}
                          className="w-4 h-4 text-[#1683FF] rounded border-slate-300"
                        />
                        <span>Saya ingin mengunggah KTP sekarang untuk mendapatkan badge "Identitas Terverifikasi"</span>
                      </label>

                      {formData.userWantsOptionalKyc && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Nomor Induk Kependudukan (NIK 16 Digit)
                            </label>
                            <input
                              type="text"
                              maxLength={16}
                              placeholder="Masukkan NIK KTP Anda"
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
                              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>{formData.idCardFileName || "KTP_terlampir.jpg"}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, idCardPreview: null, idCardFileName: "" })}
                                  className="text-xs text-rose-600 font-bold hover:underline"
                                >
                                  Hapus
                                </button>
                              </div>
                            ) : (
                              <label className="block border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-xl p-4 text-center cursor-pointer bg-white">
                                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                                <span className="text-xs font-bold text-slate-700 block">Pilih Foto KTP Asli</span>
                                <input type="file" accept="image/*" onChange={handleKTPUpload} className="hidden" />
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 3B. JIKA PENYEDIA JASA: WAJIB KTP/KTM, SKILL & REKENING PAYOUT */
                  <div className="space-y-4">
                    <div className="mb-2">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-[#1683FF]" />
                        <span>Keahlian, KYC &amp; Rekening Payout</span>
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Penyedia jasa wajib melengkapi verifikasi identitas dan rekening untuk pencairan imbalan pekerjaan.
                      </p>
                    </div>

                    {/* Pilihan Keahlian */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Pilih Keahlian yang Anda Tawarkan:
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
                            placeholder="Contoh: Barista Event, Guru Les Privat, Tukang Servis AC..."
                            value={formData.customSkill}
                            onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                            className="w-full text-xs px-3.5 py-2 rounded-lg border border-blue-200 bg-white"
                          />
                        </div>
                      )}
                    </div>

                    {/* Verifikasi Identitas KYC Wajib */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <FileBadge className="w-4 h-4 text-[#1683FF]" />
                          <span>Verifikasi Identitas KYC (e-KTP Asli)</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          Wajib untuk Provider
                        </span>
                      </div>

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
                          Unggah Foto e-KTP Asli
                        </label>
                        {formData.idCardPreview ? (
                          <div className="flex items-center justify-between p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                            <div className="flex items-center gap-3">
                              <img
                                src={formData.idCardPreview}
                                alt="KTP Preview"
                                className="w-16 h-10 rounded-lg object-cover border border-emerald-300 shadow-2xs"
                              />
                              <div>
                                <span className="text-xs font-bold text-emerald-900 block">
                                  {formData.idCardFileName || "ktp_dokumen.jpg"}
                                </span>
                                <span className="text-[10px] text-emerald-700">Tersimpan di Vault Terenkripsi</span>
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
                          <label className="block border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-xl p-5 text-center cursor-pointer bg-white transition">
                            <Upload className="w-6 h-6 text-[#1683FF] mx-auto mb-1.5" />
                            <span className="text-xs font-bold text-slate-800 block">
                              Klik untuk Unggah Foto KTP / KTM Asli
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Format JPG, PNG (Maks 5 MB). Pastikan teks NIK dan foto jelas.
                            </span>
                            <input type="file" accept="image/*" onChange={handleKTPUpload} className="hidden" />
                          </label>
                        )}
                      </div>

                      {/* Notice Kepatuhan UU PDP */}
                      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
                        <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                        <div>
                          <strong>Proteksi Privasi UU PDP:</strong> Dokumen KTP Anda disimpan di bucket penyimpanan privat berenkripsi AES-256. Akses hanya dibuka untuk staf verifikasi internal dengan watermark otomatis anti-penyalahgunaan.
                        </div>
                      </div>
                    </div>

                    {/* Data Rekening Bank untuk Payout Manual Admin */}
                    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#1683FF]" />
                          <span>Rekening Bank Penerima Payout</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Fee Admin Rp0
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Bank Tujuan
                          </label>
                          <select
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                          >
                            <option value="BCA">BCA (Bank Central Asia)</option>
                            <option value="Mandiri">Mandiri</option>
                            <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                            <option value="BNI">BNI (Bank Negara Indonesia)</option>
                            <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Nomor Rekening
                          </label>
                          <input
                            type="text"
                            required={formData.accountType === "provider"}
                            placeholder="Contoh: 8820192841"
                            value={formData.accountNumber}
                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama Pemilik Rekening (Harus sama dengan KTP/Identitas)
                        </label>
                        <input
                          type="text"
                          required={formData.accountType === "provider"}
                          placeholder="Nama Lengkap Pemilik Rekening"
                          value={formData.accountHolder}
                          onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: KONFIRMASI & PERLINDUNGAN ESCROW */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Konfirmasi &amp; Aktivasi Akun
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Tinjau ringkasan data sebelum akun Bantuin.id Anda resmi diaktifkan.
                  </p>
                </div>

                <div className="bg-[#F8FBFF] p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Nama Lengkap:</span>
                    <span className="font-bold text-slate-900">{formData.fullName || "Rian Prasetya"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Email &amp; Kontak:</span>
                    <span className="font-bold text-slate-900">{formData.email || "user@email.com"} · {formData.phone}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Peran Akun:</span>
                    <span className="font-black text-[#1683FF]">
                      {formData.accountType === "provider" ? "Penyedia Jasa (Freelancer / Pro)" : "Pengguna & Penyewa Komunitas"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Domisili Aktivitas:</span>
                    <span className="font-bold text-slate-900">{formData.district}, {formData.city}, {formData.province}</span>
                  </div>
                  
                  {formData.accountType === "provider" && (
                    <>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Status Verifikasi KYC:</span>
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Dokumen KTP Siap Ditinjau Admin</span>
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Rekening Payout:</span>
                        <span className="font-bold text-slate-900">
                          {formData.bankName} - {formData.accountNumber} ({formData.accountHolder || formData.fullName})
                        </span>
                      </div>
                    </>
                  )}

                  {formData.accountType === "user" && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Status Dokumen KTP:</span>
                      <span className="font-bold text-emerald-700">
                        {formData.idCardPreview ? "KTP Terlampir (Badge Siap Aktif)" : "Bebas KTP (Dapat ditambahkan saat sewa)"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Escrow Guarantee Highlight */}
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-start gap-3 text-xs text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-slate-900 block text-xs sm:text-sm">
                      100% Proteksi Rekening Bersama (Escrow Resmi)
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-600 mt-0.5 block leading-relaxed">
                      Seluruh transaksi keuangan aman di rekening penampung resmi platform. Hak pembayaran mitra dan pengembalian deposit diproses secara transparan.
                    </span>
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreeToS}
                      onChange={(e) => setFormData({ ...formData, agreeToS: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF] shrink-0"
                      required
                    />
                    <span>
                      Saya menyetujui <strong className="text-slate-800">Syarat &amp; Ketentuan Layanan</strong>, <strong className="text-slate-800">Kebijakan Privasi UU PDP</strong>, dan mematuhi tata tertib transaksi jujur di komunitas Bantuin.
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
                    ? (formData.accountType === "provider" ? "Selesaikan & Aktifkan Portal Jasa" : "Selesaikan & Mulai Jelajah") 
                    : "Lanjutkan"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Bottom Footer Info */}
      <div className="max-w-2xl w-full mx-auto text-center text-xs text-slate-400 mt-6">
        &copy; {new Date().getFullYear()} Bantuin.id &middot; Platform Bantuan, Jasa Mahasiswa &amp; Rental Komunitas
      </div>

    </div>
  );
}
