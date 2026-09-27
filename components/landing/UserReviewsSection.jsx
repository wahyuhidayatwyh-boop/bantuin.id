"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { landingContentService } from "@/lib/services/landingContentService";

const REVIEWS = [
  {
    id: 1,
    quote:
      "Bantuin lebih terjangkau dari segi harga. Freelancernya cepat tanggap, skillnya bagus dan pengerjaannya sangat cepat. Hasilnya juga memuaskan.",
    name: "Peter",
    company: "Istana Bakmi",
    avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80",
    initials: "IB",
  },
  {
    id: 2,
    quote:
      "Mantap pake Bantuin. Gampang aksesnya. Toko mitra dan layanannya jg profesional semua. Recommended.",
    name: "Daniel",
    company: "D'Clean",
    avatar: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=120&q=80",
    initials: "DC",
  },
  {
    id: 3,
    quote:
      "Sya baru pertama kali mencoba aplikasi ini. Dan saya puas dengan pelayanannya, baik dari aplikasi maupun mitranya. Ekspektasinya memuaskan.",
    name: "Alvan Prima",
    company: "Pas Steak",
    avatar: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=120&q=80",
    initials: "PS",
  },
  {
    id: 4,
    quote:
      "Fitur bantuan tugasnya sangat membantu pas butuh cepat angkut barang dan tugas mendadak. Respon teman-teman mahasiswa cepat dan saling bantu.",
    name: "Nabila Putri",
    company: "Mahasiswa UNSOED",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    initials: "NP",
  },
  {
    id: 5,
    quote:
      "Sewa kamera dan drone buat liputan event kampus prosesnya gampang banget. Unit terawat, sensor bersih, dan sistem pembayarannya aman.",
    name: "Rizky Ramadhan",
    company: "Kopi Soedirman",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    initials: "RR",
  },
  {
    id: 6,
    quote:
      "Teknisi panggilan servis laptop datang on-time ke tempat. Diagnosanya tepat, biaya jujur tanpa dilebih-lebihkan, dan bergaransi.",
    name: "Natasha Caroline",
    company: "Focus Creative",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    initials: "NC",
  },
];

const INITIAL_REVIEW_INDEX = 1;

export default function UserReviewsSection() {
  const scrollRef = useRef(null);
  const loopIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(INITIAL_REVIEW_INDEX);
  const [reviews, setReviews] = useState(() => landingContentService.getContentSync().reviews || REVIEWS);
  const loopReviews = useMemo(() => [...reviews, ...reviews, ...reviews], [reviews]);

  useEffect(() => {
    const sync = () => setReviews(landingContentService.getContentSync().reviews);
    window.addEventListener(landingContentService.eventName, sync);
    return () => window.removeEventListener(landingContentService.eventName, sync);
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
                className={`bg-white rounded-2xl p-6 sm:p-7 border flex flex-col justify-between flex-shrink-0 w-[290px] sm:w-[350px] md:w-[380px] min-h-[210px] sm:min-h-[225px] snap-center transition-all duration-500 ${
                  activeIndex === originalIndex
                    ? "-translate-y-2 scale-[1.035] border-blue-200 shadow-[0_16px_36px_rgba(22,131,255,0.16)]"
                    : "border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
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
                    src={rev.avatar}
                    alt={rev.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-[#1683FF] truncate leading-tight">
                      {rev.name}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5 font-medium">
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
