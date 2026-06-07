"use client";

import React from "react";
import { ArrowDown, ArrowUp, Zap, HelpCircle } from "lucide-react";
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
  logs: SepayLog[];
};

export function SepaySyncCard({
  sepayCode,
  bankAccountNumber,
  logs,
}: SepaySyncCardProps) {
  // Format bank account: mask all but the last 4 digits
  const formatBankAccount = (accountStr: string | null) => {
    if (!accountStr) return "";
    const cleanStr = accountStr.trim();
    if (cleanStr.length <= 4) return cleanStr;
    return `****${cleanStr.slice(-4)}`;
  };

  const hasSePay = !!sepayCode;
  const maskedBank = bankAccountNumber ? formatBankAccount(bankAccountNumber) : "";

  // Map status values to Vietnamese labels and premium tailwind badge styles
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

  // Format log date: dd/MM/yyyy
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

  if (!hasSePay) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-slate-800 text-base">SePay đồng bộ</h2>
          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            Chưa liên kết
          </span>
        </div>
        <EmptyState
          title="Chưa liên kết SePay"
          description="Đồng bộ tự động các giao dịch ngân hàng qua cổng thanh toán SePay bằng mã định danh của bạn."
          icon={<Zap className="h-6 w-6 text-slate-300" />}
        />
      </section>
    );
  }

  const hasLogs = logs && logs.length > 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-slate-800 text-base">SePay đồng bộ</h2>
        <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Đang hoạt động
        </span>
      </div>

      {/* Gateway Connection Details Card */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4 mt-1">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
            <Zap className="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Mã SePay
            </p>
            <p className="text-sm font-extrabold text-slate-800">{sepayCode}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Ngân hàng
          </p>
          <p className="text-sm font-extrabold text-slate-800">
            VCB {maskedBank}
          </p>
        </div>
      </div>

      {/* Logs List */}
      <div className="divide-y divide-slate-100 mt-2">
        {hasLogs ? (
          logs.slice(0, 3).map((log) => {
            const isIncoming = log.transferType === "IN";
            const badge = getStatusBadge(log.status);

            return (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50/30 px-1 -mx-1 rounded-xl transition-colors duration-150"
              >
                {/* Arrow Icon and Note */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                      isIncoming
                        ? "bg-blue-50 text-blue-500 border-blue-100"
                        : "bg-amber-50 text-amber-500 border-amber-100"
                    }`}
                  >
                    {isIncoming ? (
                      <ArrowDown className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate leading-snug">
                      {log.content || "Chuyển tiền tự động"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-none">
                      {formatLogDate(log.transactionDate)}
                    </p>
                  </div>
                </div>

                {/* Amount and Status */}
                <div className="text-right shrink-0 flex items-center gap-3">
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
                    className={`rounded-lg px-2 py-0.5 text-[9px] font-bold border ${badge.classes}`}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="Chưa nhận được giao dịch SePay"
            description="Các giao dịch tự động chuyển khoản tới ví của bạn sẽ xuất hiện tại đây."
            icon={<Zap className="h-6 w-6 text-slate-300" />}
          />
        )}
      </div>
    </section>
  );
}
