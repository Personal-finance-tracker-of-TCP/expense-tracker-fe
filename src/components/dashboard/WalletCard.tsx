"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Edit3, Loader2, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import { StatPill } from "./StatPill";
import { formatCurrency } from "./MoneyAmount";

type WalletCardProps = {
  balance: number | string;
  bankAccountNumber: string | null;
  sepayCode: string | null;
  totalIncome: number;
  totalExpense: number;
  isMasked: boolean;
  isSaving?: boolean;
  onUpdateBalance?: (balance: number) => Promise<void>;
};

export function WalletCard({
  balance,
  bankAccountNumber,
  sepayCode,
  totalIncome,
  totalExpense,
  isMasked,
  isSaving = false,
  onUpdateBalance,
}: WalletCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftBalance, setDraftBalance] = useState(String(Number(balance) || 0));

  useEffect(() => {
    if (!isEditing) {
      setDraftBalance(String(Number(balance) || 0));
    }
  }, [balance, isEditing]);

  const formatBankAccount = (accountStr: string | null) => {
    if (!accountStr) return "";
    const cleanStr = accountStr.trim();
    if (cleanStr.length <= 4) return cleanStr;
    return `****${cleanStr.slice(-4)}`;
  };

  const maskedBank = bankAccountNumber ? formatBankAccount(bankAccountNumber) : "";
  const hasSandboxLink = Boolean(bankAccountNumber);

  const handleSave = async () => {
    const nextBalance = Number(draftBalance);

    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      toast.warning("Số dư phải là số lớn hơn hoặc bằng 0.");
      return;
    }

    try {
      await onUpdateBalance?.(nextBalance);
      setIsEditing(false);
    } catch {
      toast.error("Không thể cập nhật số dư. Vui lòng thử lại.");
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">Ví của tôi</h2>
        <Link
          href="/transactions"
          className="text-xs font-bold text-emerald-600 transition-colors hover:text-emerald-700"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
          <Wallet className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-bold text-slate-800">Ví chính</span>
            {maskedBank && (
              <span className="text-[11px] font-medium text-slate-400">
                {maskedBank}
              </span>
            )}
            {hasSandboxLink && sepayCode && (
              <span className="rounded-md border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
                Sandbox
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasSandboxLink ? "bg-emerald-500" : "bg-slate-300"
              }`}
            />
            <span
              className={`text-[10px] font-semibold ${
                hasSandboxLink ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {hasSandboxLink ? "Đã liên kết sandbox" : "Chưa liên kết sandbox"}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <p className="text-base font-extrabold tabular-nums text-slate-800">
              {isMasked ? "••••••" : formatCurrency(Number(balance))}
            </p>
            {onUpdateBalance ? (
              <button
                type="button"
                onClick={() => setIsEditing((value) => !value)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                aria-label="Chỉnh sửa số dư"
                title="Chỉnh sửa số dư"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {isEditing ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
          <label
            htmlFor="wallet-balance"
            className="mb-2 block text-xs font-semibold text-emerald-800"
          >
            Chỉnh sửa số dư
          </label>
          <div className="flex gap-2">
            <input
              id="wallet-balance"
              type="number"
              min="0"
              step="1000"
              value={draftBalance}
              onChange={(event) => setDraftBalance(event.target.value)}
              className="h-9 min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 text-sm font-semibold tabular-nums text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/15"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Lưu số dư"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftBalance(String(Number(balance) || 0));
                setIsEditing(false);
              }}
              disabled={isSaving}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Hủy chỉnh sửa"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

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
