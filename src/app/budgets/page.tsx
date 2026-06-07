"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PlusCircle, RefreshCcw, WalletCards } from "lucide-react";

import {
  formatCurrencyVND,
  getBudgetStatusStyle,
  getPercentWidth,
} from "@/lib/finance";
import { authFetch, getCurrentDemoPeriod } from "@/lib/moneytrack-api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  type?: "INCOME" | "EXPENSE" | "BOTH";
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
  period: "MONTHLY" | "TOTAL";
  month?: number | null;
  year: number;
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

export default function BudgetsPage() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("1000000");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === "EXPENSE" || category.type === "BOTH"
      ),
    [categories]
  );

  const visibleBudgets = useMemo(
    () =>
      budgets.filter(
        (budget) =>
          budget.period === "MONTHLY" &&
          Number(budget.month) === Number(month) &&
          Number(budget.year) === Number(year)
      ),
    [budgets, month, year]
  );

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [budgetData, categoryData] = await Promise.all([
        authFetch<Budget[]>(`/api/budgets?month=${month}&year=${year}`),
        authFetch<Category[]>("/api/categories"),
      ]);

      setBudgets(budgetData || []);
      setCategories(categoryData || []);
      setCategoryId((current) => current || categoryData?.[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load budgets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  async function handleCreateBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice(null);
    setError(null);

    try {
      await authFetch<Budget>("/api/budgets", {
        method: "POST",
        body: JSON.stringify({
          categoryId,
          limitAmount: Number(limitAmount),
          period: "MONTHLY",
          month,
          year,
        }),
      });

      setNotice("Budget created. Progress is recalculated from transactions.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot create budget");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Budget control
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Budgets
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Watch SePay classifications flow into monthly spending
                envelopes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="h-10 w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                aria-label="Month"
              />
              <input
                type="number"
                min={2000}
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="h-10 w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                aria-label="Year"
              />
              <button
                type="button"
                onClick={loadData}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm md:col-span-2">
                Loading budgets...
              </div>
            ) : visibleBudgets.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm md:col-span-2">
                No budgets for this month yet.
              </div>
            ) : (
              visibleBudgets.map((budget) => (
                <article
                  key={budget.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold">
                        {budget.category?.icon || "•"}{" "}
                        {budget.category?.name || "Budget"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {month}/{year} monthly envelope
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${getBudgetStatusStyle(
                        budget.status
                      )}`}
                    >
                      {budget.status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Used</span>
                      <span className="font-semibold tabular-nums">
                        {Number(budget.percentUsed).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={
                          budget.status === "EXCEEDED"
                            ? "h-full rounded-full bg-red-500"
                            : budget.status === "WARNING"
                              ? "h-full rounded-full bg-amber-500"
                              : "h-full rounded-full bg-emerald-500"
                        }
                        style={{ width: getPercentWidth(budget.percentUsed) }}
                      />
                    </div>
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Limit</dt>
                      <dd className="mt-1 font-semibold tabular-nums">
                        {formatCurrencyVND(budget.limitAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Spent</dt>
                      <dd className="mt-1 font-semibold tabular-nums text-red-700">
                        {formatCurrencyVND(budget.spentAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Left</dt>
                      <dd className="mt-1 font-semibold tabular-nums text-emerald-700">
                        {formatCurrencyVND(budget.remainingAmount)}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>

          <form
            onSubmit={handleCreateBudget}
            className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-50 p-2 text-blue-700 ring-1 ring-blue-100">
                <WalletCards className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-semibold">Create budget</h2>
                <p className="text-sm text-slate-500">Monthly expense limit</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Category
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                  required
                >
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon ? `${category.icon} ` : ""}
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Limit amount
                <input
                  type="number"
                  min={1}
                  value={limitAmount}
                  onChange={(event) => setLimitAmount(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                  required
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Month
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={month}
                    onChange={(event) => setMonth(Number(event.target.value))}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Year
                  <input
                    type="number"
                    min={2000}
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                    required
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !categoryId}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircle className="h-4 w-4" />
              {submitting ? "Creating..." : "Create budget"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
