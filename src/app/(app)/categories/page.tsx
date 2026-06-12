import {
  BadgeDollarSign,
  CircleDot,
  Palette,
  Tag,
  Tags,
  Utensils,
} from "lucide-react";

import { WorkspaceMockup } from "@/components/layout/WorkspaceMockup";

export default function CategoriesPage() {
  return (
    <WorkspaceMockup
      actionLabel="Tạo danh mục"
      accent="from-amber-400 to-orange-500"
      filters={["Tất cả", "Chi tiêu", "Thu nhập"]}
      metrics={[
        {
          label: "Danh mục",
          value: "18",
          helper: "12 chi tiêu, 6 thu nhập",
          icon: Tags,
          tone: "from-amber-400 to-orange-500",
        },
        {
          label: "Đang dùng",
          value: "14",
          helper: "Có giao dịch trong tháng",
          icon: CircleDot,
          tone: "from-teal-500 to-cyan-500",
        },
        {
          label: "Thu nhập",
          value: "6",
          helper: "Lương, thưởng, đầu tư",
          icon: BadgeDollarSign,
          tone: "from-emerald-500 to-teal-500",
        },
        {
          label: "Màu & icon",
          value: "18/18",
          helper: "Sẵn sàng cho báo cáo",
          icon: Palette,
          tone: "from-fuchsia-500 to-rose-500",
        },
      ]}
      tableTitle="Bộ danh mục"
      tableColumns={["Tên danh mục", "Loại", "Màu", "Giao dịch"]}
      tableRows={[
        {
          cells: ["Ăn uống", "Chi tiêu", "Teal", "18 giao dịch"],
          status: "Đang dùng",
          tone: "bg-teal-50 text-teal-700",
        },
        {
          cells: ["Di chuyển", "Chi tiêu", "Sky", "9 giao dịch"],
          status: "Đang dùng",
          tone: "bg-sky-50 text-sky-700",
        },
        {
          cells: ["Lương", "Thu nhập", "Emerald", "1 giao dịch"],
          status: "Mặc định",
          tone: "bg-emerald-50 text-emerald-700",
        },
        {
          cells: ["Giải trí", "Chi tiêu", "Rose", "4 giao dịch"],
          status: "Cá nhân",
          tone: "bg-rose-50 text-rose-700",
        },
      ]}
      sideTitle="Phân bổ sử dụng"
      sideDescription="Nhóm danh mục giúp báo cáo và ngân sách đọc dữ liệu nhất quán."
      sideItems={[
        {
          label: "Ăn uống",
          value: "32%",
          helper: "Nhóm chi tiêu nhiều nhất",
          progress: 32,
          tone: "bg-teal-500",
        },
        {
          label: "Di chuyển",
          value: "18%",
          helper: "Phát sinh đều hằng tuần",
          progress: 18,
          tone: "bg-sky-500",
        },
        {
          label: "Tiết kiệm",
          value: "24%",
          helper: "Gắn với mục tiêu ngân sách",
          progress: 24,
          tone: "bg-amber-400",
        },
      ]}
      bottomCards={[
        {
          title: "Danh mục mặc định",
          description: "Bộ phân loại ban đầu cho tài khoản mới.",
          value: "10",
          icon: Tag,
        },
        {
          title: "Danh mục cá nhân",
          description: "Người dùng tự tạo theo thói quen chi tiêu.",
          value: "8",
          icon: Utensils,
        },
        {
          title: "Bảng màu",
          description: "Mỗi danh mục có màu riêng để đọc biểu đồ nhanh.",
          value: "6 màu",
          icon: Palette,
        },
      ]}
    />
  );
}
