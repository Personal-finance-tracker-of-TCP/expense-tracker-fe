"use client";

import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Balance Hero Skeleton */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
          <div className="h-10 w-64 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
          <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
              <div className="h-3 w-16 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Monthly Report Card Skeleton */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-5 w-36 bg-slate-200 rounded"></div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <div className="space-y-2">
                <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                <div className="h-6 w-24 bg-slate-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                <div className="h-6 w-24 bg-slate-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-16 bg-slate-200 rounded"></div>
                <div className="h-6 w-24 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="h-[220px] bg-slate-50 border border-slate-100 rounded-2xl flex items-end p-4">
              <div className="w-full flex items-end justify-between gap-2">
                {[25, 40, 58, 82, 60, 50, 67, 63, 33, 64, 31, 41].map((h, i) => (
                  <div
                    key={i}
                    className="bg-slate-200 rounded-t w-full"
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions Card Skeleton */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-5 w-44 bg-slate-200 rounded"></div>
              <div className="h-4 w-20 bg-slate-200 rounded"></div>
            </div>
            <div className="space-y-4 border-t border-slate-100 pt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 bg-slate-200 rounded-full shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/3 bg-slate-200 rounded"></div>
                      <div className="h-3 w-1/2 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2 text-right shrink-0">
                    <div className="h-4 w-24 bg-slate-200 rounded ml-auto"></div>
                    <div className="h-3 w-16 bg-slate-200 rounded ml-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Wallet Card Skeleton */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-slate-200 rounded"></div>
              <div className="h-4 w-16 bg-slate-200 rounded"></div>
            </div>
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
              <div className="h-11 w-11 bg-slate-200 rounded-xl"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-16 bg-slate-200 rounded"></div>
                <div className="h-3 w-28 bg-slate-200 rounded"></div>
              </div>
              <div className="h-6 w-24 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="flex gap-3 pt-2">
              <div className="flex-1 h-12 bg-slate-200 rounded-xl"></div>
              <div className="flex-1 h-12 bg-slate-200 rounded-xl"></div>
            </div>
          </div>

          {/* Budget Card Skeleton */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div className="h-5 w-24 bg-slate-200 rounded"></div>
              <div className="h-4 w-16 bg-slate-200 rounded"></div>
            </div>
            <div className="space-y-4 border-t border-slate-100 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    <div className="h-4 w-12 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full w-full"></div>
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                    <div className="h-3 w-10 bg-slate-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SePay Sync Card Skeleton */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <div className="h-5 w-32 bg-slate-200 rounded"></div>
              <div className="h-4.5 w-20 bg-slate-200 rounded-full"></div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
              <div className="h-4 w-36 bg-slate-200 rounded"></div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-28 bg-slate-200 rounded"></div>
                    <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-5 w-16 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
