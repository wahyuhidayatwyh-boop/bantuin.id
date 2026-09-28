"use client";

export const dynamic = "force-dynamic";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LocationPickerMap from "@/components/map/LocationPickerMap";
import { reverseGeocodeCoordinates } from "@/lib/services/gpsService";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDeadlineWithHour, formatNumberWithDots, parseNumberFromDots } from "@/lib/utils";
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Calendar,
  FileText, 
  AlertCircle, 
  ArrowRight,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Send,
  Info,
  Navigation,
  Loader2,
  Camera,
  ImagePlus,
  X,
  Trash2,
  Maximize2,
  FileImage,
  UserCheck,
  Scale,
  Ban
} from "lucide-react";
import { detectProhibitedContent } from "@/lib/security";
import CategoryIcon from "@/components/common/CategoryIcon";
import { BANTUAN_CATEGORIES } from "@/lib/categories";
import { FormSkeleton } from "@/components/skeletons/FormSkeleton";

function CreateRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetHelper = searchParams.get("helper");

  const { 
    createRequest, 
    bantuinPoints, 
    currentUser, 
    userCoordinates, 
    userRealLocation, 
    selectedLocation,
    activeKabupaten,
    detectUserLocation 
  } = useApp();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ambil Dokumen");
  const [mode, setMode] = useState("offline");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [previewModalPhoto, setPreviewModalPhoto] = useState(null);
  
  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Legal & Item Safety Declaration (Pola Grab/Gojek Self-Declaration)
  const [itemType, setItemType] = useState("Dokumen / Berkas");
  const [legalDeclarationChecked, setLegalDeclarationChecked] = useState(false);
  const [prohibitedWarning, setProhibitedWarning] = useState(null);

  const processImageFiles = (files) => {
    setPhotoError(null);
    const validImageFiles = [];
    let hasInvalid = false;

    files.forEach((file) => {
      if (file.type && file.type.startsWith("image/")) {
        validImageFiles.push({
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name || "Foto Lampiran",
          size: file.size || 0,
          type: file.type || "image/jpeg",
        });
      } else {
        hasInvalid = true;
      }
    });

    if (hasInvalid) {
      setPhotoError("Hanya file foto/gambar (JPG, PNG, WEBP, GIF, dll) yang diperbolehkan.");
    }

    if (validImageFiles.length > 0) {
      setPhotoFiles((prev) => [...prev, ...validImageFiles]);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    processImageFiles(files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      processImageFiles(droppedFiles);
    }
  };

  const handleRemovePhoto = (indexToRemove) => {
    if (previewModalPhoto && previewModalPhoto.index === indexToRemove) {
      setPreviewModalPhoto(null);
    }
    setPhotoFiles((prev) => {
      const removed = prev[indexToRemove];
      if (removed?.previewUrl) {
        try { URL.revokeObjectURL(removed.previewUrl); } catch (_) {}
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
    if (photoFiles.length <= 1) {
      setPhotoError(null);
    }
  };
  
  // Custom Location & Map Pin Picker States
  const [locationName, setLocationName] = useState(
    userRealLocation?.fullAddress || selectedLocation || ""
  );
  const [coords, setCoords] = useState(
    userCoordinates || 
    (userRealLocation ? { latitude: userRealLocation.latitude, longitude: userRealLocation.longitude } : { latitude: -7.9044, longitude: 110.0543 })
  );
  const [pickupPoint, setPickupPoint] = useState("");
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const handleUseMyGPS = async () => {
    setIsDetectingGPS(true);
    try {
      let loc = userRealLocation;
      if (!loc || !userCoordinates) {
        loc = await detectUserLocation();
      }
      if (loc) {
        const address = loc.fullAddress || `${loc.district ? loc.district + ", " : ""}${loc.city}`;
        setLocationName(address);
        setCoords({ latitude: loc.latitude, longitude: loc.longitude });
      }
    } catch (e) {
      console.warn("GPS detection failed in create page:", e);
    } finally {
      setIsDetectingGPS(false);
    }
  };

  const handleMapLocationChange = ({ latitude, longitude }) => {
    setCoords({ latitude, longitude });
  };

  const handleSyncAddressFromCoords = async () => {
    if (!coords) return;
    setIsReverseGeocoding(true);
    try {
      const res = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      if (res && (res.fullAddress || res.shortLocation)) {
        setLocationName(res.fullAddress || res.shortLocation);
      }
    } catch (e) {
      console.warn("Failed to reverse geocode clicked point:", e);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const [deadlineMode, setDeadlineMode] = useState("preset"); // 'preset' | 'custom'
  const [presetDeadline, setPresetDeadline] = useState("today_sore");

  // Helper date generators for YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const getDayAfterTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [customDate, setCustomDate] = useState(getTodayStr());
  const [customTime, setCustomTime] = useState("17:00");
  const [rewardAmount, setRewardAmount] = useState("");
  const [isVoluntary, setIsVoluntary] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = BANTUAN_CATEGORIES.filter((c) => c.id !== "Semua").map((c) => c.label);

  const calculateDeadlineTimestamp = () => {
    const now = new Date();
    if (deadlineMode === "preset") {
      if (presetDeadline === "1h") {
        return new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
      }
      if (presetDeadline === "2h") {
        return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      }
      if (presetDeadline === "4h") {
        return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
      }
      if (presetDeadline === "today_siang") {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
        return d.toISOString();
      }
      if (presetDeadline === "today_sore") {
        const d = new Date();
        d.setHours(17, 0, 0, 0);
        if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
        return d.toISOString();
      }
      if (presetDeadline === "today_malam") {
        const d = new Date();
        d.setHours(20, 0, 0, 0);
        if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
        return d.toISOString();
      }
      if (presetDeadline === "tomorrow_pagi") {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(10, 0, 0, 0);
        return d.toISOString();
      }
      if (presetDeadline === "tomorrow_siang") {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(14, 0, 0, 0);
        return d.toISOString();
      }
      if (presetDeadline === "tomorrow_sore") {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(17, 0, 0, 0);
        return d.toISOString();
      }
      if (presetDeadline === "2days_17") {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        d.setHours(17, 0, 0, 0);
        return d.toISOString();
      }
      return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    } else {
      const [h, m] = (customTime || "17:00").split(":").map(Number);
      const d = new Date(customDate || getTodayStr());
      d.setHours(h !== undefined ? h : 17, m !== undefined ? m : 0, 0, 0);
      return d.toISOString();
    }
  };

  const getDeadlineDisplayText = () => {
    const iso = calculateDeadlineTimestamp();
    return formatDeadlineWithHour(iso);
  };

  const validate = () => {
    const errs = {};
    if (!title.trim() || title.length < 5) {
      errs.title = "Judul minimal 5 karakter";
    }
    if (!description.trim() || description.length < 15) {
      errs.description = "Deskripsi minimal 15 karakter agar helper memahami kebutuhan tugas Anda.";
    }

    // Safety & Prohibited Content Detection (Risk Classification: BLOCK vs REVIEW)
    const checkText = `${title} ${description}`;
    const safetyCheck = detectProhibitedContent(checkText);
    if (safetyCheck.flagged) {
      setProhibitedWarning(safetyCheck);
      if (safetyCheck.severity === "BLOCK") {
        errs.prohibited = safetyCheck.reason;
      }
    } else {
      setProhibitedWarning(null);
    }

    if (mode === "offline" && !locationName.trim()) {
      errs.locationName = "Tentukan alamat atau titik lokasi penjemputan/tugas";
    }
    if (mode === "offline" && !legalDeclarationChecked) {
      errs.legalDeclaration = "Wajib menyetujui pernyataan kepatuhan muatan barang sebelum mempublikasikan permintaan.";
    }
    if (!isVoluntary && (!rewardAmount || Number(rewardAmount) < 1000)) {
      errs.rewardAmount = "Nominal imbalan minimal Rp1.000 (atau aktifkan mode sukarela)";
    }
    if (deadlineMode === "custom") {
      if (!customDate) {
        errs.customDeadline = "Pilih tanggal batas waktu";
      } else if (!customTime) {
        errs.customDeadline = "Tentukan jam batas waktu (Contoh: 17:00)";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const deadlineDate = calculateDeadlineTimestamp();

    try {
      let uploadedAttachments = [];

      // Upload file hanya jika form valid dan disubmit secara resmi
      if (photoFiles.length > 0) {
        const formData = new FormData();
        photoFiles.forEach((item) => {
          if (item.file) formData.append("files", item.file);
        });
        formData.append("folder", "requests");

        try {
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const uploadData = await uploadRes.json();
          if (uploadData.success && Array.isArray(uploadData.urls)) {
            uploadedAttachments = uploadData.urls;
          }
        } catch (uploadErr) {
          console.warn("Upload to storage error:", uploadErr);
        }
      }

      const payload = {
        requesterId: currentUser?.id,
        userEmail: currentUser?.email,
        userName: currentUser?.fullName || currentUser?.name || "",
        userAvatar: currentUser?.avatarUrl || currentUser?.avatar || "",
        userCampus: currentUser?.campusName || currentUser?.campus || currentUser?.location || "",
        title: title.trim(),
        description: description.trim(),
        category,
        mode,
        locationName: mode === "online" ? "Online / Remote" : (locationName.trim() || "Lokasi Pengguna"),
        latitude: coords?.latitude || userCoordinates?.latitude || null,
        longitude: coords?.longitude || userCoordinates?.longitude || null,
        deadline: deadlineDate,
        rewardAmount: isVoluntary ? 0 : Number(rewardAmount),
        isVoluntary,
        attachments: uploadedAttachments,
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mempublikasikan permintaan bantuan.");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_activity_updated"));
      }

      if (data.data?.id) {
        router.push(`/bantuan/${data.data.id}`);
      } else {
        router.push("/bantuan");
      }
    } catch (err) {
      console.error("Create request failed:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err.message || "Terjadi kesalahan saat mempublikasikan permintaan.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-8 sm:py-10">
        
        {/* Navigation Back */}
        <Link
          href="/bantuan"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Bantuan</span>
        </Link>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Buat Permintaan Bantuan Baru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Publikasikan kebutuhan tugas Anda. Tenaga bantuan terverifikasi di sekitar Anda akan langsung mengajukan tawaran bantuan.
          </p>
        </div>

        {/* Banner Ditujukan ke Tenaga Bantuan Tertentu (Jika Dipilih dari Card / Modal) */}
        {targetHelper && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1683FF] text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">
                  Permintaan Khusus untuk: <span className="text-[#1683FF] font-black underline">{targetHelper}</span>
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Tenaga bantuan ini akan menerima prioritas notifikasi tugas dan penawaran langsung dari Anda.
                </p>
              </div>
            </div>
            <Link
              href="/bantuan/create"
              className="text-xs font-bold text-slate-500 hover:text-slate-800 underline self-start sm:self-auto shrink-0"
            >
              Hapus Target Khusus
            </Link>
          </div>
        )}

        {/* UNIFIED COHESIVE MODERN CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 lg:p-10 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            
            {/* Main Form (8 Columns on desktop, Order-1 on mobile) */}
            <div className="lg:col-span-8 space-y-6 order-1">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                
                {/* Judul Kebutuhan */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                    Judul Kebutuhan Tugas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Ambil Map Dokumen Notaris di Menara Kuningan Lantai 8"
                    className={`w-full text-xs sm:text-sm p-3.5 rounded-xl border transition ${
                      errors.title ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#1683FF]"
                    } focus:outline-none font-medium`}
                  />
                  {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
                </div>

                {/* Kategori & Mode Pelaksanaan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                      Kategori Tugas <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                      Mode Pelaksanaan <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMode("offline")}
                        className={`py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          mode === "offline"
                            ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Tatap Muka</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("online")}
                        className={`py-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          mode === "online"
                            ? "bg-purple-50 border-purple-400 text-purple-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>Online / Remote</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Deskripsi Lengkap */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-2">
                    Deskripsi & Rincian Tugas <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan secara rinci apa yang perlu dilakukan, barang/dokumen yang dibawa, instruksi keselamatan, dan detail penerima..."
                    className={`w-full text-xs sm:text-sm p-4 rounded-xl border transition ${
                      errors.description ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#1683FF]"
                    } focus:outline-none leading-relaxed`}
                  />
                  {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
                </div>

                {/* Upload Foto Barang / Bukti Tugas (Opsional) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <label className="block text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#1683FF]" />
                        <span>Foto Barang / Bukti Kebutuhan</span>
                        <span className="text-[11px] font-normal text-slate-400">(Opsional)</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Lampirkan foto barang yang ingin dititip beli, bukti dokumen, foto lokasi, atau barang yang perlu dipindahkan agar helper langsung memahami kebutuhan Anda.
                      </p>
                    </div>
                    {photoFiles.length > 0 && (
                      <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 self-start sm:self-auto shrink-0">
                        {photoFiles.length} Foto Terlampir
                      </span>
                    )}
                  </div>

                  {/* Preview Thumbnails */}
                  {photoFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {photoFiles.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setPreviewModalPhoto({ ...item, index: idx })}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-2xs cursor-pointer hover:ring-2 hover:ring-[#1683FF] transition duration-200"
                        >
                          <img
                            src={item.previewUrl}
                            alt={item.name || `Lampiran barang ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          />
                          
                          {/* Hover Overlay with View Icon */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center gap-1 text-white">
                            <Eye className="w-5 h-5 drop-shadow-sm" />
                            <span className="text-[10px] font-bold">Lihat Detail</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(idx);
                            }}
                            className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-slate-900/80 hover:bg-red-600 text-white shadow-xs transition cursor-pointer z-10"
                            title="Hapus foto"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
                            <span className="px-1.5 py-0.5 rounded bg-slate-900/70 text-white text-[10px] font-bold">
                              Foto {idx + 1}
                            </span>
                            {item.size > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-900/70 text-white text-[9px] font-medium">
                                {formatFileSize(item.size)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Drop Zone */}
                  <label
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                      isDragging
                        ? "border-[#1683FF] bg-blue-50/80 scale-[1.01] ring-4 ring-blue-100"
                        : "border-slate-300 hover:border-[#1683FF] bg-white hover:bg-blue-50/20"
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2.5 transition-all duration-200 ${
                        isDragging
                          ? "bg-[#1683FF] text-white scale-110 shadow-md"
                          : "bg-blue-50 text-[#1683FF] group-hover:scale-110"
                      }`}
                    >
                      <ImagePlus className="w-6 h-6" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#1683FF] transition">
                      {isDragging
                        ? "Lepaskan foto di sini untuk mengunggah"
                        : "Tarik & lepas foto ke sini, atau klik untuk memilih file"}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Hanya format gambar: JPG, PNG, WEBP, GIF (Bisa pilih lebih dari 1 foto)
                    </span>
                  </label>

                  {/* Foto Error Alert if non-image dropped/selected */}
                  {photoError && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{photoError}</span>
                    </div>
                  )}
                </div>

                {/* Lokasi Bebas & Tentukan Titik Peta (jika Tatap Muka) */}
                {mode === "offline" && (
                  <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/60">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#1683FF]" />
                          <span>Tentukan Lokasi &amp; Titik Tugas</span>
                          <span className="text-red-500">*</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Anda dapat mengetik alamat bebas dan mengklik titik di peta secara presisi.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleUseMyGPS}
                        disabled={isDetectingGPS}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/80 transition shadow-2xs cursor-pointer self-start sm:self-auto"
                      >
                        {isDetectingGPS ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Mendeteksi GPS...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Gunakan GPS Saya</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Interactive Map Pin Picker */}
                    <div>
                      <LocationPickerMap
                        latitude={coords?.latitude || -7.9044}
                        longitude={coords?.longitude || 110.0543}
                        onChange={handleMapLocationChange}
                        height="260px"
                      />
                      
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>
                            Titik Pin Terkunci: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "Belum ditentukan"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleSyncAddressFromCoords}
                          disabled={isReverseGeocoding}
                          className="text-[#1683FF] hover:text-[#0F6FE5] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          {isReverseGeocoding ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Membaca Alamat Pin...</span>
                            </>
                          ) : (
                            <span>Gunakan Alamat dari Titik Pin Peta</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 2 Fields: Alamat Utama Bebas & Patokan Spesifik */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                      {/* Field 1: Alamat / Nama Tempat Bebas */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Nama Alamat / Tempat Tugas <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          placeholder="Contoh: Jl. Pantai Glagah No. 12, Temon, Kulon Progo"
                          className={`w-full text-xs sm:text-sm p-3 rounded-xl border transition ${
                            errors.locationName ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#1683FF]"
                          } focus:outline-none bg-white font-medium`}
                        />
                        {errors.locationName && <p className="text-[11px] text-red-500 mt-1">{errors.locationName}</p>}
                      </div>

                      {/* Field 2: Patokan Titik Temu Spesifik */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Patokan Titik Temu Spesifik <span className="text-slate-400 font-normal">(Bebas Ditentukan)</span>
                        </label>
                        <input
                          type="text"
                          value={pickupPoint}
                          onChange={(e) => setPickupPoint(e.target.value)}
                          placeholder="Contoh: Depan pos satpam, lobby terminal, atau kasir toko"
                          className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-[#1683FF] focus:outline-none bg-white font-medium"
                        />
                        {/* Quick tags */}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <span className="text-[10px] text-slate-400 font-medium">Cepat:</span>
                          {["Pos Satpam", "Lobby Utama", "Minimarket Terdekat", "Gerbang Masuk", "Parkiran"].map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setPickupPoint(sug)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-blue-50 hover:text-[#1683FF] text-slate-600 border border-slate-200 transition font-medium cursor-pointer"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Budget Imbalan & Batas Waktu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-bold text-slate-900">
                        Budget Imbalan (Rp) {!isVoluntary && <span className="text-red-500">*</span>}
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isVoluntary}
                          onChange={(e) => setIsVoluntary(e.target.checked)}
                          className="rounded border-slate-300 text-[#1683FF] focus:ring-0"
                        />
                        <span className="text-xs text-slate-500">Bantuan Sukarela</span>
                      </label>
                    </div>

                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none select-none">
                        Rp
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={isVoluntary}
                        value={isVoluntary ? "" : formatNumberWithDots(rewardAmount)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          setRewardAmount(raw);
                        }}
                        placeholder={isVoluntary ? "Gratis / Sukarela" : "Misal: 35.000"}
                        className={`w-full text-xs sm:text-sm pl-10 pr-3.5 py-3.5 rounded-xl border transition ${
                          isVoluntary ? "bg-slate-100 text-slate-400" : "border-slate-200 bg-white focus:border-[#1683FF]"
                        } focus:outline-none font-bold text-slate-900`}
                      />
                    </div>
                    {errors.rewardAmount && <p className="text-[11px] text-red-500 mt-1">{errors.rewardAmount}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs sm:text-sm font-bold text-slate-900">
                        Batas Hari & Jam (Deadline) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
                        <button
                          type="button"
                          onClick={() => setDeadlineMode("preset")}
                          className={`px-2.5 py-1 rounded-md font-bold transition ${
                            deadlineMode === "preset"
                              ? "bg-white text-[#1683FF] shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Pilihan Cepat
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeadlineMode("custom")}
                          className={`px-2.5 py-1 rounded-md font-bold transition ${
                            deadlineMode === "custom"
                              ? "bg-[#1683FF] text-white shadow-2xs"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          Tentukan Tanggal & Jam
                        </button>
                      </div>
                    </div>

                    {deadlineMode === "preset" ? (
                      <div className="space-y-2.5">
                        <select
                          value={presetDeadline}
                          onChange={(e) => setPresetDeadline(e.target.value)}
                          className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1683FF]"
                        >
                          <option value="1h">Hari Ini · 1 Jam dari Sekarang (Kilat)</option>
                          <option value="2h">Hari Ini · 2 Jam dari Sekarang (Mendesak)</option>
                          <option value="4h">Hari Ini · 4 Jam dari Sekarang</option>
                          <option value="today_siang">Hari Ini · Jam 12.00 WIB (Siang)</option>
                          <option value="today_sore">Hari Ini · Jam 17.00 WIB (Sore)</option>
                          <option value="today_malam">Hari Ini · Jam 20.00 WIB (Malam)</option>
                          <option value="tomorrow_pagi">Besok · Jam 10.00 WIB (Pagi)</option>
                          <option value="tomorrow_siang">Besok · Jam 14.00 WIB (Siang)</option>
                          <option value="tomorrow_sore">Besok · Jam 17.00 WIB (Sore)</option>
                          <option value="2days_17">2 Hari ke Depan · Jam 17.00 WIB</option>
                        </select>
                        <div className="text-[11px] text-[#1683FF] bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex items-center gap-2 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                          <span>Batas Target Selesai: <strong>{getDeadlineDisplayText()}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3.5">
                        {/* 1. Pilih Hari / Tanggal */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              Pilih Hari / Tanggal:
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setCustomDate(getTodayStr())}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                                  customDate === getTodayStr()
                                    ? "bg-[#1683FF] text-white border-[#1683FF]"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                Hari Ini
                              </button>
                              <button
                                type="button"
                                onClick={() => setCustomDate(getTomorrowStr())}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                                  customDate === getTomorrowStr()
                                    ? "bg-[#1683FF] text-white border-[#1683FF]"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                Besok
                              </button>
                              <button
                                type="button"
                                onClick={() => setCustomDate(getDayAfterTomorrowStr())}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                                  customDate === getDayAfterTomorrowStr()
                                    ? "bg-[#1683FF] text-white border-[#1683FF]"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                Lusa
                              </button>
                            </div>
                          </div>
                          <input
                            type="date"
                            min={getTodayStr()}
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#1683FF]"
                          />
                        </div>

                        {/* 2. Pilih Jam Target */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              Tentukan Jam Selesai (WIB):
                            </span>
                            <div className="flex items-center gap-1">
                              {["12:00", "15:00", "17:00", "20:00"].map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setCustomTime(t)}
                                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition border ${
                                    customTime === t
                                      ? "bg-[#1683FF] text-white border-[#1683FF]"
                                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            type="time"
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-none focus:border-[#1683FF]"
                          />
                        </div>

                        {/* Live Confirmation */}
                        <div className="text-[11px] text-[#1683FF] bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex items-center gap-2 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                          <span>Batas Target Selesai: <strong>{getDeadlineDisplayText()}</strong></span>
                        </div>
                      </div>
                    )}
                    {errors.customDeadline && <p className="text-[11px] text-red-500 mt-1">{errors.customDeadline}</p>}
                  </div>
                </div>

                {/* Prohibited Content Detected Alert */}
                {prohibitedWarning && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-900">
                      <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Pelanggaran Konten &amp; Kepatuhan: {prohibitedWarning.category}</span>
                    </div>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      {prohibitedWarning.reason}
                    </p>
                    <div className="text-[11px] text-rose-600 font-medium">
                      Silakan ubah rincian tugas Anda agar mematuhi Syarat &amp; Ketentuan dan kode etik kampus sebelum melanjutkan.
                    </div>
                  </div>
                )}

                {/* DEKLARASI MUATAN BARANG & KEPATUHAN HUKUM (POLA GRAB/GOJEK) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-[#1683FF]">
                        <Scale className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-slate-900">
                        Deklarasi Muatan &amp; Kepatuhan Hukum {mode === "offline" && <span className="text-red-500">*</span>}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1683FF] bg-white px-2 py-0.5 rounded-md border border-blue-100">
                      Standar Kepatuhan PSE
                    </span>
                  </div>

                  {mode === "offline" && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Jenis Muatan / Barang yang Ditangani: <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          "Dokumen / Berkas",
                          "Makanan / Minuman",
                          "Pakaian / Laundry",
                          "Gadget / Elektronik",
                          "Belanja Kebutuhan",
                          "Lainnya (Legal)"
                        ].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setItemType(item)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition border ${
                              itemType === item
                                ? "bg-[#1683FF] text-white border-[#1683FF] shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={legalDeclarationChecked}
                      onChange={(e) => setLegalDeclarationChecked(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF]"
                    />
                    <span className="text-[11px] text-slate-700 leading-relaxed select-none">
                      Saya menyatakan dan menjamin bahwa muatan/tugas ini <strong>aman, legal menurut hukum RI</strong>, dan <strong>bebas dari narkotika, miras oplosan, senjata, atau barang curian</strong>. Segala ketidaksesuaian atau kebohongan isi muatan menjadi tanggung jawab penuh pihak pengirim sesuai peraturan perundang-undangan yang berlaku dan Syarat &amp; Ketentuan Layanan. {mode === "offline" && <span className="text-red-500 font-bold">*</span>}
                    </span>
                  </label>
                  {errors.legalDeclaration && (
                    <p className="text-[11px] text-red-500 font-semibold">{errors.legalDeclaration}</p>
                  )}
                </div>

                {/* Error Banner */}
                {errors.submit && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{errors.submit}</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <Link
                    href="/bantuan"
                    className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition text-center"
                  >
                    Batal
                  </Link>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mempublikasikan Permintaan...</span>
                      </>
                    ) : (
                      <>
                        <span>Publikasikan Permintaan Bantuan</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Sidebar Preview & Escrow Guarantee (4 Columns, Order-2) */}
            <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-8 space-y-6 order-2">
              
              {/* Live Preview Section */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pratinjau Kartu Tugas
                </div>

                <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      <CategoryIcon category={category} className="w-3 h-3 text-[#1683FF] shrink-0" />
                      <span>{category}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {mode === "online" ? "Online" : "Tatap Muka"}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2">
                    {title || "Judul Kebutuhan Anda..."}
                  </h4>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {description || "Rincian tugas akan ditampilkan di sini agar helper mudah memahami..."}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Batas: {getDeadlineDisplayText()}</span>
                  </div>

                  {mode === "offline" && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-600 font-medium pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">
                          {locationName || "Lokasi belum ditentukan"}
                        </div>
                        {pickupPoint && (
                          <div className="text-[10px] text-slate-500 truncate">
                            Patokan: {pickupPoint}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400 font-medium">Imbalan</div>
                    <div className="font-extrabold text-sm text-[#1683FF]">
                      {isVoluntary ? "Sukarela" : formatIDR(Number(rewardAmount) || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantee Pill (Integrated) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">Garansi Pembayaran Terverifikasi</div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Dana imbalan Anda diproses aman via Payment Gateway resmi dan hak bayar baru dapat dicairkan setelah Anda menyetujui hasil kerja tenaga bantuan.
                  </p>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Image Detail & Preview Lightbox Modal */}
        {previewModalPhoto && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
            onClick={() => setPreviewModalPhoto(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1683FF] flex items-center justify-center shrink-0">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      Detail Foto #{previewModalPhoto.index + 1}: {previewModalPhoto.name}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalPhoto(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: Image View & File Meta */}
              <div className="p-6 overflow-y-auto space-y-4">
                {/* Full-view Image Canvas */}
                <div className="bg-slate-950 rounded-2xl flex items-center justify-center p-3 max-h-[50vh] min-h-[220px] overflow-hidden">
                  <img
                    src={previewModalPhoto.previewUrl}
                    alt={previewModalPhoto.name}
                    className="max-h-[46vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                  />
                </div>

                {/* File Metadata Info */}
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama File</span>
                    <span className="font-semibold text-slate-800 truncate block mt-0.5" title={previewModalPhoto.name}>
                      {previewModalPhoto.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Ukuran File</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {formatFileSize(previewModalPhoto.size)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Tipe Format</span>
                    <span className="font-semibold text-slate-800 block mt-0.5 uppercase">
                      {previewModalPhoto.type?.replace("image/", "") || "IMG"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(previewModalPhoto.index)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Foto Ini</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalPhoto(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs transition cursor-pointer shadow-xs"
                >
                  Tutup Pralihat
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function CreateRequestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
        <Navbar />
        <main className="flex-1">
          <FormSkeleton />
        </main>
        <Footer />
      </div>
    }>
      <CreateRequestForm />
    </Suspense>
  );
}
