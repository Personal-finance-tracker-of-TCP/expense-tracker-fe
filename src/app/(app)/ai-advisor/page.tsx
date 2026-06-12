import {
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  PiggyBank,
  Send,
  Sparkles,
  Target,
} from "lucide-react";

const insightCards = [
  {
    title: "Khả năng tiết kiệm",
    value: "2.4M đ",
    description: "Có thể tối ưu từ ăn uống, mua sắm và giải trí.",
    icon: PiggyBank,
    tone: "from-emerald-500 to-teal-500",
  },
  {
    title: "Rủi ro vượt ngân sách",
    value: "Trung bình",
    description: "Mua sắm đang vượt 105% hạn mức tháng.",
    icon: Target,
    tone: "from-amber-400 to-orange-500",
  },
  {
    title: "Gợi ý ưu tiên",
    value: "3 mục",
    description: "Giảm chi nhỏ lặp lại trước khi cắt khoản lớn.",
    icon: Lightbulb,
    tone: "from-fuchsia-500 to-rose-500",
  },
];

const suggestions = [
  {
    title: "Giảm 15% ăn uống ngoài",
    description: "Đặt hạn mức ngày 120K đ cho các ngày trong tuần.",
    impact: "+620K đ",
  },
  {
    title: "Tạm khóa mua sắm tự phát",
    description: "Chờ 24 giờ trước khi xác nhận giao dịch không thiết yếu.",
    impact: "+840K đ",
  },
  {
    title: "Tăng chuyển khoản tiết kiệm đầu tháng",
    description: "Tự động trích 12% thu nhập vào mục tiêu tiết kiệm.",
    impact: "+1.0M đ",
  },
];

export default function AiAdvisorPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="grid gap-4 lg:grid-cols-3">
        {insightCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <section
              key={card.title}
              className="animate-rise rounded-[1.75rem] border border-white/80 bg-white/88 p-5 shadow-lg shadow-teal-950/[0.05] backdrop-blur"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {card.value}
                  </p>
                </div>
                <div
                  className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${card.tone}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {card.description}
              </p>
            </section>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="animate-rise rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-xl shadow-teal-950/[0.06] backdrop-blur sm:p-6">
          <div className="flex items-start gap-4 border-b border-teal-100 pb-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <BrainCircuit className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Trợ lý tài chính
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Nhập câu hỏi về chi tiêu, ngân sách hoặc kế hoạch tiết kiệm.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-teal-100 bg-slate-50/80 p-4">
            <div className="space-y-4">
              <div className="max-w-[78%] rounded-[1.5rem] bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                Tháng này tôi đang chi nhiều ở đâu?
              </div>
              <div className="ml-auto max-w-[82%] rounded-[1.5rem] bg-[linear-gradient(135deg,#0f766e,#2563eb)] px-4 py-3 text-sm leading-6 text-white shadow-lg shadow-teal-700/20">
                Nhóm ăn uống và mua sắm đang chiếm 53% tổng chi tiêu. Mua sắm
                đã vượt hạn mức, nên ưu tiên giảm nhóm này trước.
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 shadow-inner shadow-white/70">
              <Sparkles className="size-4 text-teal-600" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-400">
                Hỏi FinTrack về kế hoạch tài chính...
              </span>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-700"
                aria-label="Gửi câu hỏi"
              >
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <aside className="animate-rise rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-teal-950/[0.06] backdrop-blur [animation-delay:80ms]">
          <h2 className="text-2xl font-black text-slate-950">
            Kế hoạch đề xuất
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Các hành động nhỏ có thể áp dụng ngay trong tháng này.
          </p>

          <div className="mt-6 space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.title}
                className="rounded-[1.5rem] border border-teal-100 bg-slate-50/80 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <CheckCircle2 className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">
                        {suggestion.title}
                      </p>
                      <p className="shrink-0 text-sm font-black text-teal-700">
                        {suggestion.impact}
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
