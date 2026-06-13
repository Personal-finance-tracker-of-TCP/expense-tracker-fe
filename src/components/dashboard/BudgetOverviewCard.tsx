"use client";

import React from "react";
import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { EmptyState } from "./EmptyState";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
};

type BudgetProgress = {
  id: string;
  categoryId: string;
  category?: Category | null;
  limitAmount: number | string;
  spentAmount: number | string;
  percentUsed: number | string;
};

type BudgetOverviewCardProps = {
  budgets: BudgetProgress[];
};

export function BudgetOverviewCard({ budgets }: BudgetOverviewCardProps) {
  const hasBudgets = budgets.length > 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-800 text-base">Ngân sách</h2>
        <Link
          href="/budgets"
          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
        >
          Xem tất cả
        </Link>
      </div>

      {/* Body List */}
      <div className="space-y-5 border-t border-slate-100 pt-4">
        {hasBudgets ? (
          budgets.slice(0, 3).map((budget) => {
            const limit = Number(budget.limitAmount) || 0;
            const spent = Number(budget.spentAmount) || 0;
            const percent = Number(budget.percentUsed) || 0;
            const categoryName = budget.category?.name || "Ngân sách";
            const categoryIcon = budget.category?.icon || "💰";

            // Status mapping
            let statusText = "Ổn định";
            let badgeClass = "bg-emerald-50 text-emerald-600 border-emerald-100";
            let progressColor = "bg-blue-500"; // Blue for safe like mockup

            if (percent >= 100) {
              statusText = "Đã vượt";
              badgeClass = "bg-rose-50 text-rose-600 border-rose-100";
              progressColor = "bg-rose-500";
            } else if (percent >= 80) {
              statusText = "Sắp vượt";
              badgeClass = "bg-amber-50 text-amber-600 border-amber-100";
              progressColor = "bg-amber-500";
            }

            return (
              <div key={budget.id} className="space-y-2.5">
                {/* Category & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0">{categoryIcon}</span>
                    <span className="text-sm font-bold text-slate-800">
                      {categoryName}
                    </span>
                  </div>
                  <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${badgeClass}`}>
                    {statusText}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  ></div>
                </div>

                {/* Numbers */}
                <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                  <span className="tabular-nums font-bold text-slate-600">
                    {new Intl.NumberFormat("vi-VN").format(spent)} đ
                  </span>
                  <span className="tabular-nums font-bold">
                    {new Intl.NumberFormat("vi-VN").format(limit)} đ
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="Chưa lập ngân sách"
            description="Hãy tạo kế hoạch ngân sách cho các danh mục chi tiêu để tránh chi tiêu quá mức."
            icon={<PiggyBank className="h-6 w-6 text-slate-400" />}
          />
        )}
      </div>
    </section>
  );
}
