import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import {
  type ApiEnvelope,
  type ApiUser,
  type AuthPayload,
  normalizeUser,
} from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-url";

function getGoogleProfileValue(profile: unknown, key: string) {
  if (!profile || typeof profile !== "object") {
    return undefined;
  }

  const value = (profile as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function isGoogleEmailVerified(profile: unknown) {
  if (!profile || typeof profile !== "object") {
    return true;
  }

  const value = (profile as Record<string, unknown>).email_verified;
  return value !== false;
}

async function exchangeGoogleProfile(profile: unknown) {
  const email = getGoogleProfileValue(profile, "email");
  const name =
    getGoogleProfileValue(profile, "name") ||
    getGoogleProfileValue(profile, "given_name") ||
    email?.split("@")[0];
  const avatarUrl = getGoogleProfileValue(profile, "picture");

  if (!email || !name) {
    throw new Error("Google không trả về đủ email/họ tên");
  }

  if (!isGoogleEmailVerified(profile)) {
    throw new Error("Email Google chưa được xác minh");
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.OAUTH_EXCHANGE_SECRET
        ? { "x-oauth-exchange-secret": process.env.OAUTH_EXCHANGE_SECRET }
        : {}),
    },
    body: JSON.stringify({
      email,
      name,
      avatarUrl,
      provider: "google",
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiEnvelope<AuthPayload>;

  if (!response.ok || !payload.success) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(", ")
      : payload.message;
    throw new Error(message || "Không thể đăng nhập Google với backend");
  }

  return payload.data;
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: "select_account",
                access_type: "offline",
                response_type: "code",
              },
            },
          }),
        ]
      : [],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google") {
        try {
          const authData = await exchangeGoogleProfile(profile);
          token.backendAccessToken = authData.accessToken;
          token.backendRefreshToken = authData.refreshToken;
          token.backendUser = normalizeUser(authData.user as ApiUser);
          token.oauthError = undefined;
        } catch (error) {
          token.oauthError =
            error instanceof Error ? error.message : "Đăng nhập Google thất bại";
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.backendAccessToken =
        typeof token.backendAccessToken === "string"
          ? token.backendAccessToken
          : undefined;
      session.backendRefreshToken =
        typeof token.backendRefreshToken === "string"
          ? token.backendRefreshToken
          : undefined;
      session.backendUser = token.backendUser;
      session.oauthError =
        typeof token.oauthError === "string" ? token.oauthError : undefined;

      if (session.backendUser) {
        session.user = {
          ...session.user,
          id: session.backendUser.id,
          name: session.backendUser.name,
          email: session.backendUser.email,
          image: session.backendUser.avatarUrl ?? session.user?.image,
          role: session.backendUser.role,
        };
      }

      return session;
    },
  },
};
