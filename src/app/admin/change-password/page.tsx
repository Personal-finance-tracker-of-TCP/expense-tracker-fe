import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default function AdminChangePasswordPage() {
  return (
    <ChangePasswordForm
      backHref="/admin/platform-statistics"
      backLabel="Khu vực quản trị"
      eyebrow="Bảo mật quản trị"
    />
  );
}
