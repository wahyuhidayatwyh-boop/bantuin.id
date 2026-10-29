import React from "react";
import { Skeleton, SkeletonCircle } from "./SkeletonBase";

export function RequestCardSkeleton() {
  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      {/* Header with avatar, requester name, and tag */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <SkeletonCircle size="w-9 h-9" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      {/* Title & Description lines */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5 rounded-lg" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-3 w-2/3 rounded-md" />
      </div>

      {/* Location & Time */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-3.5 h-3.5 rounded-full" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
        <Skeleton className="h-4 w-20 rounded-lg" />
      </div>

      {/* Footer / Reward */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-2xs space-y-3 p-3">
      {/* Thumbnail Aspect Ratio */}
      <Skeleton className="w-full aspect-4/3 rounded-2xl" />
      
      {/* Title & Category */}
      <div className="space-y-1.5 px-1">
        <Skeleton className="h-3 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-4/5 rounded-md" />
      </div>

      {/* Price & Rating */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-1">
        <Skeleton className="h-5 w-24 rounded-lg" />
        <Skeleton className="h-3.5 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function JasaCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden animate-pulse">
      <div>
        {/* Foto Layanan Skeleton (16:10) */}
        <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <Skeleton className="h-5 w-14 rounded-md sm:rounded-lg" />
          </div>
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-3 sm:p-5 space-y-2">
          <Skeleton className="h-4 sm:h-5 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-2/3 rounded-md" />

          {/* Provider row */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonCircle size="w-5 h-5 sm:w-6 sm:h-6" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
            <Skeleton className="h-3 w-8 rounded" />
          </div>

          {/* Location row */}
          <div className="flex items-center gap-1.5 pt-1">
            <SkeletonCircle size="w-3.5 h-3.5" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        </div>
      </div>

      {/* Footer row */}
      <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-2.5 w-10 rounded" />
          <Skeleton className="h-4 sm:h-5 w-20 rounded" />
        </div>
        <Skeleton className="h-7 sm:h-8 w-14 sm:w-16 rounded-lg sm:rounded-xl" />
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ count = 6, type = "request" }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        type === "request" ? (
          <RequestCardSkeleton key={i} />
        ) : type === "jasa" ? (
          <JasaCardSkeleton key={i} />
        ) : (
          <ItemCardSkeleton key={i} />
        )
      ))}
    </div>
  );
}

export default ItemGridSkeleton;

