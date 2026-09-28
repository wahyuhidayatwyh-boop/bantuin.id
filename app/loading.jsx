import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton, SkeletonCircle } from "@/components/skeletons/SkeletonBase";
import { ItemGridSkeleton } from "@/components/skeletons/ItemGridSkeleton";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
      <Navbar />
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner / Hero Skeleton */}
        <div className="rounded-[32px] bg-white border border-slate-200/90 p-6 sm:p-10 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-10 w-2/3 rounded-2xl" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
          <div className="pt-2 flex gap-3">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-36 rounded-xl" />
          </div>
        </div>

        {/* Content Section Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-md" />
          </div>
          <ItemGridSkeleton count={6} type="request" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
