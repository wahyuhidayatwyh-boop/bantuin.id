"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import { CANONICAL_ROLES, ROLE_LABELS } from "@/lib/services/authService";
import { ShieldAlert, ArrowLeft, RefreshCw, UserCheck, Shield, Store, Briefcase, User } from "lucide-react";

/**
 * RoleGuard Component
 * Complies with Section 3 & 4 of requirements.
 *
 * Route protection berdasarkan role kanonikal:
 * - "user"
 * - "provider"
 * - "partner"
 * - "admin"
 *
 * Mencegah direct URL navigation yang tidak sah.
 */
export default function RoleGuard({ allowedRoles = [], fallback = null, children }) {
  const { currentUser, setCurrentUser } = useApp();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    if (fallback) {
      return fallback;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#1683FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Memeriksa hak akses peran akun...</span>
        </div>
      </div>
    );
  }

  const currentRole = currentUser?.accountRole || currentUser?.accountType || currentUser?.role || CANONICAL_ROLES.USER;

  // Normalisasi alias role: partner <-> mitra, provider <-> penyedia, admin <-> super_admin
  const roleAliases = {
    partner: ["partner", "mitra"],
    mitra: ["partner", "mitra"],
    provider: ["provider", "penyedia", "jasa"],
    penyedia: ["provider", "penyedia", "jasa"],
    admin: ["admin", "super_admin"],
    super_admin: ["admin", "super_admin"],
    user: ["user", "pelanggan", "customer"],
  };

  const expandedAllowedRoles = allowedRoles.flatMap(r => roleAliases[r] || [r]);

  // Admin dan Super Admin selalu memiliki akses manajemen & preview seluruh dashboard
  const isAdministrator = 
    currentRole === "admin" || 
    currentRole === "super_admin" || 
    currentUser?.isAdmin === true;

  const isAllowed = isAdministrator || expandedAllowedRoles.includes(currentRole);

  if (!isAllowed) {
    const requiredLabels = allowedRoles.map((r) => ROLE_LABELS[r] || r).join(" atau ");
    const currentLabel = ROLE_LABELS[currentRole] || currentRole;

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7FB] p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Akses Halaman Dibatasi</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Halaman ini dikhususkan untuk peran <strong className="text-slate-800">{requiredLabels}</strong>. Akun Anda saat ini memiliki peran sebagai <strong className="text-rose-600">{currentLabel}</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Akun Aktif:</span>
              <strong className="text-slate-800">{currentUser?.fullName || "Pengguna"}</strong>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Peran Saat Ini:</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {currentLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Peran Dibutuhkan:</span>
              <span className="font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {requiredLabels}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Link>

            {(currentRole === "provider" || currentRole === "penyedia") && (
              <Link
                href="/jasa/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Dashboard Jasa</span>
              </Link>
            )}

            {(currentRole === "partner" || currentRole === "mitra") && (
              <Link
                href="/mitra/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Dashboard Mitra</span>
              </Link>
            )}

            {currentRole === "user" && (
              <Link
                href="/profile"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Pengaturan Profil</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return children;
}
