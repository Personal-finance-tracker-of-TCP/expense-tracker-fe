// app/(app)/dashboard/_components/SpendingChart.tsx
"use client";  // Recharts cần client component

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartMonth } from "@/types/dashboard";

function shortMonth(month: number) {
  return `T${month}`;
}

function formatTooltip(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

export default function SpendingChart({ data }: { data: ChartMonth[] }) {
  const chartData = data.map((d) => ({
    ...d,
    label: shortMonth(d.month),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thu/Chi 6 tháng gần nhất</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                v >= 1_000_000 ? `${v / 1_000_000}M` : `${v / 1_000}K`
              }
            />
            <Tooltip formatter={formatTooltip} />
            <Legend />
            <Bar dataKey="income" name="Thu nhập" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}