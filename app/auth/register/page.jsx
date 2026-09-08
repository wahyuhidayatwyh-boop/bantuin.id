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
  AlertCircle
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setCurrentUser } = useApp();

  const [step, setStep] = useState(1);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    idNumber: "",
    idCardPreview: null,
    idCardFileName: "",
    province: "Kalimantan Selatan",
    city: "Kota Banjarmasin",
    district: "Banjarmasin Tengah",
    accountType: "user", // 'user' or 'provider'
    selectedSkills: ["Desain Grafis & Logo"],
    customSkill: "",
    showCustomSkillInput: false,
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
      setGpsErrorMsg(err.message || "Gagal mendeteksi lokasi GPS. Pastikan izin lokasi browser telah diizinkan.");
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

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 4) {
      setStep(step + 1);
    } else {
      const allSkills = [...formData.selectedSkills];
      if (formData.customSkill.trim()) {
        allSkills.push(formData.customSkill.trim());
      }

      const newUser = {
        id: `user-${Date.now()}`,
        fullName: formData.fullName || "Pengguna Baru",
        email: formData.email,
        phoneNumber: formData.phone,
        campusName: `${formData.district}, ${formData.city}, ${formData.province}`,
        faculty: formData.accountType === "provider" ? "Penyedia Jasa Terverifikasi" : "Pengguna Komunitas",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        verificationStatus: "verified",
        ratingAvg: 5.0,
        ratingCount: 1,
        completedHelpsCount: 0,
      };
      
      setCurrentUser(newUser);
      if (formData.accountType === "provider") {
        router.push("/jasa/dashboard");
      } else {
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
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8">
      
      {/* Top Bar */}
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
          className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF]"
        >
          Sudah punya akun? <strong className="text-[#1683FF]">Masuk di sini</strong>
        </Link>
      </div>

      {/* Center Large Stepper Container */}
      <div className="max-w-2xl w-full mx-auto my-auto">
        
        {/* Step Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 mb-2.5">
            <span>Langkah {step} dari 4: {
              step === 1 ? "Informasi Akun Dasar" :
              step === 2 ? "Verifikasi KTP & Domisili 38 Provinsi" :
              step === 3 ? "Pilihan Peran & Keahlian" : "Konfirmasi & Aktivasi Escrow"
            }</span>
            <span className="text-[#1683FF] font-extrabold">{step * 25}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#1683FF] to-[#0F6FE5] transition-all duration-300 rounded-full"
              style={{ width: `${step * 25}%` }}
            />
          </div>
        </div>

        {/* Large Step Form Card */}
        <div className="bg-white rounded-[32px] border border-slate-200/90 p-6 sm:p-10 shadow-[0_16px_45px_rgba(22,131,255,0.08)]">
          <form onSubmit={handleNext} className="space-y-5">
            
            {/* STEP 1: INFORMASI DASAR */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Pendaftaran Akun Baru
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Silakan isi data diri dasar Anda untuk membuat akun di platform Bantuin.
                  </p>
                </div>

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
                      placeholder="Minimal 8 karakter (kombinasi huruf & angka)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFIKASI KTP & DOMISILI LENGKAP DENGAN DETEKSI GPS */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileBadge className="w-7 h-7 text-[#1683FF]" />
                    <span>Verifikasi Identitas KTP & Domisili</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Pilih provinsi, kota, dan kecamatan KTP Anda atau gunakan GPS realtime untuk deteksi otomatis seketika.
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
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-60"
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
                    Nomor Induk Kependudukan (NIK 16 Digit Sesuai KTP)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="Contoh: 6301234567890001"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                  />
                </div>

                {/* 1. Custom Select Provinsi */}
                <div>
                  <CustomSelect
                    label="Provinsi Domisili KTP (38 Provinsi Indonesia)"
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
                    label="Kabupaten / Kota KTP"
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
                    label="Kecamatan KTP"
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

                {/* AREA UPLOAD FOTO KTP DARI PERANGKAT LOKAL */}
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Foto Fisik KTP Asli (Unggah dari Perangkat Lokal)
                  </label>

                  {formData.idCardPreview ? (
                    <div className="relative rounded-2xl border-2 border-emerald-400 p-4 sm:p-5 bg-emerald-50/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={formData.idCardPreview}
                          alt="Foto KTP Preview"
                          className="w-28 h-18 sm:w-32 sm:h-20 rounded-xl object-cover border border-emerald-300 shadow-sm"
                        />
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Foto KTP Asli Berhasil Diunggah</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                            {formData.idCardFileName || "ktp_dokumen.jpg"}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                            Foto siap diverifikasi oleh sistem KYC Bantuin.
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, idCardPreview: null, idCardFileName: "" })}
                        className="px-3.5 py-2 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs self-end sm:self-auto"
                        title="Ganti Foto KTP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Ganti Foto KTP</span>
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="register-ktp-file-input"
                      className="border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50 hover:bg-blue-50/50 block group"
                    >
                      <Upload className="w-9 h-9 text-[#1683FF] mx-auto mb-2.5 group-hover:scale-110 transition-transform" />
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        Klik untuk Memilih File Foto KTP dari HP / Komputer Lokal
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Format JPG, JPEG, PNG (Maks 5 MB). Pastikan tulisan NIK & nama terbaca terang.
                      </div>
                      <input
                        id="register-ktp-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleKTPUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: PILIHAN TIPE AKUN & KEAHLIAN */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Pilih Peran Akun Anda
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Pilih bagaimana Anda ingin berpartisipasi dalam platform Bantuin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setFormData({ ...formData, accountType: "user" })}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      formData.accountType === "user"
                        ? "border-[#1683FF] bg-blue-50/50 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-blue-100 text-[#1683FF] flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      {formData.accountType === "user" && (
                        <CheckCircle2 className="w-6 h-6 text-[#1683FF]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">Pengguna & Penyewa</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Untuk mencari bantuan harian, titip belanja/errand, sewa alat, atau memesan jasa.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setFormData({ ...formData, accountType: "provider" })}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      formData.accountType === "provider"
                        ? "border-indigo-600 bg-indigo-50/50 shadow-2xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <Briefcase className="w-6 h-6" />
                      </div>
                      {formData.accountType === "provider" && (
                        <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">Penyedia Jasa (Pro)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Untuk membuka jasa desain, IT, fotografi, servis laptop, teknisi AC & dapatkan klien.
                      </p>
                    </div>
                  </div>
                </div>

                {formData.accountType === "provider" && (
                  <div className="pt-2 animate-in fade-in duration-150 space-y-3">
                    <label className="block text-xs sm:text-sm font-bold text-slate-800">
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
                            className={`text-xs px-3.5 py-2 rounded-full border transition font-medium flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
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
                        className={`text-xs px-3.5 py-2 rounded-full border transition font-bold flex items-center gap-1.5 ${
                          formData.showCustomSkillInput || formData.customSkill
                            ? "bg-indigo-50 text-indigo-800 border-indigo-300"
                            : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Keahlian Lainnya...</span>
                      </button>
                    </div>

                    {formData.showCustomSkillInput && (
                      <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 animate-in fade-in">
                        <label className="block text-xs font-bold text-indigo-900 mb-1">
                          Tuliskan Keahlian Spesifik Anda:
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Barista Event, Guru Les Privat Matematika, Tukang Cat..."
                          value={formData.customSkill}
                          onChange={(e) => setFormData({ ...formData, customSkill: e.target.value })}
                          className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-indigo-200 focus:outline-none focus:border-indigo-600 bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: KONFIRMASI & AKTIVASI ESCROW */}
            {step === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Konfirmasi & Perlindungan Escrow
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Satu langkah terakhir untuk mengaktifkan akun Bantuin Anda.
                  </p>
                </div>

                <div className="bg-[#F8FBFF] p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Nama Lengkap:</span>
                    <span className="font-bold text-slate-900">{formData.fullName || "Rian Prasetya"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Email & Kontak:</span>
                    <span className="font-bold text-slate-900">{formData.email || "user@email.com"} · {formData.phone}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Domisili KTP:</span>
                    <span className="font-bold text-slate-900">{formData.district}, {formData.city}, {formData.province}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Status Foto KTP:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {formData.idCardPreview ? "Foto KTP Siap Diverifikasi" : "Belum diunggah"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Tipe Akun:</span>
                    <span className="font-black text-[#1683FF]">
                      {formData.accountType === "provider" ? "Penyedia Jasa (Freelancer / Pro)" : "Pengguna & Penyewa Komunitas"}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-start gap-3 text-xs text-emerald-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm">Perlindungan Rekening Escrow Xendit Otomatis</div>
                    <div className="text-[11px] sm:text-xs text-emerald-700 mt-0.5 leading-relaxed">
                      Seluruh transaksi bantuan, rental, dan jasa dijamin aman. Dana imbalan hanya dicairkan setelah tugas selesai dan disetujui kedua pihak.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreeToS}
                    onChange={(e) => setFormData({ ...formData, agreeToS: e.target.checked })}
                    className="mt-1 rounded text-[#1683FF]"
                  />
                  <span className="text-slate-500 leading-relaxed text-xs">
                    Saya menyetujui <Link href="/syarat-ketentuan" className="text-[#1683FF] underline">Syarat & Ketentuan</Link>, <Link href="/kebijakan-privasi" className="text-[#1683FF] underline">Kebijakan Privasi</Link>, serta Kode Etik Keamanan Komunitas Bantuin.
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                type="submit"
                className="flex-1 py-3.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-black shadow-md transition flex items-center justify-center gap-2 active:scale-95"
              >
                <span>{step === 4 ? "Selesaikan & Aktifkan Akun" : "Lanjutkan"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Footer Info */}
      <div className="max-w-2xl w-full mx-auto text-center text-xs text-slate-400 mt-4">
        © 2026 Bantuin. Aman, Transparan & Terpercaya.
      </div>

    </div>
  );
}
