"use client";

import React, { useState, useEffect } from "react";
import { Eye, X, ExternalLink, Download, FileText, Image as ImageIcon, RotateCw } from "lucide-react";

/**
 * Memeriksa apakah URL kemungkinan adalah berkas PDF
 */
export function isPdfDocument(url) {
  if (!url || typeof url !== "string") return false;
  const cleanUrl = url.split("?")[0].toLowerCase();
  return (
    cleanUrl.endsWith(".pdf") ||
    url.toLowerCase().includes(".pdf?") ||
    url.toLowerCase().includes("application/pdf") ||
    url.startsWith("data:application/pdf")
  );
}

/**
 * Modal Universal untuk Pratinjau Dokumen (PDF, Foto KTP/KTM, Bukti Pembayaran, dll)
 * Mendukung tampilan PDF langsung di dalam modal (via iframe) dan gambar/foto dengan auto-fallback.
 */
export default function DocumentPreviewModal({
  url,
  title = "Pratinjau Dokumen / Foto Bukti",
  onClose,
}) {
  const [viewMode, setViewMode] = useState("auto"); // "auto", "image", "iframe"
  const [imgFailed, setImgFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isPdf = isPdfDocument(url);

  // Reset state jika URL berubah
  useEffect(() => {
    setImgFailed(false);
    setIsLoading(true);
    setViewMode(isPdf ? "iframe" : "auto");
  }, [url, isPdf]);

  // Handle ESC key untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!url) return null;

  const shouldRenderIframe = isPdf || viewMode === "iframe" || imgFailed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[92vh] bg-white rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1683FF] flex items-center justify-center shrink-0">
              {shouldRenderIframe ? <FileText className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                {title}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {shouldRenderIframe ? "Dokumen PDF / Berkas Digital" : "Foto / Berkas Gambar"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Toggle Mode Viewer */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600 mr-1">
              <button
                type="button"
                onClick={() => { setViewMode("image"); setImgFailed(false); }}
                className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                  !shouldRenderIframe ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
                title="Tampilkan sebagai Foto"
              >
                <ImageIcon className="w-3 h-3" /> Foto
              </button>
              <button
                type="button"
                onClick={() => setViewMode("iframe")}
                className={`px-2 py-1 rounded-md transition flex items-center gap-1 ${
                  shouldRenderIframe ? "bg-white text-slate-900 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
                title="Tampilkan sebagai PDF / Dokumen"
              >
                <FileText className="w-3 h-3" /> PDF
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              title="Tutup Modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950/5 rounded-xl p-2 min-h-[350px] relative">
          {shouldRenderIframe ? (
            <iframe
              src={url}
              title="Pratinjau Dokumen PDF"
              onLoad={() => setIsLoading(false)}
              className="w-full h-[68vh] rounded-lg border border-slate-200 bg-white shadow-xs"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full min-h-[300px]">
              <img
                src={url}
                alt="Pratinjau Dokumen"
                referrerPolicy="no-referrer"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  console.warn("[DocumentPreviewModal] Image failed to render as <img>, auto-switching to iframe fallback.");
                  setImgFailed(true);
                  setViewMode("iframe");
                  setIsLoading(false);
                }}
                className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 flex flex-wrap justify-between items-center text-xs text-slate-500 gap-2">
          <span className="text-[11px] text-slate-400">
            Klik di luar atau tekan tombol <strong>Esc</strong> untuk menutup
          </span>

          <div className="flex items-center gap-2">
            <a
              href={url}
              download
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas</span>
            </a>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold flex items-center gap-1.5 transition text-xs shadow-2xs cursor-pointer"
            >
              <span>Buka Tab Baru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
