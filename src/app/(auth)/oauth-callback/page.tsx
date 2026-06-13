"use client";

import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import { getPostLoginRedirect } from "@/lib/auth-redirect";
import { useAuthStore } from "@/store/authStore";

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const setAuth = useAuthStore((state) => state.setAuth);
  const requestedReturnUrl =
    searchParams.get("returnUrl") || searchParams.get("from");

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
      router.replace(
        getPostLoginRedirect(session.backendUser.role, requestedReturnUrl)
      );
      return;
    }

    void signOut({ redirect: false }).finally(() => {
      router.replace("/login?oauth=failed");
    });
  }, [requestedReturnUrl, router, session, setAuth, status]);

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="size-6 animate-spin text-blue-600" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-600">Đang đăng nhập...</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <OAuthCallbackContent />
    </Suspense>
  );
}
