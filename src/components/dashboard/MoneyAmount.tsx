"use client";

import React from "react";

export function formatCurrency(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) return "0\u00a0\u20ab";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

type MoneyAmountProps = {
  value: number | string;
  className?: string;
  isMasked?: boolean;
  type?: "INCOME" | "EXPENSE" | "NEUTRAL";
};

export function MoneyAmount({
  value,
  className = "",
  isMasked = false,
  type = "NEUTRAL",
}: MoneyAmountProps) {
  if (isMasked) {
    return <span className={className}>••••••</span>;
  }

  const formatted = formatCurrency(value);
  const colorClass =
    type === "INCOME"
      ? "text-emerald-600"
      : type === "EXPENSE"
      ? "text-rose-500"
      : "";

  return (
    <span className={`${colorClass} ${className} tabular-nums`}>
      {formatted}
    </span>
  );
}
