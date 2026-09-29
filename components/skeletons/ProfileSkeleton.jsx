import React from "react";
import { Skeleton, SkeletonCircle } from "./SkeletonBase";

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <div className="max-w-[1240px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
        
        {/* Top Profile Banner Skeleton */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
            
            {/* Avatar & User Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full lg:w-auto">
              <SkeletonCircle size="w-20 h-20 sm:w-24 sm:h-24" className="shrink-0 ring-4 ring-blue-50" />
              
              <div className="space-y-2.5 text-center sm:text-left flex-1 sm:flex-initial">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <Skeleton className="h-6 sm:h-7 w-48 rounded-xl" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-4 w-28 rounded-md" />
                </div>
                <Skeleton className="h-4 w-64 rounded-md" />
              </div>
            </div>

            {/* Stats Pills Skeleton */}
            <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-center min-w-[90px]">
                <Skeleton className="h-5 w-12 mx-auto rounded-md" />
                <Skeleton className="h-3 w-16 mx-auto rounded-md" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-center min-w-[90px]">
                <Skeleton className="h-5 w-12 mx-auto rounded-md" />
                <Skeleton className="h-3 w-16 mx-auto rounded-md" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2 text-center min-w-[90px]">
                <Skeleton className="h-5 w-12 mx-auto rounded-md" />
                <Skeleton className="h-3 w-16 mx-auto rounded-md" />
              </div>
            </div>

          </div>
        </div>

        {/* Tab & Main Card Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Tabs (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-3 space-y-2 shadow-2xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 px-4 py-3 rounded-2xl">
                <SkeletonCircle size="w-5 h-5" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
            ))}
          </div>

          {/* Tab Content Panel (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-44 rounded-xl" />
              <Skeleton className="h-4 w-80 rounded-md" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ProfileSkeleton;
