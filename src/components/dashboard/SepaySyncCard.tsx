"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckCheck,
  Copy,
  HelpCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { EmptyState } from "./EmptyState";

type SepayLog = {
  id: string;
  sepayId: string;
  gateway: string;
  transferAmount: number | string;
  transferType: "IN" | "OUT";
  content?: string | null;
  transactionDate?: string;
  status: "PENDING" | "PROCESSED" | "DUPLICATE" | "UNMATCHED" | "FAILED";
};

type SepaySyncCardProps = {
  sepayCode: string | null;
  bankAccountNumber: string | null;
  sepayLinkedAt?: string | null;
  logs: SepayLog[];
};

type CopyTarget = "bankAccountNumber" | "sepayCode" | null;

const SANDBOX_DESCRIPTION =
  "Tài khoản sandbox dùng để mô phỏng tài khoản ngân hàng trong môi trường BankHub Sandbox. Khi phát sinh giao dịch sandbox trên tài khoản này, hệ thống sẽ tự động đồng bộ giao dịch.";

function formatVietnamDateTime(value?: string | null) {
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

export function SepaySyncCard({
  sepayCode,
  bankAccountNumber,
  sepayLinkedAt,
  logs,
}: SepaySyncCardProps) {
  const [copied, setCopied] = useState<CopyTarget>(null);
  const isLinked = Boolean(bankAccountNumber);

  const handleCopy = (target: Exclude<CopyTarget, null>, text?: string | null) => {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(target);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const getStatusBadge = (status: SepayLog["status"]) => {
    switch (status) {
      case "PROCESSED":
        return {
          label: "Đã xử lý",
          classes: "bg-emerald-50 text-emerald-600 border-emerald-100",
        };
      case "DUPLICATE":
        return {
          label: "Trùng lặp",
          classes: "bg-amber-50 text-amber-600 border-amber-100",
        };
      case "FAILED":
        return {
          label: "Lỗi",
          classes: "bg-rose-50 text-rose-600 border-rose-100",
        };
      case "UNMATCHED":
        return {
          label: "Không khớp",
          classes: "bg-slate-50 text-slate-500 border-slate-200",
        };
      case "PENDING":
      default:
        return {
          label: "Đang chờ",
          classes: "bg-blue-50 text-blue-600 border-blue-100",
        };
    }
  };

  const formatLogDate = (dateStr?: string) => {
    if (!dateStr) return "-";

    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (!isLinked) {
    return (
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            SePay BankHub Sandbox
          </h2>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            Chưa liên kết
          </span>
        </div>
        <EmptyState
          title="Chưa liên kết SePay BankHub Sandbox"
          description={SANDBOX_DESCRIPTION}
          icon={<Zap className="h-6 w-6 text-slate-300" />}
        />
      </section>
    );
  }

  const hasLogs = logs && logs.length > 0;

  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-800">
          Đã liên kết SePay BankHub Sandbox
        </h2>
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Đã liên kết
        </span>
      </div>

      <p className="text-xs leading-5 text-slate-500">{SANDBOX_DESCRIPTION}</p>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-400">
                Ngân hàng
              </p>
              <p className="text-sm font-extrabold text-slate-800">
                SePay BankHub Sandbox
              </p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase text-slate-400">
                    Tài khoản sandbox
                  </p>
                  <p className="break-all text-sm font-extrabold text-slate-800">
                    {bankAccountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("bankAccountNumber", bankAccountNumber)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
                  aria-label="Sao chép tài khoản sandbox"
                  title="Sao chép tài khoản sandbox"
                >
                  {copied === "bankAccountNumber" ? (
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase text-slate-400">
                    Mã chuyển khoản tiền thật
                  </p>
                  <p className="break-all text-sm font-extrabold text-slate-800">
                    {sepayCode || "-"}
                  </p>
                </div>
                {sepayCode ? (
                  <button
                    type="button"
                    onClick={() => handleCopy("sepayCode", sepayCode)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:text-slate-900"
                    aria-label="Sao chép mã chuyển khoản tiền thật"
                    title="Sao chép mã chuyển khoản tiền thật"
                  >
                    {copied === "sepayCode" ? (
                      <CheckCheck className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">
                  Trạng thái
                </p>
                <p className="text-xs font-bold text-emerald-600">Đã liên kết</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-400">
                  Liên kết lúc
                </p>
                <p className="text-xs font-bold text-slate-700">
                  {formatVietnamDateTime(sepayLinkedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-1 divide-y divide-slate-100">
        {hasLogs ? (
          logs.slice(0, 3).map((log) => {
            const isIncoming = log.transferType === "IN";
            const badge = getStatusBadge(log.status);

            return (
              <div
                key={log.id}
                className="-mx-1 flex items-center justify-between gap-3 rounded-xl px-1 py-3 transition-colors duration-150 hover:bg-slate-50/30"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                      isIncoming
                        ? "border-blue-100 bg-blue-50 text-blue-500"
                        : "border-amber-100 bg-amber-50 text-amber-500"
                    }`}
                  >
                    {isIncoming ? (
                      <ArrowDown className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold leading-snug text-slate-700">
                      {log.content || "Giao dịch sandbox tự động"}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold leading-none text-slate-400">
                      {formatLogDate(log.transactionDate)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-right">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      isIncoming ? "text-blue-600" : "text-rose-500"
                    }`}
                  >
                    {isIncoming ? "+" : "-"}
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(Number(log.transferAmount))}
                  </span>
                  <span
                    className={`rounded-lg border px-2 py-0.5 text-[9px] font-bold ${badge.classes}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="Chưa nhận được giao dịch sandbox"
            description="Các giao dịch phát sinh trên tài khoản BankHub Sandbox sẽ xuất hiện tại đây."
            icon={<HelpCircle className="h-6 w-6 text-slate-300" />}
          />
        )}
      </div>
    </section>
  );
}
