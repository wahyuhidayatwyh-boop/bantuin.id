import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Skeleton } from "@/components/skeletons/SkeletonBase";
import { TableSkeleton } from "@/components/skeletons/FormSkeleton";

export default function ActivityLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
      <Navbar />
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-60 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-md" />
        </div>

        <div className="flex items-center gap-2 overflow-hidden py-1">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>

        <TableSkeleton rows={6} />
      </main>
      <Footer />
    </div>
  );
}
