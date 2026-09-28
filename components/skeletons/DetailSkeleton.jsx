import React from "react";
import { Skeleton, SkeletonCircle } from "./SkeletonBase";

export function DetailSkeleton() {
  return (
    <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumbs & Category Bar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-44 rounded-lg" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>

      {/* Main Grid: Left Column & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Main Content Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-6 bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-8 shadow-xs">
          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>

          {/* Big Title */}
          <div className="space-y-2.5">
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-5/6 rounded-lg" />
          </div>

          {/* Location Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <SkeletonCircle size="w-8 h-8" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-1/3 rounded-md" />
              <Skeleton className="h-3.5 w-4/5 rounded-md" />
            </div>
          </div>

          {/* Map / Image Container */}
          <Skeleton className="w-full h-64 rounded-2xl" />

          {/* Attachments Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <Skeleton className="h-4 w-32 rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="w-full aspect-square rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-5 bg-white border border-slate-200/90 rounded-[32px] p-6 sm:p-7 shadow-xs">
          {/* Budget Card */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-7 w-36 rounded-xl" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>

          {/* Author Profile Skeleton */}
          <div className="pt-2 space-y-3 border-t border-slate-100">
            <Skeleton className="h-3 w-24 rounded-md" />
            <div className="flex items-center gap-3">
              <SkeletonCircle size="w-12 h-12" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-3 w-36 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
          </div>

          {/* CTA Action Button */}
          <Skeleton className="h-12 w-full rounded-2xl" />

          {/* Trust guarantee pill */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
            <SkeletonCircle size="w-5 h-5" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-32 rounded-md" />
              <Skeleton className="h-2.5 w-full rounded-md" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DetailSkeleton;
