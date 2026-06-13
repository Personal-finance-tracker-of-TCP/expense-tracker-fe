"use client";

import { useActionState, useEffect, useRef } from "react";
import { MessageSquareText, Send, Star } from "lucide-react";
import { toast } from "sonner";

import {
  submitFeedbackAction,
  type FeedbackActionState,
} from "@/app/actions/feedback.actions";
import { useAuthStore } from "@/store/authStore";

const initialFeedbackState: FeedbackActionState = {
  success: false,
  message: "",
  values: {
    rating: "5",
  },
};

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Send className="h-4 w-4" />
      {pending ? "Đang gửi feedback..." : "Gửi feedback"}
    </button>
  );
}

export default function FeedbackPage() {
  const user = useAuthStore((state) => state.user);
  const [state, formAction, pending] = useActionState(
    submitFeedbackAction,
    initialFeedbackState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.success("Feedback đã được gửi tới admin.");
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state.message, state.success]);

  return (
    <main className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
            <MessageSquareText className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase text-emerald-600">
              Server Action Demo
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Feedback
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Form này submit bằng Next.js Server Action. Client không gọi trực
              tiếp REST API; action validate bằng Zod rồi gửi feedback tới
              backend để tạo notification cho admin.
            </p>
          </div>
        </div>
      </section>

      <form
        ref={formRef}
        action={formAction}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="senderName" value={user?.name || ""} />
        <input type="hidden" name="senderEmail" value={user?.email || ""} />

        <div className="space-y-5">
          <label className="block text-sm font-semibold text-slate-700">
            Tiêu đề
            <input
              name="title"
              defaultValue={state.success ? "" : state.values?.title || ""}
              placeholder="Ví dụ: Góp ý về dashboard"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-emerald-100 transition focus:border-emerald-400 focus:bg-white focus:ring-4"
            />
            {state.errors?.title ? (
              <span className="mt-1 block text-xs font-semibold text-red-600">
                {state.errors.title}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Nội dung
            <textarea
              name="message"
              defaultValue={state.success ? "" : state.values?.message || ""}
              placeholder="Bạn muốn FinTrack cải thiện điều gì?"
              rows={6}
              maxLength={500}
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none ring-emerald-100 transition focus:border-emerald-400 focus:bg-white focus:ring-4"
            />
            {state.errors?.message ? (
              <span className="mt-1 block text-xs font-semibold text-red-600">
                {state.errors.message}
              </span>
            ) : null}
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">
              Rating
            </legend>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label
                  key={rating}
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-xs font-bold text-slate-600 transition-colors has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700"
                >
                  <input
                    type="radio"
                    name="rating"
                    value={rating}
                    defaultChecked={Number(state.values?.rating || 5) === rating}
                    className="sr-only"
                  />
                  <Star className="h-4 w-4 fill-current" />
                  {rating}
                </label>
              ))}
            </div>
            {state.errors?.rating ? (
              <span className="mt-1 block text-xs font-semibold text-red-600">
                {state.errors.rating}
              </span>
            ) : null}
          </fieldset>
        </div>

        {state.message ? (
          <div
            className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              state.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className="mt-6">
          <SubmitButton pending={pending} />
        </div>
      </form>

      <aside className="space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Checklist đồ án</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Có file action với &quot;use server&quot;.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Client không gọi REST API; Server Action gọi backend.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Validate title, message, rating bằng Zod.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Backend tạo notification type FEEDBACK cho admin.
            </li>
          </ul>
        </section>
      </aside>
    </main>
  );
}
