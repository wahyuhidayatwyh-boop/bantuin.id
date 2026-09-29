import React from "react";
import { Skeleton, SkeletonCircle } from "./SkeletonBase";

export function JasaDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row animate-in fade-in duration-200">
      {/* 1. SKELETON SIDEBAR (Desktop >= lg) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/90 flex-col justify-between p-4 sticky top-0 h-screen shrink-0">
        <div className="space-y-6">
          {/* Logo Brand Skeleton */}
          <div className="flex items-center gap-2.5 px-2">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>

          {/* Provider Mini Card Skeleton */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <SkeletonCircle size="w-10 h-10" className="shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-28 rounded-md" />
              <Skeleton className="h-2.5 w-20 rounded-md" />
              <Skeleton className="h-2.5 w-16 rounded-md" />
            </div>
          </div>

          {/* Nav Items Skeleton */}
          <div className="space-y-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-4 h-4 rounded-md" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
                {i === 2 && <Skeleton className="h-4 w-6 rounded-full" />}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Switchers Skeleton */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-7 w-3/4 mx-auto rounded-lg" />
        </div>
      </aside>

      {/* 2. SKELETON MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Skeleton */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 items-center justify-between gap-4">
          <Skeleton className="h-6 w-56 rounded-xl" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </header>

        {/* Mobile Header Skeleton */}
        <header className="lg:hidden bg-white border-b border-slate-200/80 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </header>

        {/* Content Body Skeleton */}
        <div className="p-3 sm:p-6 md:p-8 space-y-6 max-w-[1240px] w-full mx-auto">
          {/* Cover & Profile Banner Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <Skeleton className="w-full h-28 sm:h-44 rounded-none" />
            <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-10 sm:-mt-14 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                <SkeletonCircle size="w-20 h-20 sm:w-24 sm:h-24" className="ring-4 ring-white shrink-0" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <Skeleton className="h-5 w-44 rounded-lg" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-60 rounded-md" />
                  <Skeleton className="h-3 w-36 rounded-md" />
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Skeleton className="h-9 w-full sm:w-32 rounded-xl" />
                <Skeleton className="h-9 w-full sm:w-32 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Stats Grid Skeleton (4 Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                  <SkeletonCircle size="w-7 h-7" />
                </div>
                <Skeleton className="h-6 sm:h-7 w-28 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            ))}
          </div>

          {/* Section 1: Catalog / Orders Skeleton Table/Cards */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-56 rounded-md" />
              </div>
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                  <Skeleton className="w-full h-32 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <Skeleton className="h-4 w-20 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JasaDashboardSkeleton;
