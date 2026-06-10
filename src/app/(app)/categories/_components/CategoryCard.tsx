// src/app/(app)/categories/_components/CategoryCard.tsx
"use client";

import { useState } from "react";
import { Pencil, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import api from "@/lib/api";
import type { Category } from "@/types/category";

const TYPE_LABEL = {
  INCOME: { label: "Thu nhập", class: "text-green-700 bg-green-50 border-green-200" },
  EXPENSE: { label: "Chi tiêu", class: "text-red-700 bg-red-50 border-red-200" },
  BOTH: { label: "Cả hai", class: "text-blue-700 bg-blue-50 border-blue-200" },
};

interface Props {
  category: Category;
  editable: boolean;
  onEdit?: () => void;
  onDeleteSuccess?: () => void;
}

export default function CategoryCard({ category, editable, onEdit, onDeleteSuccess }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await api.delete(`/api/categories/${category.id}`);
      onDeleteSuccess?.();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  const typeInfo = TYPE_LABEL[category.type];

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: (category.color ?? "#e5e7eb") + "30" }}
          >
            {category.icon}
          </span>
          <div>
            <p className="font-medium text-sm">{category.name}</p>
            <Badge variant="outline" className={`text-xs mt-0.5 ${typeInfo.class}`}>
              {typeInfo.label}
            </Badge>
          </div>
        </div>

        <div className="flex gap-1">
          {editable ? (
            <>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground/50" />
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá danh mục "{category.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Các giao dịch liên quan sẽ chuyển về "Không phân loại". Hành động này không thể hoàn tác.
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