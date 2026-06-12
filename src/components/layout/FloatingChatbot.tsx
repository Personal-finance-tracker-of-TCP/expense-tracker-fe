"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X, Bot, Sparkles, AlertCircle } from "lucide-react";
import { ApiRequestError, authFetch, getCurrentDemoPeriod } from "@/lib/moneytrack-api";

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

type AiConnectionStatus = "checking" | "connected" | "unauthorized" | "not-configured" | "offline";

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Xin chào! Tôi là trợ lý tài chính AI của MoneyTrack. Tôi có thể giúp gì cho bạn hôm nay?",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<AiConnectionStatus>("checking");
  const [providerLabel, setProviderLabel] = useState("AI");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { month, year } = getCurrentDemoPeriod();
  const statusMeta: Record<AiConnectionStatus, { label: string; dotClass: string }> = {
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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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
          err instanceof ApiRequestError && err.status === 401 ? "unauthorized" : "offline"
        );
        console.error("AI status check failed:", err);
      }
    }

    void checkAiStatus();

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  // Listen for custom trigger events from other pages (e.g. AI Advisor Page)
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<{ query: string }>;
      setIsOpen(true);
      if (customEvent.detail?.query) {
        setInput(customEvent.detail.query);
        // We can focus input after animation
        setTimeout(() => {
          const inputEl = document.getElementById("chatbot-input");
          if (inputEl) inputEl.focus();
        }, 150);
      }
    };

    window.addEventListener("open-chatbot", handleOpenChat);
    return () => {
      window.removeEventListener("open-chatbot", handleOpenChat);
    };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setError(null);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history for backend prompt
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          text: m.text,
        }))
        .slice(-6); // Only send last 6 messages to keep context concise

      const result = await authFetch<ChatApiResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userText,
          history,
          month,
          year,
        }),
      });

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: result.text || "Tôi không có câu trả lời cho câu hỏi này.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError("Không thể kết nối với trợ lý AI. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer"
        aria-label="Mở trợ lý AI"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform rotate-0 scale-100" />
        ) : (
          <MessageSquare className="h-6 w-6 transition-transform" />
        )}
      </button>

      {/* Chat window panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] sm:w-[380px] h-[520px] bg-white rounded-3xl border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <Bot className="h-5.5 w-5.5" />
                <span className={`absolute bottom-[-1px] right-[-1px] block h-3 w-3 rounded-full border-2 border-slate-900 ${statusMeta[connectionStatus].dotClass}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-1.5 leading-none">
                  Trợ lý tài chính AI <Sparkles className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide mt-1 block">
                  {statusMeta[connectionStatus].label}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-xl hover:bg-white/5"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                >
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                      AI
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed font-medium shadow-sm ${
                      isUser
                        ? "bg-slate-900 text-white rounded-tr-none"
                        : "bg-white text-slate-800 border border-slate-200/60 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isUser ? "text-slate-400" : "text-slate-400"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Loading state */}
            {loading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold animate-pulse">
                  AI
                </div>
                <div className="bg-white text-slate-800 border border-slate-200/60 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-3 text-xs font-semibold text-red-700 flex items-start gap-2 shadow-sm">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input form */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
          >
            <input
              id="chatbot-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi trợ lý AI về tài chính..."
              className="flex-1 h-10 px-4 rounded-xl border border-slate-200/80 text-xs font-semibold outline-none ring-slate-100 focus:border-slate-300 focus:ring-4 transition-all duration-200"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
