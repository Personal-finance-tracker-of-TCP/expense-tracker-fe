"use client";

import React from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { StatPill } from "./StatPill";
import { formatCurrency } from "./MoneyAmount";

type WalletCardProps = {
  balance: number | string;
  bankAccountNumber: string | null;
  sepayCode: string | null;
  totalIncome: number;
  totalExpense: number;
  isMasked: boolean;
};

export function WalletCard({
  balance,
  bankAccountNumber,
  sepayCode,
  totalIncome,
  totalExpense,
  isMasked,
}: WalletCardProps) {
  // Format bank account: mask all but the last 4 digits
  const formatBankAccount = (accountStr: string | null) => {
    if (!accountStr) return "";
    const cleanStr = accountStr.trim();
    if (cleanStr.length <= 4) return cleanStr;
    return `****${cleanStr.slice(-4)}`;
  };

  const maskedBank = bankAccountNumber ? formatBankAccount(bankAccountNumber) : "";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-800 text-base">Ví của tôi</h2>
        <Link
          href="/transactions"
          className="text-xs font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
        >
          Xem tất cả
        </Link>
      </div>

      {/* Wallet Body */}
      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        {/* Wallet Icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Wallet className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-bold text-slate-800">Ví chính</span>
            {maskedBank && (
              <span className="text-[11px] font-medium text-slate-400">
                {maskedBank}
              </span>
            )}
            {sepayCode && (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 border border-emerald-100">
                SePay
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-semibold text-emerald-600">
              Đã liên kết
            </span>
          </div>
        </div>

        {/* Balance */}
        <div className="text-right">
          <p className="text-base font-extrabold text-slate-800 tabular-nums">
            {isMasked ? "••••••" : formatCurrency(Number(balance))}
          </p>
        </div>
      </div>

      {/* Wallet Mini Summary Pills */}
      <div className="flex gap-3 pt-2">
        <StatPill
          label="Tổng thu"
          value={totalIncome}
          type="INCOME"
          variant="pill"
        />
        <StatPill
          label="Tổng chi"
          value={totalExpense}
          type="EXPENSE"
          variant="pill"
        />
      </div>
    </section>
  );
}
