// src/app/(app)/categories/_components/CategoriesClient.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/category";
import CategoryCard from "./CategoryCard";
import CategoryFormModal from "./CategoryFormModal";

interface Props {
  systemCategories: Category[];
  userCategories: Category[];
}

export default function CategoriesClient({ systemCategories, userCategories }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  function handleEdit(cat: Category) {
    setEditingCategory(cat);
    setIsModalOpen(true);
  }

  function handleAdd() {
    setEditingCategory(null);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Danh mục</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* Danh mục cá nhân */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Danh mục của bạn ({userCategories.length})
        </h2>
        {userCategories.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground text-sm">
            Chưa có danh mục nào.{" "}
            <button onClick={handleAdd} className="text-primary underline">
              Tạo danh mục đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userCategories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                editable
                onEdit={() => handleEdit(cat)}
                onDeleteSuccess={() => router.refresh()}
              />
            ))}
          </div>
        )}
      </section>

      {/* Danh mục hệ thống */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Danh mục hệ thống ({systemCategories.length})
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {systemCategories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} editable={false} />
          ))}
        </div>
      </section>

      <CategoryFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingCategory={editingCategory}
        onSuccess={() => {
          setIsModalOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}