// src/app/(app)/transactions/_components/TransactionTable.tsx
"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import type { Transaction } from "@/types/transaction";

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Props {
  transactions: Transaction[];
  pagination: Pagination;
  isLoading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEdit: (id: string) => void;
  onDeleteSuccess: () => void;
}

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function TransactionTable({
  transactions,
  pagination,
  isLoading,
  currentPage,
  onPageChange,
  onEdit,
  onDeleteSuccess,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/transactions/${deletingId}`);
      onDeleteSuccess();
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  }

  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="rounded-lg border py-16 text-center text-muted-foreground">
        Không có giao dịch nào trong tháng này.
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-lg border transition-opacity ${isLoading ? "opacity-50" : ""}`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Danh mục</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{tx.category.icon}</span>
                    <span className="text-sm">{tx.category.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                  {tx.note ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(tx.transactionDate)}
                </TableCell>
                <TableCell>
                  {tx.source === "SEPAY" && (
                    <Badge variant="outline" className="text-xs">SePay</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  <span className={tx.type === "INCOME" ? "text-green-600" : "text-red-600"}>
                    {tx.type === "INCOME" ? "+" : "-"}{formatVND(tx.amount)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(tx.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingId(tx.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {(currentPage - 1) * pagination.limit + 1}–
            {Math.min(currentPage * pagination.limit, pagination.total)}{" "}
            / {pagination.total} giao dịch
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pagination.totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá giao dịch?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Số dư ví sẽ được cập nhật lại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xoá..." : "Xoá"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}