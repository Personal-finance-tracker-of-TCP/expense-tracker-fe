import {
  AlertTriangle,
  CalendarDays,
  PiggyBank,
  ShieldCheck,
  Target,
  WalletCards,
} from "lucide-react";

import { WorkspaceMockup } from "@/components/layout/WorkspaceMockup";

export default function BudgetPage() {
  return (
    <WorkspaceMockup
      actionLabel="Tạo ngân sách"
      accent="from-emerald-500 to-lime-500"
      filters={["Tháng 06/2026", "Đang theo dõi", "Theo danh mục"]}
      metrics={[
        {
          label: "Tổng ngân sách",
          value: "10.0M đ",
          helper: "5 nhóm chi tiêu",
          icon: WalletCards,
          tone: "from-emerald-500 to-teal-500",
        },
        {
          label: "Đã sử dụng",
          value: "6.2M đ",
          helper: "62% hạn mức",
          icon: PiggyBank,
          tone: "from-amber-400 to-orange-500",
        },
        {
          label: "Còn lại",
          value: "3.8M đ",
          helper: "An toàn tới cuối tháng",
          icon: ShieldCheck,
          tone: "from-teal-500 to-cyan-500",
        },
        {
          label: "Cảnh báo",
          value: "2",
          helper: "Gần chạm ngưỡng",
          icon: AlertTriangle,
          tone: "from-rose-500 to-orange-500",
        },
      ]}
      tableTitle="Ngân sách theo danh mục"
      tableColumns={["Danh mục", "Hạn mức", "Đã chi", "Còn lại"]}
      tableRows={[
        {
          cells: ["Ăn uống", "3.000.000 đ", "1.860.000 đ", "1.140.000 đ"],
          status: "62%",
          tone: "bg-teal-50 text-teal-700",
        },
        {
          cells: ["Di chuyển", "1.500.000 đ", "720.000 đ", "780.000 đ"],
          status: "48%",
          tone: "bg-sky-50 text-sky-700",
        },
        {
          cells: ["Giải trí", "900.000 đ", "810.000 đ", "90.000 đ"],
          status: "Cảnh báo",
          tone: "bg-amber-50 text-amber-700",
        },
        {
          cells: ["Mua sắm", "1.200.000 đ", "1.260.000 đ", "-60.000 đ"],
          status: "Vượt mức",
          tone: "bg-rose-50 text-rose-700",
        },
      ]}
      sideTitle="Tiến độ tháng"
      sideDescription="Theo dõi nhóm chi tiêu có nguy cơ vượt hạn mức để điều chỉnh kịp thời."
      sideItems={[
        {
          label: "Ăn uống",
          value: "62%",
          helper: "Ổn định",
          progress: 62,
          tone: "bg-teal-500",
        },
        {
          label: "Giải trí",
          value: "90%",
          helper: "Cần giảm chi",
          progress: 90,
          tone: "bg-amber-400",
        },
        {
          label: "Mua sắm",
          value: "105%",
          helper: "Đã vượt hạn mức",
          progress: 100,
          tone: "bg-rose-500",
        },
      ]}
      bottomCards={[
        {
          title: "Chu kỳ ngân sách",
          description: "Tự động làm mới theo tháng.",
          value: "30 ngày",
          icon: CalendarDays,
        },
        {
          title: "Mục tiêu tiết kiệm",
          description: "Theo dõi khoản dành riêng cho mục tiêu.",
          value: "2.5M đ",
          icon: Target,
        },
        {
          title: "Ngưỡng cảnh báo",
          description: "Thông báo khi đạt 80% hạn mức.",
          value: "80%",
          icon: AlertTriangle,
        },
      ]}
    />
  );
}
