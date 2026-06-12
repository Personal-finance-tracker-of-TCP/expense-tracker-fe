"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatPill } from "./StatPill";
import { EmptyState } from "./EmptyState";
import { TrendingUp } from "lucide-react";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  transactionDate: string;
};

type MonthlyReportCardProps = {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  month: number;
  year: number;
};

export function MonthlyReportCard({
  transactions,
  totalIncome,
  totalExpense,
  month,
  year,
}: MonthlyReportCardProps) {
  const savings = totalIncome - totalExpense;

  // Process data for the line/area chart (daily cumulative sum for the month)
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      return {
        day,
        dayStr: `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}`,
        income: 0,
        expense: 0,
      };
    });

    // Populate daily amounts
    transactions.forEach((tx) => {
      const date = new Date(tx.transactionDate);
      if (date.getMonth() + 1 === month && date.getFullYear() === year) {
        const day = date.getDate();
        if (day >= 1 && day <= daysInMonth) {
          const val = Number(tx.amount) || 0;
          if (tx.type === "INCOME") {
            dailyData[day - 1].income += val;
          } else {
            dailyData[day - 1].expense += val;
          }
        }
      }
    });

    // Calculate cumulative sums for smooth rising curves matching the mockup
    let cumIncome = 0;
    let cumExpense = 0;

    return dailyData.map((d) => {
      cumIncome += d.income;
      cumExpense += d.expense;
      return {
        name: d.dayStr,
        day: d.day,
        "Thu nhập": cumIncome,
        "Chi tiêu": cumExpense,
      };
    });
  }, [transactions, month, year]);

  const hasData = transactions.length > 0;

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-100 bg-white/95 p-3.5 shadow-xl backdrop-blur-sm text-xs font-semibold space-y-1.5">
          <p className="text-slate-500 font-bold mb-1 border-b border-slate-100 pb-1">Ngày {payload[0].payload.name}</p>
          <p className="text-blue-600 flex items-center justify-between gap-4">
            <span>Thu nhập:</span>
            <span className="font-extrabold tabular-nums">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(payload[0].value)}
            </span>
          </p>
          <p className="text-rose-500 flex items-center justify-between gap-4">
            <span>Chi tiêu:</span>
            <span className="font-extrabold tabular-nums">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(payload[1].value)}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-800 text-base">Báo cáo tháng này</h2>
        <Link
          href="/reports"
          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
        >
          Xem báo cáo
        </Link>
      </div>

      {/* Grid of indicators */}
      <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
        <StatPill label="Tổng đã chi" value={totalExpense} type="EXPENSE" />
        <StatPill label="Tổng thu" value={totalIncome} type="INCOME" />
        <StatPill label="Tiết kiệm" value={savings} type="SAVING" />
      </div>

      {/* Chart container */}
      <div className="h-[220px] w-full mt-2">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                stroke="#94A3B8"
                fontSize={10}
                fontWeight={500}
                tickFormatter={(value, index) => {
                  // Only show label for 01, 15, and end of month
                  if (value.startsWith("01") || value.startsWith("15") || index === chartData.length - 1) {
                    return value;
                  }
                  return "";
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                stroke="#94A3B8"
                fontSize={10}
                fontWeight={500}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}Tr`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                  return value;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Thu nhập"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorIncome)"
              />
              <Area
                type="monotone"
                dataKey="Chi tiêu"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            title="Chưa có dữ liệu giao dịch"
            description="Hãy ghi lại thu chi đầu tiên của tháng này để xem biểu đồ báo cáo chi tiết."
            icon={<TrendingUp className="h-6 w-6 text-slate-400" />}
          />
        )}
      </div>

      {/* Chart Legend */}
      {hasData && (
        <div className="flex gap-4 items-center justify-start text-[11px] font-semibold text-slate-500 pl-4 border-t border-slate-50 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-full bg-blue-500"></span>
            <span>Thu nhập</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>Chi tiêu</span>
          </div>
        </div>
      )}
    </section>
  );
}
