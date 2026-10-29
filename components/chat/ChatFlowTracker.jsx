"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatIDR, getGoogleMapsUrl } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { getChatFlowConfig } from "@/lib/chat/flowConfig";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Camera,
  Star,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  MapPin,
  Calendar,
  X,
  FileCheck2,
  Wallet,
  Lock,
  Copy,
  CreditCard,
  Building2,
  QrCode,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Download,
  FileText,
  Upload,
  Send,
  MessageSquare,
  Check,
  Eye,
  Layers,
  Paperclip,
  CheckCircle
} from "lucide-react";

export default function ChatFlowTracker({ room, activeRole = "requester" }) {
  const {
    // Rental methods
    confirmRentalHandover,
    confirmRentalReturn,
    submitRentalReview,
    payRentalEscrow,
    // Service / General methods
    updateOrderStatus,
    submitProof,
    confirmOrderCompletion,
    sendChatMessage,
    currentUser,
    addToast
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  // Common & Category-specific Modals
  const [activeModal, setActiveModal] = useState(null); // 'handover' | 'return' | 'review' | 'deliverables' | 'revision' | 'task_proof' | 'task_completion'

  // Deliverables / Proof states (Jasa & Bantuan) - Jangan prefill data lama agar tidak muncul data dummy
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [deliverableNotes, setDeliverableNotes] = useState("");
  const [digitalFiles, setDigitalFiles] = useState([]);
  const [taskProofPhotos, setTaskProofPhotos] = useState([]);
  const [jasaProofPhotos, setJasaProofPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review states (All categories)
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  // Revision state (Jasa)
  const [revisionNotes, setRevisionNotes] = useState("");

  // Rental Handover state
  const [serialNumber, setSerialNumber] = useState(room?.serialNumber || "");
  const [handoverPhotos, setHandoverPhotos] = useState(room?.handoverPhotos || []);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [checklistIdConfirmed, setChecklistIdConfirmed] = useState(true);
  const [checklistConditionConfirmed, setChecklistConditionConfirmed] = useState(true);

  // Drag & drop states
  const [isDraggingTaskProof, setIsDraggingTaskProof] = useState(false);
  const [isDraggingHandover, setIsDraggingHandover] = useState(false);
  const [isDraggingJasaProof, setIsDraggingJasaProof] = useState(false);

  // File input refs & Synchronous Action/Submit Locks
  const taskProofFileRef = useRef(null);
  const handoverFileRef = useRef(null);
  const deliverablesFileRef = useRef(null);
  const jasaProofFileRef = useRef(null);
  const isStartingWorkRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const actionLockRef = useRef(false);

  // Helper untuk proses file gambar dengan batasan format gambar & maksimal 3 foto
  const processImageFiles = (rawFiles, currentPhotos, setPhotosFunc, labelName = "Foto") => {
    if (!rawFiles || rawFiles.length === 0) return;
    const files = Array.from(rawFiles);
    
    // Filter file gambar saja
    const imageFiles = files.filter((f) => f.type && f.type.startsWith("image/"));
    const nonImageFiles = files.filter((f) => !f.type || !f.type.startsWith("image/"));

    if (nonImageFiles.length > 0) {
      addToast?.("Format Tidak Didukung", "Hanya berkas gambar (JPG, PNG, WebP, GIF) yang dapat diunggah.", "warning");
    }

    if (imageFiles.length === 0) return;

    const maxAllowed = 3;
    const currentCount = currentPhotos.length;
    const availableSlots = maxAllowed - currentCount;

    if (availableSlots <= 0) {
      addToast?.("Batas Maksimal", `Maksimal hanya ${maxAllowed} ${labelName.toLowerCase()} yang diperbolehkan.`, "warning");
      return;
    }

    if (imageFiles.length > availableSlots) {
      addToast?.("Batas Jumlah Foto", `Hanya ${availableSlots} foto yang ditambahkan karena batas maksimal adalah 3 foto.`, "info");
    }

    const filesToRead = imageFiles.slice(0, availableSlots);
    filesToRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotosFunc((prev) => {
            if (prev.length >= maxAllowed) return prev;
            return [...prev, ev.target.result];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleTaskProofFilesSelected = (e) => {
    processImageFiles(e.target.files, taskProofPhotos, setTaskProofPhotos, "Foto Bukti");
    e.target.value = "";
  };

  const handleHandoverFilesSelected = (e) => {
    processImageFiles(e.target.files, handoverPhotos, setHandoverPhotos, "Foto Baseline");
    e.target.value = "";
  };

  const handleJasaProofFilesSelected = (e) => {
    processImageFiles(e.target.files, jasaProofPhotos, setJasaProofPhotos, "Foto Dokumentasi");
    e.target.value = "";
  };

  const handleDeliverablesFilesSelected = (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    // Tambahkan berkas SECARA INSTAN ke state UI (<5ms) sehingga tidak ada delay / loading beku
    const newFileEntries = rawFiles.map((f) => {
      const fileId = `df-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const sizeStr = f.size > 1024 * 1024
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(f.size / 1024)} KB`;

      let initialUrl = "";
      try {
        initialUrl = URL.createObjectURL(f);
      } catch (_) {
        initialUrl = `/uploads/${fileId}-${encodeURIComponent(f.name)}`;
      }

      return {
        id: fileId,
        name: f.name,
        size: sizeStr,
        type: f.type || "application/octet-stream",
        url: initialUrl,
        uploadedAt: "Baru saja",
        _rawFile: f,
      };
    });

    setDigitalFiles((prev) => [...prev, ...newFileEntries]);
    e.target.value = "";

    // Unggah di background secara paralel tanpa membekukan form
    newFileEntries.forEach(async (entry) => {
      if (!entry._rawFile) return;
      try {
        const formData = new FormData();
        formData.append("file", entry._rawFile);
        formData.append("bucket", "bantuin-documents");
        formData.append("folder", `chat/${room.id}`);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const resData = await res.json();
        const serverUrl = resData.urls?.[0] || resData.url;
        if (serverUrl) {
          setDigitalFiles((prev) =>
            prev.map((item) => (item.id === entry.id ? { ...item, url: serverUrl } : item))
          );
        }
      } catch (_) {}
    });
  };

  if (!room) return null;

  // Configuration single source of truth based on orderStatus and transactionType
  const config = getChatFlowConfig(room, activeRole);
  const {
    transactionType,
    steps,
    completedSteps,
    activeStep,
    progressPercent,
    badge,
    itemTitle,
    locationInfo,
    partnerLabel,
    primaryAction,
    isPhysical: configIsPhysical,
    googleMapsUrl: configMapsUrl,
  } = config;

  const isPhysical = configIsPhysical ?? Boolean(
    transactionType === "sewa" ||
    (transactionType === "bantuan" && room?.mode !== "online" && room?.request?.mode !== "online") ||
    (transactionType === "jasa" && config?.execMode !== "online")
  );

  const effectiveMapsUrl = configMapsUrl || room?.googleMapsUrl || getGoogleMapsUrl(
    (room?.request?.latitude && room?.request?.longitude)
      ? { latitude: room.request.latitude, longitude: room.request.longitude }
      : (room?.latitude && room?.longitude)
      ? { latitude: room.latitude, longitude: room.longitude }
      : (room?.rental?.latitude && room?.rental?.longitude)
      ? { latitude: room.rental.latitude, longitude: room.rental.longitude }
      : (room?.request?.bantuinPoint?.latitude && room?.request?.bantuinPoint?.longitude)
      ? { latitude: room.request.bantuinPoint.latitude, longitude: room.request.bantuinPoint.longitude }
      : (room?.request?.bantuinPoint?.address || room?.request?.locationName || locationInfo)
  );

  // ===========================================================================
  // ACTION HANDLERS
  // ===========================================================================

  // 1. JASA: Start Working (Digital / Umum)
  const handleStartWorking = () => {
    if (isStartingWorkRef.current || room?.startedAt || room?.orderStatus === "in_progress") {
      return;
    }
    isStartingWorkRef.current = true;
    updateOrderStatus(room.id, "in_progress");
    
    // Cegah pesan otomatis ganda jika sudah ada pengumuman mulai kerja di obrolan
    const hasStartedMsg = (room.messages || []).some(
      (m) => m?.message && m.message.includes("Saya telah memulai proses pengerjaan pesanan ini")
    );
    if (!hasStartedMsg) {
      sendChatMessage(
        room.id,
        "Halo! Pembayaran telah terkonfirmasi aman melalui Payment Gateway Bantuin. Saya telah memulai proses pengerjaan pesanan ini sesuai kesepakatan brief.",
        { isSystemAnnouncement: true }
      );
    }
    addToast?.("Pengerjaan Dimulai", "Status pesanan telah diperbarui menjadi Sedang Dikerjakan.");
    setTimeout(() => {
      isStartingWorkRef.current = false;
    }, 2000);
  };

  // 1B. JASA: Menuju Lokasi (OTW - Panggilan)
  const handleJasaOnTheWay = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setTimeout(() => { actionLockRef.current = false; }, 1500);

    updateOrderStatus(room.id, "on_the_way");
    sendChatMessage(
      room.id,
      "Halo! Saya sudah berangkat dalam perjalanan menuju lokasi janji temu. Mohon siapkan tempat atau titik temu yang telah disepakati.",
      { isSystemAnnouncement: true }
    );
    addToast?.("Mitra Bergerak", "Status pesanan diperbarui: Mitra Menuju Lokasi.");
  };

  // 1C. JASA: Tiba di Lokasi & Mulai (Panggilan)
  const handleJasaArrived = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setTimeout(() => { actionLockRef.current = false; }, 1500);

    updateOrderStatus(room.id, "in_progress");
    sendChatMessage(
      room.id,
      "Saya telah tiba di lokasi Anda dan mulai melaksanakan pengerjaan layanan. Dokumentasi hasil pengerjaan akan kami serahkan setelah tuntas.",
      { isSystemAnnouncement: true }
    );
    addToast?.("Tiba di Lokasi", "Status pesanan diperbarui: Pengerjaan di tempat dimulai.");
  };

  // 1D. JASA: Klien Tiba di Lokasi Mitra (Onsite)
  const handleJasaUnitReceived = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setTimeout(() => { actionLockRef.current = false; }, 1500);

    updateOrderStatus(room.id, "item_picked_up");
    sendChatMessage(
      room.id,
      "Klien telah tiba di lokasi tempat mitra. Pengerjaan layanan telah dimulai secara langsung.",
      { isSystemAnnouncement: true }
    );
    addToast?.("Pengerjaan Dimulai", "Status pesanan diperbarui: Klien telah tiba di lokasi mitra.");
  };

  // 2. BANTUAN: Helper En Route ("Menuju Lokasi" atau "Mulai Pengerjaan Digital")
  const handleHelperOnTheWay = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setTimeout(() => { actionLockRef.current = false; }, 1500);

    const isRoomOnline = Boolean(
      config?.execMode === "online" ||
      room?.mode === "online" ||
      room?.request?.mode === "online" ||
      (typeof room?.category === "string" && (
        room.category.toLowerCase().includes("online") ||
        room.category.toLowerCase().includes("remote") ||
        room.category.toLowerCase().includes("desain") ||
        room.category.toLowerCase().includes("ketik")
      ))
    );

    if (isRoomOnline) {
      updateOrderStatus(room.id, "in_progress");
      sendChatMessage(
        room.id,
        "Halo! Pembayaran telah aman di Rekening Bersama Bantuin. Saya telah memulai proses pengerjaan tugas ini secara digital/remote sesuai rincian instruksi.",
        { isSystemAnnouncement: true }
      );
      addToast?.("Pengerjaan Dimulai", "Status tugas diperbarui: Pengerjaan Digital Berlangsung.");
    } else {
      updateOrderStatus(room.id, "on_the_way");
      sendChatMessage(
        room.id,
        "Halo! Saya sudah mulai bergerak dalam perjalanan menuju titik lokasi tugas. Mohon tunggu, saya akan kabari saat tiba.",
        { isSystemAnnouncement: true }
      );
      addToast?.("Helper Bergerak", "Status tugas diperbarui: Helper Menuju Lokasi.");
    }
  };

  // 3. BANTUAN: Helper Arrived / Item Picked Up ("Tiba / Ambil Barang" atau "Selesai Pengerjaan")
  const handleHelperPickedUp = () => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setTimeout(() => { actionLockRef.current = false; }, 1500);

    const isRoomOnline = Boolean(
      config?.execMode === "online" ||
      room?.mode === "online" ||
      room?.request?.mode === "online" ||
      (typeof room?.category === "string" && (
        room.category.toLowerCase().includes("online") ||
        room.category.toLowerCase().includes("remote")
      ))
    );

    if (isRoomOnline) {
      setActiveModal("task_proof");
    } else {
      updateOrderStatus(room.id, "item_picked_up");
      sendChatMessage(
        room.id,
        "Saya telah tiba di lokasi dan barang/tugas telah diambil/sedang diproses. Tugas sedang dikerjakan secara langsung.",
        { isSystemAnnouncement: true }
      );
      addToast?.("Tiba di Lokasi", "Status tugas diperbarui: Proses Bantuan berlangsung.");
    }
  };

  // 4. JASA: Submit Deliverables & Proof (Instan & Responsif)
  const handleSubmitDeliverables = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const hasFiles = digitalFiles && digitalFiles.length > 0;
    const hasUrl = Boolean(submissionUrl && submissionUrl.trim());
    const hasPhotos = jasaProofPhotos && jasaProofPhotos.length > 0;

    if (!hasFiles && !hasUrl && !hasPhotos) {
      addToast?.("Bukti / Berkas Diperlukan", "Mohon sertakan minimal satu berkas pekerjaan, tautan cloud/drive, atau foto dokumentasi pengerjaan.", "warning");
      return;
    }
    if (!deliverableNotes.trim()) {
      addToast?.("Catatan Diperlukan", "Mohon isi catatan hasil pekerjaan.", "warning");
      return;
    }

    const filesToSubmit = [...digitalFiles];
    const finalNotes = deliverableNotes.trim();
    const finalSubUrl = submissionUrl.trim() || "-";
    const photosToUpload = [...jasaProofPhotos];
    const isPhysical = config?.execMode === "customer_location" || config?.execMode === "onsite";

    // TUTUP MODAL & RESET STATE SECARA INSTAN TANPA MENUNGGU LOADING LAMA
    setActiveModal(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setJasaProofPhotos([]);
    setDigitalFiles([]);
    setSubmissionUrl("");
    setDeliverableNotes("");

    addToast?.("Hasil Kerja Diserahkan", "Dokumentasi / berkas hasil kerja telah terkirim ke klien.");

    // Eksekusi upload dan sinkronisasi di background secara paralel
    (async () => {
      try {
        const uploadPromises = photosToUpload.map(async (dataUrl) => {
          if (typeof dataUrl === "string" && dataUrl.startsWith("http")) return dataUrl;
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const ext = blob.type.split("/")[1] || "jpg";
            const form = new FormData();
            form.append("file", blob, `jasa-proof-${Date.now()}.${ext}`);
            form.append("bucket", "bantuin-proofs");
            form.append("folder", `jasa/${room.id}`);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
            const uploadData = await uploadRes.json();
            return uploadData?.url || uploadData?.urls?.[0] || dataUrl;
          } catch (_) {
            return dataUrl;
          }
        });

        const uploadedPhotoUrls = await Promise.all(uploadPromises);

        await submitProof(room.id, {
          orderRoomId: room.id,
          requestId: room.requestId || room.request?.id,
          digitalFiles: filesToSubmit,
          submissionUrl: finalSubUrl,
          photoUrls: uploadedPhotoUrls,
          photoUrl: uploadedPhotoUrls[0] || null,
          notes: finalNotes
        }, finalNotes);

        await sendChatMessage(
          room.id,
          isPhysical
            ? "Penyedia jasa telah menyelesaikan pekerjaan dan mengunggah dokumentasi fisik serta hasil pekerjaan. Klien dapat memeriksa hasil secara langsung lalu menekan 'Setujui & Selesaikan' jika sudah tuntas, atau 'Minta Revisi' jika ada catatan."
            : "Penyedia jasa telah menyerahkan hasil pekerjaan & berkas digital. Klien dapat memeriksa berkas lalu menekan 'Setujui & Selesaikan' jika sudah sesuai, atau 'Minta Revisi' jika ada catatan.",
          {
            isJasaDeliverablesProof: true,
            isOnline: !isPhysical,
            digitalFiles: filesToSubmit || [],
            submissionUrl: finalSubUrl,
            proofPhotos: uploadedPhotoUrls,
            photos: uploadedPhotoUrls,
            notes: finalNotes,
            proofData: {
              serviceTitle: itemTitle,
              isOnline: !isPhysical,
              submissionUrl: finalSubUrl,
              files: filesToSubmit,
              photos: uploadedPhotoUrls,
              notes: finalNotes,
              submittedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            }
          }
        );
      } catch (err) {
        console.error("Background deliverables error:", err);
      }
    })();
  };

  // 5. JASA: Request Revision
  const handleRequestRevision = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    if (!revisionNotes.trim()) return;

    const notes = revisionNotes.trim();
    setRevisionNotes("");
    setActiveModal(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;

    updateOrderStatus(room.id, "in_progress");
    sendChatMessage(
      room.id,
      `[PERMINTAAN REVISI]:\n${notes}\n\nMohon mitra dapat melakukan perbaikan sesuai catatan di atas. Terima kasih!`,
      { isRevisionRequest: true }
    );

    addToast?.("Revisi Diajukan", "Catatan revisi telah dikirimkan ke ruang obrolan mitra.");
  };

  // 6. JASA: Approve & Complete (Instan & Snappy)
  const handleConfirmJasaCompletion = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const rating = selectedRating;
    const comment = reviewComment || "Pelayanan sangat memuaskan, hasil kerja rapi dan tepat waktu!";
    const payout = room.helperPayoutAmount || room.lockedAmount || 150000;

    // Tutup pop up modal dan reset input secara instan tanpa menunggu loading berat
    setActiveModal(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setReviewComment("");

    addToast?.("Pesanan Selesai", "Dana berhasil diteruskan ke saldo mitra. Terima kasih atas ulasan Anda!");

    // Eksekusi database update dan chat pengumuman di background
    (async () => {
      try {
        await confirmOrderCompletion(room.id, {
          rating: rating,
          feedback: comment,
          skipChat: true
        });

        await sendChatMessage(
          room.id,
          `Pesanan telah disetujui & dikonfirmasi selesai oleh pemesan! Dana imbalan sebesar ${formatIDR(payout)} telah otomatis dicairkan ke saldo mitra. Rating diberikan: ${rating}/5. Terima kasih telah menggunakan Bantuin.id!`,
          {
            isJasaCompletion: true,
            completionData: {
              serviceTitle: itemTitle,
              rating: rating,
              feedback: comment,
              payoutAmount: payout,
              completedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            }
          }
        );
      } catch (err) {
        console.error("Background confirm jasa completion error:", err);
      }
    })();
  };

  // 7. BANTUAN: Submit Task Proof (Instan & Snappy)
  const handleSubmitTaskProof = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const isOnline = config?.execMode === "online" || Boolean(
      room?.mode === "online" ||
      room?.request?.mode === "online" ||
      (typeof room?.category === "string" && (
        room.category.toLowerCase().includes("online") ||
        room.category.toLowerCase().includes("remote") ||
        room.category.toLowerCase().includes("desain") ||
        room.category.toLowerCase().includes("ketik")
      ))
    );

    const hasPhotos = taskProofPhotos && taskProofPhotos.length > 0;
    const hasFiles = digitalFiles && digitalFiles.length > 0;
    const hasUrl = Boolean(submissionUrl && submissionUrl.trim());

    if (!hasPhotos && !hasFiles && !hasUrl) {
      addToast?.(
        "Bukti Tugas Diperlukan",
        isOnline
          ? "Mohon lampirkan berkas pekerjaan digital, tautan Google Drive / Cloud, atau tangkapan layar bukti."
          : "Mohon unggah minimal 1 foto bukti penyelesaian tugas di lokasi.",
        "warning"
      );
      return;
    }

    if (!deliverableNotes || !deliverableNotes.trim()) {
      addToast?.("Catatan Diperlukan", "Mohon isi catatan ringkas mengenai penyelesaian tugas.", "warning");
      return;
    }

    const finalNotes = deliverableNotes.trim();
    const finalSubUrl = submissionUrl.trim() || "-";
    const filesToSubmit = [...(digitalFiles || [])];
    const photosToUpload = [...taskProofPhotos];

    // Tutup modal secara instan
    setActiveModal(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setTaskProofPhotos([]);
    setDigitalFiles([]);
    setSubmissionUrl("");
    setDeliverableNotes("");

    addToast?.("Bukti Terkirim", "Foto / berkas bukti pengerjaan berhasil dikirim ke pemesan.");

    (async () => {
      try {
        const uploadPromises = photosToUpload.map(async (dataUrl) => {
          if (typeof dataUrl === "string" && dataUrl.startsWith("http")) return dataUrl;
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const ext = blob.type.split("/")[1] || "jpg";
            const form = new FormData();
            form.append("file", blob, `proof-${Date.now()}.${ext}`);
            form.append("bucket", "bantuin-proofs");
            form.append("folder", `tasks/${room.id}`);
            const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
            const uploadData = await uploadRes.json();
            return uploadData?.url || uploadData?.urls?.[0] || dataUrl;
          } catch (_) {
            return dataUrl;
          }
        });

        const uploadedUrls = await Promise.all(uploadPromises);

        await submitProof(room.id, {
          orderRoomId: room.id,
          requestId: room.requestId || room.request?.id,
          photoUrl: uploadedUrls[0] || null,
          photoUrls: uploadedUrls,
          digitalFiles: filesToSubmit,
          submissionUrl: finalSubUrl,
          notes: finalNotes,
        }, finalNotes);

        await sendChatMessage(
          room.id,
          isOnline
            ? "Helper telah menyelesaikan tugas digital dan mengunggah hasil pengerjaan (berkas/tautan). Pemesan dapat memeriksa lalu menekan 'Konfirmasi Tugas Selesai'."
            : "Helper telah menyelesaikan tugas dan mengunggah bukti penyelesaian di lokasi. Pemesan dapat memeriksa lalu menekan 'Konfirmasi Tugas Selesai'.",
          {
            isTaskProof: true,
            isOnline,
            proofPhotos: uploadedUrls,
            photos: uploadedUrls,
            digitalFiles: filesToSubmit,
            submissionUrl: finalSubUrl,
            notes: finalNotes,
            proofData: {
              isOnline,
              files: filesToSubmit,
              submissionUrl: finalSubUrl,
              photos: uploadedUrls,
              notes: finalNotes,
              submittedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            }
          }
        );
      } catch (err) {
        console.error("Background task proof upload error:", err);
      }
    })();
  };

  // 8. BANTUAN: Confirm Task Completion & Rating (Instan & Snappy)
  const handleConfirmTaskCompletion = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    const rating = selectedRating;
    const comment = reviewComment || "Helper sangat cekatan, ramah, dan tugas selesai dengan rapi!";
    const payout = room.helperPayoutAmount || room.lockedAmount || 35000;

    // Tutup modal secara instan
    setActiveModal(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setReviewComment("");

    addToast?.("Bantuan Selesai", "Tugas selesai & imbalan telah dicairkan ke helper.");

    (async () => {
      try {
        await confirmOrderCompletion(room.id, {
          rating: rating,
          feedback: comment,
          skipChat: true
        });

        await sendChatMessage(
          room.id,
          `Tugas bantuan telah dikonfirmasi selesai oleh pemesan! Dana imbalan sebesar ${formatIDR(payout)} telah otomatis dicairkan ke saldo helper. Rating: ${rating}/5. Terima kasih!`,
          {
            isTaskCompletion: true,
            rating: rating,
            feedback: comment,
          }
        );
      } catch (err) {
        console.error("Background confirm task completion error:", err);
      }
    })();
  };

  // 9. SEWA: Handover Submit (Instan & Snappy)
  const handleRentalHandoverSubmit = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    if (handoverPhotos.length === 0) {
      addToast?.("Foto Baseline Diperlukan", "Mohon unggah minimal 1 foto fisik unit awal.", "warning");
      return;
    }
    if (!handoverNotes.trim()) {
      addToast?.("Catatan Fisik Diperlukan", "Mohon cantumkan catatan kondisi fisik unit.", "warning");
      return;
    }

    const photosToSubmit = [...handoverPhotos];
    const serialNum = serialNumber || "-";
    const notes = handoverNotes.trim();

    // Tutup modal secara instan
    setActiveModal(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;

    addToast?.("Pemeriksaan Unit Berhasil", "Status sewa aktif. Unit siap digunakan.");

    (async () => {
      try {
        await confirmRentalHandover(room.id, {
          photos: photosToSubmit,
          serialNumber: serialNum,
          eAgreementConfirmed: true,
          notes: notes,
          skipChat: true,
        });

        const nowDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
        const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
        const handoverMsg = `Serah terima alat berhasil dikonfirmasi!\nKondisi fisik unit telah diverifikasi bersama pihak toko. Masa sewa sekarang berstatus AKTIF. Bukti foto baseline kondisi fisik alat tersimpan permanen di ruang obrolan ini sebagai dokumen serah terima resmi.`;

        await sendChatMessage(room.id, handoverMsg, {
          isSystem: true,
          senderName: "Bantuin System",
          isHandoverProof: true,
          proofData: {
            title: "Bukti Baseline Serah Terima Fisik",
            unitName: room?.rentalDetails?.unitName || room?.requestTitle || "Unit Alat Sewa",
            photos: photosToSubmit,
            notes: notes,
            confirmedAt: `${nowDate}, ${nowTime}`,
            depositHeld: Number(room?.depositAmount ?? room?.rentalDetails?.depositFee ?? 0),
            idHeld: "1 Identitas Fisik Asli (KTP/KTM/SIM) dititipkan di toko",
            storeName: room?.helper?.name || "Toko Mitra",
            renterName: room?.requester?.name || currentUser?.fullName || "Penyewa"
          },
          photos: photosToSubmit,
          proofPhotos: photosToSubmit,
        });
      } catch (err) {
        console.error("Background rental handover submit error:", err);
      }
    })();
  };

  // 10. SEWA: Return Submit (Instan & Snappy)
  const handleRentalReturnSubmit = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    // Tutup modal secara instan
    setActiveModal(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;

    addToast?.("Pengembalian Berhasil", "Unit telah kembali dan deposit jaminan sedang diproses.");

    (async () => {
      try {
        await confirmRentalReturn(room.id, { skipChat: true });

        const nowDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
        const nowTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
        const handoverMsg = (room?.messages || []).find((m) => m.isHandoverProof && m.proofData?.depositHeld);
        const refundAmount = Number(room?.depositAmount ?? room?.rentalDetails?.depositFee ?? handoverMsg?.proofData?.depositHeld ?? 0);
        const rentFee = Number(room?.rentalFeeAmount ?? room?.rentalDetails?.rentalFee ?? (room?.lockedAmount && room.lockedAmount > refundAmount ? room.lockedAmount - refundAmount : room?.lockedAmount) ?? 0);
        const platFee = Math.round(rentFee * 0.08);
        const ownerPayout = rentFee - platFee;
        const returnNotes = "Pemeriksaan akhir selesai. Unit dikembalikan lengkap & tanpa kerusakan.";
        const returnMsg = `Pengembalian alat telah selesai diperiksa & diverifikasi oleh pihak toko mitra.\nHak sewa toko sebesar Rp${ownerPayout.toLocaleString('id-ID')} telah beralih ke status AVAILABLE (siap ditarik).\nDeposit jaminan sebesar ${formatIDR(refundAmount)} berstatus REFUND_PENDING menunggu transfer manual admin ke rekening bank Anda.`;

        await sendChatMessage(room.id, returnMsg, {
          isSystem: true,
          senderName: "Bantuin System",
          isReturnProof: true,
          proofData: {
            title: "Bukti Pengembalian & Verifikasi Alat",
            unitName: room?.rentalDetails?.unitName || room?.requestTitle || "Unit Alat Sewa",
            refundAmount: refundAmount,
            notes: returnNotes,
            photos: [],
            confirmedAt: `${nowDate}, ${nowTime}`,
            idReturned: "Identitas Fisik Asli (KTP/KTM) telah diserahkan kembali ke penyewa"
          },
          photos: [],
          proofPhotos: [],
        });
      } catch (err) {
        console.error("Background rental return submit error:", err);
      }
    })();
  };

  // 11. SEWA: Review Submit (Instan & Snappy)
  const handleRentalReviewSubmit = (e) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;

    if (!reviewComment.trim()) {
      addToast?.("Ulasan Diperlukan", "Mohon berikan ulasan singkat mengenai pengalaman sewa Anda.", "warning");
      return;
    }

    const rating = selectedRating;
    const comment = reviewComment.trim();

    // Tutup modal secara instan
    setActiveModal(null);
    setIsSubmitting(false);
    isSubmittingRef.current = false;
    setReviewComment("");

    addToast?.("Ulasan Disimpan", "Terima kasih telah memberikan ulasan untuk toko rental.");

    (async () => {
      try {
        await submitRentalReview(
          room.id,
          rating,
          comment,
          null,
          { skipChat: true }
        );

        const revMsg = `Penyewa memberikan rating ${rating}/5 bintang: "${comment}". Transaksi sewa selesai sepenuhnya. Terima kasih!`;
        await sendChatMessage(room.id, revMsg, {
          isSystem: true,
          senderName: "Bantuin System",
          rating: rating,
          comment: comment,
        });
      } catch (err) {
        console.error("Background rental review submit error:", err);
      }
    })();
  };

  const handleUseSampleHandoverPhotos = () => {
    setHandoverPhotos([
      room?.rentalDetails?.photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80"
    ]);
    if (!handoverNotes) {
      setHandoverNotes("Kondisi bodi 98% mulus, sensor bersih tanpa jamur/debu, kelengkapan 2 baterai original, charger & tas unit.");
    }
  };

  // Trigger primary action based on config
  const triggerAction = (action) => {
    if (!action) return;
    if (action.type === "modal") {
      setActiveModal(action.modalKey);
    } else if (action.type === "action") {
      if (action.actionKey === "start_working") handleStartWorking();
      if (action.actionKey === "helper_on_the_way") handleHelperOnTheWay();
      if (action.actionKey === "helper_picked_up") handleHelperPickedUp();
      if (action.actionKey === "jasa_on_the_way") handleJasaOnTheWay();
      if (action.actionKey === "jasa_arrived") handleJasaArrived();
      if (action.actionKey === "jasa_unit_received") handleJasaUnitReceived();
    }
  };

  // Cek apakah ada aksi interaktif yang butuh tombol klik user
  const hasInteractiveAction = Boolean(
    primaryAction && (
      primaryAction.type === "modal" ||
      primaryAction.type === "action" ||
      primaryAction.type === "link" ||
      primaryAction.type === "dual"
    )
  );

  const getActionIcon = (iconName) => {
    switch (iconName) {
      case "Camera": return <Camera className="w-3.5 h-3.5 shrink-0" />;
      case "RefreshCw": return <RefreshCw className="w-3.5 h-3.5 shrink-0" />;
      case "Star": return <Star className="w-3.5 h-3.5 fill-white shrink-0" />;
      case "CheckCircle2": return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
      case "Upload": return <Upload className="w-3.5 h-3.5 shrink-0" />;
      case "MapPin": return <MapPin className="w-3.5 h-3.5 shrink-0" />;
      case "Lock": return <Lock className="w-3.5 h-3.5 shrink-0" />;
      default: return null;
    }
  };

  const renderInteractiveAction = (isMobileRow = false) => {
    if (!hasInteractiveAction) return null;

    if (primaryAction.type === "link") {
      return (
        <Link
          href={primaryAction.href}
          className={`${
            isMobileRow ? "w-full py-2 px-3 text-xs justify-center" : "px-3 py-1.5 text-[11px]"
          } rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95`}
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>{primaryAction.label}</span>
        </Link>
      );
    }

    if (primaryAction.type === "modal" || primaryAction.type === "action") {
      return (
        <button
          type="button"
          onClick={() => triggerAction(primaryAction)}
          className={`${
            isMobileRow ? "w-full py-2 px-3 text-xs justify-center" : "px-3 py-1.5 text-[11px]"
          } rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer`}
        >
          {getActionIcon(primaryAction.icon)}
          <span>{primaryAction.label}</span>
        </button>
      );
    }

    if (primaryAction.type === "dual") {
      return (
        <div className={`flex items-center gap-2 ${isMobileRow ? "w-full" : ""}`}>
          {primaryAction.secondary && (
            <button
              type="button"
              onClick={() => triggerAction(primaryAction.secondary)}
              className={`${
                isMobileRow ? "flex-1 py-2 px-3 text-xs justify-center" : "px-2.5 py-1.5 text-[11px]"
              } rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer flex items-center justify-center gap-1`}
            >
              <span>{primaryAction.secondary.label}</span>
            </button>
          )}
          {primaryAction.primary && (
            <button
              type="button"
              onClick={() => triggerAction(primaryAction.primary)}
              className={`${
                isMobileRow ? "flex-1 py-2 px-3 text-xs justify-center" : "px-3 py-1.5 text-[11px]"
              } rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{primaryAction.primary.label}</span>
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white border-b border-slate-200/90 shadow-2xs shrink-0 select-none">
      
      {/* ===================================================================== */}
      {/* 1. COMPACT STATUS & ACTION BAR (~44-48px)                             */}
      {/* ===================================================================== */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50/90 flex items-center justify-between gap-2.5 border-b border-slate-200/70 min-w-0">
        
        {/* Left: Status Information Badge */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1.5 shadow-2xs ${
            badge.isComplete 
              ? "bg-slate-100 text-slate-700 border border-slate-200" 
              : "bg-blue-50 text-[#1683FF] border border-blue-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              badge.isComplete ? "bg-slate-400" : "bg-[#1683FF] animate-pulse"
            }`} />
            <span className="font-bold">{badge.title}</span>
          </span>

          <span className="text-[11px] text-slate-500 font-medium truncate hidden md:inline max-w-[200px]" title={itemTitle}>
            {itemTitle}
          </span>

          {/* Titik Lokasi Fisik -> Google Maps Quick Link */}
          {isPhysical && effectiveMapsUrl && (
            <a
              href={effectiveMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200/90 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 sm:gap-1.5 transition shadow-2xs group shrink-0 active:scale-95 cursor-pointer"
              title={`Buka titik lokasi "${locationInfo}" langsung di Google Maps`}
            >
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate max-w-[95px] sm:max-w-[150px] md:max-w-[200px]">{locationInfo}</span>
              <ExternalLink className="w-2.5 h-2.5 text-emerald-600/80 shrink-0" />
            </a>
          )}
        </div>

        {/* Right Area: Interactive Action (Desktop only) + Stepper Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Action button on desktop/tablet */}
          <div className="hidden sm:flex items-center gap-1.5">
            {renderInteractiveAction(false)}
            
            {/* Completed badge if already finished */}
            {primaryAction?.type === "badge_completed" && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                <span>{primaryAction.label}</span>
              </span>
            )}

            {/* Passive badge on desktop */}
            {primaryAction?.type === "badge" && (
              <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[160px]">{primaryAction.label}</span>
              </span>
            )}
          </div>

          {/* Stepper Roadmap Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition flex items-center gap-1 text-[11px] font-semibold shrink-0 cursor-pointer"
            title={isExpanded ? "Tutup Alur Transaksi" : "Lihat Alur Transaksi"}
            aria-label="Toggle Alur Transaksi"
          >
            <span className="hidden xs:inline">{isExpanded ? "Tutup" : "Alur"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180 text-[#1683FF]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Row 2: Action Bar khusus mobile jika ada tindakan interaktif (Kirim Hasil, Bukti, Bayar, dll) */}
      {hasInteractiveAction && (
        <div className="sm:hidden px-3 py-2 bg-white border-b border-slate-100 flex items-center">
          {renderInteractiveAction(true)}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. REUSABLE EXPANDABLE STEPPER ROADMAP                                */}
      {/* ===================================================================== */}
      {isExpanded && (
        <div className="bg-slate-50/90 border-b border-slate-200 p-3 sm:p-4 space-y-3 animate-in slide-in-from-top-2 duration-150 overflow-hidden">
          
          {/* Stepper Container with Horizontal Scroll Protection for Mobile */}
          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="min-w-[420px] sm:min-w-0 max-w-3xl mx-auto relative pt-1 pb-2 px-3">
              
              {/* Background Connecting Line */}
              <div className="absolute top-4.5 left-7 right-7 h-0.5 bg-slate-200 -z-0" />
              
              {/* Active Animated Progress Line */}
              <div 
                className="absolute top-4.5 left-7 h-0.5 bg-[#1683FF] transition-all duration-500 -z-0"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Steps Nodes */}
              <div className="flex items-center justify-between relative z-10">
                {steps.map((step) => {
                  const isComplete = completedSteps.includes(step.number);
                  const isActive = activeStep === step.number;
                  const isPending = !isComplete && !isActive;

                  return (
                    <div key={step.id} className="flex flex-col items-center text-center px-1">
                      {/* Circle indicator */}
                      <div 
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                          isComplete
                            ? "bg-slate-900 text-white"
                            : isActive
                            ? "bg-[#1683FF] text-white shadow-blue-500/30 ring-2 ring-blue-100 animate-pulse"
                            : "bg-white text-slate-400 border-2 border-slate-200"
                        }`}
                      >
                        {isComplete ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : isActive ? (
                          <span>{step.number}</span>
                        ) : (
                          <span>{step.number}</span>
                        )}
                      </div>

                      {/* Step Labels */}
                      <div className="mt-1.5">
                        <div className={`text-[10px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap ${
                          isActive 
                            ? "text-[#1683FF]" 
                            : isComplete 
                            ? "text-slate-800" 
                            : "text-slate-400"
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-[9px] text-slate-400 font-normal hidden sm:block">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Guidelines Box with Direct Google Maps Action */}
          <div className="max-w-3xl mx-auto p-2.5 sm:p-3 bg-white rounded-2xl border border-slate-200 text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-slate-600 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1683FF] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#1683FF]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{partnerLabel}</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {locationInfo}
                </div>
              </div>
            </div>

            {/* Direct Google Maps Action Button if physical */}
            {isPhysical && effectiveMapsUrl ? (
              <a
                href={effectiveMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition shadow-2xs shrink-0 cursor-pointer active:scale-95"
                title="Buka rute dan titik koordinat langsung di Google Maps"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Titik Google Maps</span>
                <ExternalLink className="w-3 h-3 text-emerald-600" />
              </a>
            ) : (
              <div className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
                <span>Jaminan: <strong className="text-slate-800">Rekber Resmi Bantuin.id</strong></span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MODALS                                                             */}
      {/* ===================================================================== */}

      {/* MODAL: SEWA SERAH TERIMA UNIT */}
      {activeModal === "handover" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Dokumentasi &amp; Serah Terima Unit (Mitra)</h3>
                  <p className="text-[11px] text-slate-500">Dokumentasikan kondisi fisik alat sebelum diserahkan ke penyewa</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRentalHandoverSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Seri / Serial Number (Opsional)</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Contoh: SN-82910482-BANTUIN"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div>
                <input
                  type="file"
                  ref={handoverFileRef}
                  onChange={handleHandoverFilesSelected}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                  multiple
                />
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Foto Kondisi Fisik Baseline <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {handoverPhotos.length}/3 Foto
                  </span>
                </div>

                {handoverPhotos.length === 0 ? (
                  <div
                    onClick={() => handoverFileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingHandover(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingHandover(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingHandover(false);
                      processImageFiles(e.dataTransfer.files, handoverPhotos, setHandoverPhotos, "Foto Baseline");
                    }}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isDraggingHandover
                        ? "border-[#1683FF] bg-blue-50/90 scale-[1.01]"
                        : "border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-[#1683FF]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {isDraggingHandover ? "Lepaskan foto di sini" : "Tarik & lepas foto ke sini, atau klik untuk memilih"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Hanya format gambar (PNG, JPG, WebP) • Maksimal 3 foto
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {handoverPhotos.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                          <img src={url} alt={`Handover ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setHandoverPhotos((p) => p.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md hover:bg-rose-600 transition cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-[9px] text-white font-bold">
                            Foto {idx + 1}
                          </span>
                        </div>
                      ))}

                      {handoverPhotos.length < 3 && (
                        <div
                          onClick={() => handoverFileRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingHandover(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingHandover(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingHandover(false);
                            processImageFiles(e.dataTransfer.files, handoverPhotos, setHandoverPhotos, "Foto Baseline");
                          }}
                          className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 hover:border-[#1683FF] hover:text-[#1683FF] transition cursor-pointer ${
                            isDraggingHandover ? "border-[#1683FF] bg-blue-50/90 text-[#1683FF]" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <Plus className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">Tambah</span>
                        </div>
                      )}
                    </div>
                    {handoverPhotos.length >= 3 && (
                      <p className="text-[10px] text-slate-400 italic">
                        Batas maksimal 3 foto telah tercapai.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Kondisi Fisik <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Kondisi unit, aksesoris lengkap, fungsi normal..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistIdConfirmed}
                    onChange={(e) => setChecklistIdConfirmed(e.target.checked)}
                    className="rounded text-[#1683FF]"
                  />
                  <span>Identitas penyewa (KTP/SIM) telah diperiksa &amp; dicatat</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistConditionConfirmed}
                    onChange={(e) => setChecklistConditionConfirmed(e.target.checked)}
                    className="rounded text-[#1683FF]"
                  />
                  <span>Kondisi fisik &amp; fungsi telah diuji bersama sebelum diserahkan</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!checklistIdConfirmed || !checklistConditionConfirmed || isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi Serah Terima Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEWA PENGEMBALIAN UNIT */}
      {activeModal === "return" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Verifikasi Pengembalian Unit</h3>
                  <p className="text-[11px] text-slate-500">Konfirmasi pengembalian unit &amp; penyelesaian masa sewa</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRentalReturnSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Unit Sewa:</span>
                  <span className="font-semibold text-slate-800">{itemTitle}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Deposit Jaminan:</span>
                  <span className="font-bold text-[#1683FF]">
                    {formatIDR(room?.depositAmount || room?.rentalDetails?.depositFee || 500000)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  Setelah diverifikasi, deposit jaminan akan diproses kembali ke rekening penyewa dan hak sewa diteruskan ke saldo mitra.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi Pengembalian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEWA REVIEW & RATING TOKO */}
      {activeModal === "review" && transactionType === "sewa" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Beri Rating Toko Mitra</h3>
                  <p className="text-[11px] text-slate-500">Ulasan Anda membantu kualitas mitra penyedia sewa</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRentalReviewSubmit} className="space-y-4">
              <div className="flex flex-col items-center py-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rating Toko Mitra <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || selectedRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {selectedRating === 5 ? "Sempurna (5/5)" :
                   selectedRating === 4 ? "Sangat Baik (4/5)" :
                   selectedRating === 3 ? "Cukup Baik (3/5)" : "Kurang Puas"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Komentar &amp; Ulasan <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Kondisi alat sangat bagus, toko ramah dan responsif..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? "Memproses..." : "Kirim Ulasan & Selesaikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JASA SERAHKAN HASIL KERJA (DELIVERABLES & BUKTI FISIK) */}
      {activeModal === "deliverables" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  {config?.execMode === "customer_location" || config?.execMode === "onsite" ? (
                    <Camera className="w-4 h-4" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {config?.execMode === "customer_location"
                      ? "Kirim Bukti Pekerjaan di Lokasi"
                      : config?.execMode === "onsite"
                      ? "Dokumentasi & Pemeriksaan Unit Selesai"
                      : config?.execMode === "online"
                      ? "Kirim Berkas Pekerjaan Digital"
                      : "Kirim Bukti & Hasil Pekerjaan"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {config?.execMode === "customer_location" || config?.execMode === "onsite"
                      ? "Unggah foto dokumentasi fisik hasil pekerjaan dan catatan pengerjaan"
                      : config?.execMode === "online"
                      ? "Unggah berkas digital atau cantumkan tautan Google Drive / Cloud"
                      : "Unggah foto dokumentasi fisik, berkas digital, atau tautan Google Drive"}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverables} className="space-y-4">
              {/* OPSI FOTO DOKUMENTASI FISIK (Khusus Panggilan, Workshop, atau Hybrid) */}
              {(config?.execMode === "customer_location" || config?.execMode === "onsite" || config?.execMode === "hybrid") && (
                <div>
                  <input
                    type="file"
                    ref={jasaProofFileRef}
                    onChange={handleJasaProofFilesSelected}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    multiple
                  />
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Foto Dokumentasi Pekerjaan Fisik{" "}
                      {config?.execMode !== "online" && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {jasaProofPhotos.length}/3 Foto
                    </span>
                  </div>

                  {jasaProofPhotos.length === 0 ? (
                    <div
                      onClick={() => jasaProofFileRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingJasaProof(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingJasaProof(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingJasaProof(false);
                        processImageFiles(e.dataTransfer.files, jasaProofPhotos, setJasaProofPhotos, "Foto Dokumentasi");
                      }}
                      className={`border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        isDraggingJasaProof
                          ? "border-[#1683FF] bg-blue-50/90 scale-[1.01]"
                          : "border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-[#1683FF]"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">
                          {isDraggingJasaProof ? "Lepaskan foto dokumentasi di sini" : "Klik atau seret foto dokumentasi hasil pekerjaan fisik"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Format PNG, JPG, WebP • Maksimal 3 foto (Sebelum / Sesudah / Hasil Jadi)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {jasaProofPhotos.map((url, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                            <img src={url} alt={`Dokumentasi ${idx}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setJasaProofPhotos((p) => p.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md hover:bg-rose-600 transition cursor-pointer"
                              title="Hapus foto"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-[9px] text-white font-bold">
                              Foto {idx + 1}
                            </span>
                          </div>
                        ))}

                        {jasaProofPhotos.length < 3 && (
                          <div
                            onClick={() => jasaProofFileRef.current?.click()}
                            className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 hover:border-[#1683FF] hover:text-[#1683FF] transition cursor-pointer border-slate-200 bg-slate-50"
                          >
                            <Plus className="w-5 h-5 mb-0.5" />
                            <span className="text-[9px] font-bold">Tambah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAUTAN CLOUD / DRIVE */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tautan Cloud / Drive {config?.execMode === "online" ? "(Opsional jika ada berkas)" : "(Opsional)"}
                </label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/... atau https://github.com/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              {/* BERKAS DIGITAL */}
              <div>
                <input
                  type="file"
                  ref={deliverablesFileRef}
                  onChange={handleDeliverablesFilesSelected}
                  className="hidden"
                  multiple
                />
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Daftar Berkas Digital {config?.execMode === "online" && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                </label>
                {digitalFiles.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {digitalFiles.map((file) => (
                      <div key={file.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-[#1683FF] shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">({file.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDigitalFiles((prev) => prev.filter((f) => f.id !== file.id))}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => deliverablesFileRef.current?.click()}
                  className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500 hover:border-[#1683FF] hover:text-[#1683FF] transition flex items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan Berkas / Laporan</span>
                </button>
              </div>

              {/* CATATAN PENGERJAAN */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Pengerjaan & Hasil Selesai <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  placeholder={
                    config?.execMode === "customer_location"
                      ? "Contoh: Sesi les privat/servis selesai. Pemeriksaan unit/pekerjaan telah disaksikan pemesan..."
                      : config?.execMode === "onsite"
                      ? "Contoh: Pengerjaan telah selesai dengan baik dan siap diperiksa langsung di tempat mitra..."
                      : "Deskripsikan hasil pekerjaan yang telah diselesaikan..."
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>
                    {isSubmitting 
                      ? "Mengirim..." 
                      : (config?.execMode === "customer_location" || config?.execMode === "onsite"
                        ? "Kirim Bukti & Selesaikan"
                        : "Kirim Hasil Kerja")}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JASA PERMINTAAN REVISI */}
      {activeModal === "revision" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Ajukan Catatan Revisi</h3>
                  <p className="text-[11px] text-slate-500">Berikan instruksi perbaikan yang jelas untuk mitra</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Revisi <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Contoh: Tolong revisi bagian warna latar belakang menjadi lebih terang dan sesuaikan teks judul..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Catatan Revisi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JASA APPROVE & REVIEW */}
      {activeModal === "review" && transactionType === "jasa" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Setujui Hasil &amp; Beri Ulasan</h3>
                  <p className="text-[11px] text-slate-500">Dana escrow akan diteruskan ke saldo mitra penyedia</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmJasaCompletion} className="space-y-4">
              <div className="flex flex-col items-center py-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rating Pekerjaan <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || selectedRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {selectedRating === 5 ? "Sangat Memuaskan (5/5)" :
                   selectedRating === 4 ? "Bagus (4/5)" :
                   selectedRating === 3 ? "Cukup (3/5)" : "Perlu Peningkatan"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ulasan Pekerjaan <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Hasil kerja sangat rapi, komunikasi responsif, terima kasih..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Pencairan Dana Escrow:</span>
                  <span className="font-bold text-[#1683FF]">
                    {formatIDR(room?.helperPayoutAmount || room?.lockedAmount || 150000)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dana diteruskan otomatis ke rekening/dompet mitra tanpa potongan biaya tambahan.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? "Memproses..." : "Setujui & Selesaikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BANTUAN KIRIM BUKTI TUGAS / HASIL DIGITAL */}
      {activeModal === "task_proof" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  {config?.execMode === "online" ? (
                    <FileCheck2 className="w-4 h-4" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {config?.execMode === "online" ? "Kirim Hasil Pengerjaan Digital" : "Kirim Bukti Tugas Selesai"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {config?.execMode === "online"
                      ? "Unggah berkas digital, cantumkan tautan Google Drive / Cloud, atau tangkapan layar"
                      : "Unggah foto bukti tugas telah dituntaskan di lokasi"}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTaskProof} className="space-y-4">
              {/* OPSI TAUTAN & BERKAS DIGITAL (Jika Tugas Online) */}
              {config?.execMode === "online" && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tautan Google Drive / Cloud (Opsional)
                    </label>
                    <input
                      type="url"
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/... atau Docs/GitHub"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                    />
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={deliverablesFileRef}
                      onChange={handleDeliverablesFilesSelected}
                      className="hidden"
                      multiple
                    />
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Berkas Digital Tugas (Word, Excel, PDF, ZIP)
                    </label>
                    {digitalFiles.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {digitalFiles.map((file) => (
                          <div key={file.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-[#1683FF] shrink-0" />
                              <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">({file.size})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDigitalFiles((prev) => prev.filter((f) => f.id !== file.id))}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => deliverablesFileRef.current?.click()}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500 hover:border-[#1683FF] hover:text-[#1683FF] transition flex items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Unggah File Hasil Tugas</span>
                    </button>
                  </div>
                </>
              )}

              {/* FOTO BUKTI (Wajib jika offline, opsional jika online) */}
              <div>
                <input
                  type="file"
                  ref={taskProofFileRef}
                  onChange={handleTaskProofFilesSelected}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                  multiple
                />
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {config?.execMode === "online" ? "Foto / Tangkapan Layar (Opsional)" : "Foto Bukti Tugas Lapangan"}{" "}
                    {config?.execMode !== "online" && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {taskProofPhotos.length}/3 Foto
                  </span>
                </div>

                {taskProofPhotos.length === 0 ? (
                  <div
                    onClick={() => taskProofFileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTaskProof(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTaskProof(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTaskProof(false);
                      processImageFiles(e.dataTransfer.files, taskProofPhotos, setTaskProofPhotos, "Foto Bukti");
                    }}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isDraggingTaskProof
                        ? "border-[#1683FF] bg-blue-50/90 scale-[1.01]"
                        : "border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-[#1683FF]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {isDraggingTaskProof ? "Lepaskan foto bukti di sini" : "Tarik & lepas foto bukti ke sini, atau klik untuk memilih"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Hanya format gambar (PNG, JPG, WebP) • Maksimal 3 foto
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {taskProofPhotos.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                          <img src={url} alt={`Bukti ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setTaskProofPhotos((p) => p.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md hover:bg-rose-600 transition cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-[9px] text-white font-bold">
                            Foto {idx + 1}
                          </span>
                        </div>
                      ))}

                      {taskProofPhotos.length < 3 && (
                        <div
                          onClick={() => taskProofFileRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingTaskProof(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingTaskProof(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingTaskProof(false);
                            processImageFiles(e.dataTransfer.files, taskProofPhotos, setTaskProofPhotos, "Foto Bukti");
                          }}
                          className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 hover:border-[#1683FF] hover:text-[#1683FF] transition cursor-pointer ${
                            isDraggingTaskProof ? "border-[#1683FF] bg-blue-50/90 text-[#1683FF]" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <Plus className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">Tambah</span>
                        </div>
                      )}
                    </div>
                    {taskProofPhotos.length >= 3 && (
                      <p className="text-[10px] text-slate-400 italic">
                        Batas maksimal 3 foto telah tercapai.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Penyelesaian <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  placeholder={
                    config?.execMode === "online"
                      ? "Contoh: Tugas pengetikan skripsi / rekap data excel telah selesai dikerjakan sesuai permintaan..."
                      : "Tugas telah selesai dilaksanakan sesuai instruksi pemesan di lokasi..."
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </span>
                  ) : (
                    <span>{config?.execMode === "online" ? "Kirim Hasil Pengerjaan" : "Kirim Bukti Tugas"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BANTUAN KONFIRMASI SELESAI & RATING */}
      {activeModal === "task_completion" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center overflow-y-auto px-4 pt-20 pb-6">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            {/* Header — fixed */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Konfirmasi Tugas Selesai</h3>
                  <p className="text-[11px] text-slate-500">Imbalan akan diteruskan ke saldo dompet helper</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTaskCompletion} className="px-5 pb-4 space-y-4">
              <div className="pt-4 space-y-4">

              {/* BUKTI PENYELESAIAN TUGAS — foto & catatan dari helper */}
              {(() => {
                const proofPhotos = (() => {
                  const seen = new Set();
                  const unique = [];
                  const addUrl = (url) => {
                    if (!url || typeof url !== "string") return;
                    const normalized = url.trim().replace(/^https?:\/\/[^/]+/i, "").split("?")[0];
                    if (!seen.has(normalized)) {
                      seen.add(normalized);
                      unique.push(url);
                    }
                  };
                  if (room?.proofPhotos?.length) {
                    room.proofPhotos.forEach(addUrl);
                  }
                  if (room?.messages?.length) {
                    room.messages.forEach((m) => {
                      if (m.proofPhotos?.length) m.proofPhotos.forEach(addUrl);
                      if (m.photos?.length && (m.isTaskProof || m.isHandoverProof)) m.photos.forEach(addUrl);
                    });
                  }
                  return unique;
                })();
                const proofNotes = room?.proofNotes || (() => {
                  const msg = room?.messages?.find((m) => (m.isTaskProof || m.isHandoverProof) && m.notes);
                  return msg?.notes || "";
                })();

                return (
                  <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1683FF]">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Bukti Penyelesaian Tugas</span>
                      </div>
                      {proofPhotos.length > 0 && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                          {proofPhotos.length} Foto Bukti
                        </span>
                      )}
                    </div>

                    {/* Tautan Hasil Pengerjaan (Google Drive / Cloud) jika ada */}
                    {(room?.submissionUrl && room.submissionUrl !== "-") && (
                      <a
                        href={room.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-blue-200 hover:border-[#1683FF] hover:bg-blue-50/50 transition group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ExternalLink className="w-4 h-4 text-[#1683FF] shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">Tautan Hasil Tugas:</span>
                          <span className="text-xs text-[#1683FF] underline truncate">{room.submissionUrl}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-md group-hover:bg-[#1683FF] group-hover:text-white transition shrink-0 ml-2">
                          Buka Link
                        </span>
                      </a>
                    )}

                    {proofPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {proofPhotos.map((imgUrl, pIdx) => {
                          const isPdf = typeof imgUrl === "string" && (
                            imgUrl.toLowerCase().split("?")[0].endsWith(".pdf") ||
                            imgUrl.toLowerCase().includes("application/pdf") ||
                            imgUrl.toLowerCase().includes("/pdf") ||
                            imgUrl.toLowerCase().includes("dokumentugas")
                          );

                          if (isPdf) {
                            return (
                              <a
                                key={pIdx}
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="relative group aspect-video rounded-xl overflow-hidden border border-rose-200 bg-rose-50/90 p-2 flex flex-col items-center justify-center text-center cursor-pointer shadow-xs hover:bg-rose-100 transition"
                              >
                                <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-110 transition">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <span className="text-[10px] font-bold text-rose-800 truncate max-w-full px-1">
                                  Dokumen PDF
                                </span>
                                <span className="text-[9px] text-rose-600 font-semibold flex items-center gap-0.5">
                                  Lihat Berkas <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              </a>
                            );
                          }

                          return (
                            <a
                              key={pIdx}
                              href={imgUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="relative group aspect-video rounded-xl overflow-hidden border border-blue-200 bg-slate-900/10 cursor-pointer shadow-xs block"
                            >
                              <img
                                src={imgUrl}
                                alt={`Bukti Tugas ${pIdx + 1}`}
                                onError={(e) => {
                                  // Fallback jika file ternyata PDF atau gambar tidak dapat dirender
                                  e.currentTarget.style.display = "none";
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.className = "relative group aspect-video rounded-xl overflow-hidden border border-rose-200 bg-rose-50/90 p-2 flex flex-col items-center justify-center text-center cursor-pointer shadow-xs";
                                    parent.innerHTML = '<div class="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center mb-1 shadow-2xs"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div><span class="text-[10px] font-bold text-rose-800 truncate max-w-full px-1">Dokumen PDF</span><span class="text-[9px] text-rose-600 font-semibold">Buka Berkas ↗</span>';
                                  }
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                <Eye className="w-3 h-3" />
                                <span>Lihat</span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic bg-white/80 p-2.5 rounded-xl border border-blue-100">
                        Helper telah menyatakan tugas selesai. Tinjau percakapan untuk detail.
                      </p>
                    )}

                    {proofNotes && (
                      <div className="text-xs bg-white p-2.5 rounded-xl border border-blue-100 leading-relaxed">
                        <span className="font-bold text-slate-800 text-[11px] block mb-0.5">Catatan Helper:</span>
                        <p className="italic text-slate-600 text-[11px]">&ldquo;{proofNotes}&rdquo;</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-col items-center py-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rating untuk Helper <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || selectedRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {selectedRating === 5 ? "Sangat Membantu (5/5)" :
                   selectedRating === 4 ? "Baik & Cepat (4/5)" :
                   selectedRating === 3 ? "Cukup Baik (3/5)" : "Kurang Memuaskan"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ulasan untuk Helper <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Helper sangat cekatan, ramah, dan tepat waktu..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Pencairan Imbalan:</span>
                  <span className="font-bold text-[#1683FF]">
                    {formatIDR(room?.helperPayoutAmount || room?.lockedAmount || 35000)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dana akan diteruskan 100% ke saldo helper Bantuin.id.
                </p>
              </div>

              </div>{/* end body */}

              {/* Footer */}
              <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi Selesai & Bayar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
