"use client";

import { FormEvent, useState } from "react";
import { BrainCircuit, Lightbulb, ShieldAlert, Sparkles } from "lucide-react";

import { formatCurrencyVND } from "@/lib/finance";
import { authFetch, getCurrentDemoPeriod } from "@/lib/moneytrack-api";

type AdviceResponse = {
  summary?: string;
  riskLevel?: string;
  insights?: string[];
  suggestions?: string[];
  savingGoal?: string | number | Record<string, unknown>;
  [key: string]: unknown;
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

function normalizeList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function renderSavingGoal(value: unknown) {
  if (typeof value === "number") {
    return formatCurrencyVND(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return "No saving goal returned yet.";
}

export default function AiAdvisorPage() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authFetch<AdviceResponse>("/api/ai/advice", {
        method: "POST",
        body: JSON.stringify({ month, year }),
      });
      setAdvice(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot create advice");
    } finally {
      setLoading(false);
    }
  }

  const insights = normalizeList(advice?.insights);
  const suggestions = normalizeList(advice?.suggestions);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100">
              <BrainCircuit className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                AI Advisor
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Financial advice
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Ask MoneyTrack to explain your spending, budget risks, and
                practical next moves for a selected month.
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-[120px_140px_1fr] sm:items-end">
            <label className="block text-sm font-medium text-slate-700">
              Month
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Year
              <input
                type="number"
                min={2000}
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? "Thinking..." : "Get advice"}
            </button>
          </div>
        </form>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-blue-50 p-2 text-blue-700 ring-1 ring-blue-100">
                <Lightbulb className="h-4 w-4" />
              </span>
              <h2 className="font-semibold">Summary</h2>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {advice?.summary ||
                "Submit a month and year to generate a personalized financial summary."}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-amber-50 p-2 text-amber-700 ring-1 ring-amber-100">
                <ShieldAlert className="h-4 w-4" />
              </span>
              <h2 className="font-semibold">Risk level</h2>
            </div>
            <p className="mt-5 text-3xl font-bold">
              {advice?.riskLevel || "Not assessed"}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Insights</h2>
            <div className="mt-4 space-y-3">
              {insights.length === 0 ? (
                <p className="text-sm text-slate-500">No insights yet.</p>
              ) : (
                insights.map((item) => (
                  <p
                    key={item}
                    className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700"
                  >
                    {item}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Suggestions</h2>
            <div className="mt-4 space-y-3">
              {suggestions.length === 0 ? (
                <p className="text-sm text-slate-500">No suggestions yet.</p>
              ) : (
                suggestions.map((item) => (
                  <p
                    key={item}
                    className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
                  >
                    {item}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Saving goal</h2>
            <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-sm leading-6 text-white">
              {renderSavingGoal(advice?.savingGoal)}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
