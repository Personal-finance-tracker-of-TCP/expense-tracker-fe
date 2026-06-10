"use server";

import { z } from "zod";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  rating: z.coerce
    .number({ message: "Rating phải là số" })
    .int("Rating phải là số nguyên")
    .min(1, "Rating tối thiểu là 1")
    .max(5, "Rating tối đa là 5"),
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
  };
  values?: {
    title?: string;
    message?: string;
    rating?: string;
  };
};

type FeedbackApiEnvelope = {
  success?: boolean;
  message?: string;
  data?: unknown;
};

function getBackendUrl(path: string) {
  return `${API_URL.replace(/\/+$/, "")}${path}`;
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

// Server Action dùng để đáp ứng yêu cầu Next.js: client không gọi trực tiếp REST API.
export async function submitFeedbackAction(
  _prevState: FeedbackActionState,
  formData: FormData
): Promise<FeedbackActionState> {
  const values = {
    title: String(formData.get("title") || ""),
    message: String(formData.get("message") || ""),
    rating: String(formData.get("rating") || ""),
    senderName: String(formData.get("senderName") || ""),
    senderEmail: String(formData.get("senderEmail") || ""),
  };

  const parsed = feedbackSchema.safeParse(values);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message: "Vui lòng kiểm tra lại thông tin feedback.",
      errors: {
        title: fieldErrors.title?.[0],
        message: fieldErrors.message?.[0],
        rating: fieldErrors.rating?.[0],
      },
      values,
    };
  }

  try {
    const response = await fetch(getBackendUrl("/api/feedback"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(parsed.data),
    });
    const json = await parseFeedbackResponse(response);

    if (!response.ok || json?.success === false) {
      return {
        success: false,
        message: json?.message || "Không thể gửi feedback tới admin.",
        values,
      };
    }

    return {
      success: true,
      message: "Feedback đã được gửi tới admin.",
      values: {
        title: "",
        message: "",
        rating: "5",
      },
    };
  } catch {
    return {
      success: false,
      message: "Không thể kết nối backend để gửi feedback.",
      values,
    };
  }
}
