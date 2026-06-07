"use client";

import React from "react";
import { Landmark, ArrowLeftRight, HelpCircle, Car, RefreshCw, CheckCircle2, Tags } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/MoneyAmount";

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
  sepayId?: string | null;
  transactionDate: string;
};

type TransactionItemProps = {
  transaction: Transaction;
  onClassify: (tx: Transaction) => void;
};

export function TransactionItem({ transaction, onClassify }: TransactionItemProps) {
  const isIncome = transaction.type === "INCOME";
  const noteText = transaction.note || "Không có ghi chú";
  const categoryName = transaction.category?.name || "Chưa phân loại";
  const categoryIcon = transaction.category?.icon || "?";
  
  const isUnclassified = !transaction.categoryId;

  const renderIcon = () => {
    if (categoryIcon && categoryIcon !== "?") {
      const isEmoji = /\p{Emoji}/u.test(categoryIcon);
      if (isEmoji || categoryIcon.length <= 2) {
        return <span className="text-lg">{categoryIcon}</span>;
      }
    }

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

    if (isUnclassified) {
      return <HelpCircle className="h-4.5 w-4.5 text-amber-500" />;
    }

    return <ArrowLeftRight className="h-4.5 w-4.5 text-slate-400" />;
  };

  const isSePay = transaction.source === "SEPAY";

  return (
    <div
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 ${
        isUnclassified
          ? "border-amber-200/80 bg-amber-50/20 hover:bg-amber-50/40"
          : "border-slate-100 bg-white hover:bg-slate-50/30"
      }`}
    >
      {/* Category Icon and Notes */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm ${
            isUnclassified
              ? "bg-amber-50 border-amber-200"
              : "bg-slate-50 border-slate-200/60"
          }`}
        >
          {renderIcon()}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-800 truncate leading-snug">
              {noteText}
            </p>
            {isUnclassified && (
              <span className="rounded-lg bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
                Cần phân loại
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate mt-0.5 font-semibold flex items-center gap-1.5">
            <span className={isUnclassified ? "text-amber-600/80 font-bold" : ""}>
              {categoryName}
            </span>
            {transaction.sepayId && (
              <span className="text-[10px] text-slate-300 font-medium font-mono">
                · {transaction.sepayId}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Badges and Actions */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-slate-100/60 pt-3 sm:border-0 sm:pt-0 shrink-0">
        {/* Type and Source badges */}
        <div className="flex items-center gap-2">
          {/* Type Badge: Thu / Chi */}
          <span
            className={`rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
              isIncome
                ? "bg-blue-50 text-blue-600 border-blue-100"
                : "bg-rose-50/50 text-rose-500 border-rose-100/70"
            }`}
          >
            {isIncome ? "Thu" : "Chi"}
          </span>

          {/* Source Badge: Manual / SePay */}
          <span
            className={`rounded-lg px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
              isSePay
                ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                : "bg-slate-50 text-slate-500 border-slate-200/80"
            }`}
          >
            {transaction.source}
          </span>
        </div>

        {/* Amount Display */}
        <div className="text-right sm:min-w-[110px]">
          <p
            className={`text-sm font-extrabold tabular-nums ${
              isIncome ? "text-blue-600" : "text-rose-500"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(Number(transaction.amount))}
          </p>
        </div>

        {/* Action Button: Phân loại / ✓ Đã phân loại */}
        <div className="sm:min-w-[120px] text-right">
          {isUnclassified ? (
            <button
              onClick={() => onClassify(transaction)}
              type="button"
              className="inline-flex h-8.5 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors active:scale-95 duration-150"
            >
              <Tags className="h-3.5 w-3.5" />
              Phân loại
            </button>
          ) : (
            <span className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-1 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã phân loại
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
