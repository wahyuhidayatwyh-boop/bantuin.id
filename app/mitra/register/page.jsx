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
  AlertCircle,
  Clock
} from "lucide-react";

export default function MitraRegisterPage() {
  const router = useRouter();
  const { addToast } = useApp();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsSuccessMsg, setGpsSuccessMsg] = useState("");
  const [gpsErrorMsg, setGpsErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    // Step 1: Profil Usaha
    storeName: "",
    businessCategory: "Rental Kamera & Lensa",
    customCategory: "",
    email: "",
    phone: "",
    operatingHours: "08.00 - 21.00 WIB",
    storePhotoPreview: null,
    storePhotoFileName: "",

    // Step 2: Lokasi Fisik & GPS
    province: "Kalimantan Selatan",
    city: "Kota Banjarmasin",
    district: "Banjarmasin Tengah",
    address: "",
    gpsCoordinates: null,

    // Step 3: Legalitas Pemilik & Rekening Payout
    ownerName: "",
    ownerNik: "",
    ktpPhotoPreview: null,
    ktpPhotoFileName: "",
    bankName: "BCA",
    accountNumber: "",
    accountHolder: "",
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
        gpsCoordinates: loc.coordinates || { lat: -3.3194, lng: 114.5908 },
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
      setFormData({ 
        ...formData, 
        storePhotoPreview: previewUrl,
        storePhotoFileName: file.name
      });
    }
  };

  const handleKtpPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFormData({ 
        ...formData, 
        ktpPhotoPreview: previewUrl,
        ktpPhotoFileName: file.name
      });
    }
  };

  const handleNext = (e) => {
    e.preventDefault();

    if (step === 3) {
      if (!formData.ownerNik || formData.ownerNik.length < 16) {
        addToast?.("NIK Belum Valid", "Harap masukkan 16 digit NIK pemilik toko yang valid.", "error");
        return;
      }
      if (!formData.ktpPhotoPreview) {
        addToast?.("Foto KTP Belum Diunggah", "Harap unggah foto KTP asli pemilik untuk validasi legalitas toko.", "error");
        return;
      }
      if (!formData.accountNumber) {
        addToast?.("Nomor Rekening Belum Diisi", "Harap masukkan nomor rekening untuk pencairan hak sewa.", "error");
        return;
      }
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      setTimeout(() => {
        addToast?.("Pendaftaran Mitra Berhasil!", "Toko Anda telah terdaftar. Dokumen legalitas sedang dalam verifikasi admin.");
        router.push("/mitra/dashboard");
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 flex flex-col justify-between py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Top Bar Navigation */}
      <div className="max-w-3xl w-full mx-auto flex items-center justify-between z-10 mb-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logoImg}
            alt="Bantuin"
            height={38}
            className="h-8 sm:h-9 w-auto object-contain mix-blend-multiply"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          <Link
            href="/auth/register"
            className="text-xs text-slate-600 hover:text-[#1683FF] transition font-medium"
          >
            Daftar User / Freelancer
          </Link>
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <Link
            href="/mitra/login"
            className="text-xs sm:text-sm text-slate-600 hover:text-[#1683FF] font-bold transition"
          >
            Sudah Mitra? <strong className="text-[#1683FF]">Masuk</strong>
          </Link>
        </div>
      </div>

      {/* Center Large Registration Stepper */}
      <div className="max-w-3xl w-full mx-auto my-auto z-10">
        
        {/* Progress Stepper */}
        <div className="mb-5 sm:mb-6">
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600 mb-2 gap-2">
            <span className="truncate">Langkah {step} dari 3: {
              step === 1 ? "Profil Usaha & Identitas Toko" :
              step === 2 ? "Lokasi Fisik Toko & GPS" : "Legalitas KTP & Rekening Payout"
            }</span>
            <span className="text-[#1683FF] font-extrabold shrink-0">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full h-2 sm:h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#1683FF] to-[#0F6FE5] transition-all duration-300 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Large Step Form Card */}
        <div className="bg-white rounded-2xl sm:rounded-[32px] border border-slate-200/90 p-5 sm:p-8 md:p-10 shadow-[0_16px_45px_rgba(22,131,255,0.08)]">
          <form onSubmit={handleNext} className="space-y-4 sm:space-y-5">
            
            {/* STEP 1: PROFIL USAHA MITRA */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1683FF] flex items-center justify-center font-bold shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Pendaftaran Mitra Toko &amp; Rental Fisik
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Buka etalase rental kamera, percetakan, sound system, alat camping, atau studio di ekosistem Bantuin.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Toko / Nama Usaha Vendor
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Yogya Cam Rental Official"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori Utama Bisnis Toko
                  </label>
                  <select
                    value={formData.businessCategory}
                    onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.businessCategory.startsWith("Lainnya") && (
                  <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 animate-in fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tuliskan Kategori Usaha Anda:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Rental Jas & Kostum, Rental Tenda & Kursi Pesta, Servis Drone..."
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Bisnis / Toko
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="toko@bisnis.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor WhatsApp Toko
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="081234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jam Operasional Toko
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Contoh: 08.00 - 21.00 WIB (Senin - Minggu)"
                      value={formData.operatingHours}
                      onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOKASI FISIK TOKO & TITIK GPS */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1683FF] flex items-center justify-center font-bold shrink-0">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Lokasi Fisik Toko &amp; Titik Peta GPS
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Penyewa akan mendatangi toko fisik Anda untuk serah terima barang dan menitipkan kartu identitas asli.
                    </p>
                  </div>
                </div>

                {/* GPS Detector Banner */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1683FF] text-white flex items-center justify-center shrink-0 shadow-sm relative font-black">
                      <Navigation className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>Kunci Koordinat GPS Toko</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        Memudahkan pelanggan membuka rute Google Maps langsung ke outlet Anda.
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
                        <span>Mengunci Titik Peta...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Kunci Titik GPS Sekarang</span>
                      </>
                    )}
                  </button>
                </div>

                {gpsSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{gpsSuccessMsg}</span>
                  </div>
                )}
                {gpsErrorMsg && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Lengkap Toko / Ruko / Workshop &amp; Patokan
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Contoh: Jl. Ahmad Yani KM 5 No. 42 (Sebelah Kantor Pos / Minimarket)"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl p-4 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                  />
                </div>

                {/* Upload Foto Toko dari Lokal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Foto Tampak Depan / Plang Toko (Unggah dari File Lokal)
                  </label>

                  {formData.storePhotoPreview ? (
                    <div className="relative rounded-2xl border-2 border-[#1683FF]/40 p-4 bg-blue-50/50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={formData.storePhotoPreview}
                          alt="Store Preview"
                          className="w-20 h-14 rounded-xl object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                            <span>Foto Toko Berhasil Dimuat</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {formData.storePhotoFileName || "foto_toko.jpg"}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, storePhotoPreview: null, storePhotoFileName: "" })}
                        className="p-2 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 transition shadow-2xs cursor-pointer"
                        title="Hapus / Ganti Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="store-photo-input"
                      className="border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50 block"
                    >
                      <Upload className="w-7 h-7 text-[#1683FF] mx-auto mb-2" />
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        Klik untuk Memilih Foto Toko dari File Lokal
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
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

            {/* STEP 3: LEGALITAS PEMILIK, UPLOAD KTP & REKENING PAYOUT */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#1683FF] flex items-center justify-center font-bold shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      Legalitas KTP &amp; Rekening Payout
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Hak sewa toko akan dicairkan via transfer manual m-Banking oleh Admin Bantuin tanpa potongan biaya admin.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap Pemilik Usaha (Sesuai KTP &amp; Buku Tabungan)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Prasetyo"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor Induk Kependudukan (NIK Pemilik 16 Digit)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="Contoh: 3201234567890001"
                    value={formData.ownerNik}
                    onChange={(e) => setFormData({ ...formData, ownerNik: e.target.value })}
                    className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                  />
                </div>

                {/* Upload KTP Pemilik Usaha dari Lokal */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Foto KTP Asli Pemilik Usaha
                  </label>

                  {formData.ktpPhotoPreview ? (
                    <div className="relative rounded-2xl border-2 border-[#1683FF]/40 p-4 bg-blue-50/50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={formData.ktpPhotoPreview}
                          alt="KTP Preview"
                          className="w-20 h-14 rounded-xl object-cover border border-slate-200 shadow-xs"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                            <span>Foto KTP Pemilik Siap Diverifikasi</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {formData.ktpPhotoFileName || "ktp_pemilik.jpg"} &middot; Vault Terenkripsi AES-256
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ktpPhotoPreview: null, ktpPhotoFileName: "" })}
                        className="p-2 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 transition shadow-2xs cursor-pointer"
                        title="Hapus / Ganti Foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="owner-ktp-input"
                      className="border-2 border-dashed border-slate-300 hover:border-[#1683FF] rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50 block"
                    >
                      <Upload className="w-7 h-7 text-[#1683FF] mx-auto mb-2" />
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        Klik untuk Memilih File KTP Pemilik Toko
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Format JPG, PNG (Maks 5 MB). Dokumen dilindungi UU PDP.
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

                {/* Rekening Payout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Bank Tujuan Payout
                    </label>
                    <select
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                    >
                      <option value="BCA">Bank BCA</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">Bank BRI</option>
                      <option value="BNI">Bank BNI</option>
                      <option value="BSI">Bank BSI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor Rekening Bank
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 8820192841"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl px-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/20"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex items-start gap-3 text-xs text-slate-700">
                  <ShieldCheck className="w-5 h-5 text-[#1683FF] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">Proteksi Rekber Escrow &amp; Transfer Admin Bebas Biaya</div>
                    <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Penyewa wajib menitipkan KTP fisik asli di toko Anda saat serah terima barang. Pencairan hak sewa ditransfer utuh oleh admin via m-Banking tanpa potongan biaya transfer (Rp0).
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
                  className="px-5 py-3.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-4 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-black text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mendaftarkan Toko Mitra...</span>
                  </>
                ) : (
                  <>
                    <span>{step === 3 ? "Selesaikan & Buka Toko Mitra" : "Lanjutkan"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* Footer Info */}
      <div className="max-w-3xl w-full mx-auto text-center text-xs text-slate-400 z-10 mt-4">
        &copy; {new Date().getFullYear()} Bantuin.id &middot; Portal Resmi Mitra &amp; Merchant Rental Komunitas
      </div>

    </div>
  );
}
