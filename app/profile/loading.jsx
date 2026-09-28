import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton, SkeletonCircle } from "@/components/skeletons/SkeletonBase";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
      <Navbar />
      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile Card Header Skeleton */}
        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <SkeletonCircle size="w-20 h-20 sm:w-24 sm:h-24" />
          <div className="space-y-2 text-center sm:text-left flex-1">
            <Skeleton className="h-6 w-48 mx-auto sm:mx-0 rounded-lg" />
            <Skeleton className="h-4 w-32 mx-auto sm:mx-0 rounded-md" />
            <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Profile Settings Fields Skeleton */}
        <div className="p-6 sm:p-8 rounded-[32px] bg-white border border-slate-200/90 shadow-xs space-y-4">
          <Skeleton className="h-5 w-36 rounded-md" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
