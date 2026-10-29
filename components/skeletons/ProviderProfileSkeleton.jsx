import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton, SkeletonCircle } from "./SkeletonBase";
import { ItemGridSkeleton } from "./ItemGridSkeleton";

export function ProviderProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] animate-in fade-in duration-200">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
        {/* Cover Banner Skeleton */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
          <Skeleton className="w-full h-36 sm:h-64 rounded-none" />

          {/* Profile Details Container */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <SkeletonCircle size="w-24 h-24 sm:w-28 sm:h-28" className="ring-4 ring-white shadow-md shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 rounded-md" />
                <div className="flex items-center gap-3 justify-center sm:justify-start pt-1">
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                  <Skeleton className="h-3.5 w-28 rounded-md" />
                  <Skeleton className="h-3.5 w-20 rounded-md" />
                </div>
              </div>
            </div>

            {/* CTA Action Buttons */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Skeleton className="h-10 w-full sm:w-36 rounded-xl" />
              <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
            </div>
          </div>
        </div>

        {/* Tabs Bar Skeleton */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        {/* Content Body Grid */}
        <div className="pt-2">
          <ItemGridSkeleton count={6} type="service" />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default ProviderProfileSkeleton;
