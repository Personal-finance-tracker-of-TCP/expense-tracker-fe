"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/authStore";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (
      status === "authenticated" &&
      session?.backendUser &&
      session.backendAccessToken
    ) {
      setAuth(
        session.backendUser,
        session.backendAccessToken,
        session.backendRefreshToken
      );
      router.replace("/dashboard");
      return;
    }

    void signOut({ redirect: false }).finally(() => {
      router.replace("/login?oauth=failed");
    });
  }, [router, session, setAuth, status]);

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="size-6 animate-spin text-blue-600" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-600">Đang đăng nhập...</p>
    </div>
  );
}
