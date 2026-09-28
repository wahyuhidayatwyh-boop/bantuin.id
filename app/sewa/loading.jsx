import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton } from "@/components/skeletons/SkeletonBase";
import { ItemGridSkeleton } from "@/components/skeletons/ItemGridSkeleton";

export default function SewaLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
      <Navbar />
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <Skeleton className="h-11 w-44 rounded-2xl" />
        </div>

        <div className="flex items-center gap-2 overflow-hidden py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-2xl" />
          ))}
        </div>

        <ItemGridSkeleton count={6} type="item" />
      </main>
      <Footer />
    </div>
  );
}
