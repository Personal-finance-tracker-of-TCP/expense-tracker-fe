"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { BudgetOverviewCard } from "@/components/dashboard/BudgetOverviewCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { MonthlyReportCard } from "@/components/dashboard/MonthlyReportCard";
import { RecentTransactionsCard } from "@/components/dashboard/RecentTransactionsCard";
import { SepaySyncCard } from "@/components/dashboard/SepaySyncCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import {
  type DashboardBudgetProgress,
  type DashboardSepayLog,
  type DashboardTransaction,
  type DashboardUser,
  fetchBudgetProgress,
  fetchCurrentUser,
  fetchDashboardSummary,
  fetchRecentTransactions,
  fetchSepayLogs,
  updateCurrentUserBalance,
} from "@/lib/dashboard-service";
import { getCurrentDemoPeriod } from "@/lib/moneytrack-api";

type DashboardSummary = {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
};

const { month: DEMO_MONTH, year: DEMO_YEAR } = getCurrentDemoPeriod();

export default function DashboardPage() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalIncome: 0,
    totalExpense: 0,
    savings: 0,
    savingsRate: 0,
  });
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [budgets, setBudgets] = useState<DashboardBudgetProgress[]>([]);
  const [sepayLogs, setSepayLogs] = useState<DashboardSepayLog[]>([]);
  const [isMasked, setIsMasked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const currentUser = await fetchCurrentUser();
      const [summaryData, transactionData, budgetData, logData] = await Promise.all([
        fetchDashboardSummary(DEMO_MONTH, DEMO_YEAR),
        fetchRecentTransactions(DEMO_MONTH, DEMO_YEAR),
        fetchBudgetProgress(DEMO_MONTH, DEMO_YEAR),
        fetchSepayLogs(currentUser.role === "ADMIN"),
      ]);

      setUser(currentUser);
      setSummary(summaryData);
      setTransactions(transactionData);
      setBudgets(
        budgetData.filter((budget) => {
          const maybeMonth = (budget as DashboardBudgetProgress & { month?: number | null }).month;
          const maybeYear = (budget as DashboardBudgetProgress & { year?: number | null }).year;
          if (!maybeYear) return true;
          if (!maybeMonth) return maybeYear === DEMO_YEAR;
          return maybeMonth === DEMO_MONTH && maybeYear === DEMO_YEAR;
        })
      );
      setSepayLogs(logData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải dữ liệu dashboard từ backend"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadDashboard();
      }
    });

    return () => {
      active = false;
    };
  }, [loadDashboard]);

  async function handleUpdateBalance(balance: number) {
    setSavingBalance(true);
    try {
      const updatedUser = await updateCurrentUserBalance(balance);
      setUser(updatedUser);
    } finally {
      setSavingBalance(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[420px] max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black text-slate-950">
                Dashboard chưa tải được dữ liệu thật
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => loadDashboard()}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <DashboardHeader
        user={user}
        isMasked={isMasked}
        onToggleMask={() => setIsMasked((value) => !value)}
        isRefreshing={refreshing}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <MonthlyReportCard
            transactions={transactions}
            totalIncome={summary.totalIncome}
            totalExpense={summary.totalExpense}
            month={DEMO_MONTH}
            year={DEMO_YEAR}
          />
          <RecentTransactionsCard transactions={transactions} />
        </div>

        <div className="space-y-6 lg:col-span-4">
          <WalletCard
            balance={user?.balance ?? 0}
            bankAccountNumber={user?.bankAccountNumber ?? null}
            sepayCode={user?.sepayCode ?? null}
            totalIncome={summary.totalIncome}
            totalExpense={summary.totalExpense}
            isMasked={isMasked}
            isSaving={savingBalance}
            onUpdateBalance={handleUpdateBalance}
          />
          <BudgetOverviewCard budgets={budgets} />
          <SepaySyncCard
            sepayCode={user?.sepayCode ?? null}
            bankAccountNumber={user?.bankAccountNumber ?? null}
            sepayLinkedAt={user?.sepayLinkedAt ?? null}
            logs={sepayLogs}
          />
        </div>
      </div>
    </div>
  );
}
