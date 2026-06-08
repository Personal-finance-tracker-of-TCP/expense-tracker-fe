// src/app/(app)/transactions/page.tsx
import { serverFetch } from "@/lib/serverApi";
import type { TransactionListResponse } from "@/types/transaction";
import type { Category } from "@/types/category"; // tạo ở bước 3
import TransactionsClient from "./_components/TransactionsClient";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    type?: string;
    page?: string;
  }>;
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month ?? now.getMonth() + 1);
  const year = Number(params.year ?? now.getFullYear());
  const type = params.type ?? "ALL";
  const page = Number(params.page ?? 1);

  const query = new URLSearchParams({
    month: String(month),
    year: String(year),
    page: String(page),
    limit: "20",
    ...(type !== "ALL" && { type }),
  });

  const [txRes, catRes] = await Promise.allSettled([
    serverFetch<{ success: boolean; data: TransactionListResponse }>(
      `/api/transactions?${query}`
    ),
    serverFetch<{ success: boolean; data: Category[] }>(`/api/categories`),
  ]);

  const txData =
    txRes.status === "fulfilled"
      ? txRes.value.data
      : { transactions: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };

  const categories =
    catRes.status === "fulfilled" ? catRes.value.data : [];

  return (
    <TransactionsClient
      initialData={txData}
      categories={categories}
      initialFilters={{ month, year, type, page }}
    />
  );
}