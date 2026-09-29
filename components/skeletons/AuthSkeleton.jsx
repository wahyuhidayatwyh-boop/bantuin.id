import React from "react";
import { Skeleton, SkeletonCircle } from "./SkeletonBase";

export function AuthSkeleton() {
  return (
    <div className="min-h-[100dvh] relative flex flex-col justify-between p-3 sm:p-6 lg:p-8 overflow-x-hidden font-sans bg-gradient-to-br from-[#EBF3FE] via-[#F0F6FF] to-[#DEEEFC]">
      <div className="w-full max-w-md mx-auto my-auto space-y-4 z-10 py-6 animate-in fade-in duration-200">
        
        {/* Brand Logo Centered */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* Clean & Elevated Login/Register Card */}
        <div className="bg-white/95 backdrop-blur-md py-6 sm:py-8 px-5 sm:px-8 shadow-[0_20px_50px_rgba(16,42,67,0.12)] border border-white/80 rounded-2xl sm:rounded-3xl space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-md" />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded-md" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>

            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          {/* Divider */}
          <div className="py-2">
            <Skeleton className="h-3 w-32 mx-auto rounded-md" />
          </div>

          {/* Google Button */}
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

      </div>

      <footer className="w-full max-w-md mx-auto text-center pt-2">
        <Skeleton className="h-3 w-64 mx-auto rounded-md" />
      </footer>
    </div>
  );
}

export default AuthSkeleton;
