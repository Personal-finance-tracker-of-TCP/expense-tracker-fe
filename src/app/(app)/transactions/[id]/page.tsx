"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  FileText,
  Hash,
  Loader2,
  ReceiptText,
  Tags,
} from "lucide-react";

import { formatCurrencyVND, getSourceBadgeStyle, getTransactionTypeStyle } from "@/lib/finance";
import { authFetch } from "@/lib/moneytrack-api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
};

type TransactionDetail = {
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

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 ring-1 ring-slate-100">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
          <div className="mt-1 break-words text-sm font-bold text-slate-900">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTransaction() {
      setLoading(true);
      setError(null);

      try {
        const data = await authFetch<TransactionDetail>(
          `/api/transactions/${transactionId}`
        );
        if (isMounted) setTransaction(data);
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải chi tiết giao dịch"
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (transactionId) {
      loadTransaction();
    }

    return () => {
      isMounted = false;
    };
  }, [transactionId]);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[420px] max-w-4xl items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white px-8 py-10 text-slate-500 shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold">Đang tải chi tiết giao dịch...</p>
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
          className="mb-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
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
  const categoryLabel = transaction.category
    ? `${transaction.category.icon ? `${transaction.category.icon} ` : ""}${transaction.category.name}`
    : "Chưa phân loại";

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <button
        type="button"
        onClick={() => router.push("/transactions")}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </button>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
                {transaction.note || "Giao dịch không có ghi chú"}
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
                  {transaction.source}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold uppercase text-slate-400">Amount</p>
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
          label="Type"
          value={isIncome ? "INCOME" : "EXPENSE"}
          icon={<ReceiptText className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Source"
          value={transaction.source}
          icon={<Hash className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Category"
          value={categoryLabel}
          icon={<Tags className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Transaction date"
          value={formatDateTime(transaction.transactionDate)}
          icon={<CalendarDays className="h-4.5 w-4.5" />}
        />
        <DetailRow
          label="Note / content"
          value={transaction.note || "-"}
          icon={<FileText className="h-4.5 w-4.5" />}
        />
        {transaction.source === "SEPAY" ? (
          <DetailRow
            label="SePay ID"
            value={transaction.sepayId || "-"}
            icon={<Hash className="h-4.5 w-4.5" />}
          />
        ) : null}
      </section>
    </main>
  );
}
