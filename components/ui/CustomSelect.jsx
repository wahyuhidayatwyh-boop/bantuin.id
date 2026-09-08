"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, Plus } from "lucide-react";

export default function CustomSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Pilih...",
  icon: Icon,
  disabled = false,
  required = false,
  allowCustom = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Standardize options to strings
  const stringOptions = options.map((opt) =>
    typeof opt === "object" ? opt.name || opt.label || "" : String(opt)
  );

  const filteredOptions = stringOptions.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isExactMatch = stringOptions.some(
    (opt) => opt.toLowerCase() === searchQuery.trim().toLowerCase()
  );

  const selectedDisplay =
    typeof value === "object" ? value?.name || value?.label || "" : value;

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Select Trigger Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchQuery("");
          }
        }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-xs sm:text-sm text-left transition ${
          disabled
            ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
            : isOpen
            ? "border-[#1683FF] ring-2 ring-[#1683FF]/20 bg-white text-slate-900 shadow-sm"
            : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate pr-2">
          {Icon && <Icon className="w-4 h-4 text-[#1683FF] shrink-0" />}
          <span className={selectedDisplay ? "font-semibold text-slate-900" : "text-slate-400"}>
            {selectedDisplay || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#1683FF]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu - Strictly Opens Downwards */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Instant Search Bar */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik untuk mencari..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-50 scrollbar-thin">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = selectedDisplay === opt;
                return (
                  <button
                    key={`${opt}-${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition text-left ${
                      isSelected
                        ? "bg-blue-50 text-[#1683FF] font-bold"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#1683FF] shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                Tidak ditemukan &quot;{searchQuery}&quot;
              </div>
            )}

            {/* Custom Input Option */}
            {allowCustom && searchQuery.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => {
                  onChange(searchQuery.trim());
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1683FF] bg-blue-50/70 hover:bg-blue-100 transition text-left mt-1 border border-blue-200/50"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Gunakan &quot;{searchQuery.trim()}&quot;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
