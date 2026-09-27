import React from "react";

export default function UnreadBadge({ count, className = "", dotOnly = false }) {
  const numericCount = Number(count) || 0;

  if (numericCount <= 0) return null;

  if (dotOnly) {
    return (
      <span
        aria-label={`${numericCount > 99 ? "99+" : numericCount} pesan belum dibaca`}
        className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#1683FF] ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <span
      aria-label={`${numericCount > 99 ? "99+" : numericCount} pesan belum dibaca`}
      className={`absolute -top-1 -right-1 z-10 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-[#1683FF] px-1 text-[9px] font-black leading-none text-white ring-2 ring-white ${className}`}
    >
      {numericCount > 99 ? "99+" : numericCount}
    </span>
  );
}
