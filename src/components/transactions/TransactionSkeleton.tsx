"use client";

import React from "react";

export function TransactionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary Card Shimmer */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-3 w-16 bg-slate-200 rounded"></div>
          <div className="h-9 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-3 w-20 bg-slate-200 rounded"></div>
        </div>
        <div className="h-px bg-slate-100 w-full"></div>
        <div className="flex gap-4 pt-2">
          <div className="flex-1 h-12 bg-slate-100 rounded-xl"></div>
          <div className="flex-1 h-12 bg-slate-100 rounded-xl"></div>
          <div className="flex-1 h-12 bg-slate-100 rounded-xl"></div>
        </div>
      </div>

      {/* Filter Bar Shimmer */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] h-10 bg-slate-100 rounded-2xl"></div>
        <div className="w-44 h-10 bg-slate-100 rounded-2xl"></div>
        <div className="w-44 h-10 bg-slate-100 rounded-2xl"></div>
        <div className="w-32 h-10 bg-slate-100 rounded-2xl"></div>
        <div className="w-32 h-10 bg-slate-100 rounded-2xl"></div>
      </div>

      {/* Day Group Shimmers */}
      {Array.from({ length: 2 }).map((_, gIdx) => (
        <div key={gIdx} className="space-y-4">
          {/* Day Header */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-200 rounded shrink-0"></div>
              <div className="space-y-1">
                <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                <div className="h-2.5 w-20 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="h-4 w-20 bg-slate-200 rounded"></div>
          </div>

          {/* Transactions list */}
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, tIdx) => (
              <div
                key={tIdx}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-white"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 bg-slate-200 rounded-full shrink-0"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="h-4 w-12 bg-slate-200 rounded"></div>
                  <div className="h-4 w-16 bg-slate-200 rounded"></div>
                  <div className="h-8 w-20 bg-slate-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
export default TransactionSkeleton;
