"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  X,
  Send,
  Sparkles,
  User,
  Paperclip,
  Mic,
  GraduationCap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
};

// ─── Quick Action Chips ───────────────────────────────────────────
const QUICK_ACTIONS = [
  { emoji: "📊", label: "Xem GPA",       message: "GPA tích lũy của tôi hiện tại là bao nhiêu?" },
  { emoji: "⚠️", label: "Môn nợ",        message: "Tôi đang nợ hoặc rớt những môn nào?" },
  { emoji: "🎓", label: "Gợi ý kỳ tới", message: "Gợi ý môn học phù hợp cho học kỳ tới của tôi?" },
  { emoji: "📈", label: "Dự báo điểm",  message: "Dự báo điểm cuối kỳ các môn tôi đang học?" },
];

// ─── Typing Indicator (3 chấm nảy) ───────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20">
        <GraduationCap className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-slate-700/50 bg-slate-800/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-2 w-2 rounded-full bg-blue-400"
              style={{ animation: `typingBounce 1.2s ease-in-out ${delay}ms infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Markdown Bubble ───────────────────────────────────────────
function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20">
        <GraduationCap className="h-3.5 w-3.5" />
      </div>
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-slate-700/40 bg-slate-800/80 px-4 py-2.5 text-[13px] leading-relaxed text-slate-300 backdrop-blur-sm shadow-sm">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Strong / bold
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
            // Danh sách
            ul: ({ children }) => (
              <ul className="mt-1 space-y-0.5 pl-4 list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mt-1 space-y-0.5 pl-4 list-decimal">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-slate-300">{children}</li>
            ),
            // Paragraph
            p: ({ children }) => (
              <p className="mb-1.5 last:mb-0">{children}</p>
            ),
            // Code inline
            code: ({ children }) => (
              <code className="rounded bg-slate-700/60 px-1 py-0.5 font-mono text-[11px] text-blue-300">
                {children}
              </code>
            ),
            // Bảng (GFM)
            table: ({ children }) => (
              <div className="mt-2 overflow-x-auto rounded-lg border border-slate-700/50">
                <table className="w-full text-[12px]">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-slate-700/50">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="px-3 py-1.5 text-left font-semibold text-slate-200">{children}</th>
            ),
            td: ({ children }) => (
              <td className="border-t border-slate-700/40 px-3 py-1.5 text-slate-300">{children}</td>
            ),
            // Blockquote
            blockquote: ({ children }) => (
              <blockquote className="mt-1 border-l-2 border-blue-400/50 pl-3 text-slate-400 italic">
                {children}
              </blockquote>
            ),
            // Horizontal rule
            hr: () => <hr className="my-2 border-slate-700/50" />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ─── User Bubble ──────────────────────────────────────────────────
function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2.5 text-[13px] leading-relaxed text-white shadow-sm shadow-blue-500/20">
        {text}
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-700/80 text-slate-300">
        <User className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Xin chào! 👋 Mình là **Trợ lý MYDTU AI**.\nMình có thể tư vấn lộ trình học, kiểm tra GPA, dự báo điểm và phân tích rủi ro dựa trên dữ liệu học tập **thực** của bạn.\n\nBạn cần giúp gì nào?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Auto-scroll: cuộn xuống mỗi khi messages hoặc isTyping đổi ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Auto-focus input khi mở chat ─────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 320);
  }, [isOpen]);

  // ── Send message ─────────────────────────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      const history = updatedMessages
        .slice(1, -1)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      const json = await res.json();

      // Xử lý lỗi từ API (ok: false hoặc HTTP error)
      if (!res.ok || json.ok === false) {
        const errMsg = json.message || json.error || `HTTP ${res.status}`;
        console.error("[chat] API error:", errMsg, json);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "ai",
            text: `⚠️ **Lỗi từ server:** ${errMsg}`,
          },
        ]);
        return;
      }

      // Đọc đúng field reply (backend trả về { ok: true, reply: "..." })
      const replyText =
        json.reply ??
        json.response ??
        json.text ??
        "Xin lỗi, mình chưa nhận được phản hồi. Bạn thử lại nhé!";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: replyText,
        },
      ]);
    } catch (err) {
      console.error("[chat] fetch error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "⚠️ Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại!",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .chat-open { animation: slideUp 0.25s ease-out forwards; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .chat-body::-webkit-scrollbar { width: 4px; }
        .chat-body::-webkit-scrollbar-track { background: transparent; }
        .chat-body::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
      `}</style>

      {/* ── FAB Button ────────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-2xl shadow-blue-600/40 transition-all duration-300 hover:scale-110 hover:shadow-blue-600/60 active:scale-95 ${
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        }`}
        aria-label="Mở trợ lý AI"
      >
        <Sparkles className="h-6 w-6" />
        <span className="absolute h-14 w-14 rounded-full bg-blue-500/30 animate-ping" />
      </button>

      {/* ── Chat Window ────────────────────────────────────────────── */}
      {isOpen && (
        <div className="chat-open fixed bottom-6 right-6 z-[100] flex h-[560px] w-[375px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">

          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-violet-600 px-4 py-3">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/20 shadow-inner backdrop-blur-sm">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight text-white">Trợ lý MYDTU</h3>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isTyping ? "animate-pulse bg-amber-400" : "bg-emerald-400"
                    }`}
                  />
                  <span className="text-[10px] font-medium text-white/80">
                    {isTyping ? "Đang trả lời..." : "Trực tuyến · AI Nội bộ"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Đóng chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Body — auto-scroll */}
          <div className="chat-body flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg) =>
                msg.sender === "ai" ? (
                  <AiBubble key={msg.id} text={msg.text} />
                ) : (
                  <UserBubble key={msg.id} text={msg.text} />
                )
              )}

              {/* Loading Indicator */}
              {isTyping && <TypingIndicator />}

              {/* Quick Actions — chỉ hiện sau tin nhắn đầu */}
              {messages.length <= 1 && !isTyping && (
                <div className="pt-1">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Hỏi nhanh
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => sendMessage(action.message)}
                        disabled={isTyping}
                        className="group relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left backdrop-blur-md transition-all duration-200 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-md hover:shadow-blue-500/10 active:scale-95 disabled:opacity-40"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-violet-600/10 opacity-0 transition-opacity group-hover:opacity-100" />
                        <div className="relative">
                          <span className="block text-base leading-none mb-1">{action.emoji}</span>
                          <span className="block whitespace-nowrap text-[11px] font-semibold text-slate-300 transition-colors group-hover:text-blue-300">
                            {action.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer / Input */}
          <div className="shrink-0 border-t border-slate-800 bg-slate-950/80 p-3 backdrop-blur-sm">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/60 px-2 py-1.5 transition-all focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10"
            >
              <button
                type="button"
                title="Đính kèm tệp"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isTyping ? "AI đang trả lời..." : "Nhập câu hỏi..."}
                disabled={isTyping}
                className="flex-1 bg-transparent text-[13px] text-slate-200 outline-none placeholder:text-slate-500 disabled:opacity-40"
              />

              <button
                type="button"
                title="Ghi âm"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-700/50 hover:text-slate-300"
              >
                <Mic className="h-4 w-4" />
              </button>

              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm shadow-blue-500/20 transition-all hover:scale-105 hover:shadow-blue-500/40 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
            <p className="mt-1.5 text-center text-[9px] text-slate-600">
              Powered by MYDTU AI · Dữ liệu học tập cá nhân
            </p>
          </div>
        </div>
      )}
    </>
  );
}
