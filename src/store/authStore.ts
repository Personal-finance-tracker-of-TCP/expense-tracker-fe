// Optional js-cookie install command: npm install js-cookie @types/js-cookie
import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN";
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const ACCESS_TOKEN_COOKIE = "access_token";
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

function setAccessTokenCookie(accessToken: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(
    accessToken
  )}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Lax`;
}

function removeAccessTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => {
    setAccessTokenCookie(accessToken);
    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },
  clearAuth: () => {
    removeAccessTokenCookie();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : state.user,
    })),
}));
