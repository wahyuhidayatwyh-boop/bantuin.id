"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  ArrowLeft,
  Send,
  ShieldCheck,
  Flag,
  CheckCheck,
  Loader2,
  MessageSquare,
  ImagePlus,
  X,
} from "lucide-react";

// ─── Konstanta ─────────────────────────────────────────────────────────────
const QUICK_MESSAGES = [
  "Saya ingin melaporkan kecurangan",
  "Ada masalah dengan pesanan saya",
  "Bagaimana keamanan pembayaran?",
  "Cek status laporan saya",
  "Ada pengguna mencurigakan",
];

function getAdminReply(text, hasImage) {
  if (hasImage)
    return "Terima kasih sudah mengirimkan foto bukti. Tim kami akan segera meninjau gambar tersebut. Apakah ada keterangan tambahan yang ingin kamu sampaikan?";
  const t = text.toLowerCase();
  if (t.includes("lapor") || t.includes("kecurangan") || t.includes("penipuan"))
    return "Terima kasih sudah menghubungi kami. Untuk laporan resmi beserta bukti foto, silakan gunakan halaman Laporkan Masalah agar kami bisa menindaklanjuti lebih cepat. Apakah ada detail yang bisa kamu ceritakan di sini?";
  if (t.includes("bayar") || t.includes("escrow") || t.includes("dana") || t.includes("refund"))
    return "Pembayaran kamu diamankan melalui Payment Gateway resmi dan sistem pencatatan resmi Bantuin. Hak bayar hanya diteruskan ke mitra setelah kedua pihak konfirmasi selesai. Jika ada kendala, tim kami siap membantu mediasi atau memproses refund. Bisa ceritakan lebih detail situasinya?";
  if (t.includes("status") || t.includes("laporan"))
    return "Untuk mengecek status laporan, bisa sebutkan ID laporan kamu? Format: rep-XXXXXXXX. Saya akan cek langsung untuk kamu.";
  if (t.includes("pesanan") || t.includes("order") || t.includes("transaksi"))
    return "Saya akan bantu cek pesananmu. Bisa berikan ID pesanan atau nama mitra/helper yang terlibat?";
  if (t.includes("mencurigakan") || t.includes("bypass") || t.includes("wa") || t.includes("whatsapp"))
    return "Terima kasih sudah melaporkan. Meminta transaksi di luar platform (disintermediasi) adalah pelanggaran serius. Silakan laporkan lewat halaman Laporkan Masalah dengan bukti screenshot chat.";
  if (t.match(/^(halo|hai|hello|hi|selamat)/))
    return "Halo! Saya dari tim Trust & Safety Bantuin. Ada yang bisa saya bantu hari ini?";
  return "Pesan kamu sudah kami terima. Bisa ceritakan lebih detail masalah yang kamu alami? Semakin lengkap informasinya, semakin cepat kami bisa membantu.";
}

function formatTime(d) {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!dateObj || isNaN(dateObj.getTime?.())) return "";
  return dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ─── Komponen ──────────────────────────────────────────────────────────────
function AdminAvatar({ size = "md" }) {
  const cls = size === "sm"
    ? "w-8 h-8 text-xs"
    : "w-10 h-10 text-sm";
  return (
    <div className={`${cls} rounded-full bg-[#1683FF] text-white font-extrabold flex items-center justify-center shrink-0 shadow-sm`}>
      B
    </div>
  );
}

function renderText(text) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line.split(/(\*\*.*?\*\*)/).map((p, j) =>
        p.startsWith("**") && p.endsWith("**")
          ? <strong key={j}>{p.slice(2, -2)}</strong>
          : p
      )}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

import { useApp } from "@/lib/context/AppContext";

// ─── Shared Storage Helper ──────────────────────────────────────────────────
const CHAT_STORAGE_KEY = "bantuin_admin_chat_threads";

