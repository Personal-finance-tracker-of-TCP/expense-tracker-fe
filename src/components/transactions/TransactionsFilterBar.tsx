"use client";

import React from "react";
import { AlertCircle, Calendar, Search, Tag } from "lucide-react";

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
  monthFilter: string;
  onMonthFilterChange: (monthStr: string) => void;
  unclassifiedCount: number;
  categories: Category[];
  availableMonths: string[];
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
  const formatMonthLabel = (monthStr: string) => {
    if (!monthStr) return "";
    const [year, month] = monthStr.split("-");
    return `Tháng ${parseInt(month, 10)} / ${year}`;
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200">
      <div className="relative h-10 min-w-[200px] flex-1">
        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm kiếm giao dịch, ghi chú..."
          className="h-full w-full rounded-2xl border border-slate-100 bg-slate-50/50 pl-10 pr-4 text-xs font-semibold placeholder-slate-400 outline-none ring-slate-100/50 transition-all duration-200 focus:border-slate-300 focus:bg-white focus:ring-4"
        />
      </div>

      <div className="flex h-10 shrink-0 items-center rounded-2xl border border-slate-200/20 bg-slate-100/80 p-0.5">
        {(["ALL", "INCOME", "EXPENSE"] as const).map((type) => {
          const isActive = typeFilter === type;
          const label =
            type === "ALL" ? "Tất cả" : type === "INCOME" ? "Thu nhập" : "Chi tiêu";

          return (
            <button
              key={type}
              onClick={() => onTypeFilterChange(type)}
              type="button"
              className={`h-full rounded-xl px-3.5 text-xs font-bold transition-all duration-150 ${
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

      <div className="flex h-10 shrink-0 items-center rounded-2xl border border-slate-200/20 bg-slate-100/80 p-0.5">
        {(["ALL", "MANUAL", "SEPAY"] as const).map((source) => {
          const isActive = sourceFilter === source;
          const label =
            source === "ALL" ? "Tất cả" : source === "MANUAL" ? "Manual" : "SePay";

          return (
            <button
              key={source}
              onClick={() => onSourceFilterChange(source)}
              type="button"
              className={`h-full rounded-xl px-3.5 text-xs font-bold transition-all duration-150 ${
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

      <div className="relative h-10 shrink-0 select-none">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
          <Tag className="h-3.5 w-3.5" />
        </span>
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryFilterChange(event.target.value)}
          className="h-full cursor-pointer appearance-none rounded-2xl border border-slate-200/85 bg-white pl-9 pr-8 text-xs font-bold text-slate-600 outline-none transition-all duration-200 hover:bg-slate-50/50 focus:border-slate-300"
        >
          <option value="ALL">Danh mục</option>
          <option value="UNCLASSIFIED">Chưa phân loại</option>
          <option value="EXCLUDED">Đã bỏ qua</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon ? `${cat.icon} ` : ""}
              {cat.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg className="h-3 w-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </div>

      <div className="relative h-10 shrink-0 select-none">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
        </span>
        <select
          value={monthFilter}
          onChange={(event) => onMonthFilterChange(event.target.value)}
          className="h-full cursor-pointer appearance-none rounded-2xl border border-slate-200/85 bg-white pl-9 pr-8 text-xs font-bold text-slate-600 outline-none transition-all duration-200 hover:bg-slate-50/50 focus:border-slate-300"
        >
          {availableMonths.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg className="h-3 w-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </span>
      </div>

      {unclassifiedCount > 0 ? (
        <div className="flex h-10 shrink-0 items-center gap-1.5 rounded-2xl border border-amber-100 bg-amber-50 px-3.5 text-xs font-bold text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>{unclassifiedCount} cần phân loại</span>
        </div>
      ) : null}
    </div>
  );
}
