"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ExploreRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    const tab = searchParams.get("tab");

    if (tab === "sewa") {
      router.replace(q ? `/sewa?q=${encodeURIComponent(q)}` : "/sewa");
    } else if (tab === "jasa") {
      router.replace(q ? `/jasa?q=${encodeURIComponent(q)}` : "/jasa");
    } else {
      router.replace(q ? `/bantuan?q=${encodeURIComponent(q)}` : "/bantuan");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5FAFF]">
      <div className="text-center text-sm font-semibold text-slate-500">
        Mengalihkan ke halaman Bantuan...
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreRedirect />
    </Suspense>
  );
}
