"use client";

import React, { useEffect, useState } from "react";
import { landingContentService } from "@/lib/services/landingContentService";

export default function PartnerLogosSection() {
  const [partners, setPartners] = useState(() => landingContentService.getContentSync().partners);

  useEffect(() => {
    const sync = () => setPartners(landingContentService.getContentSync().partners);
    window.addEventListener(landingContentService.eventName, sync);
    return () => window.removeEventListener(landingContentService.eventName, sync);
  }, []);

  return (
    <section className="pt-8 pb-14 sm:pb-20 bg-white border-b border-slate-100 select-none">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Centered Descriptive Headline (Matching Reference Screenshot) */}
        <p className="text-xs sm:text-sm md:text-[14px] font-semibold text-slate-700 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
          Lebih dari 15.000 pekerjaan kami selesaikan dari perusahaan terkemuka yang telah mempercayai dan memilih layanan Bantuin
        </p>

        {/* Logo media partner dikelola dari panel Admin */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 md:gap-16 lg:gap-20 text-slate-700">
          {partners.filter((partner) => partner.active !== false).map((partner) => (
            <div key={partner.id} className="opacity-75 hover:opacity-100 transition-opacity flex items-center justify-center h-8 max-w-[150px]">
              {partner.logoUrl ? <img src={partner.logoUrl} alt={partner.name} className="max-h-8 max-w-[140px] object-contain grayscale" /> : <span className="text-lg sm:text-2xl font-black tracking-tight text-slate-700">{partner.name}</span>}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
