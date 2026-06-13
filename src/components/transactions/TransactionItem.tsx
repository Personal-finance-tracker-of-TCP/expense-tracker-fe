"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Ban,
  Car,
  CheckCircle2,
  HelpCircle,
  Landmark,
  RefreshCw,
  Tags,
} from "lucide-react";
import { formatCurrency } from "@/components/dashboard/MoneyAmount";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
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

type TransactionItemProps = {
  transaction: Transaction;
  onClassify: (tx: Transaction) => void;
  onExclude: (tx: Transaction) => void;
};

function getStatus(transaction: Transaction): ClassificationStatus {
  if (transaction.classificationStatus) return transaction.classificationStatus;
  return transaction.categoryId ? "CLASSIFIED" : "UNCLASSIFIED";
}

export function TransactionItem({
  transaction,
  onClassify,
  onExclude,
}: TransactionItemProps) {
  const router = useRouter();
  const isIncome = transaction.type === "INCOME";
  const status = getStatus(transaction);
  const isUnclassified = status === "UNCLASSIFIED";
  const isExcluded = status === "EXCLUDED";
  const noteText = transaction.note || "Không có ghi chú";
  const categoryName = isExcluded
    ? "Đã bỏ qua"
    : transaction.category?.name || "Chưa phân loại";
  const categoryIcon = transaction.category?.icon || "?";
  const isSePay = transaction.source === "SEPAY";

  const renderIcon = () => {
    if (isExcluded) {
      return <Ban className="h-4.5 w-4.5 text-slate-500" />;
    }

    if (categoryIcon && categoryIcon !== "?") {
      const isEmoji = /\p{Emoji}/u.test(categoryIcon);

      if (isEmoji || categoryIcon.length <= 2) {
        return <span className="text-lg">{categoryIcon}</span>;
      }
    }

    const name = categoryName.toLowerCase();

    if (name.includes("lương") || name.includes("thu nhập")) {
      return <Landmark className="h-4.5 w-4.5 text-blue-500" />;
    }

    if (name.includes("ăn") || name.includes("uống") || name.includes("bữa")) {
      return <span className="text-base">🍴</span>;
    }

    if (
      name.includes("chuyển") ||
      name.includes("xe") ||
      name.includes("grab")
    ) {
      return <Car className="h-4.5 w-4.5 text-slate-500" />;
    }

    if (name.includes("hoàn tiền") || name.includes("refund")) {
      return <RefreshCw className="h-4.5 w-4.5 text-emerald-500" />;
    }

    if (isUnclassified) {
      return <HelpCircle className="h-4.5 w-4.5 text-amber-500" />;
    }

    return <ArrowLeftRight className="h-4.5 w-4.5 text-slate-400" />;
  };

  const statusBadge =
    status === "UNCLASSIFIED"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : status === "EXCLUDED"
        ? "border-slate-200 bg-slate-100 text-slate-500"
        : "border-emerald-100 bg-emerald-50 text-emerald-600";

  const statusLabel =
    status === "UNCLASSIFIED"
      ? "Cần phân loại"
      : status === "EXCLUDED"
        ? "Đã bỏ qua"
        : "Đã phân loại";

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/transactions/${transaction.id}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(`/transactions/${transaction.id}`);
        }
      }}
      className={`flex cursor-pointer flex-col items-start justify-between gap-4 rounded-2xl border p-4 outline-none transition-all duration-200 focus:ring-4 focus:ring-emerald-500/15 sm:flex-row sm:items-center ${
        isUnclassified
          ? "border-amber-200/80 bg-amber-50/20 hover:bg-amber-50/40"
          : isExcluded
            ? "border-slate-200 bg-slate-50/80 hover:bg-slate-100/70"
            : "border-slate-100 bg-white hover:bg-slate-50/30"
      }`}
      aria-label={`Xem chi tiết giao dịch ${noteText}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-sm ${
            isUnclassified
              ? "border-amber-200 bg-amber-50"
              : isExcluded
                ? "border-slate-200 bg-white"
                : "border-slate-200/60 bg-slate-50"
          }`}
        >
          {renderIcon()}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-bold leading-snug text-slate-800">
              {noteText}
            </p>

            {isSePay ? (
              <span
                className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${statusBadge}`}
              >
                {statusLabel}
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-semibold text-slate-400">
            <span
              className={isUnclassified ? "font-bold text-amber-600/80" : ""}
            >
              {categoryName}
            </span>

            {transaction.sepayId ? (
              <span className="font-mono text-[10px] font-medium text-slate-300">
                - {transaction.sepayId}
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-3 border-t border-slate-100/60 pt-3 sm:w-auto sm:min-w-[360px] sm:flex-row sm:items-center sm:justify-end sm:border-0 sm:pt-0">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-lg border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
              isIncome
                ? "border-blue-100 bg-blue-50 text-blue-600"
                : "border-rose-100/70 bg-rose-50/50 text-rose-500"
            }`}
          >
            {isIncome ? "Thu" : "Chi"}
          </span>

          <span
            className={`rounded-lg border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
              isSePay
                ? "border-indigo-100 bg-indigo-50 text-indigo-600"
                : "border-slate-200/80 bg-slate-50 text-slate-500"
            }`}
          >
            {transaction.source}
          </span>
        </div>

        <div className="text-left sm:min-w-[120px] sm:text-right">
          <p
            className={`text-sm font-extrabold tabular-nums ${
              isIncome ? "text-blue-600" : "text-rose-500"
            }`}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(Number(transaction.amount))}
          </p>
        </div>

        <div className="flex w-full flex-col items-start gap-2 sm:w-[150px] sm:items-end">
          {isUnclassified ? (
            <>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onClassify(transaction);
                }}
                type="button"
                className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold leading-4 text-white shadow-sm transition-colors duration-150 hover:bg-slate-800 active:scale-95 sm:w-auto"
              >
                <Tags className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-normal text-center">
                  Phân loại
                </span>
              </button>

              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onExclude(transaction);
                }}
                type="button"
                className="inline-flex min-h-8 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold leading-4 text-slate-600 transition-colors duration-150 hover:bg-slate-50 active:scale-95 sm:w-auto"
              >
                <Ban className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-normal text-center">Bỏ qua</span>
              </button>
            </>
          ) : (
            <span
              className={`inline-flex min-h-8 max-w-[140px] items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-center text-xs font-bold leading-4 whitespace-normal ${statusBadge}`}
            >
              {isExcluded ? (
                <Ban className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              )}

              <span className="break-words">{statusLabel}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}