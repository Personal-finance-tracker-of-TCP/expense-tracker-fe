import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";

export default function ChangePasswordPage() {
  return (
    <ChangePasswordForm
      backHref="/profile"
      backLabel="Hồ sơ"
      eyebrow="Bảo mật tài khoản"
    />
  );
}
