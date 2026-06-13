"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  CalendarDays,
  FileText,
  Hash,
  Loader2,
  ReceiptText,
  Tags,
  Trash2,
} from "lucide-react";

import {
  formatCurrencyVND,
  getSourceBadgeStyle,
  getTransactionTypeStyle,
} from "@/lib/finance";
import { authFetch } from "@/lib/moneytrack-api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  type?: "INCOME" | "EXPENSE" | "BOTH";
};

type ClassificationStatus = "UNCLASSIFIED" | "CLASSIFIED" | "EXCLUDED";

type TransactionDetail = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  note?: string | null;
  description?: string | null;
  source: "MANUAL" | "SEPAY";
  classificationStatus?: ClassificationStatus | null;
  categoryId?: string | null;
  category?: Category | null;
  sepayId?: string | null;
  transactionDate?: string | null;
  date?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getStatus(transaction: TransactionDetail): ClassificationStatus {
  if (transaction.classificationStatus) return transaction.classificationStatus;
  return transaction.categoryId ? "CLASSIFIED" : "UNCLASSIFIED";
}

function getStatusLabel(status: ClassificationStatus) {
  if (status === "CLASSIFIED") return "Đã phân loại";
  if (status === "EXCLUDED") return "Đã bỏ qua";
  return "Chưa phân loại";
}

