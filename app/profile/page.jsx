"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDateIndo } from "@/lib/utils";
import { 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  Clock, 
  Award, 
  FileBadge, 
  MapPin, 
  Settings, 
  User, 
  Briefcase, 
  CreditCard, 
  Lock, 
  LogOut, 
  Upload, 
  Check, 
  Edit, 
  PlusCircle, 
  ExternalLink,
  Phone,
  Mail,
  ArrowUpRight,
  DollarSign,
  X,
  Plus,
  QrCode,
  Building2,
  Wallet,
  Loader2
} from "lucide-react";

export default function ProfilePage() {
  const { currentUser, walletBalance, withdrawals, withdrawFunds, topUpFunds } = useApp();
  const [activeTab, setActiveTab] = useState("profile"); // profile, wallet, kyc, service_settings, bank, security
  const [isSaved, setIsSaved] = useState(false);
  
  // Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "100000",
    bankName: "BCA",
    accountNumber: "8820192841",
    accountHolder: currentUser?.fullName || "Sarah Kusuma",
  });

  // Top Up Modal State
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpForm, setTopUpForm] = useState({
    amount: "50000",
    paymentMethod: "qris",
  });
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [isTopUpSuccess, setIsTopUpSuccess] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || "Sarah Kusuma",
    email: currentUser?.email || "sarah.kusuma@email.com",
    phone: "081298765432",
    city: "Yogyakarta",
    bio: "Pengguna aktif Bantuin & Desainer Grafis lepas. Siap membantu urusan desain, dokumen kantor, dan projek kreatif.",
    isProviderEnabled: true,
    skills: ["Desain Grafis & Logo", "Video Editing", "Penerjemah"],
    bankName: "BCA",
    accountNumber: "8820192841",
    accountHolder: currentUser?.fullName || "Sarah Kusuma",
  });

  const availableSkills = [
    "Desain Grafis & Logo",
    "Fotografi & Liputan",
    "Web & IT Development",
    "Video Editing & Reels",
    "Servis Komputer / Laptop",
    "Penerjemah & Copywriting",
    "Teknisi AC & Tukang Listrik",
    "Admin Data & Excel",
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const toggleSkill = (skill) => {
    if (profileData.skills.includes(skill)) {
      setProfileData({
        ...profileData,
        skills: profileData.skills.filter((s) => s !== skill),
      });
    } else {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, skill],
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        
        {/* Top Profile Banner & Summary Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative">
                <img
                  src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                  alt={currentUser?.fullName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-blue-50 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profileData.fullName}
                  </h1>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>KTP Terverifikasi</span>
                  </span>
                  {profileData.isProviderEnabled && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Penyedia Jasa Aktif
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                  <span>{profileData.city} · Bergabung Sejak 2024</span>
                </p>

                <p className="text-xs text-slate-600 mt-2 max-w-xl line-clamp-2">
                  {profileData.bio}
                </p>

                {/* Performance Stats: Rating & Completed Bantuan / Jasa */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 pt-3 mt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/70">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span className="font-black text-amber-800">{Number(currentUser?.ratingAvg || 4.95).toFixed(2)}</span>
                    <span className="text-[11px] text-amber-700/80">({currentUser?.ratingCount || 34} ulasan)</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/70">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-black text-emerald-800">{currentUser?.completedHelpsCount || 28}</span>
                    <span className="text-[11px] text-emerald-700">Tugas &amp; Jasa Selesai</span>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/70">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span className="font-black text-blue-800">{currentUser?.reliabilityScore || 98}%</span>
                    <span className="text-[11px] text-blue-700">Keandalan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Link to Jasa Dashboard */}
            {profileData.isProviderEnabled && (
              <Link
                href="/jasa/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs border border-indigo-200 shadow-2xs transition self-center sm:self-start shrink-0"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Buka Dashboard Jasa</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Unified Profile & Portal Jasa Settings Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar Menu */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs space-y-1 self-start">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
              Pengaturan Akun & Jasa
            </div>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                activeTab === "profile"
                  ? "bg-[#1683FF] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profil & Kontak</span>
            </button>

            <button
              onClick={() => setActiveTab("wallet")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                activeTab === "wallet"
                  ? "bg-[#1683FF] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Dompet & Tarik Saldo</span>
            </button>

            <button
              onClick={() => setActiveTab("kyc")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                activeTab === "kyc"
                  ? "bg-[#1683FF] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verifikasi Identitas (KYC)</span>
            </button>

            <button
              onClick={() => setActiveTab("service_settings")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                activeTab === "service_settings"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 font-bold"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Pengaturan Jasa & Portal</span>
            </button>

            <button
              onClick={() => setActiveTab("bank")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                activeTab === "bank"
                  ? "bg-[#1683FF] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Rekening Bank & E-Wallet</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                activeTab === "security"
                  ? "bg-[#1683FF] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Keamanan & Sandi</span>
            </button>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/auth/logout"
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun (Logout)</span>
              </Link>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xs">
            
            {/* TAB 1: PROFIL & BIODATA */}
            {activeTab === "profile" && (
              <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-base font-black text-slate-900">Informasi Pribadi & Kontak</h3>
                  <p className="text-xs text-slate-500">Perbarui data profil yang ditampilkan kepada pengguna lain</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kota Domisili</label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bio Profil Singkat</label>
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {isSaved ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Perubahan Berhasil Disimpan
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}

            {/* TAB: DOMPET & SALDO (SINKRON DENGAN SISTEM ESCROW & JASA) */}
            {activeTab === "wallet" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-black text-slate-900">Dompet & Pencairan Saldo</h3>
                  <p className="text-xs text-slate-500">Hasil pendapatan dari membantu tugas dan pesanan jasa freelancer Anda</p>
                </div>

                {/* Wallet Balance Card */}
                <div className="bg-gradient-to-br from-[#102A43] to-[#0B1E32] text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-1">
                        Saldo Dompet Tersedia
                      </span>
                      <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">
                        {formatIDR(walletBalance)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Aman di Rekening Escrow Xendit & Siap Ditarik 24 Jam</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                      <button
                        onClick={() => {
                          setIsTopUpModalOpen(true);
                          setIsProcessingTopUp(false);
                          setIsTopUpSuccess(false);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Isi Saldo (Top Up)</span>
                      </button>

                      <button
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Tarik Saldo</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Withdrawals History */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-slate-900">Riwayat Penarikan Dana</h4>
                    <span className="text-xs text-slate-400">Otomatis via Xendit API</span>
                  </div>

                  <div className="border border-slate-100 rounded-2xl divide-y divide-slate-100">
                    {withdrawals.map((wd) => (
                      <div key={wd.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Transfer ke {wd.bankName} ({wd.accountNumber})
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {formatDateIndo(wd.createdAt)} · Ref: {wd.xenditDisbursementId}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900">-{formatIDR(wd.amount)}</div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            Berhasil Cair
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: VERIFIKASI IDENTITAS KYC */}
            {activeTab === "kyc" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-base font-black text-slate-900">Status Verifikasi Identitas (KYC)</h3>
                  <p className="text-xs text-slate-500">Identitas resmi yang menjamin keamanan transaksi & escrow di Bantuin</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Identitas KTP & No. HP Anda Telah Terverifikasi Penuh</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Akun Anda memiliki badge Trusted User dan dapat menerima tawaran bantuan serta membuka jasa profesional tanpa batas.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-semibold block mb-1">Status KTP:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Dukcapil
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 font-semibold block mb-1">Tingkat Kepercayaan:</span>
                    <span className="font-bold text-[#1683FF]">Level 3 (Maksimal)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PENGATURAN LAYANAN & PORTAL JASA (SINKRON DENGAN PORTAL JASA) */}
            {activeTab === "service_settings" && (
              <form onSubmit={handleSave} className="space-y-5 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Pengaturan Jasa & Keahlian Profesional</h3>
                    <p className="text-xs text-slate-500">Atur profil freelancer dan spesialisasi jasa yang Anda tawarkan ke publik</p>
                  </div>
                  <Link
                    href="/jasa/dashboard"
                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <span>Ke Dashboard Jasa</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Toggle Enable Provider Mode */}
                <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Mode Penyedia Jasa (Freelancer)</div>
                      <div className="text-[11px] text-slate-500">Tayangkan keahlian Anda di katalog jasa publik `/jasa`</div>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.isProviderEnabled}
                      onChange={(e) => setProfileData({ ...profileData, isProviderEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Skill Chips Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Keahlian & Spesialisasi Anda (Klik untuk tambah/hapus):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSkills.map((skill) => {
                      const isSelected = profileData.skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition font-medium flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          <span>{skill}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {isSaved ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Pengaturan Jasa Tersimpan
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition"
                  >
                    Simpan Pengaturan Jasa
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: REKENING & PAYOUT ESCROW */}
            {activeTab === "bank" && (
              <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-base font-black text-slate-900">Rekening Bank Pencairan Escrow</h3>
                  <p className="text-xs text-slate-500">Penghasilan dari bantuan dan jasa akan otomatis dicairkan ke rekening ini</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Bank Penerima</label>
                  <select
                    value={profileData.bankName}
                    onChange={(e) => setProfileData({ ...profileData, bankName: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] bg-white"
                  >
                    <option value="BCA">Bank BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening Bank</label>
                  <input
                    type="text"
                    value={profileData.accountNumber}
                    onChange={(e) => setProfileData({ ...profileData, accountNumber: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Rekening (Sesuai Buku Tabungan)</label>
                  <input
                    type="text"
                    value={profileData.accountHolder}
                    onChange={(e) => setProfileData({ ...profileData, accountHolder: e.target.value })}
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  {isSaved ? (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Rekening Berhasil Diperbarui
                    </span>
                  ) : <div />}

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition"
                  >
                    Simpan Rekening
                  </button>
                </div>
              </form>
            )}

            {/* TAB 5: KEAMANAN & SANDI */}
            {activeTab === "security" && (
              <form onSubmit={handleSave} className="space-y-4 animate-in fade-in duration-150">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-base font-black text-slate-900">Keamanan Akun & Sandi</h3>
                  <p className="text-xs text-slate-500">Perbarui kata sandi untuk mengamankan akun Anda</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Baru</label>
                  <input
                    type="password"
                    placeholder="Minimal 8 karakter"
                    className="w-full text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-2xs transition"
                  >
                    Perbarui Kata Sandi
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </main>

      {/* MODAL: TARIK SALDO DARI PROFIL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Tarik Saldo ke Rekening / E-Wallet</h3>
                <p className="text-[11px] text-slate-500">Pencairan instan otomatis via Xendit Disbursement</p>
              </div>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const success = withdrawFunds({
                  amount: withdrawForm.amount,
                  bankName: withdrawForm.bankName,
                  accountNumber: withdrawForm.accountNumber,
                  accountHolder: withdrawForm.accountHolder,
                });
                if (success) {
                  setIsWithdrawModalOpen(false);
                }
              }}
              className="space-y-4"
            >
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <span className="text-xs text-blue-950 font-medium">Saldo Tersedia:</span>
                <span className="text-sm font-extrabold text-[#1683FF]">{formatIDR(walletBalance)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  required
                  min={20000}
                  max={walletBalance}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#1683FF]"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Minimal Rp20.000</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawForm({ ...withdrawForm, amount: walletBalance.toString() })}
                    className="text-[#1683FF] font-bold hover:underline"
                  >
                    Tarik Semua
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank / E-Wallet</label>
                  <select
                    value={withdrawForm.bankName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="DANA">DANA</option>
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                    <option value="ShopeePay">ShopeePay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening / HP</label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  required
                  value={withdrawForm.accountHolder}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Biaya Admin Transfer:</span>
                  <span className="font-semibold text-slate-900">Rp2.500</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total yang Diterima:</span>
                  <span className="text-emerald-600">
                    {formatIDR(Math.max(0, (Number(withdrawForm.amount) || 0) - 2500))}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition"
                >
                  Konfirmasi & Tarik Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISI ULANG SALDO (TOP UP) DARI PROFIL */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Isi Ulang Saldo Dompet Bantuin</h3>
                <p className="text-[11px] text-slate-500">Top-up saldo untuk bayar bantuan & order jasa lebih cepat 1-klik</p>
              </div>
              {!isProcessingTopUp && (
                <button onClick={() => setIsTopUpModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isProcessingTopUp ? (
              <div className="py-10 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-[#1683FF] animate-spin mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Memproses Top Up Saldo...</h4>
                <p className="text-xs text-slate-500">Menghubungkan ke gateway pembayaran Xendit...</p>
              </div>
            ) : isTopUpSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h4 className="font-black text-base text-slate-900">Top Up Saldo Berhasil!</h4>
                <p className="text-xs text-slate-600">
                  Saldo Anda bertambah sebesar <strong>{formatIDR(Number(topUpForm.amount))}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="mt-3 px-6 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold shadow-xs"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsProcessingTopUp(true);
                  setTimeout(() => {
                    topUpFunds({
                      amount: topUpForm.amount,
                      paymentMethod: topUpForm.paymentMethod,
                    });
                    setIsProcessingTopUp(false);
                    setIsTopUpSuccess(true);
                  }, 1200);
                }}
                className="space-y-4"
              >
                {/* Nominal Selection Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Nominal Isi Ulang:</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {["25000", "50000", "100000", "200000", "500000", "1000000"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTopUpForm({ ...topUpForm, amount: preset })}
                        className={`p-2 rounded-xl border text-center font-bold transition ${
                          topUpForm.amount === preset
                            ? "bg-blue-50 border-[#1683FF] text-[#1683FF] shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {formatIDR(Number(preset))}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Atau Masukkan Nominal Lain (Rp):</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    value={topUpForm.amount}
                    onChange={(e) => setTopUpForm({ ...topUpForm, amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#1683FF]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Minimal top up Rp10.000 (Bebas biaya admin)</span>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Metode Pembayaran:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setTopUpForm({ ...topUpForm, paymentMethod: "qris" })}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition flex items-center gap-2 ${
                        topUpForm.paymentMethod === "qris"
                          ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-[#1683FF]" />
                      <span>QRIS (Semua E-Wallet)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTopUpForm({ ...topUpForm, paymentMethod: "bca_va" })}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition flex items-center gap-2 ${
                        topUpForm.paymentMethod === "bca_va"
                          ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>BCA VA</span>
                    </button>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-medium">Total Pembayaran:</span>
                  <span className="text-sm font-black text-emerald-800">{formatIDR(Number(topUpForm.amount) || 0)}</span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Bayar & Tambah Saldo</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
