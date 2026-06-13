"use server";

import { z } from "zod";

import { getApiBaseUrl } from "@/lib/api-url";
import { getServerAccessToken } from "@/lib/server-api";

const optionalText = (maxLength: number, message: string) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }, z.string().max(maxLength, message).optional());

const feedbackSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Tiêu đề phải có ít nhất 3 ký tự")
    .max(100, "Tiêu đề tối đa 100 ký tự"),
  message: z
    .string()
    .trim()
    .min(10, "Nội dung phải có ít nhất 10 ký tự")
    .max(500, "Nội dung tối đa 500 ký tự"),
  type: z.enum(["BUG", "FEATURE", "OTHER"]).default("OTHER"),
  rating: z.coerce
    .number({ message: "Đánh giá phải là số" })
    .int("Đánh giá phải là số nguyên")
    .min(1, "Đánh giá tối thiểu là 1")
    .max(5, "Đánh giá tối đa là 5"),
  senderName: optionalText(100, "Tên người gửi tối đa 100 ký tự"),
  senderEmail: optionalText(150, "Email người gửi tối đa 150 ký tự"),
});

export type FeedbackActionState = {
  success: boolean;
  message: string;
  errors?: {
    title?: string;
    message?: string;
    rating?: string;
    type?: string;
  };
  values?: {
    title?: string;
    message?: string;
    rating?: string;
    type?: string;
  };
};

type FeedbackApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

function getBackendUrl(path: string) {
  return `${getApiBaseUrl()}${path}`;
}

async function parseFeedbackResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as FeedbackApiEnvelope;
  } catch {
    return { message: text } satisfies FeedbackApiEnvelope;
  }
}

export async function submitFeedbackAction(
  _prevState: FeedbackActionState,
  formData: FormData
): Promise<FeedbackActionState> {
  const values = {
    title: String(formData.get("title") || ""),
    message: String(formData.get("message") || ""),
    rating: String(formData.get("rating") || ""),
    type: String(formData.get("type") || "OTHER"),
    senderName: String(formData.get("senderName") || ""),
    senderEmail: String(formData.get("senderEmail") || ""),
  };

  const parsed = feedbackSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Vui lòng kiểm tra lại thông tin phản hồi.",
      errors: {
        title: fieldErrors.title?.[0],
        message: fieldErrors.message?.[0],
        rating: fieldErrors.rating?.[0],
        type: fieldErrors.type?.[0],
      },
      values,
    };
  }

  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    return {
      success: false,
      message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      values,
    };
  }

  try {
    const response = await fetch(getBackendUrl("/api/feedback"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(parsed.data),
    });
    const json = await parseFeedbackResponse(response);

    if (!response.ok || json?.success === false) {
      return {
        success: false,
        message: json?.message || "Không thể gửi phản hồi tới admin.",
        values,
      };
    }

    return {
      success: true,
      message: "Phản hồi đã được gửi tới admin.",
      values: {
        title: "",
        message: "",
        rating: "5",
        type: "OTHER",
      },
    };
  } catch {
    return {
      success: false,
      message: "Không thể kết nối backend để gửi phản hồi.",
      values,
    };
  }
}
