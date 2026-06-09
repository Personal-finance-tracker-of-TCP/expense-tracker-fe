"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { getCurrentDemoPeriod } from "@/lib/moneytrack-api";
import {
  fetchBudgetProgress,
  fetchCurrentUser,
  fetchDashboardSummary,
  fetchRecentTransactions,
  fetchSepayLogs,
  updateCurrentUserBalance,
  type DashboardUser,
} from "@/lib/dashboard-service";
import { useAuthStore } from "@/store/authStore";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MonthlyReportCard } from "@/components/dashboard/MonthlyReportCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { BudgetOverviewCard } from "@/components/dashboard/BudgetOverviewCard";
import { RecentTransactionsCard } from "@/components/dashboard/RecentTransactionsCard";
import { SepaySyncCard } from "@/components/dashboard/SepaySyncCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

type Summary = {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

export default function DashboardPage() {
  const updateStoredUser = useAuthStore((state) => state.updateUser);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [sepayLogs, setSepayLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingBalance, setSavingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMasked, setIsMasked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsMasked(localStorage.getItem("balance_masked") === "true");
  }, []);

  const persistUser = useCallback(
    (nextUser: DashboardUser) => {
      setUser(nextUser);
      updateStoredUser(nextUser);

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(nextUser));
      }
    },
    [updateStoredUser]
  );

  const loadDashboardData = useCallback(
    async (options?: { silent?: boolean }) => {
      if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const currentUser = await fetchCurrentUser();
        const isAdmin = currentUser.role === "ADMIN";

        const [summaryData, transactionsData, budgetsData, logsData] =
          await Promise.all([
            fetchDashboardSummary(DEFAULT_MONTH, DEFAULT_YEAR),
            fetchRecentTransactions(DEFAULT_MONTH, DEFAULT_YEAR),
            fetchBudgetProgress(DEFAULT_MONTH, DEFAULT_YEAR),
            fetchSepayLogs(isAdmin),
          ]);

        persistUser(currentUser);
        setSummary(summaryData);
        setTransactions(transactionsData);
        setBudgets(budgetsData);
        setSepayLogs(logsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải dữ liệu Dashboard. Vui lòng thử lại."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [persistUser]
  );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadDashboardData({ silent: true });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [loadDashboardData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadDashboardData({ silent: true });
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadDashboardData]);

  const handleToggleMask = () => {
    setIsMasked((prev) => {
      const newVal = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("balance_masked", String(newVal));
      }
      return newVal;
    });
  };

  const handleUpdateBalance = async (balance: number) => {
    setSavingBalance(true);
    try {
      const updatedUser = await updateCurrentUserBalance(balance);
      persistUser(updatedUser);
      toast.success("Đã cập nhật số dư ví chính.");
      await loadDashboardData({ silent: true });
    } finally {
      setSavingBalance(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-2 py-4">
        <DashboardSkeleton />
      </main>
    );
  }

  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const currentBalance = Number(user?.balance) || 0;

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-1 py-3 sm:px-2">
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-sm">
          <span>{error}</span>
          <button
            onClick={() => loadDashboardData()}
            className="ml-4 shrink-0 text-xs font-bold text-red-800 underline hover:text-red-900"
          >
            Tải lại
          </button>
        </div>
      )}

      <DashboardHeader
        user={user}
        isMasked={isMasked}
        onToggleMask={handleToggleMask}
        isRefreshing={refreshing}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <MonthlyReportCard
            transactions={transactions}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            month={DEFAULT_MONTH}
            year={DEFAULT_YEAR}
          />

          <RecentTransactionsCard transactions={transactions} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <WalletCard
            balance={currentBalance}
            bankAccountNumber={user?.bankAccountNumber || null}
            sepayCode={user?.sepayCode || null}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            isMasked={isMasked}
            isSaving={savingBalance}
            onUpdateBalance={handleUpdateBalance}
          />

          <BudgetOverviewCard budgets={budgets} />

          <SepaySyncCard
            sepayCode={user?.sepayCode || null}
            bankAccountNumber={user?.bankAccountNumber || null}
            sepayLinkedAt={user?.sepayLinkedAt || null}
            logs={sepayLogs}
          />
        </div>
      </div>
    </main>
  );
}
