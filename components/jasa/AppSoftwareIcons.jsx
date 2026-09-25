"use client";

import React from "react";
import { Zap } from "lucide-react";

// =========================================================================
// HIGH-FIDELITY SOFTWARE & APP ICONS (iOS / macOS App Icon Style)
// Authentic brand aesthetics, crisp vectors, and responsive squircles
// =========================================================================

export function FigmaIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-slate-900 border border-slate-700/60 p-1 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 ${className}`}>
      <svg viewBox="0 0 38 57" fill="none" className="w-full h-full">
        <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
        <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
        <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
        <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
        <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
      </svg>
    </div>
  );
}

export function PhotoshopIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#001E36] border border-[#31A8FF]/80 flex items-center justify-center font-black text-[#31A8FF] shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[11px] font-extrabold tracking-tighter">Ps</span>
    </div>
  );
}

export function IllustratorIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#330000] border border-[#FF9A00]/80 flex items-center justify-center font-black text-[#FF9A00] shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[11px] font-extrabold tracking-tighter">Ai</span>
    </div>
  );
}

export function CanvaIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-gradient-to-tr from-[#00C4CC] via-[#5C32E6] to-[#7D2AE8] flex items-center justify-center text-white font-black shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[12px] font-black italic">C</span>
    </div>
  );
}

export function CorelIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-300/40 flex items-center justify-center text-white font-bold shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[9px] font-black tracking-tight">CDR</span>
    </div>
  );
}

export function VSCodeIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#18181B] border border-blue-500/50 p-1 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 ${className}`}>
      <svg viewBox="0 0 24 24" className="w-full h-full fill-[#007ACC]">
        <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .32 8.688l3.64 3.313-3.64 3.314a1 1 0 0 0 .006 1.426l1.323 1.202a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352z"/>
      </svg>
    </div>
  );
}

export function ReactIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#14161B] border border-cyan-500/50 p-1 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 ${className}`}>
      <svg viewBox="-11.5 -10.23174 23 20.46348" className="w-full h-full fill-none stroke-[#61DAFB] stroke-[1.2]">
        <circle cx="0" cy="0" r="2.05" fill="#61DAFB" />
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </svg>
    </div>
  );
}

export function NextjsIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-black border border-slate-700 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[12px] font-black text-white tracking-tight">N</span>
    </div>
  );
}

export function TailwindIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-slate-900 border border-sky-400/50 p-1 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 ${className}`}>
      <svg viewBox="0 0 24 24" className="w-full h-full fill-[#38BDF8]">
        <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"/>
      </svg>
    </div>
  );
}

export function PythonIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#0F172A] border border-yellow-500/40 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[10px] font-black text-[#3776AB]">Py</span>
    </div>
  );
}

export function LightroomIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#001D26] border border-[#31A8FF]/80 flex items-center justify-center font-black text-[#31A8FF] shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[11px] font-extrabold tracking-tighter">Lr</span>
    </div>
  );
}

export function CameraAlphaIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-gradient-to-b from-stone-900 to-black border border-stone-700 flex items-center justify-center text-white shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[9px] font-black tracking-tight"><span className="text-red-500">α</span>/EOS</span>
    </div>
  );
}

export function GoogleDriveIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 ${className}`}>
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.45z" fill="#0066DA"/>
        <path d="M16.29 3.5H7.71l6.55 11.45h8.59z" fill="#00AC47"/>
        <path d="M14.26 15l-3.43 6H22.85l3.43-6z" fill="#EA4335"/>
        <path d="M4.58 21h18.27l-3.43-6H7.71z" fill="#FFBA00"/>
      </svg>
    </div>
  );
}

export function PremiereIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#260026] border border-[#EA77FF]/80 flex items-center justify-center font-black text-[#EA77FF] shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[11px] font-extrabold tracking-tighter">Pr</span>
    </div>
  );
}

export function AfterEffectsIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#1C002C] border border-[#9999FF]/80 flex items-center justify-center font-black text-[#9999FF] shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[11px] font-extrabold tracking-tighter">Ae</span>
    </div>
  );
}

export function CapCutIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-black border border-slate-700 flex items-center justify-center text-white shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[9px] font-black tracking-tight uppercase">CUT</span>
    </div>
  );
}

