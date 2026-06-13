"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { TransactionsFilterBar } from "@/components/transactions/TransactionsFilterBar";
import { formatCurrencyVND, formatDate } from "@/lib/finance";
import { authFetch, getCurrentDemoPeriod, toNumber } from "@/lib/moneytrack-api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type?: "INCOME" | "EXPENSE" | "BOTH";
};

type ClassificationStatus = "UNCLASSIFIED" | "CLASSIFIED" | "EXCLUDED";

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  note?: string | null;
  source: "MANUAL" | "SEPAY";
  classificationStatus?: ClassificationStatus;
  categoryId?: string | null;
  category?: Category | null;
  sepayId?: string | null;
  transactionDate: string;
};

type TransactionResponse = {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type TransactionPayload = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  categoryId: string;
  note?: string;
  transactionDate: string;
};

const { month: DEMO_MONTH, year: DEMO_YEAR } = getCurrentDemoPeriod();
const DEFAULT_MONTH = `${DEMO_YEAR}-${String(DEMO_MONTH).padStart(2, "0")}`;

function categoryMatchesType(category: Category, type: "INCOME" | "EXPENSE") {
  return !category.type || category.type === "BOTH" || category.type === type;
}

function getStatus(transaction: Transaction): ClassificationStatus {
  if (transaction.classificationStatus) return transaction.classificationStatus;
  return transaction.categoryId ? "CLASSIFIED" : "UNCLASSIFIED";
}

function toInputDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toApiDate(value: string) {
  return new Date(`${value}T00:00:00`).toISOString();
}

function monthParts(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  return { year, month };
}

function buildAvailableMonths() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(DEMO_YEAR, DEMO_MONTH - 1 - index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/88 p-5 shadow-lg shadow-teal-950/[0.05] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tone}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-xs font-black text-teal-700">{helper}</p>
    </section>
  );
}

