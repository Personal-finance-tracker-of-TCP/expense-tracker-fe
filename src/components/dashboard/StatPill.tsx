"use client";

import React from "react";

type StatPillProps = {
  label: string;
  value: number | string;
  type: "INCOME" | "EXPENSE" | "SAVING";
  variant?: "card" | "pill";
};

export function StatPill({ label, value, type, variant = "card" }: StatPillProps) {
  const isIncome = type === "INCOME";
  const isExpense = type === "EXPENSE";

  if (variant === "pill") {
    // Pill variant used at the bottom of the Wallet Card
    const bgClass = isIncome
      ? "bg-blue-50 hover:bg-blue-100/80 border-blue-100"
      : "bg-rose-50 hover:bg-rose-100/80 border-rose-100";
    const textClass = isIncome ? "text-blue-700" : "text-rose-600";
    const prefix = isIncome ? "+" : "-";

    return (
      <div className={`flex flex-col flex-1 gap-1 px-4 py-2.5 rounded-xl border ${bgClass} transition-all duration-200`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? "bg-blue-500" : "bg-rose-500"}`}></span>
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-sm font-bold ${textClass} tabular-nums`}>
          {prefix}
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(Math.abs(Number(value)))}
        </span>
      </div>
    );
  }

  // Card sub-stat indicators inside Monthly Report Card
  const labelColor = "text-slate-400";
  const valueColor = isIncome
    ? "text-blue-600 font-bold"
    : isExpense
    ? "text-rose-500 font-bold"
    : "text-emerald-500 font-bold";

  return (
    <div className="flex flex-col gap-1">
      <span className={`text-[13px] font-medium ${labelColor}`}>{label}</span>
      <span className={`text-lg sm:text-xl font-bold tracking-tight ${valueColor} tabular-nums`}>
        {new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(Number(value))}
      </span>
    </div>
  );
}