export function DaVinciIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#18181B] border border-slate-700 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-cyan-400 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[#18181B]" />
      </div>
    </div>
  );
}

export function WindowsIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-slate-900 border border-blue-500/50 flex items-center justify-center shadow-2xs transition-transform group-hover/app:scale-110 ${className}`}>
      <div className="grid grid-cols-2 gap-0.5 w-3.5 h-3.5">
        <div className="bg-[#0078D4] rounded-[1px]"></div>
        <div className="bg-[#0078D4] rounded-[1px]"></div>
        <div className="bg-[#0078D4] rounded-[1px]"></div>
        <div className="bg-[#0078D4] rounded-[1px]"></div>
      </div>
    </div>
  );
}

export function AppleIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-200 shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[12px]"></span>
    </div>
  );
}

export function LinuxIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#E95420] border border-orange-300/40 flex items-center justify-center text-white font-bold shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[9px] font-black">OS</span>
    </div>
  );
}

export function HardwareSSDIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-400/50 flex items-center justify-center text-cyan-300 font-bold shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[9px] font-mono font-black">SSD</span>
    </div>
  );
}

export function ACInverterIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 border border-teal-300/40 flex items-center justify-center text-white font-bold shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[8px] font-black uppercase tracking-tight">ECO</span>
    </div>
  );
}

export function PowerFlashIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-amber-500 border border-amber-300/50 flex items-center justify-center text-white font-bold shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <Zap className="w-3.5 h-3.5 fill-white text-white" />
    </div>
  );
}

export function WordIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#185ABD] border border-blue-300/50 flex items-center justify-center font-black text-white shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[11px] font-extrabold">W</span>
    </div>
  );
}

export function GoogleDocsIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#2684FC] border border-blue-200/50 flex items-center justify-center font-bold text-white shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[11px] font-mono">≡</span>
    </div>
  );
}

export function PdfIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#EE3124] border border-red-300/40 flex items-center justify-center font-black text-white shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[8px] font-black">PDF</span>
    </div>
  );
}

export function GrammarlyIcon({ className = "w-7 h-7" }) {
  return (
    <div className={`relative rounded-xl bg-[#15C39A] border border-emerald-300/40 flex items-center justify-center font-black text-white shadow-2xs transition-transform group-hover/app:scale-110 select-none ${className}`}>
      <span className="text-[11px] font-black">G</span>
    </div>
  );
}

// Master Icon Renderer Helper
export function RenderAppIcon({ type, className = "w-7 h-7" }) {
  switch (type) {
    case "figma":
      return <FigmaIcon className={className} />;
    case "ps":
      return <PhotoshopIcon className={className} />;
    case "ai":
      return <IllustratorIcon className={className} />;
    case "canva":
      return <CanvaIcon className={className} />;
    case "corel":
      return <CorelIcon className={className} />;
    case "vscode":
      return <VSCodeIcon className={className} />;
    case "react":
      return <ReactIcon className={className} />;
    case "nextjs":
      return <NextjsIcon className={className} />;
    case "tailwind":
      return <TailwindIcon className={className} />;
    case "python":
      return <PythonIcon className={className} />;
    case "lightroom":
      return <LightroomIcon className={className} />;
    case "camera":
      return <CameraAlphaIcon className={className} />;
    case "gdrive":
      return <GoogleDriveIcon className={className} />;
    case "premiere":
      return <PremiereIcon className={className} />;
    case "ae":
      return <AfterEffectsIcon className={className} />;
    case "capcut":
      return <CapCutIcon className={className} />;
    case "davinci":
      return <DaVinciIcon className={className} />;
    case "windows":
      return <WindowsIcon className={className} />;
    case "apple":
      return <AppleIcon className={className} />;
    case "linux":
      return <LinuxIcon className={className} />;
    case "ssd":
      return <HardwareSSDIcon className={className} />;
    case "inverter":
      return <ACInverterIcon className={className} />;
    case "power":
      return <PowerFlashIcon className={className} />;
    case "word":
      return <WordIcon className={className} />;
    case "docs":
      return <GoogleDocsIcon className={className} />;
    case "pdf":
      return <PdfIcon className={className} />;
    case "grammarly":
      return <GrammarlyIcon className={className} />;
    default:
      return null;
  }
}
