// src/app/(app)/categories/error.tsx
"use client";
import { Button } from "@/components/ui/button";
export default function CategoriesError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-muted-foreground">Không thể tải danh mục.</p>
      <Button onClick={reset} variant="outline">Thử lại</Button>
    </div>
  );
}