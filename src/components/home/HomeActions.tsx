"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, LogOut } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { useLogout } from "@/hooks/useLogout";
import { ADMIN_HOME, USER_HOME } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";
import { useAuthStore, type User } from "@/store/authStore";

type SessionRole = User["role"] | null;

function getStoredRole(): SessionRole {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = localStorage.getItem("user");
    const role = storedUser
      ? (JSON.parse(storedUser) as { role?: string }).role
      : null;

    return role === "ADMIN" || role === "USER" ? role : null;
  } catch {
    return null;
  }
}

export function HomeActions() {
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useLogout("/");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    hydrateFromStorage();

    const mountTimer = window.setTimeout(() => {
      setHasMounted(true);
    }, 0);

    return () => {
      window.clearTimeout(mountTimer);
    };
  }, [hydrateFromStorage]);

  const role = useMemo<SessionRole>(() => {
    if (!hasMounted) {
      return null;
    }

    return user?.role || getStoredRole();
  }, [hasMounted, user?.role]);

  if (hasMounted && isAuthenticated && role) {
    const destination = role === "ADMIN" ? ADMIN_HOME : USER_HOME;

    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={destination}
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-11 bg-white px-5 text-base font-black text-teal-900 shadow-lg shadow-black/15 hover:bg-teal-50"
          )}
        >
          {role === "ADMIN" ? "Vào trang quản trị" : "Vào dashboard"}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={logout}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 border-white/20 bg-white/10 px-5 text-base font-black text-white backdrop-blur hover:bg-white/15"
          )}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link
        href="/register"
        className={cn(
          buttonVariants({ size: "lg" }),
          "h-11 bg-white px-5 text-base font-black text-teal-900 shadow-lg shadow-black/15 hover:bg-teal-50"
        )}
      >
        Bắt đầu miễn phí
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11 border-white/20 bg-white/10 px-5 text-base font-black text-white backdrop-blur hover:bg-white/15"
        )}
      >
        Đăng nhập
      </Link>
    </div>
  );
}
