"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  Move, 
  Camera,
  RefreshCw,
  Maximize2
} from "lucide-react";

export default function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
  isProcessing = false,
}) {
  // Default zoom 0.55 (55%) agar tampilan awal foto lebih mundur & proporsional
  const [zoom, setZoom] = useState(0.55);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [naturalDims, setNaturalDims] = useState({ width: 240, height: 240 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const PREVIEW_SIZE = 240;

  // Calculate base display size based on natural aspect ratio
  const aspect = naturalDims.width / naturalDims.height || 1;
  let baseWidth = PREVIEW_SIZE;
  let baseHeight = PREVIEW_SIZE;

  if (aspect >= 1) {
    baseHeight = PREVIEW_SIZE;
    baseWidth = PREVIEW_SIZE * aspect;
  } else {
    baseWidth = PREVIEW_SIZE;
    baseHeight = PREVIEW_SIZE / aspect;
  }

  // Reset when a new image is loaded
  useEffect(() => {
    if (isOpen) {
      setZoom(0.55);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Handle Mouse / Touch Dragging
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Zoom controls (allows zooming out to 20% and in to 300%)
  const handleZoomChange = (e) => {
    setZoom(parseFloat(e.target.value));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, +(prev + 0.1).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.2, +(prev - 0.1).toFixed(2)));
  };

  // Rotate controls
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = (presetZoom = 0.55) => {
    setZoom(presetZoom);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Render cropped canvas and export pixel-perfect
  const handleSaveCropped = async () => {
    if (!imageRef.current) return;

    try {
      const img = imageRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const OUTPUT_SIZE = 512; // High-res 512x512
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const scaleFactor = OUTPUT_SIZE / PREVIEW_SIZE;

      ctx.save();
      // Fill background with clean white for zoomed-out borders
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Move origin to canvas center
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // Pixel-perfect scale and draw dimensions matching preview exactly
      const drawWidth = baseWidth * zoom * scaleFactor;
      const drawHeight = baseHeight * zoom * scaleFactor;

      const drawX = (position.x * scaleFactor) - (drawWidth / 2);
      const drawY = (position.y * scaleFactor) - (drawHeight / 2);

      // Draw image
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      // Convert to blob and dataUrl
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `avatar-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            onApplyCrop({ file, blob, dataUrl });
          } else {
            onApplyCrop({ file: null, blob: null, dataUrl });
          }
        },
        "image/jpeg",
        0.92
      );
    } catch (err) {
      console.error("Failed to crop image:", err);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[95vh]"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Sesuaikan Foto Profil
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Atur zoom & geser foto agar pas dan tidak terlalu dekat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport & Interactive Crop Canvas */}
        <div className="relative w-full h-64 sm:h-72 bg-slate-950 flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing shrink-0">
          {/* Draggable & Scalable Image */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            className="absolute inset-0 flex items-center justify-center will-change-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Avatar Crop Preview"
              crossOrigin="anonymous"
              onLoad={(e) => {
                const nw = e.currentTarget.naturalWidth || 240;
                const nh = e.currentTarget.naturalHeight || 240;
                setNaturalDims({ width: nw, height: nh });
              }}
              style={{
                width: `${baseWidth}px`,
                height: `${baseHeight}px`,
                minWidth: `${baseWidth}px`,
                minHeight: `${baseHeight}px`,
              }}
              className="pointer-events-none select-none block max-w-none max-h-none"
            />
          </div>

          {/* Mask Overlay: Circular Frame with Dark Backdrop */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Circular cut-out viewport */}
            <div 
              style={{ width: `${PREVIEW_SIZE}px`, height: `${PREVIEW_SIZE}px` }}
              className="relative rounded-full border-2 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.75)]"
            >
              {/* Center crosshair guide */}
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="w-full h-px bg-white/40" />
                <div className="h-full w-px bg-white/40 absolute" />
              </div>
            </div>
          </div>

          {/* Hint Overlay */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white/90 text-[11px] rounded-full pointer-events-none flex items-center gap-1.5 shadow-md">
            <Move className="w-3 h-3 text-teal-400" />
            <span>Klik & geser foto untuk memposisikan</span>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
          {/* Zoom Slider (0.2x to 3.0x) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1 text-[11px]">
                <span>Tingkat Zoom:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{Math.round(zoom * 100)}%</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoom(0.45)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                    Math.abs(zoom - 0.45) < 0.05 
                      ? "bg-teal-600 text-white border-teal-600" 
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Mundur
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(0.7)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                    Math.abs(zoom - 0.7) < 0.05 
                      ? "bg-teal-600 text-white border-teal-600" 
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Sedang
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1.0)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition ${
                    Math.abs(zoom - 1.0) < 0.05 
                      ? "bg-teal-600 text-white border-teal-600" 
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Dekat
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.2}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                title="Mundurkan (Zoom Out)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="0.2"
                max="3"
                step="0.01"
                value={zoom}
                onChange={handleZoomChange}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:accent-teal-500"
              />
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                title="Dekatkan (Zoom In)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Tools: Rotate & Reset */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750 font-medium text-[11px] transition-colors cursor-pointer"
              >
                <RotateCw className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Putar 90°</span>
              </button>
              <button
                type="button"
                onClick={() => handleReset(0.55)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750 font-medium text-[11px] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>Reset Posisi</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-400">Bisa Zoom Out hingga 20%</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSaveCropped}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Terapkan Foto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
