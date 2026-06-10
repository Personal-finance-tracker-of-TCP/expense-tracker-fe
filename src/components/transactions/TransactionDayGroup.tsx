"use client";

import React, { useMemo } from "react";
import { TransactionItem } from "./TransactionItem";
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

type TransactionDayGroupProps = {
  dateStr: string;
  transactions: Transaction[];
  onClassify: (tx: Transaction) => void;
};

export function TransactionDayGroup({
  dateStr,
  transactions,
  onClassify,
}: TransactionDayGroupProps) {
  // Calculate daily net sum (INCOME - EXPENSE)
  const dailyNetSum = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === "INCOME") {
        return acc + amount;
      } else {
        return acc - amount;
      }
    }, 0);
  }, [transactions]);

  // Format date parts
  const dateParts = useMemo(() => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, "0");
      
      const weekdays = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
      ];
      const weekday = weekdays[date.getDay()];
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      return {
        day,
        subtitle: `${weekday}`,
        monthYear: `tháng ${month} ${year}`,
      };
    } catch {
      return {
        day: "--",
        subtitle: "Không xác định",
        monthYear: "",
      };
    }
  }, [dateStr]);

  const isPositive = dailyNetSum >= 0;

  return (
    <div className="space-y-3.5">
      {/* Date Header Box */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        {/* Left Side: Day Number + Weekday Info */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold text-slate-800 leading-none tracking-tight">
            {dateParts.day}
          </span>
          <div className="text-left">
            <p className="text-xs font-extrabold text-slate-800 leading-tight">
              {dateParts.subtitle}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 leading-none">
              {dateParts.monthYear}
            </p>
          </div>
        </div>

        {/* Right Side: Net amount of the day */}
        <div className="text-right">
          <span
            className={`text-xs font-extrabold tabular-nums ${
              isPositive ? "text-blue-600" : "text-rose-500"
            }`}
          >
            {isPositive ? "+" : "-"}
            {formatCurrency(Math.abs(dailyNetSum))}
          </span>
        </div>
      </div>

      {/* Transactions List of Day */}
      <div className="space-y-3">
        {transactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            transaction={tx}
            onClassify={onClassify}
          />
        ))}
      </div>
    </div>
  );
}
