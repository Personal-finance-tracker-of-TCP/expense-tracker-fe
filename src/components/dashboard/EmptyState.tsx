"use client";

import React from "react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  icon,
  className = "",
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 min-h-[220px] ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm border border-slate-100 mb-4 animate-pulse">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="font-semibold text-slate-800 text-sm tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-slate-400 max-w-[240px] leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
