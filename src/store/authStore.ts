import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: "USER" | "ADMIN";
  sepayCode?: string | null;
  bankhubAccountXid?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  sepayLinkedAt?: string | null;
  balance?: string | number | null;
  provider?: string | null;
  createdAt?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrateFromStorage: () => void;
  setAuth: (user: User, accessToken: string, refreshToken?: string | null) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const ACCESS_TOKEN_COOKIE = "access_token";
const USER_ROLE_COOKIE = "user_role";
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
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

function getStoredRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export function setAccessTokenCookie(accessToken: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(
    accessToken
  )}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Lax`;
}

export function setUserRoleCookie(role: User["role"]) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${USER_ROLE_COOKIE}=${encodeURIComponent(
    role
  )}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Lax`;
}

function removeAccessTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${USER_ROLE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function setStoredAuth(user: User, accessToken: string, refreshToken?: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.removeItem("adminAccessToken");
  sessionStorage.removeItem("adminAccessToken");

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  hydrateFromStorage: () => {
    const accessToken = getStoredAccessToken() || getCookieValue(ACCESS_TOKEN_COOKIE);
    const refreshToken = getStoredRefreshToken();
    const user = getStoredUser();

    if (!accessToken) {
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
      return;
    }

    setAccessTokenCookie(accessToken);
    if (user) {
      setUserRoleCookie(user.role);
    }

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },
  setAuth: (user, accessToken, refreshToken = null) => {
    setAccessTokenCookie(accessToken);
    setUserRoleCookie(user.role);
    setStoredAuth(user, accessToken, refreshToken ?? undefined);
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },
  setUser: (user) => {
    const state = get();
    const accessToken = state.accessToken;

    if (accessToken) {
      setStoredAuth(user, accessToken);
    } else if (typeof window !== "undefined") {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }

    set({
      user,
      isAuthenticated: true,
    });
  },
  clearAuth: () => {
    removeAccessTokenCookie();
    removeStoredAuth();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
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
