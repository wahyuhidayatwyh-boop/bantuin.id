"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import PromotedCard from "@/components/promotion/PromotedCard";

/**
 * Carousel Rekomendasi Pintar Bantuin:
 * - Deduplikasi ketat: tidak ada kartu ganda.
 * - Desktop: hanya bergeser jika > 3 item. Jika <= 3 item, tampil berdampingan tanpa bergeser.
 * - Mobile: bergeser bergantian jika > 1 item. Jika 1 item, tampil statis.
 * - Muter terus (Seamless Infinite Forward Loop): saat mencapai akhir siklus, tidak ada efek mundur/rewind.
 *   Posisi di-teleport seketika ke set awal tanpa jeda visual.
 */
export default function RecommendedCarousel({ items, variant, getHref, onCardClick }) {
  const scrollRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isPausedRef = useRef(false);
  const resetTimeoutRef = useRef(null);
  const resumeTimeoutRef = useRef(null);

  // 1. Deduplikasi ketat data item yang diterima
  const safeItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    const result = [];
    for (const item of items) {
      if (!item) continue;
      const key = String(item.promoId || item.id || item.targetId || item.title || "");
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    return result;
  }, [items]);

  // 2. Deteksi kapasitas tampilan berdasarkan lebar layar:
  // - Mobile (< 640px): 1 kartu
  // - Tablet (640px - 1023px): 2 kartu
  // - Desktop (>= 1024px): 3 kartu
  const [capacity, setCapacity] = useState(3);
  const [activeDotIndex, setActiveDotIndex] = useState(0);

  useEffect(() => {
    const updateCapacity = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      if (w < 640) {
        setCapacity(1);
      } else if (w < 1024) {
        setCapacity(2);
      } else {
        setCapacity(3);
      }
    };

    updateCapacity();
    window.addEventListener("resize", updateCapacity);
    return () => window.removeEventListener("resize", updateCapacity);
  }, []);

  // Sesuai aturan:
  // - Mobile (> 1 item): bergeser bergantian
  // - Desktop (> 3 item): bergeser terus memutar
  const shouldAutoSlide = safeItems.length > capacity;

  // 3. Susun loop items dan baseIndex untuk infinite continuous rotation
  const { loopItems, baseIndex } = useMemo(() => {
    if (!shouldAutoSlide) {
      return { loopItems: safeItems, baseIndex: 0 };
    }
    if (safeItems.length === 2) {
      // 4 salinan untuk 2 item (total 8 item) agar buffer loop panjang dan mulus
      return {
        loopItems: [...safeItems, ...safeItems, ...safeItems, ...safeItems],
        baseIndex: 2,
      };
    }
    // 3 salinan untuk 3+ item
    return {
      loopItems: [...safeItems, ...safeItems, ...safeItems],
      baseIndex: safeItems.length,
    };
  }, [safeItems, shouldAutoSlide]);

  // Kalkulasi posisi scrollLeft yang akurat untuk setiap kartu
  const getCardScrollLeft = useCallback((card, container) => {
    if (!card || !container) return 0;
    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const currentScroll = container.scrollLeft;
    const offset = cardRect.left - containerRect.left;
    return Math.max(0, Math.round(currentScroll + offset));
  }, []);

  // 4. Inisialisasi posisi awal ke baseIndex secara instan (tanpa animasi)
  useEffect(() => {
    currentIndexRef.current = baseIndex;
    setActiveDotIndex(0);

    if (!shouldAutoSlide) return undefined;

    const container = scrollRef.current;
    if (!container) return undefined;

    const frameId = requestAnimationFrame(() => {
      const baseCard = container.querySelector(`[data-recommended-card="${baseIndex}"]`);
      if (baseCard) {
        container.style.scrollBehavior = "auto";
        container.style.scrollSnapType = "none";
        container.scrollLeft = getCardScrollLeft(baseCard, container);
        requestAnimationFrame(() => {
          if (!container) return;
          container.style.scrollBehavior = "";
          container.style.scrollSnapType = "";
        });
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [baseIndex, shouldAutoSlide, getCardScrollLeft]);

  // 5. Auto-slide timer dengan perpindahan halus maju dan teleport instan (muter terus)
  useEffect(() => {
    if (!shouldAutoSlide || safeItems.length === 0) return undefined;

    const container = scrollRef.current;
    if (!container) return undefined;

    const handlePause = () => {
      isPausedRef.current = true;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };

    const handleResume = () => {
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = setTimeout(() => {
        isPausedRef.current = false;
        syncCurrentIndex();
      }, 1500);
    };

    const handleVisibilityChange = () => {
      isPausedRef.current = document.hidden;
    };

    const syncCurrentIndex = () => {
      if (!container) return;
      const cards = container.querySelectorAll("[data-recommended-card]");
      if (!cards.length) return;
      const containerLeft = container.getBoundingClientRect().left;
      let closestIndex = currentIndexRef.current;
      let minDiff = Infinity;
      cards.forEach((card) => {
        const diff = Math.abs(card.getBoundingClientRect().left - containerLeft);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = Number(card.getAttribute("data-recommended-card"));
        }
      });
      currentIndexRef.current = closestIndex;
      setActiveDotIndex(closestIndex % safeItems.length);
    };

    container.addEventListener("mouseenter", handlePause);
    container.addEventListener("mouseleave", handleResume);
    container.addEventListener("touchstart", handlePause, { passive: true });
    container.addEventListener("touchend", handleResume, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const advance = () => {
      if (isPausedRef.current || !container) return;

      const nextIndex = currentIndexRef.current + 1;
      const nextCard = container.querySelector(`[data-recommended-card="${nextIndex}"]`);
      if (!nextCard) return;

      const targetLeft = getCardScrollLeft(nextCard, container);

      // Geser maju secara halus
      container.scrollTo({ left: targetLeft, behavior: "smooth" });
      currentIndexRef.current = nextIndex;
      setActiveDotIndex(nextIndex % safeItems.length);

      // Ketika menyelesaikan 1 putaran penuh (mencapai set kloning berikutnya):
      // Tunggu animasi maju selesai (~550ms), lalu teleport seketika ke baseIndex
      // tanpa animasi scroll balik (sehingga tidak ada efek "back" rewind, tapi muter terus).
      if (nextIndex >= baseIndex + safeItems.length) {
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = setTimeout(() => {
          if (!container) return;
          const baseCard = container.querySelector(`[data-recommended-card="${baseIndex}"]`);
          if (baseCard) {
            container.style.scrollBehavior = "auto";
            container.style.scrollSnapType = "none";
            container.scrollLeft = getCardScrollLeft(baseCard, container);
            currentIndexRef.current = baseIndex;

            requestAnimationFrame(() => {
              if (!container) return;
              container.style.scrollBehavior = "";
              container.style.scrollSnapType = "";
            });
          }
        }, 550);
      }
    };

    const intervalId = setInterval(advance, 3500);

    return () => {
      clearInterval(intervalId);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      container.removeEventListener("mouseenter", handlePause);
      container.removeEventListener("mouseleave", handleResume);
      container.removeEventListener("touchstart", handlePause);
      container.removeEventListener("touchend", handleResume);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [shouldAutoSlide, safeItems.length, baseIndex, getCardScrollLeft]);

  // Navigasi manual via dot
  const goToSlide = (targetDotIndex) => {
    const container = scrollRef.current;
    if (!container) return;
    const targetIndex = baseIndex + targetDotIndex;
    const targetCard = container.querySelector(`[data-recommended-card="${targetIndex}"]`);
    if (targetCard) {
      container.scrollTo({
        left: getCardScrollLeft(targetCard, container),
        behavior: "smooth",
      });
      currentIndexRef.current = targetIndex;
      setActiveDotIndex(targetDotIndex);
    }
  };

  // Jika tidak ada item promosi
  if (!safeItems || safeItems.length === 0) {
    return null;
  }

  // 1 Item: Tampilkan satu kartu proporsional
  if (safeItems.length === 1) {
    const singleItem = safeItems[0];
    return (
      <div className="w-full sm:max-w-md lg:w-[calc((100%_-_1.75rem)_/_3)]">
        <PromotedCard
          item={singleItem}
          href={getHref(singleItem)}
          onCardClick={() => onCardClick?.(singleItem)}
          variant={variant}
          layout="list"
        />
      </div>
    );
  }

  // Jika tidak perlu auto-slide (misal di Desktop dengan 2 atau 3 item):
  // Tampilkan berdampingan secara statis tanpa bergeser
  if (!shouldAutoSlide) {
    return (
      <div className="flex gap-3 sm:gap-3.5 pb-1">
        {safeItems.map((item, index) => (
          <div
            key={`promoted-${item.promoId || item.id}-${index}`}
            className="w-full sm:w-[calc((100%_-_0.875rem)_/_2)] lg:w-[calc((100%_-_1.75rem)_/_3)]"
          >
            <PromotedCard
              item={item}
              href={getHref(item)}
              onCardClick={() => onCardClick?.(item)}
              variant={variant}
              layout="list"
            />
          </div>
        ))}
      </div>
    );
  }

  // Mode Auto-Slide (Mobile > 1 item atau Desktop > 3 item)
  return (
    <div className="space-y-2">
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-3.5 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1"
        aria-label={`Carousel ${variant === "rental" ? "sewa" : "jasa"} direkomendasikan`}
      >
        {loopItems.map((item, index) => (
          <div
            key={`promoted-${item.promoId || item.id}-${index}`}
            data-recommended-card={index}
            className="w-full shrink-0 snap-start sm:w-[calc((100%_-_0.875rem)_/_2)] lg:w-[calc((100%_-_1.75rem)_/_3)]"
          >
            <PromotedCard
              item={item}
              href={getHref(item)}
              onCardClick={() => onCardClick?.(item)}
              variant={variant}
              layout="list"
            />
          </div>
        ))}
      </div>

      {/* Indikator dot navigasi */}
      {safeItems.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {safeItems.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              onClick={() => goToSlide(idx)}
              aria-label={`Lihat rekomendasi ke-${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeDotIndex === idx
                  ? "w-5 bg-[#1683FF]"
                  : "w-1.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
