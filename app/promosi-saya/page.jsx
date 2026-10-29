"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import { Loader2 } from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";

export default function PromosiSayaPage() {
  const router = useRouter();
  const { currentUser } = useApp() || {};
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const role = currentUser.role || currentUser.accountRole || "";
    const isPartner = currentUser.isPartner || role === "partner" || role === "rental";

    if (isPartner) {
      router.replace("/mitra/dashboard?tab=promote_rental");
    } else {
      router.replace("/jasa/dashboard?tab=promosi");
    }
  }, [currentUser, router]);

  return (
    <RoleGuard allowedRoles={["provider", "partner", "admin"]}>
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Mengarahkan ke Dashboard Promosi Mitra...</p>
        </div>
      </div>
    </RoleGuard>
  );
}
