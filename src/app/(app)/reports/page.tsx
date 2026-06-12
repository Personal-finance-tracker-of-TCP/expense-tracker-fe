import {
  BarChart2,
  Download,
  FileSpreadsheet,
  PieChart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { WorkspaceMockup } from "@/components/layout/WorkspaceMockup";

export default function ReportsPage() {
  return (
    <WorkspaceMockup
      actionLabel="Xuất báo cáo"
      accent="from-indigo-500 to-sky-500"
      filters={["Tháng này", "Theo danh mục", "PDF/Excel"]}
      metrics={[
        {
          label: "Thu nhập",
          value: "18.0M đ",
          helper: "+12.4%",
          icon: TrendingUp,
          tone: "from-emerald-500 to-teal-500",
        },
        {
          label: "Chi tiêu",
          value: "6.2M đ",
          helper: "-8.1%",
          icon: TrendingDown,
          tone: "from-rose-500 to-orange-500",
        },
        {
          label: "Tỷ lệ tiết kiệm",
          value: "34%",
          helper: "+4% tháng này",
          icon: PieChart,
          tone: "from-indigo-500 to-sky-500",
        },
        {
          label: "Báo cáo đã xuất",
          value: "7",
          helper: "PDF và Excel",
          icon: Download,
          tone: "from-amber-400 to-orange-500",
        },
      ]}
      tableTitle="Báo cáo gần đây"
      tableColumns={["Tên báo cáo", "Chu kỳ", "Định dạng", "Ngày tạo"]}
      tableRows={[
        {
          cells: ["Tổng quan tháng 6", "01/06 - 12/06", "PDF", "12/06/2026"],
          status: "Sẵn sàng",
          tone: "bg-teal-50 text-teal-700",
        },
        {
          cells: ["Chi tiêu theo danh mục", "Tháng 6", "Excel", "11/06/2026"],
          status: "Sẵn sàng",
          tone: "bg-emerald-50 text-emerald-700",
        },
        {
          cells: ["Dòng tiền tuần", "Tuần 23", "PDF", "09/06/2026"],
          status: "Đã tải",
          tone: "bg-sky-50 text-sky-700",
        },
        {
          cells: ["Ngân sách vượt mức", "Tháng 6", "Excel", "08/06/2026"],
          status: "Cần xem",
          tone: "bg-amber-50 text-amber-700",
        },
      ]}
      sideTitle="Cơ cấu chi tiêu"
      sideDescription="Tỷ trọng danh mục giúp nhận diện nhóm chi tiêu ảnh hưởng nhiều nhất."
      sideItems={[
        {
          label: "Ăn uống",
          value: "32%",
          helper: "1.86M đ",
          progress: 32,
          tone: "bg-teal-500",
        },
        {
          label: "Mua sắm",
          value: "21%",
          helper: "1.26M đ",
          progress: 21,
          tone: "bg-rose-500",
        },
        {
          label: "Di chuyển",
          value: "12%",
          helper: "720K đ",
          progress: 12,
          tone: "bg-sky-500",
        },
      ]}
      bottomCards={[
        {
          title: "Biểu đồ cột",
          description: "So sánh thu chi theo từng tháng.",
          value: "12 mốc",
          icon: BarChart2,
        },
        {
          title: "Biểu đồ vòng",
          description: "Cơ cấu danh mục chi tiêu.",
          value: "5 nhóm",
          icon: PieChart,
        },
        {
          title: "Tệp xuất",
          description: "Chuẩn bị file cho báo cáo cuối kỳ.",
          value: "PDF/XLSX",
          icon: FileSpreadsheet,
        },
      ]}
    />
  );
}
