"use client";

import React from "react";
import Link from "next/link";
import { Eye, EyeOff, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/components/dashboard/MoneyAmount";

type TransactionsSummaryCardProps = {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  selectedPeriod: "prev" | "current" | "next";
  onPeriodChange: (period: "prev" | "current" | "next") => void;
  isMasked: boolean;
  onToggleMask: () => void;
};

export function TransactionsSummaryCard({
  balance,
  totalIncome,
  totalExpense,
  selectedPeriod,
  onPeriodChange,
  isMasked,
  onToggleMask,
}: TransactionsSummaryCardProps) {
  const savings = totalIncome - totalExpense;

  const tabs = [
    { id: "prev" as const, label: "Tháng trước" },
    { id: "current" as const, label: "Tháng này" },
    { id: "next" as const, label: "Tương lai" },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6 transition-all duration-200">
      {/* Balance Block */}
      <div className="flex flex-col items-center justify-center text-center space-y-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          Tổng cộng
        </span>
        <div className="flex items-center gap-2.5">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {isMasked ? "••••••" : formatCurrency(balance)}
          </h2>
          <button
            onClick={onToggleMask}
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-50 rounded-full"
            aria-label={isMasked ? "Show balance" : "Hide balance"}
          >
            {isMasked ? (
              <EyeOff className="h-4.5 w-4.5" />
            ) : (
              <Eye className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
        <span className="text-xs text-slate-400 font-medium">Số dư hiện tại</span>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100 flex justify-center">
        <div className="flex gap-8 -mb-px">
          {tabs.map((tab) => {
            const isActive = selectedPeriod === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onPeriodChange(tab.id)}
                type="button"
                className={`py-3.5 text-xs font-extrabold border-b-2 transition-all duration-200 ${
                  isActive
                    ? "border-emerald-500 text-emerald-600 font-bold"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Summary Table-Grid */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 pt-2">
        <div className="flex-1 flex justify-between sm:flex-col gap-2 sm:gap-1 pl-4 sm:pl-0 sm:border-l-0">
          <span className="text-xs font-semibold text-slate-400">Tiền vào</span>
          <span className="text-sm sm:text-base font-extrabold text-blue-600 tabular-nums">
            {isMasked ? "••••••" : formatCurrency(totalIncome)}
          </span>
        </div>

        <div className="hidden sm:block w-px bg-slate-100"></div>

        <div className="flex-1 flex justify-between sm:flex-col gap-2 sm:gap-1 pl-4 sm:pl-0">
          <span className="text-xs font-semibold text-slate-400">Tiền ra</span>
          <span className="text-sm sm:text-base font-extrabold text-rose-500 tabular-nums">
            {isMasked ? "••••••" : formatCurrency(totalExpense)}
          </span>
        </div>

        <div className="hidden sm:block w-px bg-slate-100"></div>

        <div className="flex-1 flex justify-between sm:flex-col gap-2 sm:gap-1 pl-4 sm:pl-0">
          <span className="text-xs font-semibold text-slate-400">Còn lại</span>
          <span
            className={`text-sm sm:text-base font-extrabold tabular-nums ${
              savings >= 0 ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {isMasked ? "••••••" : formatCurrency(savings)}
          </span>
        </div>

        <div className="shrink-0 flex items-center justify-end pl-4 sm:pl-0">
          <Link
            href="/reports"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-50 px-4 text-xs font-bold text-emerald-600 border border-emerald-100 hover:bg-emerald-100/60 transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Xem báo cáo cho giai đoạn này</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
