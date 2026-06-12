export type UserRole = "USER" | "ADMIN";

export interface ApiUser {
  id: string;
  name?: string | null;
  fullName?: string | null;
  email: string;
  role: UserRole;
  sepayCode?: string | null;
  bankhubAccountXid?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  sepayLinkedAt?: string | null;
  avatarUrl?: string | null;
  balance?: string | number | null;
  provider?: string | null;
  createdAt?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sepayCode?: string | null;
  bankhubAccountXid?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  sepayLinkedAt?: string | null;
  avatarUrl?: string | null;
  balance?: string | number | null;
  provider?: string | null;
  createdAt?: string | null;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string | string[];
}

export interface AuthPayload {
  user: ApiUser;
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshPayload {
  accessToken: string;
  refreshToken?: string;
}

export const ACCESS_TOKEN_COOKIE = "access_token";

export function normalizeUser(user: ApiUser): User {
  const fallbackName = user.email?.split("@")[0] || "Người dùng";
  const name = user.name || user.fullName || fallbackName;

  return {
    id: user.id,
    name,
    email: user.email,
    role: user.role,
    sepayCode: user.sepayCode ?? null,
    bankhubAccountXid: user.bankhubAccountXid ?? null,
    bankAccountNumber: user.bankAccountNumber ?? null,
    bankName: user.bankName ?? null,
    bankAccountName: user.bankAccountName ?? null,
    sepayLinkedAt: user.sepayLinkedAt ?? null,
    avatarUrl: user.avatarUrl ?? null,
    balance: user.balance ?? null,
    provider: user.provider ?? null,
    createdAt: user.createdAt ?? null,
  };
}

export function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "NU";
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
