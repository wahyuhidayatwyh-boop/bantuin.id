import React from "react";
import Navbar from "@/components/layout/Navbar";
import { Skeleton, SkeletonCircle } from "@/components/skeletons/SkeletonBase";
import { ChatListSkeleton } from "@/components/skeletons/FormSkeleton";

export default function ChatLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6]">
      <Navbar />
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-[70vh]">
          {/* Left Chat List (4 cols) */}
          <div className="md:col-span-4 border-r border-slate-100 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <ChatListSkeleton />
          </div>

          {/* Right Chat Conversation (8 cols) */}
          <div className="hidden md:flex md:col-span-8 flex-col justify-between p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <SkeletonCircle size="w-10 h-10" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex justify-start">
                <Skeleton className="h-12 w-64 rounded-2xl" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-12 w-56 rounded-2xl" />
              </div>
            </div>

            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
