import React from "react";
import Image from "next/image";
import qrisImg from "@/components/image/qris_clean.png";
import bcaImg from "@/components/image/bca_clean.png";
import mandiriImg from "@/components/image/mandiri_clean.png";
import briImg from "@/components/image/bri_clean.png";
import bniImg from "@/components/image/bni_clean.png";
import bantuinImg from "@/components/image/logo_clean.png";

export function QrisLogo({ className = "max-h-7 max-w-full w-auto object-contain" }) {
  return (
    <Image 
      src={qrisImg} 
      alt="QRIS" 
      className={className} 
      priority 
    />
  );
}

export function BcaLogo({ className = "max-h-7 max-w-full w-auto object-contain" }) {
  return (
    <Image 
      src={bcaImg} 
      alt="BCA" 
      className={className} 
      priority 
    />
  );
}

export function MandiriLogo({ className = "max-h-6 max-w-full w-auto object-contain" }) {
  return (
    <Image 
      src={mandiriImg} 
      alt="Bank Mandiri" 
      className={className} 
      priority 
    />
  );
}

export function BriLogo({ className = "max-h-6 max-w-full w-auto object-contain" }) {
  return (
    <Image 
      src={briImg} 
      alt="Bank BRI" 
      className={className} 
      priority 
    />
  );
}

export function BniLogo({ className = "max-h-6 max-w-full w-auto object-contain" }) {
  return (
    <Image 
      src={bniImg} 
      alt="Bank BNI" 
      className={className} 
      priority 
    />
  );
}

export function BantuinPayLogo({ className = "max-h-6 max-w-full w-auto object-contain" }) {
  return (
    <Image 
      src={bantuinImg} 
      alt="Bantuin Pay" 
      className={className} 
      priority 
    />
  );
}
