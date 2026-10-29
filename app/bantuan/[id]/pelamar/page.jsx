"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PelamarListPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      router.replace(`/bantuan/${id}`);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin mb-3" />
      <p className="text-sm font-semibold text-slate-600">Mengalihkan ke Detail Permintaan Bantuan...</p>
    </div>
  );
}
