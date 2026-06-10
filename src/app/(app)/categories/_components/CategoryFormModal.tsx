// src/app/(app)/categories/_components/CategoryFormModal.tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import type { Category } from "@/types/category";

const ICONS = ["🍔","🚗","🏠","💊","📚","🎮","✈️","👕","💡","🎁","💰","📈","🏋️","🐾","🎵"];
const COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#3b82f6","#8b5cf6","#ec4899"];

const schema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên").max(50, "Tối đa 50 ký tự"),
  type: z.enum(["INCOME", "EXPENSE", "BOTH"]),
  icon: z.string().min(1, "Vui lòng chọn icon"),
  color: z.string().min(1, "Vui lòng chọn màu"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: Category | null;
  onSuccess: () => void;
}

export default function CategoryFormModal({ open, onOpenChange, editingCategory, onSuccess }: Props) {
  const isEditing = !!editingCategory;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "EXPENSE", icon: "🍔", color: "#3b82f6" },
  });

  useEffect(() => {
    if (!open) { form.reset(); return; }
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        type: editingCategory.type,
        icon: editingCategory.icon,
        color: editingCategory.color ?? "#3b82f6",
      });
    }
  }, [open, editingCategory, form]);

  async function onSubmit(values: FormValues) {
    if (isEditing) {
      await api.put(`/api/categories/${editingCategory.id}`, values);
    } else {
      await api.post("/api/categories", values);
    }
    onSuccess();
  }

  const selectedIcon = form.watch("icon");
  const selectedColor = form.watch("color");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Sửa danh mục" : "Thêm danh mục mới"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tên */}
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Tên danh mục</FormLabel>
                <FormControl>
                  <Input placeholder="VD: Ăn uống, Xăng xe..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Loại */}
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Loại</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="EXPENSE">Chi tiêu</SelectItem>
                    <SelectItem value="INCOME">Thu nhập</SelectItem>
                    <SelectItem value="BOTH">Cả hai</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Icon picker */}
            <FormField control={form.control} name="icon" render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => field.onChange(icon)}
                      className={`h-9 w-9 rounded-lg text-xl transition-all ${
                        selectedIcon === icon
                          ? "ring-2 ring-primary ring-offset-1 scale-110"
                          : "border hover:bg-muted"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* Color picker */}
            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem>
                <FormLabel>Màu sắc</FormLabel>
                <div className="flex gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        selectedColor === color ? "scale-125 ring-2 ring-offset-1 ring-slate-400" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )} />

            {/* Preview */}
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                style={{ backgroundColor: selectedColor + "30" }}
              >
                {selectedIcon}
              </span>
              <span className="text-sm font-medium">
                {form.watch("name") || "Tên danh mục"}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1"
                onClick={() => onOpenChange(false)}>
                Huỷ
              </Button>
              <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm mới"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}