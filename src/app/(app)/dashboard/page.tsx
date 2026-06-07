// src/app/(app)/dashboard/page.tsx
import { serverFetch } from "@/lib/serverApi";
import { redirect } from "next/navigation";
import type { SummaryData, ChartMonth, Transaction, Budget } from "@/types/dashboard";

import SummaryCards from "./_components/SummaryCards";
import SpendingChart from "./_components/SpendingChart";
import RecentTransactions from "./_components/RecentTransactions";
import BudgetProgress from "./_components/BudgetProgress";

export default async function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let summary: SummaryData;
  let chart: { data: ChartMonth[] };
  let txRes: { data: Transaction[] };
  let budgets: { data: Budget[] };

  try {
    [summary, chart, txRes, budgets] = await Promise.all([
      serverFetch<SummaryData>(`/api/reports/summary?month=${month}&year=${year}`),
      serverFetch<{ data: ChartMonth[] }>(`/api/reports/chart?year=${year}`),
      serverFetch<{ data: Transaction[] }>(
        `/api/transactions?month=${month}&year=${year}&page=1&limit=5`
      ),
      serverFetch<{ data: Budget[] }>(`/api/budgets`),
    ]);
  } catch {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground text-sm">Tháng {month}/{year}</p>
      </div>
      <SummaryCards data={summary} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendingChart data={chart.data} />
        </div>
        <BudgetProgress budgets={budgets.data} />
      </div>
      <RecentTransactions transactions={txRes.data} />
    </div>
  );
}