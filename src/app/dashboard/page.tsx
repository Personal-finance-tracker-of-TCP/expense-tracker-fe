"use client";

import { useEffect, useState } from "react";
import { getCurrentDemoPeriod } from "@/lib/moneytrack-api";
import {
  fetchDashboardSummary,
  fetchRecentTransactions,
  fetchBudgetProgress,
  fetchSepayLogs,
  getDevMockUser,
} from "@/lib/dashboard-service";

// Modular Dashboard Components
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MonthlyReportCard } from "@/components/dashboard/MonthlyReportCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { BudgetOverviewCard } from "@/components/dashboard/BudgetOverviewCard";
import { RecentTransactionsCard } from "@/components/dashboard/RecentTransactionsCard";
import { SepaySyncCard } from "@/components/dashboard/SepaySyncCard";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

type UserInfo = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  balance?: number | string;
  sepayCode?: string | null;
  bankAccountNumber?: string | null;
  avatarUrl?: string | null;
};

type Summary = {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [sepayLogs, setSepayLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMasked, setIsMasked] = useState(false);

  // Load balance masking preferences and user storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const maskedPref = localStorage.getItem("balance_masked");
      if (maskedPref === "true") {
        setIsMasked(true);
      }

      try {
        const rawUser = localStorage.getItem("user");
        let parsedUser: UserInfo | null = null;
        if (rawUser) {
          parsedUser = JSON.parse(rawUser);
        }

        // If in development mode and fields are missing or empty, merge with mockup user
        if (process.env.NODE_ENV === "development") {
          const devMockUser = getDevMockUser();
          if (devMockUser) {
            parsedUser = {
              ...devMockUser,
              ...parsedUser,
              // If user is logged in, preserve their name and actual balance if present
              name: parsedUser?.name || devMockUser.name,
              balance: parsedUser?.balance !== undefined ? parsedUser.balance : devMockUser.balance,
              sepayCode: parsedUser?.sepayCode || devMockUser.sepayCode,
              bankAccountNumber: parsedUser?.bankAccountNumber || devMockUser.bankAccountNumber,
            };
          }
        }
        setUser(parsedUser);
      } catch (err) {
        console.error("Error reading stored user:", err);
      }
    }
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        // Read user role to see if they can query real sepay logs
        let isAdmin = false;
        if (typeof window !== "undefined") {
          try {
            const rawUser = localStorage.getItem("user");
            if (rawUser) {
              const u = JSON.parse(rawUser);
              isAdmin = u.role === "ADMIN";
            }
          } catch (e) { }
        }

        const [summaryData, transactionsData, budgetsData, logsData] = await Promise.all([
          fetchDashboardSummary(DEFAULT_MONTH, DEFAULT_YEAR),
          fetchRecentTransactions(DEFAULT_MONTH, DEFAULT_YEAR),
          fetchBudgetProgress(DEFAULT_MONTH, DEFAULT_YEAR),
          fetchSepayLogs(isAdmin),
        ]);

        if (!active) return;

        setSummary(summaryData);
        setTransactions(transactionsData);
        setBudgets(budgetsData);
        setSepayLogs(logsData);
      } catch (err) {
        if (active) {
          console.error("Failed to load dashboard data:", err);
          setError("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại kết nối.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Handle balance visibility toggle
  const handleToggleMask = () => {
    setIsMasked((prev) => {
      const newVal = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("balance_masked", String(newVal));
      }
      return newVal;
    });
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-2 py-4">
        <DashboardSkeleton />
      </main>
    );
  }

  // Fallbacks if stats are null
  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const currentBalance = user?.balance !== undefined ? Number(user.balance) : (totalIncome - totalExpense);

  // Update user balance dynamically if it's not set in local storage
  const displayUser = user ? { ...user, balance: currentBalance } : null;

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-1 py-3 sm:px-2">
      {/* Error banner */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => window.location.reload()}
            className="text-xs underline font-bold text-red-800 hover:text-red-900 ml-4 shrink-0"
          >
            Tải lại trang
          </button>
        </div>
      )}

      {/* Dashboard Top Header Balance Hero */}
      <DashboardHeader
        user={displayUser}
        isMasked={isMasked}
        onToggleMask={handleToggleMask}
      />

      {/* 2 Column Responsive Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - 8/12 width on Large Screens */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Monthly area chart card */}
          <MonthlyReportCard
            transactions={transactions}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            month={DEFAULT_MONTH}
            year={DEFAULT_YEAR}
          />

          {/* Recent transactions card */}
          <RecentTransactionsCard transactions={transactions} />
        </div>

        {/* Right Column - 4/12 width on Large Screens */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Wallet Balance Summary Card */}
          <WalletCard
            balance={currentBalance}
            bankAccountNumber={user?.bankAccountNumber || null}
            sepayCode={user?.sepayCode || null}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            isMasked={isMasked}
          />

          {/* Budget Progress Card */}
          <BudgetOverviewCard budgets={budgets} />

          {/* SePay Sync Logs Card */}
          <SepaySyncCard
            sepayCode={user?.sepayCode || null}
            bankAccountNumber={user?.bankAccountNumber || null}
            logs={sepayLogs}
          />
        </div>
      </div>
    </main>
  );
}
