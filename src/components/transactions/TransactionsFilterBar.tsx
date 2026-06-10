"use client";

import React from "react";
import { Search, Tag, Calendar, AlertCircle } from "lucide-react";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
};

type TransactionsFilterBarProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  typeFilter: "ALL" | "INCOME" | "EXPENSE";
  onTypeFilterChange: (type: "ALL" | "INCOME" | "EXPENSE") => void;
  sourceFilter: "ALL" | "MANUAL" | "SEPAY";
  onSourceFilterChange: (source: "ALL" | "MANUAL" | "SEPAY") => void;
  categoryFilter: string;
  onCategoryFilterChange: (catId: string) => void;
  monthFilter: string; // "YYYY-MM" format
  onMonthFilterChange: (monthStr: string) => void;
  unclassifiedCount: number;
  categories: Category[];
  availableMonths: string[]; // List of YYYY-MM strings
};

export function TransactionsFilterBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sourceFilter,
  onSourceFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  monthFilter,
  onMonthFilterChange,
  unclassifiedCount,
  categories,
  availableMonths,
}: TransactionsFilterBarProps) {
  // Format month label: "Tháng 6 / 2026"
  const formatMonthLabel = (monthStr: string) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    return `Tháng ${parseInt(month, 10)} / ${year}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm w-full transition-all duration-200">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] h-10">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm giao dịch, ghi chú..."
          className="h-full w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-10 pr-4 text-xs font-semibold placeholder-slate-400 outline-none ring-slate-100/50 focus:bg-white focus:border-slate-300 focus:ring-4 transition-all duration-200"
        />
      </div>

      {/* Type Filter Capsule */}
      <div className="bg-slate-100/80 p-0.5 rounded-2xl flex items-center h-10 border border-slate-200/20 shrink-0">
        {(["ALL", "INCOME", "EXPENSE"] as const).map((type) => {
          const isActive = typeFilter === type;
          const label = type === "ALL" ? "Tất cả" : type === "INCOME" ? "Thu nhập" : "Chi tiêu";
          return (
            <button
              key={type}
              onClick={() => onTypeFilterChange(type)}
              type="button"
              className={`px-3.5 h-full rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Source Filter Capsule */}
      <div className="bg-slate-100/80 p-0.5 rounded-2xl flex items-center h-10 border border-slate-200/20 shrink-0">
        {(["ALL", "MANUAL", "SEPAY"] as const).map((source) => {
          const isActive = sourceFilter === source;
          const label = source === "ALL" ? "Tất cả" : source === "MANUAL" ? "Manual" : "SePay";
          return (
            <button
              key={source}
              onClick={() => onSourceFilterChange(source)}
              type="button"
              className={`px-3.5 h-full rounded-xl text-xs font-bold transition-all duration-150 ${
                isActive
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Category Dropdown */}
      <div className="relative h-10 shrink-0 select-none">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none">
          <Tag className="h-3.5 w-3.5" />
        </span>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="h-full rounded-2xl border border-slate-200/85 bg-white pl-9 pr-8 text-xs font-bold text-slate-600 outline-none hover:bg-slate-50/50 appearance-none cursor-pointer focus:border-slate-300 transition-all duration-200"
        >
          <option value="ALL">Danh mục</option>
          <option value="UNCLASSIFIED">Chưa phân loại</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon ? `${cat.icon} ` : ""}
              {cat.name}
            </option>
          ))}
        </select>
        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
          <svg className="w-3 h-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
        </span>
      </div>

      {/* Month Dropdown Picker */}
      <div className="relative h-10 shrink-0 select-none">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400 pointer-events-none">
          <Calendar className="h-3.5 w-3.5" />
        </span>
        <select
          value={monthFilter}
          onChange={(e) => onMonthFilterChange(e.target.value)}
          className="h-full rounded-2xl border border-slate-200/85 bg-white pl-9 pr-8 text-xs font-bold text-slate-600 outline-none hover:bg-slate-50/50 appearance-none cursor-pointer focus:border-slate-300 transition-all duration-200"
        >
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {formatMonthLabel(m)}
            </option>
          ))}
        </select>
        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
          <svg className="w-3 h-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg>
        </span>
      </div>

      {/* Unclassified Badge Warning */}
      {unclassifiedCount > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-100 px-3.5 h-10 flex items-center gap-1.5 text-xs font-bold text-amber-700 shrink-0 animate-pulse">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <span>{unclassifiedCount} chưa phân loại</span>
        </div>
      )}
    </div>
  );
}
