export const TRANSACTION_TYPES = {
  INCOME: 'Thu nhập',
  EXPENSE: 'Chi tiêu',
};

export const TRANSACTION_SOURCES = {
  MANUAL: 'Thủ công',
  SEPAY: 'SePay',
  SYSTEM: 'Hệ thống',
};

export const CLASSIFICATION_STATUS = {
  CLASSIFIED: 'Đã phân loại',
  UNCLASSIFIED: 'Chưa phân loại',
};

export const BUDGET_STATUS = {
  NORMAL: 'Bình thường',
  WARNING: 'Cảnh báo',
  EXCEEDED: 'Vượt hạn mức',
};

export const RISK_LEVELS = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
};

export const NOTIFICATION_TYPES = {
  SYSTEM: 'Hệ thống',
  BUDGET_WARNING: 'Cảnh báo ngân sách',
  BUDGET_EXCEEDED: 'Vượt ngân sách',
  NEW_TRANSACTION: 'Giao dịch mới',
};

export const FEEDBACK_TYPES = {
  BUG: 'Báo lỗi',
  FEATURE: 'Đề xuất tính năng',
  OTHER: 'Khác',
};

export const FEEDBACK_STATUS = {
  OPEN: 'Mở',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đóng',
};

export const ROLE_LABELS = {
  ADMIN: 'Quản trị viên',
  USER: 'Người dùng',
};

export const AI_PROVIDER = {
  RULE_BASED: 'Quy tắc cơ bản',
  GEMINI: 'Gemini',
};

export const getLabel = (dict: Record<string, string>, key: string | null | undefined, fallback: string = 'Không xác định') => {
  if (!key) return fallback;
  return dict[key] || fallback;
};

export const formatCurrency = (amount: number | string) => {
  const num = Number(amount);
  if (isNaN(num)) return '0 ₫';
  return num.toLocaleString('vi-VN') + ' ₫';
};

export const formatDate = (dateString: string | Date) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
};
