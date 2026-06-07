"use client";

import React from "react";
import { Landmark, ArrowLeftRight, HelpCircle, Car, RefreshCw } from "lucide-react";
import { formatCurrency } from "./MoneyAmount";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
};

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  note?: string | null;
  source: "MANUAL" | "SEPAY";
  categoryId?: string | null;
  category?: Category | null;
  transactionDate: string;
};

type TransactionItemProps = {
  transaction: Transaction;
};

export function TransactionItem({ transaction }: TransactionItemProps) {
  const isIncome = transaction.type === "INCOME";
  const noteText = transaction.note || "Không có ghi chú";
  const categoryName = transaction.category?.name || "Chưa phân loại";
  const categoryIcon = transaction.category?.icon || "?";

  // Format date: dd/MM/yyyy
  const formatDateStr = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Icon mapping helper if it's emoji or need a fallback UI
  const renderIcon = () => {
    if (categoryIcon && categoryIcon !== "?") {
      // If emoji, render as text
      const isEmoji = /\p{Emoji}/u.test(categoryIcon);
      if (isEmoji || categoryIcon.length <= 2) {
        return <span className="text-lg">{categoryIcon}</span>;
      }
    }

    // Lucide fallbacks based on name
    const name = categoryName.toLowerCase();
    if (name.includes("lương") || name.includes("thu nhập")) {
      return <Landmark className="h-4.5 w-4.5 text-blue-500" />;
    }
    if (name.includes("ăn") || name.includes("uống") || name.includes("bữa")) {
      return <span className="text-base">🍴</span>;
    }
    if (name.includes("chuyển") || name.includes("xe") || name.includes("grab")) {
      return <Car className="h-4.5 w-4.5 text-slate-500" />;
    }
    if (name.includes("hoàn tiền") || name.includes("refund")) {
      return <RefreshCw className="h-4.5 w-4.5 text-emerald-500" />;
    }

    if (!transaction.categoryId) {
      return <HelpCircle className="h-4.5 w-4.5 text-slate-400" />;
    }

    return <ArrowLeftRight className="h-4.5 w-4.5 text-slate-400" />;
  };

  const isSePay = transaction.source === "SEPAY";

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 group hover:bg-slate-50/40 rounded-2xl px-2 -mx-2 transition-colors duration-200">
      {/* Left: Icon and Name/Note */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200/60 shadow-sm">
          {renderIcon()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate leading-snug">
            {categoryName}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5 font-medium leading-normal">
            {noteText}
          </p>
        </div>
      </div>

      {/* Middle: Source Badge */}
      <div className="shrink-0 hidden sm:block">
        <span
          className={`rounded-lg px-2 py-0.5 text-[9px] font-bold border tracking-wide uppercase ${
            isSePay
              ? "bg-blue-50 text-blue-600 border-blue-100"
              : "bg-slate-50 text-slate-500 border-slate-200/80"
          }`}
        >
          {transaction.source}
        </span>
      </div>

      {/* Right: Amount and Date */}
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-bold tabular-nums leading-snug ${
            isIncome ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(Number(transaction.amount))}
        </p>
        <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[10px] font-semibold text-slate-400">
          {/* Mobile source badge tag next to date */}
          <span className="sm:hidden font-bold uppercase tracking-wider text-[8px]">
            {transaction.source} ·
          </span>
          <span>{formatDateStr(transaction.transactionDate)}</span>
        </div>
      </div>
    </div>
  );
}
