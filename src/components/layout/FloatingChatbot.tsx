"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  Bot,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import {
  ApiRequestError,
  authFetch,
  getCurrentDemoPeriod,
} from "@/lib/moneytrack-api";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
};

type ChatApiResponse = {
  text: string;
  source: string;
};

type AiStatusResponse = {
  provider: string;
  model: string;
  configured: boolean;
  hasGeminiApiKey: boolean;
  hasFetch: boolean;
};

type AiConnectionStatus =
  | "checking"
  | "connected"
  | "unauthorized"
  | "not-configured"
  | "offline";

const AI_CONNECTION_ERROR =
  "Hiện chưa thể kết nối tới AI. Vui lòng thử lại sau.";

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Xin chào! Tôi là cố vấn AI tài chính của bạn. Bạn muốn xem dòng tiền, ngân sách hay giao dịch nào trước?",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<AiConnectionStatus>("checking");
  const [providerLabel, setProviderLabel] = useState("AI");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { month, year } = getCurrentDemoPeriod();
  const statusMeta: Record<
    AiConnectionStatus,
    { label: string; dotClass: string }
  > = {
    checking: {
      label: `Đang kiểm tra · ${providerLabel}`,
      dotClass: "bg-amber-300",
    },
    connected: {
      label: `Đã kết nối · ${providerLabel.toUpperCase()}`,
      dotClass: "bg-emerald-400",
    },
    unauthorized: {
      label: "Cần đăng nhập · AI",
      dotClass: "bg-amber-300",
    },
    "not-configured": {
      label: "Chưa cấu hình · AI",
      dotClass: "bg-slate-400",
    },
    offline: {
      label: "Mất kết nối · AI",
      dotClass: "bg-rose-400",
    },
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isActive = true;

    async function checkAiStatus() {
      setConnectionStatus("checking");

      try {
        const status = await authFetch<AiStatusResponse>("/api/ai/status");
        if (!isActive) return;

        setProviderLabel(status.provider || "AI");
        setConnectionStatus(status.configured ? "connected" : "not-configured");
      } catch (err) {
        if (!isActive) return;

        setConnectionStatus(
          err instanceof ApiRequestError && err.status === 401
            ? "unauthorized"
            : "offline"
        );
      }
    }

    void checkAiStatus();

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<{ query: string }>;
      setIsOpen(true);

      if (customEvent.detail?.query) {
        setInput(customEvent.detail.query);
        window.setTimeout(() => {
          document.getElementById("chatbot-input")?.focus();
        }, 150);
      }
    };

    window.addEventListener("open-chatbot", handleOpenChat);

    return () => {
      window.removeEventListener("open-chatbot", handleOpenChat);
    };
  }, []);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setError(null);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date(),
    };

    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      const history = messages
        .filter((message) => message.id !== "welcome")
        .map((message) => ({
          role: message.sender === "user" ? "user" : "model",
          text: message.text,
        }))
        .slice(-6);

      const result = await authFetch<ChatApiResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userText,
          history,
          month,
          year,
        }),
      });

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text:
          result.text ||
          "Tôi chưa có câu trả lời phù hợp cho câu hỏi này. Bạn thử hỏi cụ thể hơn nhé.",
        timestamp: new Date(),
      };

      setMessages((current) => [...current, botMessage]);
    } catch {
      setError(AI_CONNECTION_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 transition-all duration-200 hover:scale-105 hover:bg-emerald-600 active:scale-95 sm:right-6"
        aria-label={isOpen ? "Đóng cố vấn AI" : "Mở cố vấn AI"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {isOpen ? (
        <div className="fixed bottom-24 right-4 z-50 flex h-[520px] max-h-[calc(100vh-7rem)] w-[calc(100vw-2rem)] max-w-[380px] animate-in flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl duration-200 fade-in slide-in-from-bottom-5 dark:border-slate-800 dark:bg-slate-900 sm:right-6">
          <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <Bot className="h-5 w-5" />
                <span
                  className={`absolute bottom-[-1px] right-[-1px] block h-3 w-3 rounded-full border-2 border-slate-950 ${statusMeta[connectionStatus].dotClass}`}
                />
              </div>
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-bold leading-none">
                  Cố vấn AI tài chính
                  <Sparkles className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                </h3>
                <span className="mt-1 block text-[10px] font-semibold tracking-wide text-slate-400">
                  {statusMeta[connectionStatus].label}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Đóng cố vấn AI"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/60">
            {messages.map((message) => {
              const isUser = message.sender === "user";

              return (
                <div
                  key={message.id}
                  className={`flex max-w-[85%] gap-2.5 ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {!isUser ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                      AI
                    </div>
                  ) : null}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs font-medium leading-relaxed shadow-sm ${
                      isUser
                        ? "rounded-tr-none bg-slate-950 text-white"
                        : "rounded-tl-none border border-slate-200/60 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    <span className="mt-1 block text-right text-[9px] text-slate-400">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="mr-auto flex max-w-[85%] gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                  AI
                </div>
                <div className="rounded-2xl rounded-tl-none border border-slate-200/60 bg-white px-4 py-3 text-xs font-bold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  AI đang phân tích...
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700 shadow-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
          >
            <input
              id="chatbot-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Hỏi cố vấn AI về tài chính của bạn..."
              className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200/80 px-4 text-xs font-semibold outline-none ring-slate-100 transition-all duration-200 focus:border-slate-300 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white transition-all hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
              aria-label="Gửi câu hỏi"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
