"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCcw, Tags, X } from "lucide-react";

import {
  formatCurrencyVND,
  formatDate,
  getSourceBadgeStyle,
  getTransactionTypeStyle,
} from "@/lib/finance";
import { authFetch, getCurrentDemoPeriod, toNumber } from "@/lib/moneytrack-api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  type?: "INCOME" | "EXPENSE" | "BOTH";
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

type TransactionResult = {
  transactions: Transaction[];
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === "EXPENSE" || category.type === "BOTH"
      ),
    [categories]
  );

  const unclassifiedCount = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.source === "SEPAY" && !transaction.categoryId
      ).length,
    [transactions]
  );

  async function loadTransactions() {
    const result = await authFetch<TransactionResult>(
      `/api/transactions?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}&limit=100`
    );
    setTransactions(result.transactions || []);
  }

  async function loadBudgetsForSync() {
    await authFetch(`/api/budgets?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`);
  }

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [transactionResult, categoryData] = await Promise.all([
        authFetch<TransactionResult>(
          `/api/transactions?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}&limit=100`
        ),
        authFetch<Category[]>("/api/categories"),
      ]);

      setTransactions(transactionResult.transactions || []);
      setCategories(categoryData || []);
      setSelectedCategoryId((current) => current || categoryData?.[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function openClassifyModal(transaction: Transaction) {
    setSelectedTransaction(transaction);
    setSelectedCategoryId(expenseCategories[0]?.id || "");
    setNotice(null);
    setError(null);
  }

  async function handleClassify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTransaction || !selectedCategoryId) {
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      await authFetch<Transaction>(`/api/transactions/${selectedTransaction.id}`, {
        method: "PUT",
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          type: "EXPENSE",
          amount: toNumber(selectedTransaction.amount),
          note: selectedTransaction.note || "",
          transactionDate: selectedTransaction.transactionDate,
        }),
      });

      await Promise.all([loadTransactions(), loadBudgetsForSync()]);
      setSelectedTransaction(null);
      setNotice("Transaction classified. Budgets have been refreshed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot classify transaction");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Ledger review
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Transactions
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Classify incoming SePay rows so expense budgets can update.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                {unclassifiedCount} Chưa phân loại
              </span>
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

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[1fr_120px_150px_140px_160px] gap-4 border-b border-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-400 lg:grid">
            <span>Transaction</span>
            <span>Type</span>
            <span>Source</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Action</span>
          </div>

          {loading ? (
            <div className="p-5 text-sm text-slate-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">
              No transactions found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((transaction) => {
                const isUnclassifiedSepay =
                  transaction.source === "SEPAY" && !transaction.categoryId;

                return (
                  <article
                    key={transaction.id}
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_120px_150px_140px_160px] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">
                          {transaction.note || "No note"}
                        </p>
                        {isUnclassifiedSepay ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                            Chưa phân loại
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(transaction.transactionDate)} ·{" "}
                        {transaction.category?.icon || "•"}{" "}
                        {transaction.category?.name || "Chưa phân loại"}
                        {transaction.sepayId ? ` · ${transaction.sepayId}` : ""}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getTransactionTypeStyle(
                          transaction.type
                        )}`}
                      >
                        {transaction.type}
                      </span>
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getSourceBadgeStyle(
                          transaction.source
                        )}`}
                      >
                        {transaction.source}
                      </span>
                    </div>

                    <p
                      className={`font-bold tabular-nums lg:text-right ${
                        transaction.type === "INCOME"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatCurrencyVND(transaction.amount)}
                    </p>

                    <div className="lg:text-right">
                      {isUnclassifiedSepay ? (
                        <button
                          type="button"
                          onClick={() => openClassifyModal(transaction)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Tags className="h-4 w-4" />
                          Phân loại
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" />
                          Classified
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {selectedTransaction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form
            onSubmit={handleClassify}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Phân loại SePay</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assign this bank transfer to an expense category.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm">
              <p className="font-semibold">
                {selectedTransaction.note || "SePay transaction"}
              </p>
              <p className="mt-1 text-slate-500">
                {formatCurrencyVND(selectedTransaction.amount)} ·{" "}
                {formatDate(selectedTransaction.transactionDate)}
              </p>
            </div>

            <label className="mt-5 block text-sm font-medium text-slate-700">
              Expense category
              <select
                value={selectedCategoryId}
                onChange={(event) => setSelectedCategoryId(event.target.value)}
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

            <button
              type="submit"
              disabled={syncing || !selectedCategoryId}
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? "Classifying..." : "Save classification"}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
