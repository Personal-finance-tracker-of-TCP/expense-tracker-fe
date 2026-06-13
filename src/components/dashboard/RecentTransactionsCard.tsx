"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { TransactionItem } from "./TransactionItem";
import { EmptyState } from "./EmptyState";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
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

type RecentTransactionsCardProps = {
  transactions: Transaction[];
};

export function RecentTransactionsCard({
  transactions,
}: RecentTransactionsCardProps) {
  const hasTransactions = transactions && transactions.length > 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-800 text-base">Giao dịch gần đây</h2>
        <Link
          href="/transactions"
          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
        >
          Xem tất cả
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 border-t border-slate-100 pt-1">
        {hasTransactions ? (
          transactions
            .slice(0, 5)
            .map((tx) => <TransactionItem key={tx.id} transaction={tx} />)
        ) : (
          <EmptyState
            title="Chưa có giao dịch nào"
            description="Hãy ghi chép các hoạt động thu chi của bạn để bắt đầu quản lý dòng tiền."
            icon={<ArrowLeftRight className="h-6 w-6 text-slate-400" />}
          />
        )}
      </div>
    </section>
  );
}
