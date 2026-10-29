"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LocationPickerMap from "@/components/map/LocationPickerMap";
import { reverseGeocodeCoordinates } from "@/lib/services/gpsService";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDeadlineWithHour, formatNumberWithDots } from "@/lib/utils";
import { saveFormDraft, getFormDraft, clearFormDraft, useBeforeUnload } from "@/lib/hooks/useFormDraft";
import { 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Calendar,
  AlertCircle, 
  ArrowRight,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Check,
  Send,
  Navigation,
  Loader2,
  Camera,
  ImagePlus,
  X,
  Trash2,
  FileImage,
  UserCheck,
  Scale,
  Ban,
  DollarSign,
  Globe,
  ClipboardList
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
    currentUser, 
    userCoordinates, 
    userRealLocation, 
    selectedLocation,
    detectUserLocation 
  } = useApp();

  // Wizard Step State (1: Rincian, 2: Lokasi & Waktu, 3: Imbalan & Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Form Fields - Step 1
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Kebutuhan Harian & Belanja");
  const [mode, setMode] = useState("offline");
  const [photoFiles, setPhotoFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [previewModalPhoto, setPreviewModalPhoto] = useState(null);

  // Form Fields - Step 2 (Location & Deadline)
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

  // Form Fields - Step 3 (Reward & Declaration)
  const [rewardAmount, setRewardAmount] = useState("");
  const [isVoluntary, setIsVoluntary] = useState(false);
  const [itemType, setItemType] = useState("Dokumen / Berkas");
  const [legalDeclarationChecked, setLegalDeclarationChecked] = useState(false);
  const [prohibitedWarning, setProhibitedWarning] = useState(null);

  // Submission & Validation States
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DRAFT_KEY = "bantuin_draft_create_bantuan";
  const hasLoadedDraftRef = useRef(false);

  // Restore draft from storage on mount
  useEffect(() => {
    if (hasLoadedDraftRef.current) return;
    hasLoadedDraftRef.current = true;
    const draft = getFormDraft(DRAFT_KEY, null);
    if (draft) {
      if (draft.title) setTitle(draft.title);
      if (draft.description) setDescription(draft.description);
      if (draft.category) setCategory(draft.category);
      if (draft.mode) setMode(draft.mode);
      if (draft.locationName) setLocationName(draft.locationName);
      if (draft.pickupPoint) setPickupPoint(draft.pickupPoint);
      if (draft.coords) setCoords(draft.coords);
      if (draft.deadlineMode) setDeadlineMode(draft.deadlineMode);
      if (draft.presetDeadline) setPresetDeadline(draft.presetDeadline);
      if (draft.customDate) setCustomDate(draft.customDate);
      if (draft.customTime) setCustomTime(draft.customTime);
      if (draft.rewardAmount) setRewardAmount(draft.rewardAmount);
      if (draft.isVoluntary !== undefined) setIsVoluntary(draft.isVoluntary);
      if (draft.itemType) setItemType(draft.itemType);
      if (draft.currentStep && Number(draft.currentStep) >= 1) {
        setCurrentStep(Number(draft.currentStep));
      }
    }
  }, []);

  // Auto-save draft on every change
  useEffect(() => {
    if (!hasLoadedDraftRef.current) return;
    if (title || description || rewardAmount || pickupPoint || currentStep > 1) {
      saveFormDraft(DRAFT_KEY, {
        title,
        description,
        category,
        mode,
        locationName,
        pickupPoint,
        coords,
        deadlineMode,
        presetDeadline,
        customDate,
        customTime,
        rewardAmount,
        isVoluntary,
        itemType,
        currentStep,
      });
    }
  }, [
    title,
    description,
    category,
    mode,
    locationName,
    pickupPoint,
    coords,
    deadlineMode,
    presetDeadline,
    customDate,
    customTime,
    rewardAmount,
    isVoluntary,
    itemType,
    currentStep,
  ]);

  const isFormDirty = Boolean(title.trim() || description.trim() || rewardAmount.trim());
  useBeforeUnload(isFormDirty, "Ada isian permohonan bantuan yang belum dipublikasikan. Yakin ingin meninggalkan halaman?");

  const categories = BANTUAN_CATEGORIES.filter((c) => c.id !== "Semua").map((c) => c.label);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

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

  // Step-Specific Validations
  const validateStep1 = () => {
    const errs = {};
    if (!title.trim() || title.trim().length < 5) {
      errs.title = "Judul kebutuhan minimal 5 karakter";
    }
    if (!description.trim() || description.trim().length < 15) {
      errs.description = "Deskripsi minimal 15 karakter agar helper memahami rincian tugas Anda.";
    }

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

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (mode === "offline" && !locationName.trim()) {
      errs.locationName = "Tentukan alamat atau nama lokasi penjemputan/tugas";
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

  const validateStep3 = () => {
    const errs = {};
    if (!isVoluntary && (!rewardAmount || Number(rewardAmount) < 1000)) {
      errs.rewardAmount = "Nominal imbalan minimal Rp1.000 (atau aktifkan opsi sukarela)";
    }
    if (mode === "offline" && !legalDeclarationChecked) {
      errs.legalDeclaration = "Wajib menyetujui pernyataan kepatuhan muatan barang sebelum mempublikasikan permintaan.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (currentUser?.verificationStatus === "suspended") {
      setErrors((prev) => ({
        ...prev,
        submit: "Akun Anda sedang ditangguhkan oleh Administrator Bantuin. Anda tidak dapat membuat permintaan bantuan baru.",
      }));
      return;
    }

    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      return;
    }

    setIsSubmitting(true);
    const deadlineDate = calculateDeadlineTimestamp();

    try {
      let uploadedAttachments = [];

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
        window.dispatchEvent(new Event("bantuin_requests_updated"));
        window.dispatchEvent(new Event("bantuin_activity_updated"));
      }

      if (data.data?.id) {
        clearFormDraft(DRAFT_KEY);
        router.push(`/bantuan/${data.data.id}`);
      } else {
        clearFormDraft(DRAFT_KEY);
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
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Navigation Back */}
        <Link
          href="/bantuan"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#1683FF] transition mb-4 sm:mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Bantuan</span>
        </Link>

        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Buat Permintaan Bantuan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Isi formulir bertahap di bawah ini agar tenaga bantuan di sekitar Anda dapat memberikan penawaran terbaik.
          </p>
        </div>

        {/* Banner Ditujukan ke Tenaga Bantuan Tertentu (Jika ada) */}
        {targetHelper && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1683FF] text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-700">
                Permintaan khusus untuk <strong className="text-[#1683FF]">{targetHelper}</strong>. Notifikasi prioritas akan dikirimkan langsung.
              </p>
            </div>
            <Link
              href="/bantuan/create"
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 underline shrink-0"
            >
              Batalkan
            </Link>
          </div>
        )}

        {/* MODERN CLEAN STEPPER BAR */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs">
          {/* Mobile Stepper Header */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1683FF]">
                Langkah {currentStep} dari 3
              </span>
              <span className="text-slate-500 font-medium">
                {currentStep === 1 && "Rincian Bantuan"}
                {currentStep === 2 && "Lokasi & Waktu"}
                {currentStep === 3 && "Imbalan & Review"}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#1683FF] h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Desktop Stepper */}
          <div className="hidden sm:grid grid-cols-3 gap-3">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition ${
                currentStep === 1 ? "bg-blue-50/80 border border-blue-200/60" : "hover:bg-slate-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                currentStep > 1 
                  ? "bg-emerald-500 text-white" 
                  : currentStep === 1 
                  ? "bg-[#1683FF] text-white" 
                  : "bg-slate-100 text-slate-500"
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold leading-tight ${currentStep === 1 ? "text-slate-900" : "text-slate-600"}`}>
                  1. Rincian Bantuan
                </p>
                <p className="text-[11px] text-slate-400 truncate">Judul, kategori & deskripsi</p>
              </div>
            </button>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => { if (validateStep1()) setCurrentStep(2); }}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition ${
                currentStep === 2 ? "bg-blue-50/80 border border-blue-200/60" : "hover:bg-slate-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                currentStep > 2 
                  ? "bg-emerald-500 text-white" 
                  : currentStep === 2 
                  ? "bg-[#1683FF] text-white" 
                  : "bg-slate-100 text-slate-500"
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold leading-tight ${currentStep === 2 ? "text-slate-900" : "text-slate-600"}`}>
                  2. Lokasi &amp; Waktu
                </p>
                <p className="text-[11px] text-slate-400 truncate">Titik peta &amp; batas deadline</p>
              </div>
            </button>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => { if (validateStep1() && validateStep2()) setCurrentStep(3); }}
              className={`flex items-center gap-3 p-3 rounded-xl text-left transition ${
                currentStep === 3 ? "bg-blue-50/80 border border-blue-200/60" : "hover:bg-slate-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${
                currentStep === 3 
                  ? "bg-[#1683FF] text-white" 
                  : "bg-slate-100 text-slate-500"
              }`}>
                3
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold leading-tight ${currentStep === 3 ? "text-slate-900" : "text-slate-600"}`}>
                  3. Imbalan &amp; Review
                </p>
                <p className="text-[11px] text-slate-400 truncate">Budget imbalan &amp; publikasi</p>
              </div>
            </button>
          </div>
        </div>

        {/* STEP CONTENT CONTAINER */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-8 shadow-xs">
          
          {/* ==================== STEP 1: RINCIAN BANTUAN ==================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Langkah 1: Rincian Bantuan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tuliskan judul singkat, pilih kategori, dan jelaskan tugas yang Anda butuhkan.
                </p>
              </div>

              {/* Judul Kebutuhan */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                  Judul Kebutuhan Tugas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Ambil Map Dokumen di Menara Kuningan Lantai 8"
                  className={`w-full text-xs sm:text-sm p-3.5 rounded-xl border transition ${
                    errors.title ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#1683FF]"
                  } focus:outline-none font-medium text-slate-800`}
                />
                {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Kategori & Mode Pelaksanaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
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
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
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
                      <Globe className="w-3.5 h-3.5" />
                      <span>Online / Remote</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Deskripsi Lengkap */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1.5">
                  Deskripsi &amp; Rincian Tugas <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan secara rinci apa yang perlu dilakukan, barang yang dibawa/dibeli, instruksi keselamatan, dan detail penerima..."
                  className={`w-full text-xs sm:text-sm p-3.5 rounded-xl border transition ${
                    errors.description ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#1683FF]"
                  } focus:outline-none leading-relaxed text-slate-800`}
                />
                {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
              </div>

              {/* Prohibited Warning (jika terdeteksi kata terlarang) */}
              {prohibitedWarning && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-900">
                    <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Peringatan Konten: {prohibitedWarning.category}</span>
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    {prohibitedWarning.reason}
                  </p>
                </div>
              )}

              {/* Upload Foto Barang / Bukti (Opsional) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-[#1683FF] shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        Foto Barang / Lampiran Tugas
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md border border-slate-300/40 shrink-0">
                      Opsional
                    </span>
                  </div>
                  {photoFiles.length > 0 && (
                    <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                      {photoFiles.length} foto terpilih
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                {photoFiles.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                    {photoFiles.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewModalPhoto({ ...item, index: idx })}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square cursor-pointer hover:ring-2 hover:ring-[#1683FF] transition duration-150"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.name || `Lampiran ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(idx);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 hover:bg-red-600 text-white transition z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drag & Drop Zone */}
                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                    isDragging
                      ? "border-[#1683FF] bg-blue-50/70"
                      : "border-slate-300 hover:border-[#1683FF] bg-white"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <ImagePlus className="w-6 h-6 text-[#1683FF] mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    Klik atau tarik foto ke sini untuk mengunggah
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    Mendukung JPG, PNG, WEBP (Bisa lebih dari 1 foto)
                  </span>
                </label>

                {photoError && (
                  <p className="text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{photoError}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ==================== STEP 2: LOKASI & WAKTU ==================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Langkah 2: Lokasi &amp; Batas Waktu
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan titik pertemuan tugas (jika tatap muka) dan batas waktu penyelesaian.
                </p>
              </div>

              {/* Lokasi (Jika Offline) */}
              {mode === "offline" ? (
                <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#1683FF]" />
                        <span>Titik Lokasi Tugas / Penjemputan</span>
                        <span className="text-red-500">*</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Klik pada peta untuk mengunci titik koordinat yang presisi.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleUseMyGPS}
                      disabled={isDetectingGPS}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition self-start sm:self-auto cursor-pointer"
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

                  {/* Interactive Map */}
                  <div>
                    <LocationPickerMap
                      latitude={coords?.latitude || -7.9044}
                      longitude={coords?.longitude || 110.0543}
                      onChange={handleMapLocationChange}
                      onAddressResolved={(resolvedAddr) => {
                        if (resolvedAddr) {
                          setLocationName(resolvedAddr);
                          setErrors((prev) => ({ ...prev, locationName: null }));
                        }
                      }}
                      onGeocodingStateChange={setIsReverseGeocoding}
                      height="240px"
                    />

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        Koordinat: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "-"}
                      </span>
                      {isReverseGeocoding ? (
                        <span className="text-[#1683FF] font-semibold inline-flex items-center gap-1 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Alamat terisi otomatis...</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSyncAddressFromCoords}
                          className="text-[#1683FF] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          Sinkron Alamat dari Pin Peta
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Alamat Input & Patokan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Alamat Lengkap / Nama Tempat <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Contoh: Jl. Pantai Glagah No. 12, Temon"
                        className={`w-full text-xs sm:text-sm p-3 rounded-xl border transition ${
                          errors.locationName ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#1683FF]"
                        } focus:outline-none bg-white font-medium`}
                      />
                      {errors.locationName && <p className="text-[11px] text-red-500 mt-1">{errors.locationName}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Patokan / Detail Titik Temu <span className="text-slate-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={pickupPoint}
                        onChange={(e) => setPickupPoint(e.target.value)}
                        placeholder="Contoh: Depan pos satpam, lobby lantai 1"
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-[#1683FF] focus:outline-none bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200/80 text-purple-900 space-y-1">
                  <h3 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-purple-600" />
                    <span>Mode Online / Remote</span>
                  </h3>
                  <p className="text-xs text-purple-700 leading-relaxed">
                    Tugas ini dapat dikerjakan secara digital dari mana saja tanpa perlu tatap muka langsung di lapangan.
                  </p>
                </div>
              )}

              {/* Batas Waktu / Deadline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#1683FF]" />
                    <span>Batas Waktu Pengerjaan (Deadline)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDeadlineMode("preset")}
                      className={`px-2.5 py-1 rounded-md font-semibold transition ${
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
                      className={`px-2.5 py-1 rounded-md font-semibold transition ${
                        deadlineMode === "custom"
                          ? "bg-[#1683FF] text-white shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Tanggal &amp; Jam
                    </button>
                  </div>
                </div>

                {deadlineMode === "preset" ? (
                  <div className="space-y-2">
                    <select
                      value={presetDeadline}
                      onChange={(e) => setPresetDeadline(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    >
                      <option value="1h">Hari Ini · 1 Jam dari Sekarang (Mendesak)</option>
                      <option value="2h">Hari Ini · 2 Jam dari Sekarang</option>
                      <option value="4h">Hari Ini · 4 Jam dari Sekarang</option>
                      <option value="today_siang">Hari Ini · Jam 12.00 WIB (Siang)</option>
                      <option value="today_sore">Hari Ini · Jam 17.00 WIB (Sore)</option>
                      <option value="today_malam">Hari Ini · Jam 20.00 WIB (Malam)</option>
                      <option value="tomorrow_pagi">Besok · Jam 10.00 WIB (Pagi)</option>
                      <option value="tomorrow_siang">Besok · Jam 14.00 WIB (Siang)</option>
                      <option value="tomorrow_sore">Besok · Jam 17.00 WIB (Sore)</option>
                      <option value="2days_17">2 Hari ke Depan · Jam 17.00 WIB</option>
                    </select>
                    <div className="text-xs text-[#1683FF] bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Target Selesai: <strong>{getDeadlineDisplayText()}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Pilih Tanggal Selesai
                        </label>
                        <input
                          type="date"
                          min={getTodayStr()}
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1683FF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Pilih Jam Selesai (WIB)
                        </label>
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1683FF]"
                        />
                      </div>
                    </div>
                    {errors.customDeadline && <p className="text-[11px] text-red-500">{errors.customDeadline}</p>}
                    <div className="text-xs text-[#1683FF] bg-blue-50/70 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Target Selesai: <strong>{getDeadlineDisplayText()}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== STEP 3: IMBALAN & REVIEW ==================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Langkah 3: Budget Imbalan &amp; Ringkasan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan nominal imbalan, setujui kepatuhan keamanan, dan tinjau sebelum mempublikasikan.
                </p>
              </div>

              {/* Budget Imbalan */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-900">
                    Nominal Imbalan (Rp) {!isVoluntary && <span className="text-red-500">*</span>}
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVoluntary}
                      onChange={(e) => setIsVoluntary(e.target.checked)}
                      className="rounded border-slate-300 text-[#1683FF] focus:ring-0"
                    />
                    <span className="text-xs text-slate-600 font-medium">Bantuan Sukarela (Gratis)</span>
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
                    placeholder={isVoluntary ? "Bantuan Sukarela" : "Contoh: 35.000"}
                    className={`w-full text-xs sm:text-sm pl-10 pr-3.5 py-3 rounded-xl border transition ${
                      isVoluntary ? "bg-slate-100 text-slate-400" : "border-slate-200 bg-white focus:border-[#1683FF]"
                    } focus:outline-none font-bold text-slate-900`}
                  />
                </div>
                {errors.rewardAmount && <p className="text-[11px] text-red-500">{errors.rewardAmount}</p>}
                
                <p className="text-[11px] text-slate-500">
                  Imbalan akan ditahan aman oleh sistem escrow Bantuin dan hanya dicairkan kepada helper setelah Anda mengonfirmasi tugas selesai.
                </p>
              </div>

              {/* Deklarasi Kepatuhan Hukum */}
              {mode === "offline" && (
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#1683FF] shrink-0" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      Deklarasi Muatan &amp; Keamanan Tugas
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jenis Muatan / Barang yang Ditangani:
                    </label>
                    <select
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    >
                      <option value="Dokumen / Berkas">Dokumen / Berkas</option>
                      <option value="Makanan / Minuman">Makanan / Minuman</option>
                      <option value="Pakaian / Laundry">Pakaian / Laundry</option>
                      <option value="Gadget / Elektronik">Gadget / Elektronik</option>
                      <option value="Belanja Kebutuhan">Belanja Kebutuhan</option>
                      <option value="Lainnya (Legal)">Lainnya (Legal)</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={legalDeclarationChecked}
                      onChange={(e) => setLegalDeclarationChecked(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF]"
                    />
                    <span className="text-[11px] text-slate-700 leading-relaxed select-none">
                      Saya menjamin bahwa muatan/tugas ini <strong>aman, legal menurut hukum RI</strong>, dan bebas dari narkotika, miras oplosan, senjata, atau barang terlarang. <span className="text-red-500 font-bold">*</span>
                    </span>
                  </label>
                  {errors.legalDeclaration && (
                    <p className="text-[11px] text-red-500 font-semibold">{errors.legalDeclaration}</p>
                  )}
                </div>
              )}

              {/* RINGKASAN TINJAUAN SEBELUM SUBMIT - MODERN & EXECUTIVE CARD */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                {/* Header Ringkasan */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#1683FF]/10 text-[#1683FF] flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        Ringkasan Permintaan Bantuan
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Periksa kembali data Anda sebelum diterbitkan ke para pencari tugas
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shrink-0">
                    Siap Terbit
                  </span>
                </div>

                {/* Konten Rincian */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Judul & Kategori */}
                  <div className="space-y-1.5 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                        {category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1683FF] text-[11px] font-bold">
                        {mode === "online" ? "Online / Remote" : "Tatap Muka"}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900 pt-1">
                      {title || "Belum ada judul tugas"}
                    </h4>
                    {description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {description}
                      </p>
                    )}
                  </div>

                  {/* Grid Detail Lokasi & Waktu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Lokasi Pelaksanaan
                        </span>
                        <span className="font-semibold text-slate-800 line-clamp-1 block mt-0.5">
                          {mode === "offline" ? (locationName || "Belum diisi") : "Bisa Dikerjakan Fleksibel (Online)"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start gap-2.5">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          Target Selesai
                        </span>
                        <span className="font-semibold text-slate-800 block mt-0.5">
                          {getDeadlineDisplayText()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Foto Lampiran Preview Strip (Jika Ada) */}
                  {photoFiles && photoFiles.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#1683FF]" />
                          Foto Barang / Lampiran
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {photoFiles.length} Foto
                        </span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {photoFiles.map((p, idx) => (
                          <div
                            key={idx}
                            className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 shadow-2xs"
                          >
                            <img
                              src={p.previewUrl}
                              alt={`Foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlight Imbalan & Garansi Escrow */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Imbalan yang Ditawarkan
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-[#1683FF] mt-0.5">
                        {isVoluntary ? "Sukarela (Bantuan Sosial)" : formatIDR(Number(rewardAmount) || 0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 self-start sm:self-auto">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Garansi Rekening Escrow Terlindungi</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submission Error Banner */}
              {errors.submit && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex items-start gap-2.5 break-words">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{errors.submit}</span>
                </div>
              )}
            </div>
          )}

          {/* BOTTOM STEP NAVIGATION BUTTONS - RESPONSIVE & CONTAINED */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Sebelumnya</span>
              </button>
            ) : (
              <Link
                href="/bantuan"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition"
              >
                Batal
              </Link>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 overflow-hidden"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Mempublikasikan...</span>
                  </>
                ) : (
                  <>
                    <span>Publikasikan Permintaan Bantuan</span>
                    <Send className="w-4 h-4 shrink-0" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Image Detail & Preview Modal */}
        {previewModalPhoto && (
          <div 
            className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setPreviewModalPhoto(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-lg w-full flex flex-col overflow-hidden shadow-2xl border border-slate-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate">
                  Pralihat Foto #{previewModalPhoto.index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewModalPhoto(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex items-center justify-center bg-slate-950 max-h-[60vh] overflow-hidden">
                <img
                  src={previewModalPhoto.previewUrl}
                  alt="Detail foto"
                  className="max-h-[50vh] w-auto max-w-full object-contain rounded-lg"
                />
              </div>

              <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(previewModalPhoto.index)}
                  className="text-xs text-red-600 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalPhoto(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
                >
                  Tutup
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
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
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
