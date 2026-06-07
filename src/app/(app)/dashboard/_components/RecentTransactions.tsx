// app/(app)/dashboard/_components/RecentTransactions.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Transaction } from "@/types/dashboard";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export default function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Chưa có giao dịch nào. <Link href="/transactions/new" className="text-primary underline">Thêm ngay</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Giao dịch gần nhất</CardTitle>
        <Link href="/transactions" className="text-sm text-primary hover:underline">
          Xem tất cả
        </Link>
      </CardHeader>
      <CardContent className="divide-y">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: tx.category.color + "20" }}
              >
                {tx.category.icon}
              </span>
              <div>
                <p className="text-sm font-medium leading-none">
                  {tx.note ?? tx.category.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {tx.category.name} · {formatDate(tx.transactionDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tx.source === "SEPAY" && (
                <Badge variant="outline" className="text-xs">SePay</Badge>
              )}
              <span
                className={`text-sm font-semibold tabular-nums ${
                  tx.type === "INCOME" ? "text-green-600" : "text-red-600"
                }`}
              >
                {tx.type === "INCOME" ? "+" : "-"}{formatVND(tx.amount)}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}