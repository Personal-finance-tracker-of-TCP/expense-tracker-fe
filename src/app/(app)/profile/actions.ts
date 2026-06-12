"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  type ApiEnvelope,
  type ApiUser,
  type User,
  normalizeUser,
} from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/server-api";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: string;
  user?: User;
};

const profileSchema = z.object({
  name: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự").max(80),
});

const MAX_AVATAR_SIZE = 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message || "Dữ liệu hồ sơ không hợp lệ",
    };
  }

  const currentAvatarUrl = formData.get("currentAvatarUrl");
  const avatarFile = formData.get("avatarFile");
  let avatarUrl = typeof currentAvatarUrl === "string" ? currentAvatarUrl : "";

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!ALLOWED_AVATAR_TYPES.has(avatarFile.type)) {
      return {
        status: "error",
        message: "Ảnh đại diện chỉ hỗ trợ JPG, PNG, WebP hoặc GIF.",
      };
    }

    if (avatarFile.size > MAX_AVATAR_SIZE) {
      return {
        status: "error",
        message: "Ảnh đại diện tối đa 1MB. Vui lòng chọn ảnh nhẹ hơn.",
      };
    }

    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    avatarUrl = `data:${avatarFile.type};base64,${buffer.toString("base64")}`;
  }

  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    return {
      status: "error",
      message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    };
  }

  const response = await fetch(`${getApiBaseUrl()}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: parsed.data.name,
      avatarUrl,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<{ user: ApiUser }>
    | null;

  if (!response.ok || !payload?.success) {
    const message = Array.isArray(payload?.message)
      ? payload?.message.join(", ")
      : payload?.message;

    return {
      status: "error",
      message: message || "Không thể cập nhật hồ sơ",
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Cập nhật hồ sơ thành công",
    user: normalizeUser(payload.data.user),
  };
}
