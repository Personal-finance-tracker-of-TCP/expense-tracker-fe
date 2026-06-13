"use client";

import React from "react";
import { Eye, EyeOff, HelpCircle, Loader2, Search } from "lucide-react";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { formatCurrency } from "./MoneyAmount";

type UserInfo = {
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string | null;
  balance?: number | string;
};

type DashboardHeaderProps = {
  user: UserInfo | null;
  isMasked: boolean;
  onToggleMask: () => void;
  isRefreshing?: boolean;
};

export function DashboardHeader({
  user,
  isMasked,
  onToggleMask,
  isRefreshing = false,
}: DashboardHeaderProps) {
  const userName = user?.name || "Người dùng";
  const userRole = user?.role === "ADMIN" ? "Quản trị viên" : "Thành viên";
  const balanceValue = Number(user?.balance) || 0;
  const avatarText = userName.slice(0, 2).toUpperCase();

  return (
    <header className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 sm:p-8 md:flex-row md:items-center">
      <div className="space-y-1.5">
        <p className="flex items-center gap-2 text-[13px] font-medium text-slate-400">
          Xin chào, {userName}
          {isRefreshing ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              <Loader2 className="h-3 w-3 animate-spin" />
              Đang cập nhật
            </span>
          ) : null}
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
            {isMasked ? "••••••" : formatCurrency(balanceValue)}
          </h1>
          <button
            onClick={onToggleMask}
            type="button"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label={isMasked ? "Hiện số dư" : "Ẩn số dư"}
          >
            {isMasked ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <span>Tổng số dư</span>
          <HelpCircle className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="flex w-full items-center justify-between gap-4 border-t border-slate-100 pt-4 md:w-auto md:justify-end md:border-none md:pt-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-500 transition-all duration-200 hover:bg-slate-100/80 hover:text-slate-700"
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          <NotificationBell />
        </div>

        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Avatar URLs can come from any auth provider domain.
            <img
              src={user.avatarUrl}
              alt={userName}
              className="h-10 w-10 rounded-full border border-slate-100 object-cover ring-2 ring-slate-100/50"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-sm font-bold text-emerald-600">
              {avatarText}
            </div>
          )}
          <div className="shrink-0 text-left">
            <p className="text-sm font-semibold leading-tight text-slate-800">
              {userName}
            </p>
            <p className="text-[11px] font-medium text-slate-400">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
