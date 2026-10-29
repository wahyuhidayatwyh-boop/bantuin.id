import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton, SkeletonCircle } from "./SkeletonBase";

export function ServiceDetailSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] animate-in fade-in duration-200">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-4 w-16 rounded-md" />
          <span className="text-slate-300">/</span>
          <Skeleton className="h-4 w-24 rounded-md" />
          <span className="text-slate-300">/</span>
          <Skeleton className="h-4 w-40 rounded-md" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column: Gallery & Description (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image Banner */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <Skeleton className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-none" />
              <div className="p-4 flex gap-2.5">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <Skeleton key={idx} className="w-20 h-14 rounded-xl shrink-0" />
                ))}
              </div>
            </div>

            {/* Title & Provider Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-7 w-3/4 rounded-xl" />
                <div className="flex items-center gap-3 pt-1">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>

              {/* Provider Info Row */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonCircle size="w-12 h-12" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <Skeleton className="h-3 w-24 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-9 w-28 rounded-xl" />
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-3 shadow-xs">
              <Skeleton className="h-5 w-36 rounded-lg" />
              <Skeleton className="h-3.5 w-full rounded-md" />
              <Skeleton className="h-3.5 w-5/6 rounded-md" />
              <Skeleton className="h-3.5 w-4/6 rounded-md" />
            </div>
          </div>

          {/* Right Column: Order & Pricing Card (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs sticky top-24">
              <div className="space-y-1.5 pb-4 border-b border-slate-100">
                <Skeleton className="h-3.5 w-20 rounded-md" />
                <Skeleton className="h-8 w-44 rounded-xl" />
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-28 rounded-md" />
                {Array.from({ length: 3 }).map((_, pIdx) => (
                  <Skeleton key={pIdx} className="h-16 w-full rounded-2xl" />
                ))}
              </div>

              <div className="pt-2 space-y-2.5">
                <Skeleton className="h-11 w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4 mx-auto rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ServiceDetailSkeleton;
