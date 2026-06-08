// src/app/(app)/transactions/_components/TransactionFormModal.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import type { Category } from "@/types/category";

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z
    .number({ invalid_type_error: "Vui lòng nhập số tiền" })
    .positive("Số tiền phải lớn hơn 0")
    .max(10_000_000_000, "Số tiền quá lớn"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  transactionDate: z
    .string()
    .min(1, "Vui lòng chọn ngày")
    .refine(
      (d) => new Date(d) <= new Date(),
      "Ngày giao dịch không thể ở tương lai"
    ),
  note: z.string().max(200, "Ghi chú tối đa 200 ký tự").optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  editingId: string | null;
  onSuccess: () => void;
}

export default function TransactionFormModal({
  open,
  onOpenChange,
  categories,
  editingId,
  onSuccess,
}: Props) {
  const isEditing = !!editingId;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "EXPENSE",
      amount: undefined,
      categoryId: "",
      transactionDate: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const selectedType = form.watch("type");
  const filteredCategories = categories.filter(
    (c) => c.type === selectedType || c.type === "BOTH"
  );

  // Load dữ liệu khi edit
  useEffect(() => {
    if (!open) {
      form.reset();
      return;
    }
    if (!editingId) return;

    api.get(`/api/transactions/${editingId}`).then((res) => {
      const tx = res.data.data;
      form.reset({
        type: tx.type,
        amount: tx.amount,
        categoryId: tx.categoryId,
        transactionDate: tx.transactionDate.split("T")[0],
        note: tx.note ?? "",
      });
    });
  }, [open, editingId, form]);

  async function onSubmit(values: FormValues) {
    if (isEditing) {
      await api.put(`/api/transactions/${editingId}`, values);
    } else {
      await api.post("/api/transactions", values);
    }
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Sửa giao dịch" : "Thêm giao dịch mới"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Loại giao dịch */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại</FormLabel>
                  <div className="flex gap-2">
                    {(["INCOME", "EXPENSE"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          field.onChange(t);
                          form.setValue("categoryId", "");
                        }}
                        className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                          field.value === t
                            ? t === "INCOME"
                              ? "border-green-500 bg-green-50 text-green-700"
                              : "border-red-500 bg-red-50 text-red-700"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {t === "INCOME" ? "💰 Thu nhập" : "💸 Chi tiêu"}
                      </button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Số tiền */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền (VNĐ)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Danh mục */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Danh mục</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ngày */}
            <FormField
              control={form.control}
              name="transactionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày</FormLabel>
                  <FormControl>
                    <Input type="date" max={new Date().toISOString().split("T")[0]} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ghi chú */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú (tuỳ chọn)</FormLabel>
                  <FormControl>
                    <Input placeholder="Mô tả giao dịch..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Đang lưu..."
                  : isEditing
                  ? "Cập nhật"
                  : "Thêm mới"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}