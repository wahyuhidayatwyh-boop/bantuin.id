"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminPromosiLandingPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=promo");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Mengarahkan ke Manajemen Promosi Admin...</p>
      </div>
    </div>
  );
}
