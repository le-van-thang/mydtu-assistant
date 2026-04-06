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
  Camera,
  Mic,
  GraduationCap,
  Menu,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
  image?: string; // Base64 image
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
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm border border-slate-700/50 bg-[#1e293b]/95 px-4 py-2.5 text-[13px] leading-relaxed text-slate-300 shadow-sm">
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
function UserBubble({ text, image }: { text: string; image?: string }) {
  return (
    <div className="flex items-end justify-end gap-2">
      <div className="flex max-w-[78%] flex-col items-end gap-1.5">
        {image && (
          <div className="relative overflow-hidden rounded-xl border border-slate-700/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="User upload" className="max-h-40 max-w-full object-cover" />
          </div>
        )}
        {text && (
          <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2.5 text-[13px] leading-relaxed text-white shadow-sm shadow-blue-500/20">
            {text}
          </div>
        )}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Xin chào! 👋 Mình là **Trợ lý MYDTU AI**.\nMình có thể tư vấn lộ trình học, kiểm tra GPA, dự báo điểm và phân tích rủi ro dựa trên dữ liệu học tập **thực** của bạn.\n\nBạn cần giúp gì nào?",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auto-scroll: cuộn xuống mỗi khi messages hoặc isTyping đổi ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Auto-focus input khi mở chat ─────────────────────────────────
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 320);
  }, [isOpen]);

  // ── Handle Image Selection ───────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      inputRef.current?.focus();
    };
    reader.readAsDataURL(file);
    
    // Reset input file
    e.target.value = '';
  };

  // ── Send message ─────────────────────────────────────────────────
  const sendMessage = async (text: string, imageStr: string | null = null) => {
    if ((!text.trim() && !imageStr) || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text, image: imageStr || undefined };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setSelectedImage(null); // Clear preview sau khi gửi
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
    sendMessage(inputValue, selectedImage);
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
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/20 shadow-inner backdrop-blur-sm">
                <Bot className="h-5 w-5 text-white" />
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

          <div className="relative flex-1 overflow-hidden">
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
              <div 
                className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar Drawer */}
            <div 
              className={`absolute bottom-0 left-0 top-0 z-30 w-[260px] border-r border-slate-700/50 bg-[#0f172a] shadow-xl transition-transform duration-300 ease-in-out ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-700/50 p-4">
                <span className="text-sm font-semibold text-slate-200">Lịch sử trò chuyện</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-1 p-2">
                {/* Mock History Items */}
                <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/60">
                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate">Hỏi điểm kỳ trước</span>
                </button>
                <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/60">
                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate">Bài toán giải tích</span>
                </button>
                <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/60">
                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                  <span className="truncate">Tư vấn chọn chuyên ngành</span>
                </button>
              </div>
            </div>

            {/* Messages Body — auto-scroll */}
            <div className="chat-body h-full overflow-y-auto p-4">
              <div className="flex flex-col gap-4">
                {messages.map((msg) =>
                  msg.sender === "ai" ? (
                    <AiBubble key={msg.id} text={msg.text} />
                  ) : (
                    <UserBubble key={msg.id} text={msg.text} image={msg.image} />
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
          </div>

          {/* Footer / Input */}
          <div className="shrink-0 border-t border-slate-700/60 bg-slate-900 px-3 py-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] z-10">
            {/* Image Preview Area */}
            {selectedImage && (
              <div className="mb-3 flex items-start">
                <div className="relative inline-block rounded-xl border border-slate-700 bg-slate-800/50 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImage} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-slate-300 shadow-md hover:bg-red-500 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSend}
              className="flex items-end gap-2 rounded-2xl border border-slate-700/80 bg-[#1e293b]/80 p-1.5 transition-all focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10"
            >
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <button
                type="button"
                title="Tải ảnh lên"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
              >
                <Camera className="h-5 w-5" />
              </button>

              <textarea
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (inputValue.trim() || selectedImage) {
                      sendMessage(inputValue, selectedImage);
                      e.currentTarget.style.height = "auto";
                    }
                  }
                }}
                placeholder={isTyping ? "AI đang trả lời..." : "Nhập tin nhắn..."}
                disabled={isTyping}
                className="max-h-[120px] min-h-[36px] w-full resize-none border-0 bg-transparent py-2 pl-1 pr-2 text-[14px] text-slate-200 outline-none placeholder:text-slate-500 disabled:opacity-40"
              />

              <button
                type="button"
                title="Ghi âm"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
              >
                <Mic className="h-5 w-5" />
              </button>

              <button
                type="submit"
                disabled={(!inputValue.trim() && !selectedImage) || isTyping}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600"
              >
                <Send className="h-4 w-4" />
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
