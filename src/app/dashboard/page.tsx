"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  ReceiptText,
  Wallet,
} from "lucide-react";

import {
  formatCurrencyVND,
  formatDate,
  getBudgetStatusStyle,
  getPercentWidth,
  getSourceBadgeStyle,
  getTransactionTypeStyle,
} from "@/lib/finance";
import { authFetch, getCurrentDemoPeriod, toNumber } from "@/lib/moneytrack-api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
};

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  note?: string | null;
  source: "MANUAL" | "SEPAY";
  categoryId?: string | null;
  category?: Category | null;
  transactionDate: string;
};

type Budget = {
  id: string;
  categoryId: string;
  category?: Category | null;
  limitAmount: number | string;
  spentAmount: number | string;
  remainingAmount: number | string;
  percentUsed: number | string;
  status: "SAFE" | "WARNING" | "EXCEEDED";
  month?: number | null;
  year: number;
  period: string;
};

type TransactionResult = {
  transactions: Transaction[];
};

type Summary = {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
};

type StoredUser = {
  name?: string;
  email?: string;
  balance?: number | string;
  sepayCode?: string;
  bankAccountNumber?: string;
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

function loadStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
}

function getDisplaySePayVA(user: StoredUser | null) {
  if (user?.bankAccountNumber) {
    return user.bankAccountNumber;
  }

  if (user?.email === "user@moneytrack.local") {
    return "970400000001";
  }

  return null;
}

function OverviewCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  tone: "blue" | "green" | "red" | "amber";
  icon: typeof Wallet;
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`rounded-full p-2 ring-1 ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-bold tabular-nums text-slate-950">
        {value}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthlyBudgets = useMemo(
    () =>
      budgets.filter(
        (budget) =>
          budget.period === "MONTHLY" &&
          Number(budget.month) === DEFAULT_MONTH &&
          Number(budget.year) === DEFAULT_YEAR
      ),
    [budgets]
  );

  const unclassifiedSepay = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.source === "SEPAY" && !transaction.categoryId
      ),
    [transactions]
  );

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [summaryData, transactionData, budgetData] = await Promise.all([
          authFetch<Summary>(
            `/api/reports/summary?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`
          ),
          authFetch<TransactionResult>(
            `/api/transactions?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}&limit=100`
          ),
          authFetch<Budget[]>(
            `/api/budgets?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`
          ),
        ]);

        if (ignore) {
          return;
        }

        setUser(loadStoredUser());
        setSummary(summaryData);
        setTransactions(transactionData.transactions || []);
        setBudgets(budgetData || []);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Cannot load dashboard");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const currentBalance = toNumber(user?.balance);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              MoneyTrack cockpit
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Follow the June 2026 demo flow from SePay intake to budget impact.
              {user?.sepayCode ? ` SePay Code: ${user.sepayCode}.` : ""}
              {getDisplaySePayVA(user)
                ? ` SePay VA: ${getDisplaySePayVA(user)}.`
                : ""}
            </p>
          </div>
          <Link
            href="/transactions"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Review transactions
          </Link>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <OverviewCard
            label="Current balance"
            value={formatCurrencyVND(currentBalance)}
            tone="blue"
            icon={Wallet}
          />
          <OverviewCard
            label="Monthly income"
            value={formatCurrencyVND(summary?.totalIncome)}
            tone="green"
            icon={ArrowDownLeft}
          />
          <OverviewCard
            label="Monthly expense"
            value={formatCurrencyVND(summary?.totalExpense)}
            tone="red"
            icon={ArrowUpRight}
          />
          <OverviewCard
            label="Savings"
            value={formatCurrencyVND(summary?.savings)}
            tone="green"
            icon={PiggyBank}
          />
          <OverviewCard
            label="Unclassified SePay"
            value={loading ? "..." : String(unclassifiedSepay.length)}
            tone="amber"
            icon={AlertCircle}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold">Recent transactions</h2>
                <p className="text-sm text-slate-500">
                  Latest activity in the selected demo month.
                </p>
              </div>
              <ReceiptText className="h-5 w-5 text-slate-400" />
            </div>

            <div className="divide-y divide-slate-100">
              {loading ? (
                <p className="p-5 text-sm text-slate-500">Loading...</p>
              ) : transactions.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">
                  No transactions for this period.
                </p>
              ) : (
                transactions.slice(0, 8).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">
                          {transaction.note || "Untitled transaction"}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getSourceBadgeStyle(
                            transaction.source
                          )}`}
                        >
                          {transaction.source}
                        </span>
                        {!transaction.categoryId ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Chua phan loai
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(transaction.transactionDate)} ·{" "}
                        {transaction.category?.icon || "·"}{" "}
                        {transaction.category?.name || "Unclassified"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold tabular-nums ${
                          transaction.type === "INCOME"
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}
                        {formatCurrencyVND(transaction.amount)}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getTransactionTypeStyle(
                          transaction.type
                        )}`}
                      >
                        {transaction.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-semibold">Budget progress</h2>
                <p className="text-sm text-slate-500">
                  Current month spending envelopes.
                </p>
              </div>
              <Landmark className="h-5 w-5 text-slate-400" />
            </div>

            <div className="space-y-4 p-5">
              {loading ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : monthlyBudgets.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No monthly budgets yet. Create one in Budgets.
                </p>
              ) : (
                monthlyBudgets.slice(0, 5).map((budget) => (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold">
                        {budget.category?.icon || "•"}{" "}
                        {budget.category?.name || "Budget"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getBudgetStatusStyle(
                          budget.status
                        )}`}
                      >
                        {budget.status}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: getPercentWidth(budget.percentUsed) }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{formatCurrencyVND(budget.spentAmount)} spent</span>
                      <span>{Number(budget.percentUsed).toFixed(0)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