function getStoredThreads() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveStoredThreads(threads) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(threads));
    window.dispatchEvent(new Event("bantuin_admin_chat_updated"));
  } catch (e) {}
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function AdminChatPage() {
  const { currentUser, selectedLocation } = useApp();
  const currentUserId = currentUser?.id || "usr-001";
  const currentUserName = currentUser?.fullName || "Rian Prasetya";
  const currentUserAvatar = currentUser?.avatarUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80";
  const userLoc = selectedLocation || "Jakarta Selatan";

  const initialGreeting = {
    id: 1,
    from: "admin",
    text: "Halo! Selamat datang di layanan Chat Admin Bantuin 👋\n\nSaya dari tim **Trust & Safety**. Saya siap membantu kamu dengan:\n• Pelaporan kecurangan atau penipuan\n• Pertanyaan seputar sistem pembayaran & keamanan\n• Status laporan yang sudah dibuat\n• Masalah transaksi lainnya\n\nSilakan ceritakan apa yang bisa saya bantu.",
    time: new Date().toISOString(),
  };

  const [messages, setMessages] = useState(() => {
    if (typeof window !== "undefined") {
      const allThreads = getStoredThreads();
      if (allThreads && Array.isArray(allThreads)) {
        const myThread = allThreads.find((t) => t.userId === currentUserId || t.id === "chat-001");
        if (myThread?.messages && myThread.messages.length > 0) {
          return myThread.messages;
        }
      }
    }
    return [initialGreeting];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync incoming updates from admin dashboard
  useEffect(() => {
    const handleSync = () => {
      const allThreads = getStoredThreads();
      if (allThreads && Array.isArray(allThreads)) {
        const myThread = allThreads.find((t) => t.userId === currentUserId || t.id === "chat-001");
        if (myThread?.messages) {
          setMessages(myThread.messages);
        }
      }
    };
    window.addEventListener("bantuin_admin_chat_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("bantuin_admin_chat_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran foto maksimal 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeImage = () => setImagePreview(null);

  const sendMessage = (quickText) => {
    const trimmed = (quickText ?? input).trim();
    const hasImg = !!imagePreview;
    if (!trimmed && !hasImg) return;
    if (isTyping) return;

    const userMsg = {
      id: Date.now(),
      from: "user",
      text: trimmed,
      image: imagePreview ?? null,
      time: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setImagePreview(null);

    // Save to shared threads so admin sees it immediately
    const allThreads = getStoredThreads() || [];
    const threadIndex = allThreads.findIndex((t) => t.userId === currentUserId || t.id === "chat-001");
    const threadData = {
      id: threadIndex >= 0 ? allThreads[threadIndex].id : `chat-${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      userAvatar: currentUserAvatar,
      location: userLoc,
      lastMessage: trimmed || "📷 Lampiran Foto",
      time: new Date().toISOString(),
      unread: true, // mark unread for Admin
      messages: updatedMessages,
    };

    let nextThreads;
    if (threadIndex >= 0) {
      nextThreads = allThreads.map((t, idx) => (idx === threadIndex ? { ...t, ...threadData } : t));
    } else {
      nextThreads = [threadData, ...allThreads];
    }
    saveStoredThreads(nextThreads);

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const replyMsg = {
        id: Date.now() + 1,
        from: "admin",
        text: getAdminReply(trimmed, hasImg),
        time: new Date().toISOString(),
      };
      setMessages((prev) => {
        const withReply = [...prev, replyMsg];
        // update storage
        const currentStored = getStoredThreads() || [];
        const idx = currentStored.findIndex((t) => t.userId === currentUserId || t.id === "chat-001");
        if (idx >= 0) {
          const updated = currentStored.map((t, i) =>
            i === idx ? { ...t, messages: withReply, lastMessage: replyMsg.text.slice(0, 60), time: new Date().toISOString() } : t
          );
          saveStoredThreads(updated);
        }
        return withReply;
      });
    }, 1200 + Math.random() * 600);
  };

  const canSend = (input.trim() || imagePreview) && !isTyping;

  return (
    /* Full-screen: navbar + chat memenuhi layar */
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <Navbar />

      {/* ── Chat shell — memenuhi sisa tinggi layar ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar kiri (desktop) */}
        <aside className="hidden lg:flex flex-col w-72 bg-[#F5FAFF] border-r border-[#DCEAF7] shrink-0">
          {/* Header sidebar */}
          <div className="p-5 border-b border-[#DCEAF7]">
            <Link
              href="/keamanan"
              className="inline-flex items-center gap-2 text-xs text-[#61758A] hover:text-[#1683FF] transition mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Pusat Keamanan
            </Link>
            <div className="flex items-center gap-3">
              <AdminAvatar />
              <div>
                <div className="font-bold text-sm text-[#102A43]">Tim Bantuin</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-emerald-600 font-semibold">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info keamanan */}
          <div className="p-5 space-y-3 flex-1">
            <p className="text-[11px] font-bold text-[#61758A] uppercase tracking-wider">Tentang Layanan Ini</p>
            {[
              { icon: ShieldCheck, text: "Chat dipantau tim keamanan Bantuin" },
              { icon: MessageSquare, text: "Respons biasanya dalam 1×24 jam" },
              { icon: ImagePlus, text: "Kamu bisa kirim foto bukti langsung di chat ini" },
              { icon: Flag, text: "Untuk laporan resmi + bukti foto, gunakan halaman Laporkan Masalah" },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-[#61758A]">
                <Icon className="w-3.5 h-3.5 text-[#1683FF] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA buat laporan */}
          <div className="p-5 border-t border-[#DCEAF7]">
            <Link
              href="/lapor"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition"
            >
              <Flag className="w-3.5 h-3.5" />
              Buat Laporan Resmi
            </Link>
          </div>
        </aside>

        {/* ── Area Chat Utama ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header chat (mobile: tampil penuh; desktop: ringkas) */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-[#DCEAF7] bg-white shrink-0">
            {/* Tombol back — hanya mobile */}
            <Link href="/keamanan"
              className="lg:hidden p-1.5 -ml-1 rounded-lg hover:bg-[#EAF4FF] text-[#61758A] hover:text-[#1683FF] transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <AdminAvatar size="sm" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#102A43]">Tim Bantuin</span>
                <span className="hidden sm:inline text-[10px] font-semibold text-[#1683FF] bg-[#EAF4FF] px-2 py-0.5 rounded-full border border-[#DCEAF7]">
                  Trust & Safety
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-emerald-600 font-medium">Online — Respons 1×24 jam</span>
              </div>
            </div>

            {/* Shortcut laporan — desktop di header */}
            <Link href="/lapor"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition shrink-0">
              <Flag className="w-3.5 h-3.5" />
              Laporan Resmi
            </Link>
          </div>

          {/* Info bar keamanan */}
          <div className="bg-[#EAF4FF] border-b border-[#DCEAF7] px-4 sm:px-5 py-2 flex items-center gap-2 text-[11px] text-[#1683FF] shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>
              Chat ini dipantau tim keamanan.{" "}
              <Link href="/lapor" className="font-bold underline hover:text-[#0F6FE5]">
                Laporan resmi + bukti foto
              </Link>{" "}
              diproses lebih cepat.
            </span>
          </div>

          {/* ── Area Pesan — flex-1 ── */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 bg-[#F5FAFF]">
            {messages.map((msg) => {
              const isUser = msg.from === "user";
              return (
                <div key={msg.id} className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
                  {!isUser && <AdminAvatar size="sm" />}
                  <div className="max-w-[72%] sm:max-w-[60%] space-y-1">
                    {/* Gambar bukti (jika ada) */}
                    {msg.image && (
                      <div className={`rounded-2xl overflow-hidden border border-[#DCEAF7] shadow-sm ${isUser ? "rounded-br-none" : "rounded-bl-none"}`}>
                        <img
                          src={msg.image}
                          alt="Foto bukti"
                          className="max-w-[220px] sm:max-w-[260px] w-full object-cover cursor-zoom-in"
                          onClick={() => window.open(msg.image, "_blank")}
                        />
                      </div>
                    )}
                    {/* Teks (jika ada) */}
                    {msg.text && (
                      <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-[#1683FF] text-white rounded-br-none"
                          : "bg-white border border-[#DCEAF7] text-[#102A43] rounded-bl-none shadow-sm"
                      }`}>
                        {renderText(msg.text)}
                      </div>
                    )}
                    <div className={`flex items-center gap-1 ${isUser ? "justify-end" : ""}`}>
                      <span className="text-[10px] text-[#61758A]">{formatTime(msg.time)}</span>
                      {isUser && <CheckCheck className="w-3 h-3 text-[#1683FF]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2.5">
                <AdminAvatar size="sm" />
                <div className="bg-white border border-[#DCEAF7] rounded-2xl rounded-bl-none px-4 py-3.5 shadow-sm">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="w-2 h-2 rounded-full bg-[#DCEAF7] animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Quick messages ── */}
          <div className="bg-white border-t border-[#DCEAF7] px-4 sm:px-5 pt-2.5 pb-0 shrink-0">
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2.5">
              {QUICK_MESSAGES.map((q, i) => (
                <button key={i} type="button" onClick={() => sendMessage(q)}
                  className="shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#F5FAFF] border border-[#DCEAF7] text-[#61758A] hover:border-[#1683FF] hover:text-[#1683FF] hover:bg-[#EAF4FF] transition cursor-pointer whitespace-nowrap">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* ── Input kirim ── */}
          <div className="bg-white border-t border-[#DCEAF7] px-4 sm:px-5 py-3 shrink-0">

            {/* Preview gambar sebelum kirim */}
            {imagePreview && (
              <div className="mb-2.5 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview foto"
                  className="h-20 w-auto rounded-xl border border-[#DCEAF7] object-cover shadow-sm"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow hover:bg-rose-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Input file tersembunyi */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {/* Tombol lampirkan foto */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Lampirkan foto"
                className="w-10 h-10 rounded-xl border border-[#DCEAF7] bg-[#F5FAFF] text-[#61758A] hover:border-[#1683FF] hover:text-[#1683FF] hover:bg-[#EAF4FF] flex items-center justify-center transition shrink-0 cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder="Tulis pesan ke Tim Bantuin..."
                rows={1}
                className="flex-1 text-xs border border-[#DCEAF7] rounded-xl px-4 py-3 bg-[#F5FAFF] text-[#102A43] placeholder:text-[#61758A] focus:outline-none focus:border-[#1683FF] focus:bg-white transition resize-none leading-relaxed"
                style={{ fieldSizing: "content", maxHeight: "120px" }}
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!canSend}
                className="w-10 h-10 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] disabled:bg-[#DCEAF7] text-white flex items-center justify-center transition active:scale-95 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {isTyping
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>

            <p className="text-[10px] text-[#61758A] mt-1.5 text-center">
              Enter kirim · Shift+Enter baris baru · Maks. foto 5MB
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