function TransactionFormModal({
  isOpen,
  categories,
  transaction,
  submitting,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  categories: Category[];
  transaction: Transaction | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: TransactionPayload) => Promise<void>;
}) {
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toInputDate());

  const availableCategories = useMemo(
    () => categories.filter((category) => categoryMatchesType(category, type)),
    [categories, type]
  );

  useEffect(() => {
    if (!isOpen) return;

    const nextType = transaction?.type ?? "EXPENSE";
    const nextCategoryId =
      transaction?.categoryId ||
      categories.find((category) => categoryMatchesType(category, nextType))?.id ||
      "";

    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setType(nextType);
      setAmount(transaction ? String(toNumber(transaction.amount)) : "");
      setCategoryId(nextCategoryId);
      setNote(transaction?.note ?? "");
      setDate(toInputDate(transaction?.transactionDate));
    });

    return () => {
      active = false;
    };
  }, [categories, isOpen, transaction]);

  useEffect(() => {
    let active = true;

    if (!availableCategories.length) {
      queueMicrotask(() => {
        if (active) setCategoryId("");
      });
      return () => {
        active = false;
      };
    }

    if (!availableCategories.some((category) => category.id === categoryId)) {
      const nextCategoryId = availableCategories[0].id;
      queueMicrotask(() => {
        if (active) setCategoryId(nextCategoryId);
      });
    }

    return () => {
      active = false;
    };
  }, [availableCategories, categoryId]);

  async function submitCurrentForm() {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.warning("Số tiền phải lớn hơn 0.");
      return;
    }

    if (!categoryId) {
      toast.warning("Vui lòng chọn danh mục phù hợp.");
      return;
    }

    await onSubmit({
      type,
      amount: numericAmount,
      categoryId,
      note: note.trim() || undefined,
      transactionDate: toApiDate(date),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitCurrentForm();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng form giao dịch"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              {transaction ? "Sửa giao dịch" : "Thêm giao dịch"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Dữ liệu sẽ được lưu vào backend và cập nhật số dư thật.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            {(["EXPENSE", "INCOME"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`h-10 rounded-xl text-sm font-black transition ${
                  type === option
                    ? option === "INCOME"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-rose-600 text-white shadow-sm"
                    : "text-slate-500 hover:bg-white"
                }`}
              >
                {option === "INCOME" ? "Thu nhập" : "Chi tiêu"}
              </button>
            ))}
          </div>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase text-slate-400">Số tiền</span>
            <input
              type="number"
              min="1"
              step="1000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Ví dụ: 85000"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase text-slate-400">Danh mục</span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            >
              {availableCategories.length === 0 ? (
                <option value="">Chưa có danh mục phù hợp</option>
              ) : (
                availableCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon ? `${category.icon} ` : ""}
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase text-slate-400">Ngày giao dịch</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase text-slate-400">Ghi chú</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={255}
              rows={3}
              className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Nội dung giao dịch..."
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submitCurrentForm}
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {transaction ? "Lưu thay đổi" : "Tạo giao dịch"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ClassifyModal({
  transaction,
  categories,
  submitting,
  onClose,
  onSubmit,
}: {
  transaction: Transaction | null;
  categories: Category[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (categoryId: string, note?: string) => Promise<void>;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  const availableCategories = useMemo(() => {
    if (!transaction) return [];
    return categories.filter((category) => categoryMatchesType(category, transaction.type));
  }, [categories, transaction]);

  useEffect(() => {
    if (!transaction) return;
    const nextCategoryId = availableCategories[0]?.id ?? "";
    const nextNote = transaction.note ?? "";
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setCategoryId(nextCategoryId);
      setNote(nextNote);
    });

    return () => {
      active = false;
    };
  }, [availableCategories, transaction]);

  if (!transaction) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryId) {
      toast.warning("Vui lòng chọn danh mục.");
      return;
    }
    await onSubmit(categoryId, note.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Đóng phân loại"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">Phân loại giao dịch</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Chọn danh mục đúng loại để backend cập nhật trạng thái.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          >
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ""}
                {category.name}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            maxLength={255}
            className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            placeholder="Ghi chú bổ sung..."
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tags className="h-4 w-4" />}
            Phân loại
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paginationTotal, setPaginationTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "MANUAL" | "SEPAY">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState(DEFAULT_MONTH);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [classifyTarget, setClassifyTarget] = useState<Transaction | null>(null);

  const availableMonths = useMemo(() => buildAvailableMonths(), []);

  const loadTransactions = useCallback(async () => {
    const { month, year } = monthParts(monthFilter);
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
      limit: "100",
      page: "1",
    });

    if (typeFilter !== "ALL") params.set("type", typeFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (categoryFilter === "UNCLASSIFIED" || categoryFilter === "EXCLUDED") {
      params.set("classificationStatus", categoryFilter);
    } else if (categoryFilter !== "ALL") {
      params.set("categoryId", categoryFilter);
    }

    const data = await authFetch<TransactionResponse>(`/api/transactions?${params.toString()}`);
    setTransactions(data.transactions || []);
    setPaginationTotal(data.pagination?.total || 0);
  }, [categoryFilter, monthFilter, searchQuery, typeFilter]);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoryData] = await Promise.all([
        authFetch<Category[]>("/api/categories"),
        loadTransactions(),
      ]);
      setCategories(categoryData);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải dữ liệu giao dịch"));
    } finally {
      setLoading(false);
    }
  }, [loadTransactions]);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadPageData();
      }
    });

    return () => {
      active = false;
    };
  }, [loadPageData]);

  const visibleTransactions = useMemo(() => {
    if (sourceFilter === "ALL") return transactions;
    return transactions.filter((transaction) => transaction.source === sourceFilter);
  }, [sourceFilter, transactions]);

  const summary = useMemo(() => {
    return visibleTransactions.reduce(
      (acc, transaction) => {
        const status = getStatus(transaction);
        if (status === "EXCLUDED") {
          acc.excluded += 1;
          return acc;
        }

        if (status === "UNCLASSIFIED") {
          acc.unclassified += 1;
        }

        const amount = toNumber(transaction.amount);
        if (transaction.type === "INCOME") {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        return acc;
      },
      { income: 0, expense: 0, unclassified: 0, excluded: 0 }
    );
  }, [visibleTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    visibleTransactions.forEach((transaction) => {
      const key = toInputDate(transaction.transactionDate);
      groups.set(key, [...(groups.get(key) || []), transaction]);
    });
    return Array.from(groups.entries());
  }, [visibleTransactions]);

  async function handleSubmitTransaction(payload: TransactionPayload) {
    setSubmitting(true);
    try {
      if (editTransaction) {
        await authFetch(`/api/transactions/${editTransaction.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Đã cập nhật giao dịch.");
      } else {
        await authFetch("/api/transactions", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Đã tạo giao dịch.");
      }

      setFormOpen(false);
      setEditTransaction(null);
      await loadTransactions();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể lưu giao dịch"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(transaction: Transaction) {
    if (!window.confirm(`Xóa giao dịch "${transaction.note || transaction.id}"?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await authFetch(`/api/transactions/${transaction.id}`, { method: "DELETE" });
      toast.success("Đã xóa giao dịch.");
      await loadTransactions();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa giao dịch"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExclude(transaction: Transaction) {
    setSubmitting(true);
    try {
      await authFetch(`/api/transactions/${transaction.id}/exclude`, {
        method: "PATCH",
      });
      toast.success("Đã bỏ qua giao dịch.");
      await loadTransactions();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể bỏ qua giao dịch"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClassify(categoryId: string, note?: string) {
    if (!classifyTarget) return;

    setSubmitting(true);
    try {
      await authFetch(`/api/transactions/${classifyTarget.id}/classify`, {
        method: "PATCH",
        body: JSON.stringify({ categoryId, note }),
      });
      toast.success("Đã phân loại giao dịch.");
      setClassifyTarget(null);
      await loadTransactions();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể phân loại giao dịch"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[420px] max-w-7xl items-center justify-center">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Đang tải giao dịch từ backend...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h1 className="text-lg font-black text-slate-950">Không tải được giao dịch</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => loadPageData()}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
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
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tổng thu"
          value={formatCurrencyVND(summary.income)}
          helper="Tính từ giao dịch đang hiển thị"
          icon={ArrowDownLeft}
          tone="from-emerald-500 to-teal-500"
        />
        <MetricCard
          label="Tổng chi"
          value={formatCurrencyVND(summary.expense)}
          helper="Không tính giao dịch đã bỏ qua"
          icon={ArrowUpRight}
          tone="from-rose-500 to-orange-500"
        />
        <MetricCard
          label="Giao dịch"
          value={String(visibleTransactions.length)}
          helper={`${paginationTotal} kết quả từ backend`}
          icon={ArrowLeftRight}
          tone="from-sky-500 to-cyan-500"
        />
        <MetricCard
          label="Chờ phân loại"
          value={String(summary.unclassified)}
          helper={`${summary.excluded} giao dịch đã bỏ qua`}
          icon={Tags}
          tone="from-amber-400 to-orange-500"
        />
      </div>

      <section className="rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-xl shadow-teal-950/[0.06] backdrop-blur sm:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Danh sách giao dịch</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Gọi trực tiếp `/api/transactions` và lưu thay đổi vào database.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditTransaction(null);
              setFormOpen(true);
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Thêm giao dịch
          </button>
        </div>

        <TransactionsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          monthFilter={monthFilter}
          onMonthFilterChange={setMonthFilter}
          unclassifiedCount={summary.unclassified}
          categories={categories}
          availableMonths={availableMonths}
        />

        <div className="mt-6 space-y-6">
          {groupedTransactions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
              <p className="text-sm font-black text-slate-700">Không có giao dịch phù hợp.</p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Thử đổi bộ lọc hoặc thêm giao dịch thủ công mới.
              </p>
            </div>
          ) : (
            groupedTransactions.map(([dateKey, items]) => (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-sm font-black text-slate-900">{formatDate(dateKey)}</h2>
                  <span className="text-xs font-bold text-slate-400">{items.length} giao dịch</span>
                </div>
                <div className="space-y-3">
                  {items.map((transaction) => {
                    const isIncome = transaction.type === "INCOME";
                    const status = getStatus(transaction);
                    const isManual = transaction.source === "MANUAL";
                    const categoryName =
                      status === "EXCLUDED"
                        ? "Đã bỏ qua"
                        : transaction.category?.name || "Chưa phân loại";
                    const categoryIcon = transaction.category?.icon || (status === "UNCLASSIFIED" ? "?" : "•");

                    return (
                      <article
                        key={transaction.id}
                        className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-teal-100 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg ${
                              status === "UNCLASSIFIED"
                                ? "border-amber-200 bg-amber-50 text-amber-600"
                                : status === "EXCLUDED"
                                  ? "border-slate-200 bg-slate-100 text-slate-500"
                                  : "border-slate-200 bg-slate-50"
                            }`}
                          >
                            {status === "EXCLUDED" ? <Ban className="h-4 w-4" /> : categoryIcon}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">
                              {transaction.note || "Giao dịch không có ghi chú"}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                              <span>{categoryName}</span>
                              <span className={isIncome ? "text-emerald-600" : "text-rose-600"}>
                                {isIncome ? "Thu nhập" : "Chi tiêu"}
                              </span>
                              <span>{transaction.source}</span>
                              {transaction.sepayId ? <span>#{transaction.sepayId}</span> : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                          <p
                            className={`min-w-[130px] text-left text-sm font-black tabular-nums sm:text-right ${
                              isIncome ? "text-emerald-600" : "text-rose-600"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatCurrencyVND(transaction.amount)}
                          </p>
                          <span
                            className={`inline-flex h-8 items-center gap-1 rounded-xl border px-3 text-xs font-black ${
                              status === "CLASSIFIED"
                                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                : status === "EXCLUDED"
                                  ? "border-slate-200 bg-slate-100 text-slate-500"
                                  : "border-amber-100 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {status === "CLASSIFIED" ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : status === "EXCLUDED" ? (
                              <Ban className="h-3.5 w-3.5" />
                            ) : (
                              <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            {status === "CLASSIFIED"
                              ? "Đã phân loại"
                              : status === "EXCLUDED"
                                ? "Đã bỏ qua"
                                : "Cần phân loại"}
                          </span>

                          <div className="flex items-center gap-1">
                            <Link
                              href={`/transactions/${transaction.id}`}
                              className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                              Chi tiết
                            </Link>
                            {status === "UNCLASSIFIED" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setClassifyTarget(transaction)}
                                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white transition hover:bg-slate-800"
                                >
                                  <Tags className="h-3.5 w-3.5" />
                                  Phân loại
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExclude(transaction)}
                                  disabled={submitting}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
                                  title="Bỏ qua"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              </>
                            ) : null}
                            {isManual ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditTransaction(transaction);
                                    setFormOpen(true);
                                  }}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                                  title="Sửa"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(transaction)}
                                  disabled={submitting}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
                                  title="Xóa"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <TransactionFormModal
        isOpen={formOpen}
        categories={categories}
        transaction={editTransaction}
        submitting={submitting}
        onClose={() => {
          setFormOpen(false);
          setEditTransaction(null);
        }}
        onSubmit={handleSubmitTransaction}
      />

      <ClassifyModal
        transaction={classifyTarget}
        categories={categories}
        submitting={submitting}
        onClose={() => setClassifyTarget(null)}
        onSubmit={handleClassify}
      />
    </div>
  );
}
