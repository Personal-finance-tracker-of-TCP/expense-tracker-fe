import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: "USER" | "ADMIN";
  sepayCode?: string | null;
  bankAccountNumber?: string | null;
  sepayLinkedAt?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const ACCESS_TOKEN_COOKIE = "access_token";
const ACCESS_TOKEN_MAX_AGE = 60 * 15;
const ACCESS_TOKEN_STORAGE_KEY = "accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "refreshToken";
const USER_STORAGE_KEY = "user";
const AUTH_STORAGE_KEYS = [
  ACCESS_TOKEN_STORAGE_KEY,
  REFRESH_TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  "authUser",
  "currentUser",
  "adminAccessToken",
];

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

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

function setStoredAuth(user: User, accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
}

function removeStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

const storedUser = getStoredUser();
const storedAccessToken = getStoredAccessToken();

export const useAuthStore = create<AuthState>((set) => ({
  user: storedUser,
  accessToken: storedAccessToken,
  isAuthenticated: Boolean(storedAccessToken),
  setAuth: (user, accessToken, refreshToken) => {
    setAccessTokenCookie(accessToken);
    setStoredAuth(user, accessToken, refreshToken);
    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },
  clearAuth: () => {
    removeAccessTokenCookie();
    removeStoredAuth();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },
  updateUser: (partial) =>
    set((state) => {
      const user = state.user ? { ...state.user, ...partial } : state.user;

      if (typeof window !== "undefined" && user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }

      return { user };
    }),
}));
