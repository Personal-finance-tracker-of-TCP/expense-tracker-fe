"use client";

import { useEffect, useState } from "react";
import { Tags } from "lucide-react";

import { authFetch } from "@/lib/moneytrack-api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  type?: string;
  isDefault?: boolean;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await authFetch<Category[]>("/api/categories");
        setCategories(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Cannot load categories");
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100">
              <Tags className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Category library
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Categories
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Expense categories are used by transactions, budgets, and
                reports.
              </p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
              No categories found.
            </div>
          ) : (
            categories.map((category) => (
              <article
                key={category.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">
                      {category.icon || "•"} {category.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {category.type || "BOTH"}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                    {category.isDefault ? "Default" : "Custom"}
                  </span>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
