import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarRange,
  CreditCard,
  WalletCards,
} from "lucide-react";

import { WorkspaceMockup } from "@/components/layout/WorkspaceMockup";

export default function TransactionsPage() {
  return (
    <WorkspaceMockup
      actionLabel="Thêm giao dịch"
      accent="from-sky-500 to-cyan-500"
      filters={["Tháng này", "Tất cả danh mục", "SePay + thủ công"]}
      metrics={[
        {
          label: "Tổng thu",
          value: "18.0M đ",
          helper: "+2 khoản mới",
          icon: ArrowDownLeft,
          tone: "from-emerald-500 to-teal-500",
        },
        {
          label: "Tổng chi",
          value: "6.2M đ",
          helper: "-8.1% so với tháng trước",
          icon: ArrowUpRight,
          tone: "from-rose-500 to-orange-500",
        },
        {
          label: "Giao dịch",
          value: "48",
          helper: "12 giao dịch tuần này",
          icon: ArrowLeftRight,
          tone: "from-sky-500 to-cyan-500",
        },
        {
          label: "Chờ phân loại",
          value: "5",
          helper: "Cần gán danh mục",
          icon: CreditCard,
          tone: "from-amber-400 to-orange-500",
        },
      ]}
      tableTitle="Danh sách giao dịch"
      tableColumns={["Nội dung", "Danh mục", "Ngày", "Số tiền"]}
      tableRows={[
        {
          cells: ["Lương tháng 6", "Thu nhập", "12/06/2026", "+18.000.000 đ"],
          status: "Đã ghi nhận",
          tone: "bg-emerald-50 text-emerald-700",
        },
        {
          cells: ["Ăn trưa", "Ăn uống", "11/06/2026", "-85.000 đ"],
          status: "Thủ công",
          tone: "bg-sky-50 text-sky-700",
        },
        {
          cells: ["Grab di chuyển", "Di chuyển", "10/06/2026", "-126.000 đ"],
          status: "Đã phân loại",
          tone: "bg-teal-50 text-teal-700",
        },
        {
          cells: ["Thanh toán QR", "Chưa phân loại", "09/06/2026", "-240.000 đ"],
          status: "Cần xử lý",
          tone: "bg-amber-50 text-amber-700",
        },
      ]}
      sideTitle="Luồng tiền"
      sideDescription="Theo dõi tỷ trọng thu chi và nhóm giao dịch cần xử lý trong tháng."
      sideItems={[
        {
          label: "Thu nhập",
          value: "74%",
          helper: "Lương, thưởng, hoàn tiền",
          progress: 74,
          tone: "bg-emerald-500",
        },
        {
          label: "Chi thiết yếu",
          value: "52%",
          helper: "Ăn uống, di chuyển, hóa đơn",
          progress: 52,
          tone: "bg-sky-500",
        },
        {
          label: "Cần phân loại",
          value: "5 mục",
          helper: "Ưu tiên xử lý trong ngày",
          progress: 28,
          tone: "bg-amber-400",
        },
      ]}
      bottomCards={[
        {
          title: "Lịch sử nhập liệu",
          description: "Theo dõi nguồn thủ công và tự động.",
          value: "2 nguồn",
          icon: CalendarRange,
        },
        {
          title: "Ví thanh toán",
          description: "Đồng bộ giao dịch ngân hàng và ví.",
          value: "3 ví",
          icon: WalletCards,
        },
        {
          title: "Luật phân loại",
          description: "Tự động nhận diện danh mục thường dùng.",
          value: "8 luật",
          icon: CreditCard,
        },
      ]}
    />
  );
}
