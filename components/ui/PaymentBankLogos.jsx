import React from "react";
import Image from "next/image";
import qrisImg from "@/components/image/qris_clean.png";
import bcaImg from "@/components/image/bca_clean.png";
import mandiriImg from "@/components/image/mandiri_clean.png";
import briImg from "@/components/image/bri_clean.png";
import bniImg from "@/components/image/bni_clean.png";
import bantuinImg from "@/components/image/logo_clean.png";

export function QrisLogo({ className = "h-5 sm:h-7 w-auto max-w-[65px] sm:max-w-[90px] object-contain" }) {
  return (
    <Image 
      src={qrisImg} 
      alt="QRIS" 
      className={className} 
      priority 
    />
  );
}

export function BcaLogo({ className = "h-5 sm:h-7 w-auto max-w-[70px] sm:max-w-[95px] object-contain" }) {
  return (
    <Image 
      src={bcaImg} 
      alt="BCA" 
      className={className} 
      priority 
    />
  );
}

export function MandiriLogo({ className = "h-4.5 sm:h-6.5 w-auto max-w-[65px] sm:max-w-[90px] object-contain" }) {
  return (
    <Image 
      src={mandiriImg} 
      alt="Bank Mandiri" 
      className={className} 
      priority 
    />
  );
}

export function BriLogo({ className = "h-4.5 sm:h-6.5 w-auto max-w-[65px] sm:max-w-[90px] object-contain" }) {
  return (
    <Image 
      src={briImg} 
      alt="Bank BRI" 
      className={className} 
      priority 
    />
  );
}

export function BniLogo({ className = "h-4.5 sm:h-6.5 w-auto max-w-[65px] sm:max-w-[90px] object-contain" }) {
  return (
    <Image 
      src={bniImg} 
      alt="Bank BNI" 
      className={className} 
      priority 
    />
  );
}

export function BantuinPayLogo({ className = "h-4.5 sm:h-6.5 w-auto max-w-[70px] sm:max-w-[95px] object-contain" }) {
  return (
    <Image 
      src={bantuinImg} 
      alt="Bantuin Pay" 
      className={className} 
      priority 
    />
  );
}
