// src/app/(app)/dashboard/page.tsx
import { serverFetch } from "@/lib/serverApi";
import type {
  SummaryData,
  ChartData,
  TransactionListResponse,
  Budget,
} from "@/types/dashboard";

import SummaryCards from "./_components/SummaryCards";
import SpendingChart from "./_components/SpendingChart";
import RecentTransactions from "./_components/RecentTransactions";
import BudgetProgress from "./_components/BudgetProgress";

export default async function DashboardPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Budget chưa có BE → dùng Promise.allSettled để không crash cả page
  const [summaryRes, chartRes, txRes, budgetRes] = await Promise.allSettled([
    serverFetch<{ success: boolean; data: SummaryData }>(
      `/api/reports/summary?month=${month}&year=${year}`
    ),
    serverFetch<{ success: boolean; data: ChartData }>(
      `/api/reports/chart?year=${year}`
    ),
    serverFetch<{ success: boolean; data: TransactionListResponse }>(
      `/api/transactions?month=${month}&year=${year}&page=1&limit=5`
    ),
    serverFetch<{ success: boolean; data: Budget[] }>(`/api/budgets`),
  ]);

  const summary =
    summaryRes.status === "fulfilled" ? summaryRes.value.data : null;
  const chart =
    chartRes.status === "fulfilled" ? chartRes.value.data : null;
  const transactions =
    txRes.status === "fulfilled" ? txRes.value.data.transactions : [];
  const budgets =
    budgetRes.status === "fulfilled" ? budgetRes.value.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground text-sm">
          Tháng {month}/{year}
        </p>
      </div>

      {summary && <SummaryCards data={summary} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {chart && <SpendingChart data={chart.chartData} />}
        </div>
        <BudgetProgress budgets={budgets} />
      </div>

      <RecentTransactions transactions={transactions} />
    </div>
  );
}