"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logoImg from "@/components/image/logo.png";
import { INDONESIA_REGION_DATA, PROVINCE_LIST } from "@/lib/data/indonesiaRegions";
import { detectRealtimeLocation } from "@/lib/services/gpsService";
import CustomSelect from "@/components/ui/CustomSelect";
import { 
  Store, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Upload, 
  CreditCard, 
  Phone, 
  Mail, 
  CheckCircle2,
  Trash2,
  Navigation,
  Loader2,
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function MitraRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    storeName: "",
    businessCategory: "Rental Kamera & Lensa",
    customCategory: "",
    email: "",
    phone: "",
    province: "Kalimantan Selatan",
    city: "Kota Banjarmasin",
    district: "Banjarmasin Tengah",
    address: "",
    storePhotoPreview: null,
    operatingHours: "08.00 - 21.00 WIB",
    ownerName: "",
    ktpPhotoPreview: null,
    bankName: "BCA",
    accountNumber: "",
    agreeToS: true,
  });

  const categories = [
    "Rental Kamera & Lensa",
    "Rental Audio & Podcast",
    "Percetakan & Digital Printing",
    "Studio Foto & Lighting",
    "Rental Proyektor & Display",
    "Alat Perkakas & Pertukangan",
    "Vendor Event & Bazar",
    "Lainnya (Kategori Usaha Lain)",
  ];

  // Dynamic Cities from selected Province
  const currentProvinceData = INDONESIA_REGION_DATA[formData.province] || INDONESIA_REGION_DATA["Kalimantan Selatan"] || {};
  const cityOptions = Object.keys(currentProvinceData);

  // Dynamic Districts (Kecamatan) from selected City
  const districtOptions = currentProvinceData[formData.city] || currentProvinceData[cityOptions[0]] || [];

  // Handle GPS Activation for Mitra Store
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
        address: prev.address || loc.fullAddress,
      }));
      setGpsSuccessMsg(`GPS Toko Terkunci: ${loc.district}, ${loc.city}, ${loc.province}`);
    } catch (err) {
      setGpsErrorMsg(err.message || "Gagal mendeteksi koordinat GPS toko.");
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleStorePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, storePhotoPreview: previewUrl });
    }
  };

  const handleKtpPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, ktpPhotoPreview: previewUrl });
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      setTimeout(() => {
        router.push("/mitra/dashboard");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1528] via-[#102444] to-[#0A1120] text-white flex flex-col justify-between p-4 sm:p-8 lg:p-12 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#1683FF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between z-10 mb-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-white px-3 py-1.5 rounded-2xl">
            <Image
              src={logoImg}
              alt="Bantuin"
              height={32}
              className="h-7 w-auto object-contain"
            />
          </div>
        </Link>

        <Link
          href="/mitra/login"
          className="text-xs sm:text-sm text-slate-300 hover:text-emerald-400 font-bold transition"
        >
          Sudah jadi Mitra Toko? <strong className="text-emerald-400">Masuk Portal</strong>
        </Link>
      </div>

      {/* Center Large Registration Stepper */}
      <div className="max-w-3xl w-full mx-auto my-auto z-10">
        
        {/* Progress Stepper */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-300 mb-2.5">
            <span>Langkah {step} dari 3: {
              step === 1 ? "Profil Usaha Toko / Merchant" :
              step === 2 ? "Lokasi Fisik 38 Provinsi, Kota & Kecamatan" : "Legalitas & Rekening Payout Xendit"
            }</span>
            <span className="text-emerald-400 font-black">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Large Step Form Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[36px] p-6 sm:p-10 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
          <form onSubmit={handleNext} className="space-y-5">
            
            {/* STEP 1: PROFIL USAHA MITRA */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Pendaftaran Mitra Toko & Vendor Rental
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      Buka toko rental kamera, percetakan, sound system, alat musik, atau studio di ekosistem Bantuin.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Nama Toko / Nama Usaha Vendor
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Yogya Cam Rental Official"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Kategori Utama Bisnis Anda
                  </label>
                  <select
                    value={formData.businessCategory}
                    onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                    className="w-full bg-slate-900 border border-white/20 text-white rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-slate-900 text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.businessCategory.startsWith("Lainnya") && (
                  <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 animate-in fade-in">
                    <label className="block text-xs font-bold text-emerald-300 mb-1">
                      Tuliskan Kategori Usaha Anda:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rental Jas & Kostum, Rental Tenda & Kursi Pesta, Servis Drone..."
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      className="w-full bg-slate-900 border border-emerald-400/40 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Email Bisnis / Toko
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="toko@domain.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      No. WhatsApp Official Toko
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="081234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOKASI TOKO FISIK DENGAN DETEKSI GPS REALTIME */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200 text-slate-900">
                <div className="flex items-center gap-3.5 mb-2 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Lokasi Toko Fisik (Provinsi, Kota & Kecamatan)
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      Alamat pengambilan unit barang rental dan titik aman bagi penyewa terdaftar.
                    </p>
                  </div>
                </div>

                {/* Banner GPS Realtime Toko */}
                <div className="bg-white/10 border border-emerald-400/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm relative">
                      <Navigation className="w-5 h-5 animate-pulse" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-300 rounded-full border-2 border-slate-900" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                        <span>Deteksi Titik GPS Toko</span>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Kunci koordinat presisi toko untuk mempermudah penyewa menemukan outlet Anda.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isDetectingGps}
                    onClick={handleActivateGPS}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 shadow-sm active:scale-95 disabled:opacity-60"
                  >
                    {isDetectingGps ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Mencari Titik GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Nyalakan GPS Toko</span>
                      </>
                    )}
                  </button>
                </div>

                {gpsSuccessMsg && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-400/50 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-bold animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{gpsSuccessMsg}</span>
                  </div>
                )}
                {gpsErrorMsg && (
                  <div className="p-3 bg-amber-500/20 border border-amber-400/50 rounded-xl flex items-center gap-2 text-xs text-amber-300 font-semibold animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{gpsErrorMsg}</span>
                  </div>
                )}

                <div>
                  <CustomSelect
                    label="Provinsi Lokasi Toko (38 Provinsi Indonesia)"
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
                    label="Kabupaten / Kota Toko"
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
                    label="Kecamatan Toko"
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

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Alamat Lengkap Toko / Ruko / Workshop & Patokan
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Contoh: Jl. Lambung Mangkurat No. 45 (Sebelah Kantor Pos)"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl p-4 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Upload Foto Toko dari Lokal */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Foto Tampak Depan Toko / Outlet (Unggah dari Perangkat Lokal)
                  </label>

                  {formData.storePhotoPreview ? (
                    <div className="relative rounded-2xl border-2 border-emerald-400/50 p-4 bg-emerald-500/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={formData.storePhotoPreview}
                          alt="Store Preview"
                          className="w-20 h-14 rounded-xl object-cover border border-emerald-400/40 shadow-xs"
                        />
                        <div>
                          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Foto Toko Berhasil Dimuat</span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">Foto akan ditampilkan di halaman mitra resmi.</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, storePhotoPreview: null })}
                        className="p-2 rounded-xl bg-white/10 border border-red-400/40 text-red-400 hover:bg-red-500/20 transition shadow-2xs"
                        title="Hapus / Ganti Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="store-photo-input"
                      className="border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-2xl p-6 text-center cursor-pointer transition bg-white/5 hover:bg-white/10 block"
                    >
                      <Upload className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                      <div className="text-xs sm:text-sm font-bold text-white">
                        Klik untuk Memilih Foto Toko dari File Lokal
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Format JPG, PNG (Maks 5 MB).
                      </div>
                      <input
                        id="store-photo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleStorePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: LEGALITAS, UPLOAD KTP PEMILIK & REKENING PAYOUT */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Rekening Pencairan & Escrow Xendit
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                      Penghasilan sewa akan otomatis dicairkan ke rekening bank resmi toko Anda.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Nama Pemilik Usaha (Sesuai Buku Tabungan / KTP)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Pemilik"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Bank Penerima
                    </label>
                    <select
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-slate-900 border border-white/20 text-white rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                    >
                      <option value="BCA">Bank BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="BNI">Bank BNI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Nomor Rekening Bank
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 8820192841"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Upload KTP Pemilik Usaha dari Lokal */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Foto KTP Pemilik Usaha (Unggah dari Perangkat Lokal)
                  </label>

                  {formData.ktpPhotoPreview ? (
                    <div className="relative rounded-2xl border-2 border-emerald-400/50 p-4 bg-emerald-500/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={formData.ktpPhotoPreview}
                          alt="KTP Preview"
                          className="w-20 h-14 rounded-xl object-cover border border-emerald-400/40 shadow-xs"
                        />
                        <div>
                          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Foto KTP Pemilik Siap Diverifikasi</span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-0.5">Dokumen terenkripsi 256-bit aman.</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ktpPhotoPreview: null })}
                        className="p-2 rounded-xl bg-white/10 border border-red-400/40 text-red-400 hover:bg-red-500/20 transition shadow-2xs"
                        title="Hapus / Ganti Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="owner-ktp-input"
                      className="border-2 border-dashed border-white/20 hover:border-emerald-400 rounded-2xl p-6 text-center cursor-pointer transition bg-white/5 hover:bg-white/10 block"
                    >
                      <Upload className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
                      <div className="text-xs sm:text-sm font-bold text-white">
                        Klik untuk Memilih File KTP Pemilik Toko
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Format JPG, PNG (Maks 5 MB).
                      </div>
                      <input
                        id="owner-ktp-input"
                        type="file"
                        accept="image/*"
                        onChange={handleKtpPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="bg-emerald-500/20 p-4 rounded-2xl border border-emerald-400/30 flex items-start gap-3 text-xs text-emerald-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm">Keamanan Escrow & Asuransi Alat Rental</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Penyewa wajib melampirkan deposit/KTP asli saat pengambilan unit di outlet Anda. Dana tersimpan aman di sistem escrow Xendit.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-3.5 rounded-2xl border border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm font-bold transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_8px_25px_rgba(16,185,129,0.35)] transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{isLoading ? "Mengaktifkan Toko Mitra..." : step === 3 ? "Selesaikan & Buka Toko Mitra" : "Lanjutkan"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Footer Info */}
      <div className="max-w-3xl w-full mx-auto text-center text-xs text-slate-400 z-10 mt-4">
        © 2026 Bantuin Mitra Hub. Akses khusus merchant terverifikasi di 38 Provinsi Indonesia.
      </div>

    </div>
  );
}
