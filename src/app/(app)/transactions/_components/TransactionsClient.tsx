// src/app/(app)/transactions/_components/TransactionsClient.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransactionListResponse, TransactionFilters } from "@/types/transaction";
import type { Category } from "@/types/category";
import TransactionTable from "./TransactionTable";
import TransactionFormModal from "./TransactionFormModal";

interface Props {
  initialData: TransactionListResponse;
  categories: Category[];
  initialFilters: TransactionFilters & { type: string };
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = [2024, 2025, 2026];

export default function TransactionsClient({
  initialData,
  categories,
  initialFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams({
      month: String(initialFilters.month),
      year: String(initialFilters.year),
      type: initialFilters.type,
      page: "1",
      [key]: value,
    });
    startTransition(() => router.push(`${pathname}?${params}`));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giao dịch</h1>
        <Button onClick={() => { setEditingId(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm giao dịch
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={String(initialFilters.month)}
          onValueChange={(v) => updateFilter("month", v)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={String(m)}>
                Tháng {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(initialFilters.year)}
          onValueChange={(v) => updateFilter("year", v)}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={initialFilters.type}
          onValueChange={(v) => updateFilter("type", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            <SelectItem value="INCOME">Thu nhập</SelectItem>
            <SelectItem value="EXPENSE">Chi tiêu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <TransactionTable
        transactions={initialData.transactions}
        pagination={initialData.pagination}
        isLoading={isPending}
        currentPage={initialFilters.page ?? 1}
        onPageChange={(p) => updateFilter("page", String(p))}
        onEdit={(id) => { setEditingId(id); setIsModalOpen(true); }}
        onDeleteSuccess={() => router.refresh()}
      />

      {/* Modal */}
      <TransactionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        categories={categories}
        editingId={editingId}
        onSuccess={() => { setIsModalOpen(false); router.refresh(); }}
      />
    </div>
  );
}