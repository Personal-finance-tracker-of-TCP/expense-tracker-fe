import type { DefaultSession } from "next-auth";
import type { User } from "@/lib/auth";

declare module "next-auth" {
  interface Session {
    backendAccessToken?: string;
    backendRefreshToken?: string;
    backendUser?: User;
    oauthError?: string;
    user?: DefaultSession["user"] & {
      id?: string;
      role?: User["role"];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendAccessToken?: string;
    backendRefreshToken?: string;
    backendUser?: User;
    oauthError?: string;
  }
}
