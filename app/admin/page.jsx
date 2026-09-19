"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDateTimeIndo, formatDateIndo } from "@/lib/utils";
import { 
  Shield, 
  AlertTriangle, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Lock,
  History,
  DollarSign,
  Receipt,
  ArrowUpRight,
  Check,
  Package,
  RotateCcw,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Loader2,
  Clock,
  Building2,
  Filter,
  Eye,
  EyeOff,
  Store,
  Briefcase,
  ShieldCheck
} from "lucide-react";

export default function AdminDashboardPage() {
  const { 
    currentUser, 
    orderRooms,
    ledgerEntries,
    withdrawals,
    customerDeposits,
    adminMarkWithdrawalSuccess,
    adminRejectWithdrawal,
    adminMarkDepositRefunded,
    reports, 
    auditLogs, 
    adminVerifyUser, 
    resolveDispute 
  } = useApp();

  const [activeTab, setActiveTab] = useState("transactions"); // transactions, withdrawals, deposit_refunds, disputes, kyc, audit
  const [transactionFilter, setTransactionFilter] = useState("all"); // all, service, rental, task
  const [searchQuery, setSearchQuery] = useState("");
  
  // Withdrawal action state
  const [transferRefMap, setTransferRefMap] = useState({});
  const [rejectReasonMap, setRejectReasonMap] = useState({});

  // Deposit refund action state
  const [depositRefundRefMap, setDepositRefundRefMap] = useState({});
  const [deductionAmountMap, setDeductionAmountMap] = useState({});
  const [deductionReasonMap, setDeductionReasonMap] = useState({});

  // KYC action state
  const [revealedNikIds, setRevealedNikIds] = useState({});
  const toggleRevealNik = (id) => {
    setRevealedNikIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Dispute tab states
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || "");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Filter transactions
  const filteredOrders = orderRooms.filter((order) => {
    if (order.stage === "inquiry") return false; // Show paid/active transactions
    if (transactionFilter === "service" && order.orderType !== "service") return false;
    if (transactionFilter === "rental" && order.orderType !== "rental") return false;
    if (transactionFilter === "task" && order.orderType === "rental") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (order.requestTitle || "").toLowerCase().includes(q);
      const matchId = (order.id || "").toLowerCase().includes(q);
      const matchCustomer = (order.requester?.name || "").toLowerCase().includes(q);
      const matchMitra = (order.helper?.name || "").toLowerCase().includes(q);
      return matchTitle || matchId || matchCustomer || matchMitra;
    }
    return true;
  });

  // Calculate high-level transaction statistics
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === "PENDING").length;
  const pendingRefundsCount = customerDeposits.filter((d) => d.status === "REFUND_PENDING").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 py-8">
        
        {/* Header Command Center */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin & Financial Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102A43] tracking-tight">
              Manajemen Transaksi, Pencairan Mitra & Deposit
            </h1>
            <p className="text-xs sm:text-sm text-[#61758A] mt-1">
              Sistem pencatatan ledger transaksi, transfer manual penarikan mitra, dan pengembalian jaminan sewa (Non E-Money).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-white border border-[#DCEAF7] text-xs font-bold text-[#102A43] flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Mode Operasional: MVP Manual Admin</span>
            </span>
          </div>
        </div>

        {/* 6 Admin Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[#DCEAF7] pb-3 mb-6 overflow-x-auto no-scrollbar">
          {[
            { id: "transactions", label: `Transaksi & Ledger (${filteredOrders.length})`, badge: null },
            { id: "withdrawals", label: `Penarikan Mitra`, badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : null },
            { id: "deposit_refunds", label: `Pengembalian Deposit`, badge: pendingRefundsCount > 0 ? pendingRefundsCount : null },
            { id: "disputes", label: `Sengketa (${reports.length})`, badge: null },
            { id: "kyc", label: "Antrean KYC (1)", badge: null },
            { id: "audit", label: `Audit Trail (${auditLogs.length})`, badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#1683FF] text-white shadow-xs"
                  : "bg-white text-[#61758A] hover:text-[#102A43] border border-[#DCEAF7]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: TRANSAKSI & LEDGER PEMBAGIAN DANA */}
        {/* ======================================================== */}
        {activeTab === "transactions" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Filter & Search Bar */}
            <div className="bg-white border border-[#DCEAF7] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-bold text-[#61758A] flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                {[
                  { id: "all", label: "Semua Transaksi" },
                  { id: "service", label: "Jasa Spesialis" },
                  { id: "rental", label: "Sewa Barang + Deposit" },
                  { id: "task", label: "Bantuan Tugas" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTransactionFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                      transactionFilter === f.id
                        ? "bg-[#1683FF] text-white shadow-2xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari order, customer, mitra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                />
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white border border-[#DCEAF7] rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#DCEAF7] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#102A43]">Daftar Transaksi Masuk (Payment Gateway)</h3>
                  <p className="text-[11px] text-[#61758A]">Rincian gross pembayaran, pemisahan deposit 0% komisi, komisi platform 8%, dan hak bersih mitra</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  Total Tercatat: {filteredOrders.length} Order
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-[#F8FBFF] border-b border-[#DCEAF7] text-[#61758A] font-bold">
                    <tr>
                      <th className="py-3 px-4">Order ID & Jenis</th>
                      <th className="py-3 px-3">Customer & Mitra</th>
                      <th className="py-3 px-3">Total Bayar (Gross)</th>
                      <th className="py-3 px-3">Deposit Jaminan</th>
                      <th className="py-3 px-3">Komisi Bantuin (8%)</th>
                      <th className="py-3 px-3">Hak Mitra (92%)</th>
                      <th className="py-3 px-3">Status Pekerjaan</th>
                      <th className="py-3 px-3">Status Hak Mitra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCEAF7]/70">
                    {filteredOrders.map((order) => {
                      const isRental = order.orderType === "rental";
                      const gross = order.lockedAmount || order.totalAmount || 100000;
                      const deposit = isRental ? (order.depositAmount || 200000) : 0;
                      const baseFee = isRental ? (gross - deposit) : gross;
                      const platformFee = Math.round(baseFee * 0.08);
                      const mitraEntitlement = baseFee - platformFee;
                      const isCompleted = order.orderStatus === "completed" || order.orderStatus === "returned";

                      return (
                        <tr key={order.id} className="hover:bg-[#F5FAFF] transition">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-[11px] text-[#1683FF]">{order.id}</div>
                            <div className="font-semibold text-slate-900 mt-0.5 max-w-[180px] truncate">{order.requestTitle}</div>
                            <span className={`inline-block mt-1 text-[9px] font-extrabold px-2 py-0.2 rounded-md ${
                              isRental ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {isRental ? "SEWA + DEPOSIT" : (order.orderType === "service" ? "JASA" : "BANTUAN")}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="text-slate-900 font-semibold">Klien: {order.requester?.name || "Customer"}</div>
                            <div className="text-slate-500 text-[11px] mt-0.5">Mitra: {order.helper?.name || "Penyedia/Toko"}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-black text-slate-900">{formatIDR(gross)}</div>
                            <div className="text-[10px] text-slate-400">Via {order.serviceDetails?.paymentMethod || "QRIS Gateway"}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            {isRental ? (
                              <div>
                                <div className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block">
                                  {formatIDR(deposit)}
                                </div>
                                <div className="text-[9px] text-slate-400 mt-0.5">0% komisi (titipan)</div>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-bold text-indigo-900">{formatIDR(platformFee)}</div>
                            <div className="text-[10px] text-slate-400">8% dari {formatIDR(baseFee)}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-black text-emerald-600">{formatIDR(mitraEntitlement)}</div>
                            <div className="text-[10px] text-slate-400">Hak bersih mitra</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isCompleted 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {isCompleted ? "✓ Selesai" : "⏳ Sedang Berjalan"}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              isCompleted
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}>
                              {isCompleted ? "AVAILABLE" : "PENDING"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-Panel: Mutasi Ledger Akuntansi Terakhir */}
            <div className="bg-white border border-[#DCEAF7] rounded-2xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-[#102A43] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#1683FF]" />
                  <span>Buku Jurnal Akuntansi Platform (Transaction Ledger Entries)</span>
                </h4>
                <span className="text-[11px] text-slate-400">Tercatat {ledgerEntries.length} mutasi</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px]">
                      <th className="py-2 px-3">Waktu</th>
                      <th className="py-2 px-3">Tipe Ledger</th>
                      <th className="py-2 px-3">Order / Ref</th>
                      <th className="py-2 px-3">Keterangan</th>
                      <th className="py-2 px-3 text-right">Mutasi Hak/Komisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {ledgerEntries.slice(0, 10).map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-400 font-mono whitespace-nowrap">
                          {formatDateTimeIndo(entry.timestamp)}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-blue-600">{entry.orderId}</td>
                        <td className="py-2 px-3 text-slate-600 max-w-sm truncate">{entry.description}</td>
                        <td className="py-2 px-3 text-right font-black font-mono">
                          {entry.platformFee > 0 && <span className="text-indigo-600">+{formatIDR(entry.platformFee)}</span>}
                          {entry.mitraEntitlement !== 0 && (
                            <span className={entry.mitraEntitlement > 0 ? "text-emerald-600" : "text-rose-600"}>
                              {entry.mitraEntitlement > 0 ? `+${formatIDR(entry.mitraEntitlement)}` : formatIDR(entry.mitraEntitlement)}
                            </span>
                          )}
                          {entry.depositAmount !== 0 && (
                            <span className={entry.depositAmount > 0 ? "text-amber-600" : "text-slate-600"}>
                              {entry.depositAmount > 0 ? `+${formatIDR(entry.depositAmount)}` : formatIDR(entry.depositAmount)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PENARIKAN DANA MITRA (WITHDRAWALS - TRANSFER MANUAL) */}
        {/* ======================================================== */}
        {activeTab === "withdrawals" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Box */}
            <div className="bg-gradient-to-br from-[#102A43] to-[#0B1E32] text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-1">
                  Pusat Pembayaran Mitra (Manual Transfer Queue)
                </span>
                <h3 className="text-2xl font-black">Antrean Transfer Penarikan Mitra</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Admin melakukan transfer manual ke rekening bank mitra, lalu menekan tombol "Tandai Transfer Berhasil". Biaya admin transfer Rp2.500 ditanggung Bantuin.id, mitra menerima 100% utuh.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-center">
                  <div className="text-[10px] text-slate-300">Menunggu Transfer</div>
                  <div className="text-xl font-black text-amber-400">{pendingWithdrawalsCount} Pengajuan</div>
                </div>
              </div>
            </div>

            {/* Withdrawals List */}
            <div className="space-y-4">
              {withdrawals.map((wd) => {
                const isPending = wd.status === "PENDING";
                const isSuccess = wd.status === "SUCCESS";
                const currentRef = transferRefMap[wd.id] || "";
                const currentReason = rejectReasonMap[wd.id] || "";

                return (
                  <div 
                    key={wd.id}
                    className={`p-5 rounded-2xl border bg-white shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition ${
                      isPending ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200"
                    }`}
                  >
                    {/* Left: Info Rekening & Nominal */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#1683FF]">#{wd.id}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isSuccess
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPending
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {isSuccess ? "✓ SUCCESS (Transfer Berhasil)" : isPending ? "⏳ WITHDRAWAL_PENDING" : "❌ REJECTED"}
                        </span>
                        <span className="text-[11px] text-slate-400">· Diajukan: {formatDateTimeIndo(wd.requestedAt)}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-slate-900">
                          {wd.mitraName || "Mitra Penyedia"}
                        </h4>
                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                            {wd.bankName}
                          </span>
                          <span className="font-mono font-bold text-slate-900">{wd.accountNumber}</span>
                          <span className="text-slate-500">a.n. <strong>{wd.accountHolder}</strong></span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                        <span>Fee Transfer: <strong className="text-emerald-700">Rp2.500 (Ditanggung Bantuin)</strong></span>
                        <span>Nominal Wajib Dikirim: <strong className="text-slate-900 font-bold">{formatIDR(wd.amount)}</strong></span>
                      </div>
                    </div>

                    {/* Right: Nominal & Action Form */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:self-center">
                      <div className="text-right sm:border-r sm:border-slate-100 sm:pr-4">
                        <div className="text-[11px] text-slate-400">Nominal Penarikan:</div>
                        <div className="text-2xl font-black text-emerald-600">{formatIDR(wd.amount)}</div>
                        <div className="text-[10px] text-slate-400">100% Diterima Mitra</div>
                      </div>

                      {isPending ? (
                        <div className="space-y-2 shrink-0">
                          <input
                            type="text"
                            placeholder="Nomor Ref Bank (Opsional)"
                            value={currentRef}
                            onChange={(e) => setTransferRefMap({ ...transferRefMap, [wd.id]: e.target.value })}
                            className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adminMarkWithdrawalSuccess(wd.id, currentRef)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Tandai Transfer Berhasil</span>
                            </button>
                            <button
                              onClick={() => adminRejectWithdrawal(wd.id, "Rekening tidak dapat diproses")}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition"
                            >
                              Tolak
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right space-y-0.5 shrink-0">
                          <div className="text-[11px] text-slate-500 font-medium">
                            Diproses: {formatDateTimeIndo(wd.processedAt || wd.requestedAt)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {wd.transferReference || "TRF-MANUAL-ADMIN"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PENGEMBALIAN DEPOSIT SEWA (DEPOSIT REFUNDS) */}
        {/* ======================================================== */}
        {activeTab === "deposit_refunds" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Box */}
            <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-[#102A43] text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Pengembalian Titipan Jaminan Sewa (0% Komisi)
                </span>
                <h3 className="text-2xl font-black">Manajemen Pengembalian Deposit Sewa</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Deposit sewa bukan pendapatan Bantuin.id. Setelah barang selesai diperiksa toko mitra, admin mentransfer manual uang jaminan ini kembali ke rekening customer tanpa memotong biaya transfer.
                </p>
              </div>

              <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-center shrink-0">
                <div className="text-[10px] text-slate-300">Siap Ditransfer Kembali</div>
                <div className="text-xl font-black text-amber-300">{pendingRefundsCount} Customer</div>
              </div>
            </div>

            {/* Deposits List */}
            <div className="space-y-4">
              {customerDeposits.map((dep) => {
                const isRefunded = dep.status === "REFUNDED";
                const isPendingRefund = dep.status === "REFUND_PENDING";
                const isWaitingReturn = dep.status === "WAITING_RETURN";
                const isDispute = dep.status === "DISPUTE";

                const currentRef = depositRefundRefMap[dep.id] || "";
                const currentDeduction = deductionAmountMap[dep.id] || "";
                const currentReason = deductionReasonMap[dep.id] || "";

                return (
                  <div
                    key={dep.id}
                    className={`p-5 rounded-2xl border bg-white shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition ${
                      isPendingRefund ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"
                    }`}
                  >
                    {/* Left: Info Rental & Customer */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#1683FF]">#{dep.id}</span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isRefunded
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPendingRefund
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : isDispute
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {isRefunded && "✓ REFUNDED (Deposit Telah Dikembalikan)"}
                          {isPendingRefund && "⏳ REFUND_PENDING (Siap Ditransfer Admin)"}
                          {isWaitingReturn && "📦 DEPOSIT_HELD (Barang Sedang Disewa)"}
                          {isDispute && "⚠️ DISPUTE / KLAIM KERUSAKAN"}
                        </span>
                        <span className="text-[11px] text-slate-400">· Order: {dep.rentalOrderId}</span>
                      </div>

                      <div>
                        <h4 className="font-bold text-base text-slate-900">{dep.rentalTitle}</h4>
                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-0.5">
                          <span>Rekening Customer:</span>
                          <span className="font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                            {dep.customerBank}
                          </span>
                          <span className="font-mono font-bold text-slate-900">{dep.customerAccountNumber}</span>
                          <span className="text-slate-500">a.n. <strong>{dep.customerAccountHolder}</strong></span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        {isRefunded && `Dikembalikan penuh ${formatIDR(dep.refundAmount)} pada ${formatDateTimeIndo(dep.refundedAt)}`}
                        {isPendingRefund && "Pemeriksaan unit toko telah beres. Silakan lakukan transfer manual ke rekening di atas."}
                        {isWaitingReturn && "Barang masih digunakan oleh penyewa. Deposit tertahan aman di rekening penampung."}
                      </div>
                    </div>

                    {/* Right: Nominal & Action Form */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:self-center">
                      <div className="text-right sm:border-r sm:border-slate-100 sm:pr-4">
                        <div className="text-[11px] text-slate-400">Nominal Deposit:</div>
                        <div className="text-2xl font-black text-amber-800">{formatIDR(dep.depositAmount)}</div>
                        <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Fee TF: Ditanggung Platform</div>
                      </div>

                      {isPendingRefund ? (
                        <div className="space-y-2 shrink-0">
                          <input
                            type="text"
                            placeholder="Nomor Referensi Transfer Bank"
                            value={currentRef}
                            onChange={(e) => setDepositRefundRefMap({ ...depositRefundRefMap, [dep.id]: e.target.value })}
                            className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => adminMarkDepositRefunded(dep.id, currentRef, {
                                deductionAmount: Number(currentDeduction) || 0,
                                deductionReason: currentReason
                              })}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span>Tandai Deposit Dikembalikan</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right space-y-0.5 shrink-0">
                          <div className="text-[11px] font-bold text-emerald-700">
                            {isRefunded ? "Transfer Sukses" : "Menunggu Selesai Sewa"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {dep.transferReference || "REFUND-AUTO-RECORD"}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SENGKETA & LAPORAN */}
        {/* ======================================================== */}
        {activeTab === "disputes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
            <div className="lg:col-span-5 space-y-3">
              <h3 className="font-bold text-sm text-[#102A43] uppercase tracking-wider mb-2">
                Daftar Kasus Masuk ({reports.length})
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
                  <div className="text-[10px] text-slate-400 mt-2 font-mono">
                    Pelapor: {rep.reporter}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-7 bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-[#102A43] mb-4">Investigasi Kasus #{selectedReportId}</h3>
              <p className="text-xs text-[#61758A] mb-4">
                Tindakan resolusi akan mencatat audit log dan mengirim instruksi penanganan sengketa ke pengguna terkait.
              </p>
              <textarea
                rows={3}
                placeholder="Catatan resolusi investigasi admin..."
                value={disputeNotes}
                onChange={(e) => setDisputeNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-[#DCEAF7] mb-4 focus:outline-none focus:border-[#1683FF]"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => resolveDispute(selectedReportId, "RESOLVED_WITH_WARNING", disputeNotes || "Peringatan resmi diberikan.")}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  Beri Peringatan
                </button>
                <button
                  onClick={() => resolveDispute(selectedReportId, "RESOLVED_DISMISSED", "Kasus ditutup karena bukti tidak mencukupi.")}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Tutup Kasus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: VERIFIKASI IDENTITAS KYC */}
        {/* ======================================================== */}
        {activeTab === "kyc" && (
          <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm animate-in fade-in duration-150 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-[#102A43] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#1683FF]" />
                  <span>Antrean Verifikasi Identitas &amp; Legalitas (KYC)</span>
                </h3>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  2 Antrean Menunggu
                </span>
              </div>
              <p className="text-xs text-[#61758A] mt-1">
                Validasi identitas KTP/KTM, kecocokan nama buku tabungan, dan lokasi fisik sebelum memberikan badge Verified.
              </p>
            </div>

            {/* Banner Kepatuhan Privasi UU PDP untuk Admin */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-[#1683FF] shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 block font-bold mb-0.5">
                  Protokol Keamanan Data Sensitif (Kepatuhan UU PDP No. 27/2022):
                </strong>
                Dokumen KTP/KTM di bawah ini dimuat dari *Private Storage Vault* menggunakan *Signed URL* sementara (berlaku 60 detik). Seluruh tindakan peninjauan dan pembukaan NIK dicatat secara permanen di Immutable Audit Log. Dilarang mengambil screenshot atau menyebarluaskan dokumen identitas pengguna.
              </div>
            </div>

            {/* Daftar Antrean KYC */}
            <div className="space-y-4">
              
              {/* KARTU KYC 1: PENYEDIA JASA */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-[#F8FBFF] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#102A43]">Sarah Kusuma, S.Ds</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Penyedia Jasa (Pro)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Keahlian: Desain Grafis &amp; UI/UX &middot; Universitas Indonesia &middot; Terdaftar 2 jam lalu
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
                    Menunggu Verifikasi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Foto KTP dengan Watermark Proteksi */}
                  <div className="md:col-span-4 relative rounded-xl overflow-hidden border border-slate-300 bg-slate-100 group">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                      alt="KTM Preview"
                      className="w-full h-32 object-cover"
                    />
                    {/* Watermark Overlay Otomatis */}
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px] p-2 flex flex-col justify-between pointer-events-none">
                      <span className="text-[9px] font-black text-white/80 bg-red-600/80 px-1.5 py-0.5 rounded self-start">
                        VAULT PRIVATE
                      </span>
                      <p className="text-[8px] font-bold text-white/90 text-center leading-tight">
                        HANYA UNTUK VERIFIKASI BANTUIN.ID &mdash; DILARANG MENYEBARLUASKAN
                      </p>
                    </div>
                  </div>

                  {/* Detail NIK & Rekening Payout */}
                  <div className="md:col-span-8 space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Nomor Identitas (NIK)</span>
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          {revealedNikIds["kyc-1"] ? "3201102901920004" : "320110******0004"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRevealNik("kyc-1")}
                        className="p-1.5 text-slate-500 hover:text-[#1683FF] rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                        title={revealedNikIds["kyc-1"] ? "Mask NIK" : "Buka NIK Penuh"}
                      >
                        {revealedNikIds["kyc-1"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Rekening Bank Payout</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-bold text-slate-800">
                          BCA &middot; 8820192841
                        </span>
                        <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Nama Cocok: Sarah Kusuma
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    onClick={() => adminVerifyUser(currentUser?.id || "user-1", false, "Dokumen buram/tidak terbaca")}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                  >
                    Tolak KYC
                  </button>
                  <button
                    onClick={() => adminVerifyUser(currentUser?.id || "user-1", true, "Identitas KTM & Rekening BCA Valid")}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui &amp; Beri Badge Verified Pro</span>
                  </button>
                </div>
              </div>

              {/* KARTU KYC 2: MITRA TOKO RENTAL */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-[#F8FBFF] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[#102A43]">Jogja Cam &amp; Audio Hub</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Mitra Toko Rental
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Pemilik: Budi Prasetyo &middot; Alamat: Jl. Kaliurang KM 5, Sleman (Dekat UGM) &middot; GPS Terkunci
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 self-start sm:self-auto">
                    Menunggu Verifikasi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Foto KTP dengan Watermark Proteksi */}
                  <div className="md:col-span-4 relative rounded-xl overflow-hidden border border-slate-300 bg-slate-100 group">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                      alt="KTP Pemilik Toko"
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[0.5px] p-2 flex flex-col justify-between pointer-events-none">
                      <span className="text-[9px] font-black text-white/80 bg-red-600/80 px-1.5 py-0.5 rounded self-start">
                        VAULT PRIVATE
                      </span>
                      <p className="text-[8px] font-bold text-white/90 text-center leading-tight">
                        HANYA UNTUK VERIFIKASI BANTUIN.ID &mdash; DILARANG MENYEBARLUASKAN
                      </p>
                    </div>
                  </div>

                  {/* Detail NIK Pemilik & Rekening Payout */}
                  <div className="md:col-span-8 space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">NIK Pemilik Toko</span>
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          {revealedNikIds["kyc-2"] ? "3302141508890002" : "330214******0002"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRevealNik("kyc-2")}
                        className="p-1.5 text-slate-500 hover:text-[#1683FF] rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                        title={revealedNikIds["kyc-2"] ? "Mask NIK" : "Buka NIK Penuh"}
                      >
                        {revealedNikIds["kyc-2"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Rekening Bank Payout Toko</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-bold text-slate-800">
                          Mandiri &middot; 1370019284122
                        </span>
                        <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Nama Cocok: Budi Prasetyo
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    onClick={() => adminVerifyUser("mitra-1", false, "Titik fisik belum tervalidasi")}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition cursor-pointer"
                  >
                    Tolak Toko
                  </button>
                  <button
                    onClick={() => adminVerifyUser("mitra-1", true, "KTP Pemilik, Alamat Fisik & Rekening Mandiri Valid")}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui &amp; Beri Badge Verified Store</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: AUDIT TRAIL */}
        {/* ======================================================== */}
        {activeTab === "audit" && (
          <div className="bg-white border border-[#DCEAF7] rounded-2xl p-6 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#102A43] flex items-center gap-2">
                <History className="w-5 h-5 text-[#1683FF]" />
                <span>Immutable Security & Financial Audit Log</span>
              </h3>
              <span className="text-xs text-[#61758A]">Anti-Tamper Record</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#DCEAF7] text-[#61758A]">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Aktor</th>
                    <th className="py-2.5 px-3">Aksi</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Detail Mutasi/Aksi</th>
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
