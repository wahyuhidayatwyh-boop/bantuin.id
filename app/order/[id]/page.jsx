"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OrderRedirectPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const targetRoom = params?.id || "order-room-101";
    router.replace(`/chat?room=${targetRoom}`);
  }, [params?.id, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-slate-600">
      <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xl flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-[#1683FF] animate-spin" />
        <span className="font-bold text-xs sm:text-sm text-slate-800">
          Memuat Ruang Kerja Obrolan &amp; Transaksi...
        </span>
      </div>
    </div>
  );
}
