// src/app/(app)/categories/page.tsx
import { serverFetch } from "@/lib/serverApi";
import type { Category } from "@/types/category";
import CategoriesClient from "./_components/CategoriesClient";

export default async function CategoriesPage() {
  const res = await serverFetch<{ success: boolean; data: Category[] }>(
    "/api/categories"
  ).catch(() => null);

  const categories = res?.data ?? [];

  const systemCategories = categories.filter((c) => c.userId === null);
  const userCategories = categories.filter((c) => c.userId !== null);

  return (
    <CategoriesClient
      systemCategories={systemCategories}
      userCategories={userCategories}
    />
  );
}