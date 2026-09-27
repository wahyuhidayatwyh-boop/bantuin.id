"use client";

import React, { useEffect, useMemo, useRef } from "react";
import PromotedCard from "@/components/promotion/PromotedCard";

/** Carousel rekomendasi: tiga kartu pada desktop dan memutar seluruh produk. */
export default function RecommendedCarousel({ items, variant, getHref, onCardClick }) {
  const scrollRef = useRef(null);
  const loopIndexRef = useRef(0);
  const loopItems = useMemo(() => [...items, ...items, ...items], [items]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || items.length < 2) return undefined;

    const centerCard = (index, behavior = "auto") => {
      const card = container.querySelector(`[data-recommended-card="${index}"]`);
      if (!card) return;
      const left = card.offsetLeft - (container.clientWidth - card.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, left), behavior });
    };

    const frameId = window.requestAnimationFrame(() => {
      loopIndexRef.current = items.length;
      centerCard(items.length);
    });

    const advance = () => {
      const nextIndex = loopIndexRef.current + 1;
      const nextCard = container.querySelector(`[data-recommended-card="${nextIndex}"]`);
      if (!nextCard) return;
      const left = nextCard.offsetLeft - (container.clientWidth - nextCard.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
      loopIndexRef.current = nextIndex;

      if (nextIndex === items.length * 2) {
        window.setTimeout(() => {
          centerCard(items.length);
          loopIndexRef.current = items.length;
        }, 700);
      }
    };

    const intervalId = window.setInterval(advance, 4500);
    return () => { window.cancelAnimationFrame(frameId); window.clearInterval(intervalId); };
  }, [items.length]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 sm:gap-3.5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-1"
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
  );
}
