"use client";

import type {
  ChangeEventHandler,
  MouseEventHandler,
  ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Loader2, Plus, Search } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricItem = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
};

type TableRow = {
  cells: string[];
  status?: string;
  tone?: string;
  actions?: ReactNode;
};

type SideItem = {
  label: string;
  value: string;
  helper?: string;
  progress?: number;
  tone?: string;
};

type WorkspaceMockupProps = {
  actionLabel: string;
  accent: string;
  filters: string[];
  metrics: MetricItem[];
  tableTitle: string;
  tableColumns: string[];
  tableRows: TableRow[];
  sideTitle: string;
  sideDescription: string;
  sideItems: SideItem[];
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: ChangeEventHandler<HTMLInputElement>;
  onAction?: MouseEventHandler<HTMLButtonElement>;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
  bottomCards?: Array<{
    title: string;
    description: string;
    value: string;
    icon: LucideIcon;
  }>;
};

export function WorkspaceMockup({
  actionLabel,
  accent,
  filters,
  metrics,
  tableTitle,
  tableColumns,
  tableRows,
  sideTitle,
  sideDescription,
  sideItems,
  searchValue,
  searchPlaceholder = "Tìm kiếm...",
  onSearchChange,
  onAction,
  actionDisabled = false,
  actionLoading = false,
  emptyMessage = "Chưa có dữ liệu.",
  children,
  bottomCards = [],
}: WorkspaceMockupProps) {
  const hasRowActions = tableRows.some((row) => row.actions);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item, index) => {
          const Icon = item.icon;

          return (
            <section
              key={item.label}
              className="animate-rise rounded-[1.75rem] border border-white/80 bg-white/88 p-5 shadow-lg shadow-teal-950/[0.05] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/90"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-300">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                    {item.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                    item.tone
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs font-black text-teal-700">
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
                {item.helper}
              </p>
            </section>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="animate-rise rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-xl shadow-teal-950/[0.06] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-teal-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                {tableTitle}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <span
                    key={filter}
                    className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-black text-teal-800"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex h-11 min-w-0 items-center gap-2 rounded-full border border-teal-100 bg-slate-50 px-4 text-sm text-slate-500 shadow-inner shadow-white/70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 sm:w-64">
                <Search className="size-4 text-teal-600" aria-hidden="true" />
                {onSearchChange ? (
                  <input
                    type="search"
                    value={searchValue ?? ""}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  />
                ) : (
                  <span className="truncate">{searchPlaceholder}</span>
                )}
              </div>
              <button
                type="button"
                onClick={onAction}
                disabled={actionDisabled || actionLoading}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
                  accent
                )}
              >
                {actionLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                {actionLabel}
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-teal-100 bg-white dark:border-slate-700 dark:bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-teal-50/70 text-xs uppercase tracking-[0.16em] text-teal-800 dark:bg-slate-800 dark:text-teal-200">
                  <tr>
                    {tableColumns.map((column) => (
                      <th key={column} className="px-4 py-3 font-black">
                        {column}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-black">Trạng thái</th>
                    {hasRowActions ? (
                      <th className="px-4 py-3 font-black">Thao tác</th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100 dark:divide-slate-800">
                  {tableRows.length > 0 ? (
                    tableRows.map((row, rowIndex) => (
                      <tr key={`${row.cells[0]}-${rowIndex}`} className="bg-white dark:bg-slate-950">
                        {row.cells.map((cell, cellIndex) => (
                          <td
                            key={`${cell}-${cellIndex}`}
                            className={cn(
                              "px-4 py-4",
                              cellIndex === 0
                                ? "font-black text-slate-950 dark:text-white"
                                : "font-medium text-slate-600 dark:text-slate-300"
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                        <td className="px-4 py-4">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-black",
                              row.tone ?? "bg-teal-50 text-teal-700"
                            )}
                          >
                            {row.status ?? "Active"}
                          </span>
                        </td>
                        {hasRowActions ? (
                          <td className="px-4 py-4">{row.actions}</td>
                        ) : null}
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white">
                      <td
                        colSpan={tableColumns.length + 1 + (hasRowActions ? 1 : 0)}
                        className="px-4 py-10 text-center text-sm font-bold text-slate-400"
                      >
                        {emptyMessage}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="animate-rise rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-teal-950/[0.06] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 [animation-delay:80ms]">
          <h2 className="text-2xl font-black text-slate-950 dark:text-white">{sideTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
            {sideDescription}
          </p>

          <div className="mt-6 space-y-4">
            {sideItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-teal-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">
                      {item.label}
                    </p>
                    {item.helper ? (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {item.helper}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-black text-teal-700">
                    {item.value}
                  </p>
                </div>

                {typeof item.progress === "number" ? (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        item.tone ?? "bg-teal-500"
                      )}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </aside>
      </div>

      {bottomCards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {bottomCards.map((card) => {
            const Icon = card.icon;

            return (
              <section
                key={card.title}
                className="animate-rise rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-lg shadow-teal-950/[0.05] backdrop-blur"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {card.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {card.description}
                    </p>
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                </div>
                <p className="mt-4 text-2xl font-black text-slate-950">
                  {card.value}
                </p>
              </section>
            );
          })}
        </div>
      ) : null}
      {children}
    </div>
  );
}