function getSourceLabel(source: TransactionDetail["source"]) {
  return source === "SEPAY" ? "SePay" : "Thủ công";
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-400">
            {label}
          </p>
          <div className="mt-1 break-words text-sm font-bold text-slate-900 dark:text-white">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const transactionId = params.id;
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [classifyCategoryId, setClassifyCategoryId] = useState("");
  const [isClassifyOpen, setIsClassifyOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [excluding, setExcluding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransaction = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [transactionData, categoryData] = await Promise.all([
        authFetch<TransactionDetail>(`/api/transactions/${transactionId}`),
        authFetch<Category[]>("/api/categories"),
      ]);
      setTransaction(transactionData);
      setCategories(categoryData || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải chi tiết giao dịch"
      );
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    if (!transactionId) return;

    const timer = window.setTimeout(() => {
      void loadTransaction();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTransaction, transactionId]);

  const classifyCategories = useMemo(() => {
    if (!transaction) return [];

    return categories.filter(
      (category) => category.type === transaction.type || category.type === "BOTH"
    );
  }, [categories, transaction]);

  function openClassifyModal() {
    if (!transaction) return;

    const nextCategoryId =
      transaction.categoryId || classifyCategories[0]?.id || "";
    setClassifyCategoryId(nextCategoryId);
    setIsClassifyOpen(true);
  }

  async function handleClassifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!transaction || !classifyCategoryId) return;

    setClassifying(true);
    try {
      const updated = await authFetch<TransactionDetail>(
        `/api/transactions/${transaction.id}/classify`,
        {
          method: "PATCH",
          body: JSON.stringify({ categoryId: classifyCategoryId }),
        }
      );
      setTransaction(updated);
      setIsClassifyOpen(false);
      toast.success("Đã phân loại giao dịch.");
    } catch {
      toast.error("Không thể phân loại giao dịch. Vui lòng thử lại.");
    } finally {
      setClassifying(false);
    }
  }

  async function handleExclude() {
    if (!transaction) return;

    setExcluding(true);
    try {
      const updated = await authFetch<TransactionDetail>(
        `/api/transactions/${transaction.id}/exclude`,
        { method: "PATCH" }
      );
      setTransaction(updated);
      toast.success("Đã bỏ qua giao dịch.");
    } catch {
      toast.error("Không thể bỏ qua giao dịch. Vui lòng thử lại.");
    } finally {
      setExcluding(false);
    }
  }

  async function handleDelete() {
    if (!transaction) return;

    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa giao dịch này không? Hành động này không thể hoàn tác."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await authFetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa giao dịch.");
      router.push("/transactions");
    } catch {
      toast.error("Không thể xóa giao dịch. Vui lòng thử lại.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[420px] max-w-4xl items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-10 text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold">
            Đang tải chi tiết giao dịch...
          </p>
        </div>
      </main>
    );
  }

  if (error || !transaction) {
    return (
      <main className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => router.push("/transactions")}
          className="mb-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error || "Không tìm thấy giao dịch"}
          </div>
        </div>
      </main>
    );
  }

  const isIncome = transaction.type === "INCOME";
  const status = getStatus(transaction);
  const isUnclassified = status === "UNCLASSIFIED";
  const canExclude = transaction.source === "SEPAY" && isUnclassified;
  const content = transaction.note || transaction.description || "Giao dịch";
  const categoryLabel = transaction.category
    ? `${transaction.category.icon ? `${transaction.category.icon} ` : ""}${transaction.category.name}`
    : "Chưa phân loại";

  return (
    <main className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/transactions")}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        <div className="flex flex-wrap gap-2">
          {isUnclassified ? (
            <button
              type="button"
              onClick={openClassifyModal}
              disabled={classifyCategories.length === 0 || deleting}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Tags className="h-4 w-4" />
              Phân loại
            </button>
          ) : null}

          {canExclude ? (
            <button
              type="button"
              onClick={() => void handleExclude()}
              disabled={excluding || deleting}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              {excluding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
              {excluding ? "Đang bỏ qua..." : "Bỏ qua"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting || excluding || classifying}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/70 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {deleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                isIncome
                  ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                  : "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
              }`}
            >
              <ReceiptText className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Chi tiết giao dịch
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {content}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-extrabold uppercase ${getTransactionTypeStyle(
                    transaction.type
                  )}`}
                >
                  {isIncome ? "Thu nhập" : "Chi tiêu"}
                </span>
                <span
                  className={`rounded-lg px-2.5 py-1 text-xs font-extrabold uppercase ${getSourceBadgeStyle(
                    transaction.source
                  )}`}
                >
                  {getSourceLabel(transaction.source)}
                </span>
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-extrabold uppercase text-amber-700">
                  {getStatusLabel(status)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Số tiền
            </p>
            <p
              className={`mt-1 text-3xl font-extrabold tabular-nums ${
                isIncome ? "text-blue-600" : "text-rose-600"
              }`}
            >
              {isIncome ? "+" : "-"}
              {formatCurrencyVND(transaction.amount)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <DetailRow
          label="Nội dung / ghi chú"
          value={transaction.note || "-"}
          icon={<FileText className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Số tiền"
          value={`${isIncome ? "+" : "-"}${formatCurrencyVND(transaction.amount)}`}
          icon={<ReceiptText className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Loại"
          value={isIncome ? "Thu nhập" : "Chi tiêu"}
          icon={<ReceiptText className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Danh mục"
          value={categoryLabel}
          icon={<Tags className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Nguồn"
          value={getSourceLabel(transaction.source)}
          icon={<Hash className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Trạng thái phân loại"
          value={getStatusLabel(status)}
          icon={<Ban className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Ngày giao dịch"
          value={formatDateTime(transaction.transactionDate ?? transaction.date)}
          icon={<CalendarDays className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Ngày tạo"
          value={formatDateTime(transaction.createdAt)}
          icon={<CalendarDays className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Ngày cập nhật"
          value={formatDateTime(transaction.updatedAt)}
          icon={<CalendarDays className="h-4.5 w-4.5" />}
        />
        {transaction.description ? (
          <DetailRow
            label="Mô tả"
            value={transaction.description}
            icon={<FileText className="h-4.5 w-4.5" />}
          />
        ) : null}
      </section>

      {isClassifyOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleClassifySubmit}
            className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="border-b border-teal-100 pb-4 dark:border-slate-700">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                Phân loại giao dịch
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-300">
                Chọn danh mục phù hợp để đưa giao dịch vào báo cáo.
              </p>
            </div>

            <label className="mt-5 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Danh mục
              <select
                value={classifyCategoryId}
                onChange={(event) => setClassifyCategoryId(event.target.value)}
                required
                className="mt-2 h-12 w-full rounded-full border border-teal-100 px-5 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {classifyCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsClassifyOpen(false)}
                className="h-11 rounded-full border border-teal-100 px-5 text-sm font-black text-slate-600 hover:bg-teal-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={classifying || classifyCategories.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {classifying ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Lưu phân loại
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
