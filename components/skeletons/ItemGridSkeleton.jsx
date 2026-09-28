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

export function ItemGridSkeleton({ count = 6, type = "request" }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        type === "request" ? <RequestCardSkeleton key={i} /> : <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default ItemGridSkeleton;
