import { cn } from "@/lib/utils";

export function formatCurrencyVND(amount: unknown) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function getBudgetStatusStyle(status: string | undefined) {
  return cn(
    "border",
    status === "EXCEEDED" &&
      "border-red-200 bg-red-50 text-red-700 ring-red-100",
    status === "WARNING" &&
      "border-amber-200 bg-amber-50 text-amber-700 ring-amber-100",
    (!status || status === "SAFE") &&
      "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100"
  );
}

export function getTransactionTypeStyle(type: string | undefined) {
  return cn(
    "border",
    type === "INCOME"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700"
  );
}

export function getSourceBadgeStyle(source: string | undefined) {
  return cn(
    "border",
    source === "SEPAY"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-slate-200 bg-slate-50 text-slate-600"
  );
}

export function getPercentWidth(percent: unknown) {
  return `${Math.min(Math.max(Number(percent) || 0, 0), 100)}%`;
}
