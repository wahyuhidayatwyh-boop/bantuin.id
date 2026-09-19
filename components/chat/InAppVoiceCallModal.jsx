"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Lock,
  Check
} from "lucide-react";

export default function InAppVoiceCallModal({
  isOpen,
  onClose,
  partner,
  roomTitle,
  onCallEnded
}) {
  const [callState, setCallState] = useState("ringing"); // 'ringing' | 'connected' | 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [waveHeights, setWaveHeights] = useState([8, 16, 24, 12, 20, 28, 14, 22]);

  const dialToneCleanupRef = useRef(null);

  // Bersihkan penamaan partner agar selalu konsisten
  const cleanPartnerName = (partner?.name || "Mitra Bantuin").replace("Mitra Rental", "Mitra Sewa");

  // Web Audio API untuk nada dering panggil realistis
  useEffect(() => {
    if (!isOpen || callState !== "ringing") {
      if (dialToneCleanupRef.current) {
        dialToneCleanupRef.current();
        dialToneCleanupRef.current = null;
      }
      return;
    }

    let isCancelled = false;
    let audioCtx = null;
    let intervalId = null;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();

        const playRingBurst = () => {
          if (isCancelled || !audioCtx || audioCtx.state === "closed") return;
          if (audioCtx.state === "suspended") {
            audioCtx.resume();
          }

          try {
            const osc1 = audioCtx.createOscillator();
            const osc2 = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc1.type = "sine";
            osc2.type = "sine";
            osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
            osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

            gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.4);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(audioCtx.currentTime + 1.4);
            osc2.stop(audioCtx.currentTime + 1.4);
          } catch (e) {
            // Audio interupsi ditoleransi
          }
        };

        playRingBurst();
        intervalId = setInterval(playRingBurst, 3200);

        dialToneCleanupRef.current = () => {
          isCancelled = true;
          if (intervalId) clearInterval(intervalId);
          try {
            audioCtx?.close();
          } catch (e) {}
        };
      }
    } catch (err) {
      // Browser Web Audio tidak tersedia
    }

    // Sambungkan otomatis setelah 3 detik untuk simulasi panggilan berhasil
    const connectTimer = setTimeout(() => {
      if (!isCancelled) {
        setCallState("connected");
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearTimeout(connectTimer);
      if (dialToneCleanupRef.current) {
        dialToneCleanupRef.current();
        dialToneCleanupRef.current = null;
      }
    };
  }, [isOpen, callState]);

  // Timer panggilan aktif
  useEffect(() => {
    if (callState !== "connected") return;

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    const waveInterval = setInterval(() => {
      if (!isMuted) {
        setWaveHeights([
          Math.floor(8 + Math.random() * 20),
          Math.floor(12 + Math.random() * 26),
          Math.floor(8 + Math.random() * 32),
          Math.floor(14 + Math.random() * 24),
          Math.floor(10 + Math.random() * 30),
          Math.floor(16 + Math.random() * 34),
          Math.floor(10 + Math.random() * 22),
          Math.floor(8 + Math.random() * 18),
        ]);
      } else {
        setWaveHeights([4, 4, 4, 4, 4, 4, 4, 4]);
      }
    }, 150);

    return () => {
      clearInterval(timer);
      clearInterval(waveInterval);
    };
  }, [callState, isMuted]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    if (dialToneCleanupRef.current) {
      dialToneCleanupRef.current();
      dialToneCleanupRef.current = null;
    }
    setCallState("ended");

    const finalDuration = callDuration;
    setTimeout(() => {
      onCallEnded?.(finalDuration);
      onClose();
      // Reset state untuk panggilan berikutnya
      setCallState("ringing");
      setCallDuration(0);
      setIsMinimized(false);
    }, 700);
  };

  if (!isOpen) return null;

  // Floating PiP Mode (Konsisten Biru & Putih)
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
        <div className="bg-white text-slate-800 rounded-2xl p-2.5 shadow-xl border border-blue-200/80 flex items-center gap-3 backdrop-blur-md">
          <div className="relative">
            <img
              src={partner?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
              alt={cleanPartnerName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#1683FF]"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#1683FF] border-2 border-white animate-pulse" />
          </div>

          <div className="min-w-0 pr-1">
            <div className="font-bold text-xs text-slate-900 truncate max-w-[120px]">{cleanPartnerName}</div>
            <div className="text-[11px] text-[#1683FF] font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] animate-ping" />
              <span>{callState === "ringing" ? "Memanggil..." : formatDuration(callDuration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl text-xs transition cursor-pointer ${
                isMuted ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#1683FF]"
              }`}
              title={isMuted ? "Nyalakan Mikrofon" : "Bisukan Mikrofon"}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#1683FF] transition cursor-pointer"
              title="Perbesar Tampilan Panggilan"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleEndCall}
              className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition cursor-pointer"
              title="Akhiri Panggilan"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      
      {/* Modal Utama: 100% Tema Bersih Biru & Putih */}
      <div className="relative w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 text-slate-800 flex flex-col items-center p-6 sm:p-7">
        
        {/* Bar Atas Minimalis */}
        <div className="w-full flex items-center justify-between text-xs mb-5">
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1683FF] border border-blue-200/70 text-[11px] font-bold">
            <Lock className="w-3 h-3 text-[#1683FF]" />
            <span>Telepon In-App</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Kecilkan ke pojok layar"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Profil Mitra */}
        <div className="flex flex-col items-center text-center my-auto w-full">
          
          {/* Avatar dengan Ring Biru Lembut */}
          <div className="relative mb-3.5">
            {callState === "ringing" && (
              <div className="absolute -inset-2.5 rounded-full bg-blue-100/70 animate-ping pointer-events-none" />
            )}

            <img
              src={partner?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
              alt={cleanPartnerName}
              className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full object-cover border-2 border-white ring-4 ring-blue-100 shadow-sm"
            />

            <div className="absolute bottom-0 right-0 p-1 rounded-full bg-[#1683FF] text-white shadow-xs border-2 border-white">
              <Phone className="w-3 h-3" />
            </div>
          </div>

          {/* Nama & Konteks Singkat */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate max-w-[260px]">
            {cleanPartnerName}
          </h3>
          
          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[240px]">
            {roomTitle || "Mitra Terverifikasi"}
          </p>

          {/* Status Panggilan & Timer */}
          <div className="mt-4 mb-2">
            {callState === "ringing" && (
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#1683FF] flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] animate-ping" />
                  <span>Menghubungkan...</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCallState("connected")}
                  className="text-[10px] text-slate-400 hover:text-[#1683FF] transition cursor-pointer underline decoration-slate-300"
                >
                  Langsung jawab otomatis
                </button>
              </div>
            )}

            {callState === "connected" && (
              <div className="space-y-2">
                <div className="font-mono text-2xl font-extrabold text-slate-900 tracking-wider flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1683FF] animate-pulse" />
                  <span>{formatDuration(callDuration)}</span>
                </div>

                {/* Gelombang Suara Bersih */}
                <div className="flex items-center justify-center gap-1 h-8 px-4 py-1 bg-blue-50/60 rounded-xl border border-blue-100/80">
                  {waveHeights.map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}px` }}
                      className={`w-1 rounded-full transition-all duration-100 ${
                        isMuted ? "bg-slate-300" : "bg-[#1683FF]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {callState === "ended" && (
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-rose-600">Panggilan Berakhir</div>
                <div className="text-[11px] text-slate-400">Durasi: {formatDuration(callDuration)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Kontrol Panggilan (Mute, Akhiri, Speaker) */}
        <div className="w-full pt-5 mt-auto border-t border-slate-100">
          <div className="flex items-center justify-center gap-6">
            
            {/* Tombol Mute */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                disabled={callState === "ended"}
                className={`w-11 h-11 rounded-full transition flex items-center justify-center cursor-pointer ${
                  isMuted
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1683FF] border border-slate-200"
                }`}
                title={isMuted ? "Nyalakan Suara" : "Bisukan Suara"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <span className="text-[10px] font-medium text-slate-500">{isMuted ? "Bisu" : "Mic"}</span>
            </div>

            {/* Tombol Tutup Telepon (End Call) */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleEndCall}
                className="w-13 h-13 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                title="Tutup Panggilan"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-medium text-slate-500">Tutup</span>
            </div>

            {/* Tombol Speaker */}
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                disabled={callState === "ended"}
                className={`w-11 h-11 rounded-full transition flex items-center justify-center cursor-pointer ${
                  isSpeakerOn
                    ? "bg-blue-50 hover:bg-blue-100 text-[#1683FF] border border-blue-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                }`}
                title={isSpeakerOn ? "Speaker Aktif" : "Earpiece Aktif"}
              >
                {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <span className="text-[10px] font-medium text-slate-500">Speaker</span>
            </div>

          </div>

          {/* Footer Minimalis */}
          <div className="text-center mt-3.5">
            <span className="text-[10px] text-slate-400">
              Privasi nomor HP 100% terjaga rahasia
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
