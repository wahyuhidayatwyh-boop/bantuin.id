import React from "react";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`}
      {...props}
    />
  );
}

export function SkeletonCircle({ size = "w-10 h-10", className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-full ${size} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
