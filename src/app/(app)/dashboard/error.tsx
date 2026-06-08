// app/(app)/dashboard/error.tsx
"use client";
import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-muted-foreground">Không thể tải dữ liệu dashboard.</p>
      <Button onClick={reset} variant="outline">Thử lại</Button>
    </div>
  );
}