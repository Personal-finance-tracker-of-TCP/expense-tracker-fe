# MoneyTrack / FinTrack Frontend

MoneyTrack / FinTrack là giao diện web quản lý tài chính cá nhân cho đồ án INT1334 Lập trình Web. Frontend dùng Next.js App Router để phục vụ người dùng cuối và admin, kết nối với backend Express/Prisma qua REST API.

## Tech Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, shadcn-style components, lucide-react
- NextAuth cho Google OAuth và session phía frontend
- Axios/authFetch cho REST API backend
- React Hook Form, Zod cho form validation
- Zustand cho trạng thái layout/auth
- Recharts cho dashboard/report charts
- Sonner toast, next-themes dark mode

## Tính Năng User

- Đăng ký, đăng nhập, đăng nhập Google, quên mật khẩu bằng OTP.
- Dashboard tổng quan thu chi, số dư, biểu đồ và giao dịch gần đây.
- Quản lý giao dịch thủ công: tạo, xem chi tiết, phân loại, xóa.
- Quản lý danh mục và ngân sách.
- Báo cáo tài chính, xuất PDF/Excel từ backend.
- AI Advisor/Chatbot tư vấn chi tiêu.
- Liên kết BankHub/SePay, nhận giao dịch webhook và notification.
- Chuông thông báo gọi `GET /api/notifications` và poll định kỳ.
- Trang feedback gửi bằng Server Action.

## Tính Năng Admin

- Dashboard thống kê nền tảng.
- Quản lý user đã liên kết BankHub.
- BankHub Sandbox để tạo giao dịch mô phỏng, chờ webhook SePay và kiểm tra logs.
- Xem SePay logs.
- Tạo/quản lý notification admin.
- Quản lý feedback.

## Cài Đặt Local

Yêu cầu:

- Node.js 20+
- Backend chạy tại `http://localhost:5000`

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`.

## Biến Môi Trường

Xem [.env.example](./.env.example). Các giá trị bắt buộc khi chạy local:

| Biến | Mô tả |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL backend Express, ví dụ `http://localhost:5000`. |
| `NEXTAUTH_URL` | URL frontend, ví dụ `http://localhost:3000`. |
| `NEXTAUTH_SECRET` | Secret cho NextAuth, dùng chuỗi placeholder khi local. |
| `OAUTH_EXCHANGE_SECRET` | Secret chia sẻ với backend nếu bật Google OAuth exchange. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID, để trống nếu không demo Google. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret, để trống nếu không demo Google. |

Không commit `.env.local` hoặc key thật.

## Scripts

```bash
npm run dev      # chạy development server
npm run lint     # ESLint
npm run build    # production build
npm run start    # chạy build production
```

## Rendering Strategy

- Landing/public routes dùng App Router static rendering/metadata mặc định.
- Dashboard, transactions, categories, budgets, reports, AI Advisor, profile, admin pages là client-auth/data pages, gọi backend sau khi user đăng nhập.
- `/statistics` dùng ISR với `revalidate = 60`.
- `/system-status` dùng dynamic rendering với `force-dynamic`.
- `/transactions/[id]` là dynamic route để xem chi tiết giao dịch.

## Advanced Features

- Charts bằng Recharts ở dashboard/report widgets.
- PDF/Excel export do backend tạo và frontend tải xuống.
- AI Advisor/Chatbot gọi backend `/api/ai/*`.
- BankHub Sandbox admin tạo giao dịch mô phỏng qua backend.
- SePay webhook logs hiển thị ở admin.
- NotificationBell poll backend mỗi 30 giây.
- Dark mode/theme qua provider.

## Demo Accounts

Sau khi backend chạy `npx prisma db seed`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@moneytrack.local` | `12345678` |
| User | `user@moneytrack.local` | `12345678` |

## Demo Script Bảo Vệ

1. Đăng nhập user `user@moneytrack.local`.
2. Mở Dashboard để xem tổng quan, chart và giao dịch gần đây.
3. Vào Transactions, click một giao dịch để mở `/transactions/[id]`.
4. Demo phân loại giao dịch chưa phân loại, xóa giao dịch thủ công có confirm.
5. Vào Reports, tải PDF và Excel.
6. Vào AI Advisor, gửi câu hỏi tư vấn.
7. Đăng nhập admin, mở BankHub Sandbox.
8. Chọn user đã liên kết BankHub, nhập `1000000`, tạo giao dịch sandbox.
9. Mở SePay Logs để xem webhook.
10. Quay lại user, kiểm tra NotificationBell nhận thông báo mới.

## Backend Link

Frontend cần backend MoneyTrack/FinTrack chạy và cấu hình `NEXT_PUBLIC_API_URL`. Local mặc định:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Production nên cấu hình URL backend đã deploy trên Render/Railway hoặc nền tảng tương đương.
