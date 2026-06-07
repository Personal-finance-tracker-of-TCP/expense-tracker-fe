"use client";

import React from "react";
import { Eye, EyeOff, Search, Bell, HelpCircle } from "lucide-react";
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
};

export function DashboardHeader({
  user,
  isMasked,
  onToggleMask,
}: DashboardHeaderProps) {
  const userName = user?.name || "Người dùng";
  const userRole = user?.role === "ADMIN" ? "Quản trị viên" : "Thành viên";
  const balanceValue = Number(user?.balance) || 0;
  const avatarText = userName.slice(0, 2).toUpperCase();

  return (
    <header className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-200">
      {/* Balance Section */}
      <div className="space-y-1.5">
        <p className="text-[13px] font-medium text-slate-400 flex items-center gap-1">
          Xin chào, {userName} <span className="animate-wiggle">👋</span>
        </p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {isMasked ? "••••••" : formatCurrency(balanceValue)}
          </h1>
          <button
            onClick={onToggleMask}
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-50 rounded-full"
            aria-label={isMasked ? "Show balance" : "Hide balance"}
          >
            {isMasked ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span>Tổng số dư</span>
          <HelpCircle className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Action / Profile Section */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-slate-100 pt-4 md:border-none md:pt-0">
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            type="button"
            className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-100 bg-slate-50 hover:bg-slate-100/80 text-slate-500 hover:text-slate-700 transition-all duration-200"
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          {/* Notification Button */}
          <button
            type="button"
            className="relative h-10 w-10 flex items-center justify-center rounded-full border border-slate-100 bg-slate-50 hover:bg-slate-100/80 text-slate-500 hover:text-slate-700 transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={userName}
              className="h-10 w-10 rounded-full object-cover border border-slate-100 ring-2 ring-slate-100/50"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-sm flex items-center justify-center border border-emerald-500/20">
              {avatarText}
            </div>
          )}
          <div className="text-left shrink-0">
            <p className="text-sm font-semibold text-slate-800 leading-tight">
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
