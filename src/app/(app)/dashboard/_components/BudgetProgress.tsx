// app/(app)/dashboard/_components/BudgetProgress.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import type { Budget } from "@/types/dashboard";

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

export default function BudgetProgress({ budgets }: { budgets: Budget[] }) {
  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Ngân sách</CardTitle></CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground py-8">
          Chưa có ngân sách. <Link href="/budgets" className="text-primary underline">Thiết lập ngay</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Ngân sách tháng này</CardTitle>
        <Link href="/budgets" className="text-sm text-primary hover:underline">Chi tiết</Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.map((budget) => {
          const pct = Math.min(budget.percentage, 100);
          const isOver = budget.percentage > 100;
          const isWarning = budget.percentage >= 80 && !isOver;

          return (
            <div key={budget.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <span>{budget.category.icon}</span>
                  {budget.category.name}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isOver ? "text-red-600" : isWarning ? "text-yellow-600" : "text-muted-foreground"
                  }`}
                >
                  {isOver ? "Đã vượt" : isWarning ? "Sắp vượt" : `${Math.round(pct)}%`}
                </span>
              </div>
              <Progress
                value={pct}
                className={`h-2 ${
                  isOver
                    ? "[&>div]:bg-red-500"
                    : isWarning
                    ? "[&>div]:bg-yellow-500"
                    : "[&>div]:bg-green-500"
                }`}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formatVND(budget.spent)} / {formatVND(budget.limitAmount)}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}