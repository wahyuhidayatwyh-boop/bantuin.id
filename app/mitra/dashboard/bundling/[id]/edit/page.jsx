"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EditBundlingMitraPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mitra/dashboard?menu=catalog");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB]">
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin text-[#1683FF]" />
        <span>Mengalihkan ke Katalog Unit Sewa...</span>
      </div>
    </div>
  );
}
