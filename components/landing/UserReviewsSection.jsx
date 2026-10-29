"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
const INITIAL_REVIEW_INDEX = 1;

export default function UserReviewsSection() {
  const scrollRef = useRef(null);
  const loopIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(INITIAL_REVIEW_INDEX);
  const [reviews, setReviews] = useState([]);
  const loopReviews = useMemo(() => [...reviews, ...reviews, ...reviews], [reviews]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/landing-content", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => { if (!cancelled && json.success) setReviews(json.data?.reviews || []); })
      .catch(() => { if (!cancelled) setReviews([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || reviews.length === 0) return undefined;

    const centerCard = (index, behavior = "auto") => {
      const card = container.querySelector(`[data-review-card="${index}"]`);
      if (!card) return;
      const left = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, left), behavior });
    };

    const updateActiveReview = () => {
      const trackCenter = container.getBoundingClientRect().left + container.clientWidth / 2;
      const cards = [...container.querySelectorAll("[data-review-card]")];
      const closestCard = cards.reduce((closest, card) => {
        const cardRect = card.getBoundingClientRect();
        const distance = Math.abs(cardRect.left + cardRect.width / 2 - trackCenter);
        return !closest || distance < closest.distance ? { card, distance } : closest;
      }, null);

      if (closestCard) {
        loopIndexRef.current = Number(closestCard.card.dataset.reviewCard);
        setActiveIndex(Number(closestCard.card.dataset.reviewOriginal));
      }
    };

    const frameId = window.requestAnimationFrame(() => {
      const initialIndex = reviews.length + Math.min(INITIAL_REVIEW_INDEX, reviews.length - 1);
      loopIndexRef.current = initialIndex;
      centerCard(initialIndex);
      updateActiveReview();
    });
    container.addEventListener("scroll", updateActiveReview, { passive: true });
    window.addEventListener("resize", updateActiveReview);

    return () => {
      window.cancelAnimationFrame(frameId);
      container.removeEventListener("scroll", updateActiveReview);
      window.removeEventListener("resize", updateActiveReview);
    };
  }, [reviews.length]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const container = scrollRef.current;
      if (!container || reviews.length === 0) return;
      const nextIndex = loopIndexRef.current + 1;
      const nextCard = container.querySelector(`[data-review-card="${nextIndex}"]`);
      if (!nextCard) return;

      const targetLeft = nextCard.offsetLeft - (container.clientWidth - nextCard.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
      loopIndexRef.current = nextIndex;
      setActiveIndex(Number(nextCard.dataset.reviewOriginal));

      // Setelah salinan pertama di sisi kanan masuk, pindahkan posisi internal
      // ke salinan tengah yang identik. Secara visual gerakan tetap satu arah.
      if (nextIndex === reviews.length * 2) {
        window.setTimeout(() => {
          const resetCard = container.querySelector(`[data-review-card="${reviews.length}"]`);
          if (!resetCard) return;
          const resetLeft = resetCard.offsetLeft - (container.clientWidth - resetCard.offsetWidth) / 2;
          container.scrollTo({ left: Math.max(0, resetLeft), behavior: "auto" });
          loopIndexRef.current = reviews.length;
        }, 700);
      }
    }, 4800);

    return () => window.clearInterval(intervalId);
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  return (
    <section className="pt-12 sm:pt-16 pb-8 bg-white select-none">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title: Ulasan dari Pelanggan */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] tracking-tight">
            Ulasan dari Pelanggan
          </h2>
        </div>

        {/* Carousel otomatis — tetap bisa digeser dengan sentuhan */}
        <div>
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-none scroll-smooth py-5 snap-x snap-mandatory"
          >
            {loopReviews.map((rev, index) => {
              const originalIndex = index % reviews.length;
              return (
              <div
                key={`${rev.id}-${index}`}
                data-review-card={index}
                data-review-original={originalIndex}
                className={`bg-white rounded-2xl p-6 sm:p-7 border flex flex-col justify-between flex-shrink-0 w-[290px] sm:w-[350px] md:w-[380px] min-h-[210px] sm:min-h-[225px] snap-center transition-transform duration-500 will-change-transform ${
                  activeIndex === originalIndex
                    ? "-translate-y-2 scale-[1.035] border-blue-200 shadow-[0_12px_28px_rgba(22,131,255,0.12)]"
                    : "border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                }`}
              >
                {/* Quotation mark on left & quote text */}
                <div className="flex items-start gap-3.5">
                  <span className="text-3xl sm:text-4xl font-serif text-[#C5DCFA] select-none leading-none shrink-0 font-bold -mt-0.5">
                    “
                  </span>
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal">
                    {rev.quote}
                  </p>
                </div>

                {/* Profile Circle, Name & Subtitle */}
                <div className="flex items-center gap-3 pt-4 mt-auto">
                  <img
                    src={rev.avatarUrl || rev.avatar || "/logotab.png"}
                    alt={rev.name}
                    width={40}
                    height={40}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />

                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#0F6FE5] truncate leading-tight">
                      {rev.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5 font-medium">
                      {rev.company}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
