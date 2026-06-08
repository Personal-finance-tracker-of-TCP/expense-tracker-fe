// app/(app)/dashboard/_components/SummaryCards.tsx
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SummaryData } from "@/types/dashboard";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export default function SummaryCards({ data }: { data: SummaryData }) {
  const cards = [
    {
      title: "Số dư ví",
      value: data.balance,
      icon: Wallet,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Thu nhập tháng này",
      value: data.income,
      icon: TrendingUp,
      colorClass: "text-green-600",
      bgClass: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Chi tiêu tháng này",
      value: data.expense,
      icon: TrendingDown,
      colorClass: "text-red-600",
      bgClass: "bg-red-50 dark:bg-red-950",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bgClass}`}>
              <card.icon className={`h-4 w-4 ${card.colorClass}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${card.colorClass}`}>
              {formatVND(card.value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}