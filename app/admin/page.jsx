"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatDateTimeIndo } from "@/lib/utils";
import { 
  Shield, 
  AlertTriangle, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Lock,
  History
} from "lucide-react";

export default function AdminDashboardPage() {
  const { 
    currentUser, 
    reports, 
    auditLogs, 
    adminVerifyUser, 
    resolveDispute 
  } = useApp();

  const [activeTab, setActiveTab] = useState("disputes");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || "");
  const [disputeNotes, setDisputeNotes] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-[#F5FAFF]">
      <Navbar />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 md:px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin & Trust & Safety Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#102A43] tracking-tight">
            Moderasi, Verifikasi KYC & Penyelesaian Sengketa
          </h1>
          <p className="text-xs sm:text-sm text-[#61758A] mt-1">
            Setiap tindakan admin diverifikasi dan dicatat dalam immutable audit log.
          </p>
        </div>

        {/* 3 Admin Tabs */}
        <div className="flex items-center gap-2 border-b border-[#DCEAF7] pb-4 mb-8">
          {[
            { id: "disputes", label: `Sengketa & Laporan (${reports.length})` },
            { id: "kyc", label: "Antrean Verifikasi KYC (1)" },
            { id: "audit", label: `Audit Trail (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
                activeTab === tab.id
                  ? "bg-[#102A43] text-white shadow-xs"
                  : "bg-white text-[#61758A] hover:text-[#102A43] border border-[#DCEAF7]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: SENGKETA & LAPORAN */}
        {activeTab === "disputes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <h3 className="font-bold text-sm text-[#102A43] uppercase tracking-wider mb-2">
                Daftar Kasus Masuk
              </h3>
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    selectedReportId === rep.id
                      ? "bg-white border-[#1683FF] shadow-sm"
                      : "bg-[#F5FAFF] border-[#DCEAF7] hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-rose-600 uppercase">
                      Kasus #{rep.id}
                    </span>
                    <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      {rep.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#102A43]">{rep.target}</h4>
                  <p className="text-xs text-[#61758A] mt-1 line-clamp-2">{rep.description}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-7 bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-[#102A43] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Ruang Review Bukti & Keputusan Admin</span>
              </h3>

              <div className="p-4 rounded-xl bg-[#F5FAFF] border border-[#DCEAF7] text-xs space-y-2">
                <div>
                  <span className="text-[#61758A]">Pelapor:</span>
                  <strong className="text-[#102A43] block">Cindy Clarissa (FISIP UI)</strong>
                </div>
                <div>
                  <span className="text-[#61758A]">Kategori Pelanggaran:</span>
                  <strong className="text-rose-600 block">Indikasi Disintermediasi (Sharing Kontak Luar)</strong>
                </div>
                <div>
                  <span className="text-[#61758A]">Bukti Log Sistem:</span>
                  <p className="text-[#102A43] bg-white p-2.5 rounded-lg border border-[#DCEAF7] mt-1 font-mono text-[11px]">
                    [CHAT DETECT] Terdeteksi nomor kontak 081299xxxx sebelum Order Room terbentuk.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#102A43] mb-1">
                  Catatan Keputusan Resmi Admin:
                </label>
                <textarea
                  rows={3}
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  placeholder="Tulis alasan keputusan yang akan tersimpan di audit log..."
                  className="w-full text-xs p-3 rounded-xl border border-[#DCEAF7] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => resolveDispute(selectedReportId, disputeNotes || "Peringatan resmi diberikan kepada akun pelanggar.", false)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
                >
                  Beri Peringatan Akun
                </button>
                <button
                  onClick={() => resolveDispute(selectedReportId, disputeNotes || "Refund escrow diproses ke requester.", true)}
                  className="flex-1 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-semibold"
                >
                  Refund Dana Escrow
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANTREAN KYC */}
        {activeTab === "kyc" && (
          <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-bold text-base text-[#102A43] mb-4">
              Verifikasi Dokumen Identitas Mahasiswa
            </h3>

            <div className="p-5 rounded-xl bg-[#F5FAFF] border border-[#DCEAF7] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <img
                  src={currentUser?.avatarUrl}
                  alt={currentUser?.fullName}
                  className="w-14 h-14 rounded-full object-cover border border-[#DCEAF7]"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#102A43]">{currentUser?.fullName}</h4>
                  <p className="text-xs text-[#61758A]">{currentUser?.email} · {currentUser?.campusName}</p>
                  <span className="inline-block mt-2 text-[11px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Status: {currentUser?.verificationStatus}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => adminVerifyUser(currentUser?.id, true, "KTM Valid")}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Setujui (Approve)</span>
                </button>
                <button
                  onClick={() => adminVerifyUser(currentUser?.id, false, "KTM Buram/Tidak Jelas")}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak (Reject)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {activeTab === "audit" && (
          <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#102A43] flex items-center gap-2">
                <History className="w-5 h-5 text-[#1683FF]" />
                <span>Immutable Security Audit Log</span>
              </h3>
              <span className="text-xs text-[#61758A]">Anti-Tamper Record</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#DCEAF7] text-[#61758A]">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Aktor</th>
                    <th className="py-2.5 px-3">Aksi</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCEAF7]/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F5FAFF]">
                      <td className="py-3 px-3 text-[#61758A] whitespace-nowrap font-mono text-[11px]">
                        {formatDateTimeIndo(log.timestamp)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#102A43]">{log.actor}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] font-bold text-[10px] font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#102A43] font-medium">{log.target}</td>
                      <td className="py-3 px-3 text-[#61758A] max-w-xs truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
