import React from "react";
import { Skeleton, SkeletonCircle } from "./SkeletonBase";

export function AdminDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col lg:flex-row animate-in fade-in duration-200">
      {/* 1. SIDEBAR SKELETON (lg: w-72) */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col justify-between p-5 sticky top-0 h-screen shrink-0">
        <div className="space-y-6">
          {/* Logo & Admin Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-xl" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>

          {/* Quick Metrics Pill */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <SkeletonCircle size="w-9 h-9" className="shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-2.5 w-16 rounded-md" />
            </div>
          </div>

          {/* Nav Item Groups */}
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                <Skeleton className="h-2.5 w-20 rounded-md mb-2" />
                {Array.from({ length: 2 }).map((_, iIdx) => (
                  <div key={iIdx} className="flex items-center justify-between px-3 py-2 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-4 h-4 rounded-md" />
                      <Skeleton className="h-3.5 w-28 rounded-md" />
                    </div>
                    {iIdx === 0 && <Skeleton className="h-4 w-5 rounded-full" />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="pt-4 border-t border-slate-100">
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      </aside>

      {/* 2. MAIN ADMIN CONTENT SKELETON */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 items-center justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-5 w-56 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-44 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          <Skeleton className="w-8 h-8 rounded-lg" />
        </header>

        {/* Body Content */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Top Banner Alert Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <SkeletonCircle size="w-10 h-10" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-48 rounded-md" />
                <Skeleton className="h-3 w-72 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 rounded-xl hidden sm:block" />
          </div>

          {/* Metric Cards Grid (6 cards) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <SkeletonCircle size="w-6 h-6" />
                </div>
                <Skeleton className="h-6 w-20 rounded-lg" />
                <Skeleton className="h-2.5 w-12 rounded-md" />
              </div>
            ))}
          </div>

          {/* Table / Queue Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md" />
              </div>
              <Skeleton className="h-8 w-28 rounded-xl" />
            </div>

            {/* Simulated Table Rows */}
            <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, rIdx) => (
                <div key={rIdx} className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <SkeletonCircle size="w-9 h-9" className="shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-3.5 w-48 rounded-md" />
                      <Skeleton className="h-3 w-32 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24 rounded-md hidden md:block" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboardSkeleton;
