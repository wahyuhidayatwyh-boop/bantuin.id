import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount) {
  const num = Number(amount);
  if (amount === null || amount === undefined || isNaN(num)) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(num));
}

export function formatNumberWithDots(val) {
  if (val === null || val === undefined || val === "") return "";
  const numStr = String(val).replace(/\D/g, "");
  if (!numStr) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numStr));
}

export function parseNumberFromDots(val) {
  if (!val) return 0;
  const clean = String(val).replace(/\D/g, "");
  return clean ? Number(clean) : 0;
}

export function formatDateIndo(dateInput) {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeIndo(dateInput) {
  if (!dateInput) return "-";
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function timeAgoIndo(dateInput) {
  if (!dateInput) return "";
  const now = new Date();
  const past = new Date(dateInput);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return "baru saja";
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function formatDeadlineWithHour(deadline, deadlineText) {
  if (deadlineText && (deadlineText.includes(":") || deadlineText.includes("."))) {
    return deadlineText;
  }
  if (!deadline) {
    return deadlineText || "Hari ini · Jam 18:00 WIB";
  }
  try {
    const target = new Date(deadline);
    if (isNaN(target.getTime())) return deadlineText || "Hari ini · Jam 18:00 WIB";
    
    const now = new Date();
    const isToday = target.toDateString() === now.toDateString();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = target.toDateString() === tomorrow.toDateString();

    const hours = String(target.getHours()).padStart(2, "0");
    const minutes = String(target.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes} WIB`;

    if (isToday) {
      return `Hari ini · Jam ${timeStr}`;
    }
    if (isTomorrow) {
      return `Besok · Jam ${timeStr}`;
    }
    const dayStr = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(target);
    return `${dayStr} · Jam ${timeStr}`;
  } catch (e) {
    return deadlineText || "Hari ini · Jam 18:00 WIB";
  }
}

