import { cookies } from "next/headers";

import { type ApiEnvelope } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-url";

type ServerApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; message: string };

export async function getServerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}

export async function serverApiGet<T>(
  path: string
): Promise<ServerApiResult<T>> {
  const accessToken = await getServerAccessToken();

  if (!accessToken) {
    return { ok: false, status: 401, message: "Phiên đăng nhập đã hết hạn" };
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  }).catch(() => null);

  if (!response) {
    return {
      ok: false,
      status: 503,
      message: "Không thể kết nối máy chủ",
    };
  }

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

  if (!response.ok || !payload?.success) {
    const message = Array.isArray(payload?.message)
      ? payload?.message.join(", ")
      : payload?.message;

    return {
      ok: false,
      status: response.status,
      message: message || "Không thể tải dữ liệu",
    };
  }

  return {
    ok: true,
    status: response.status,
    data: payload.data,
  };
}
