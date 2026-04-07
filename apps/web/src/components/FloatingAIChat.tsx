"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  X,
  Send,
  Sparkles,
  User,
  Camera,
  Mic,
  MicOff,
  GraduationCap,
  Menu,
  MessageSquare,
  Volume2,
  VolumeX,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type Message = {
  id: string;
  sender: "ai" | "user";
  text: string;
  image?: string;
};

// ─── Web Speech API Types ─────────────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── Quick Action Chips ───────────────────────────────────────────
const QUICK_ACTIONS = [
  { emoji: "📊", label: "Xem GPA",       message: "GPA tích lũy của tôi hiện tại là bao nhiêu?" },
  { emoji: "⚠️", label: "Môn nợ",        message: "Tôi đang nợ hoặc rớt những môn nào?" },
  { emoji: "🎓", label: "Gợi ý kỳ tới", message: "Gợi ý môn học phù hợp cho học kỳ tới của tôi?" },
  { emoji: "📈", label: "Dự báo điểm",  message: "Dự báo điểm cuối kỳ các môn tôi đang học?" },
];

// ─── Typing Indicator ─────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20">
        <GraduationCap className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-2xl rounded-bl-sm border border-slate-700/50 bg-slate-800/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="h-2 w-2 rounded-full bg-violet-400"
              style={{ animation: `typingBounce 1.2s ease-in-out ${delay}ms infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Markdown Bubble ───────────────────────────────────────────
function AiBubble({ text, onSpeak }: { text: string; onSpeak: (text: string) => void }) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeakClick = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    onSpeak(text);
    // Reset state when speech ends
    const checkEnd = setInterval(() => {
      if (!window.speechSynthesis?.speaking) {
        setIsSpeaking(false);
        clearInterval(checkEnd);
      }
    }, 300);
  };

  return (
    <div className="flex items-end gap-2 group">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20">
        <GraduationCap className="h-3.5 w-3.5" />
      </div>
      <div className="relative max-w-[80%]">
        <div className="rounded-2xl rounded-bl-sm border border-slate-700/50 bg-[#1e293b]/95 px-4 py-2.5 text-[13px] leading-relaxed text-slate-300 shadow-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              strong: ({ children }) => (
                <strong className="font-semibold text-white">{children}</strong>
              ),
              ul: ({ children }) => (
                <ul className="mt-1 space-y-0.5 pl-4 list-disc">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mt-1 space-y-0.5 pl-4 list-decimal">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-slate-300">{children}</li>
              ),
              p: ({ children }) => (
                <p className="mb-1.5 last:mb-0">{children}</p>
              ),
              code: ({ children }) => (
                <code className="rounded bg-slate-700/60 px-1 py-0.5 font-mono text-[11px] text-violet-300">
                  {children}
                </code>
              ),
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
              blockquote: ({ children }) => (
                <blockquote className="mt-1 border-l-2 border-violet-400/50 pl-3 text-slate-400 italic">
                  {children}
                </blockquote>
              ),
              hr: () => <hr className="my-2 border-slate-700/50" />,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>

        {/* TTS Button — xuất hiện khi hover */}
        <button
          type="button"
          onClick={handleSpeakClick}
          title={isSpeaking ? "Dừng đọc" : "Đọc to tin nhắn"}
          className={`absolute -bottom-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 opacity-0 group-hover:opacity-100 ${
            isSpeaking
              ? "border-violet-500 bg-violet-600 text-white shadow-md shadow-violet-500/30"
              : "border-slate-600 bg-slate-800 text-slate-400 hover:border-violet-500/60 hover:text-violet-400"
          }`}
        >
          {isSpeaking ? (
            <VolumeX className="h-3 w-3" />
          ) : (
            <Volume2 className="h-3 w-3" />
          )}
        </button>
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
          <div className="rounded-2xl rounded-br-sm bg-gradient-to-br from-violet-600 to-violet-700 px-4 py-2.5 text-[13px] leading-relaxed text-white shadow-sm shadow-violet-500/20">
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

// ─── Voice Listening Overlay ──────────────────────────────────────
function ListeningOverlay({ transcript }: { transcript: string }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 rounded-2xl bg-slate-900/95 backdrop-blur-sm">
      {/* Animated rings */}
      <div className="relative flex items-center justify-center">
        <span className="absolute h-20 w-20 animate-ping rounded-full bg-red-500/20" />
        <span className="absolute h-14 w-14 animate-ping rounded-full bg-red-500/30" style={{ animationDelay: "0.2s" }} />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 shadow-2xl shadow-red-500/40">
          <Mic className="h-7 w-7 text-white" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-white">Đang lắng nghe...</p>
        <p className="mt-1 text-xs text-slate-400">Nói tiếng Việt — nhả để gửi</p>
      </div>

      {transcript && (
        <div className="mx-6 rounded-xl border border-slate-700/60 bg-slate-800/80 px-4 py-2.5 text-center text-[13px] italic text-slate-300">
          "{transcript}"
        </div>
      )}
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

  // ── Voice states ──────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef<any | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Xin chào! 👋 Mình là **OmniScholar AI**.\nMình có thể tư vấn lộ trình học, kiểm tra GPA, dự báo điểm và giải bài tập.\n\nBạn có thể gõ, gửi ảnh 📷, hoặc **nhấn 🎤 để nói** nhé!",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 320);
  }, [isOpen]);

  // ── Cleanup recognition on unmount ───────────────────────────
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Text-to-Speech ────────────────────────────────────────────
  const handleSpeak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Strip markdown for cleaner reading
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\n/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "vi-VN";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Try to pick a Vietnamese voice if available
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.startsWith("vi"));
    if (viVoice) utterance.voice = viVoice;

    window.speechSynthesis.speak(utterance);
  }, []);

  // ── Speech Recognition (STT) ──────────────────────────────────
  const handleToggleListening = useCallback(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.\nVui lòng dùng Chrome hoặc Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setLiveTranscript("");
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = "vi-VN";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }
        setLiveTranscript(final || interim);
        if (final) {
          setInputValue((prev) => (prev ? `${prev} ${final}` : final).trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[STT] error:", event.error);
        if (event.error !== "no-speech") {
          alert(`Lỗi nhận diện giọng nói: ${event.error}`);
        }
        setIsListening(false);
        setLiveTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setLiveTranscript("");
        recognitionRef.current = null;
        setTimeout(() => inputRef.current?.focus(), 100);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("[STT] init error:", err);
      setIsListening(false);
    }
  }, [isListening]);

  // ── Handle Image Selection ────────────────────────────────────
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
    e.target.value = "";
  };

  // ── Send message ──────────────────────────────────────────────
  const sendMessage = async (text: string, imageStr: string | null = null) => {
    if ((!text.trim() && !imageStr) || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      image: imageStr || undefined,
    };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setSelectedImage(null);
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

      if (!res.ok || json.ok === false) {
        const errMsg = json.message || json.error || `HTTP ${res.status}`;
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), sender: "ai", text: `⚠️ **Lỗi từ server:** ${errMsg}` },
        ]);
        return;
      }

      const replyText =
        json.reply ?? json.response ?? json.text ?? "Xin lỗi, mình chưa nhận được phản hồi. Bạn thử lại nhé!";

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: replyText },
      ]);
    } catch (err) {
      console.error("[chat] fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: "⚠️ Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại!" },
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
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(239,68,68,0); }
        }
        .chat-open { animation: slideUp 0.25s ease-out forwards; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .chat-body::-webkit-scrollbar { width: 4px; }
        .chat-body::-webkit-scrollbar-track { background: transparent; }
        .chat-body::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
        .mic-active { animation: micPulse 1.5s ease-in-out infinite; }
      `}</style>

      {/* ── FAB Button ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={`fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-600/40 transition-all duration-300 hover:scale-110 hover:shadow-violet-600/60 active:scale-95 ${
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        }`}
        aria-label="Mở trợ lý AI"
      >
        <Sparkles className="h-6 w-6" />
        <span className="absolute h-14 w-14 rounded-full bg-violet-500/30 animate-ping" />
      </button>

      {/* ── Chat Window ─────────────────────────────────────────── */}
      {isOpen && (
        <div className="chat-open fixed bottom-6 right-6 z-[100] flex h-[580px] w-[385px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">

          {/* Header */}
          <div className="relative flex shrink-0 items-center justify-between overflow-hidden bg-gradient-to-r from-violet-700 via-violet-600 to-fuchsia-600 px-4 py-3">
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
                <h3 className="text-sm font-bold leading-tight text-white">OmniScholar AI</h3>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isListening
                        ? "animate-pulse bg-red-400"
                        : isTyping
                          ? "animate-pulse bg-amber-400"
                          : "bg-emerald-400"
                    }`}
                  />
                  <span className="text-[10px] font-medium text-white/80">
                    {isListening ? "🎤 Đang lắng nghe..." : isTyping ? "Đang trả lời..." : "Trực tuyến · AI Cố vấn"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setIsOpen(false); recognitionRef.current?.abort(); window.speechSynthesis?.cancel(); }}
              className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Đóng chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            {/* Voice Listening Overlay */}
            {isListening && <ListeningOverlay transcript={liveTranscript} />}

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
                {["Hỏi điểm kỳ trước", "Bài toán giải tích", "Tư vấn chọn chuyên ngành"].map((label) => (
                  <button
                    key={label}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/60"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Body */}
            <div className="chat-body h-full overflow-y-auto p-4">
              <div className="flex flex-col gap-4">
                {messages.map((msg) =>
                  msg.sender === "ai" ? (
                    <AiBubble key={msg.id} text={msg.text} onSpeak={handleSpeak} />
                  ) : (
                    <UserBubble key={msg.id} text={msg.text} image={msg.image} />
                  )
                )}

                {isTyping && <TypingIndicator />}

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
                          className="group relative shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left backdrop-blur-md transition-all duration-200 hover:border-violet-500/50 hover:bg-violet-500/10 hover:shadow-md hover:shadow-violet-500/10 active:scale-95 disabled:opacity-40"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 opacity-0 transition-opacity group-hover:opacity-100" />
                          <div className="relative">
                            <span className="block text-base leading-none mb-1">{action.emoji}</span>
                            <span className="block whitespace-nowrap text-[11px] font-semibold text-slate-300 transition-colors group-hover:text-violet-300">
                              {action.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Footer / Input */}
          <div className="shrink-0 border-t border-slate-700/60 bg-slate-900 px-3 py-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] z-10">
            {/* Image Preview */}
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
              className="flex items-end gap-2 rounded-2xl border border-slate-700/80 bg-[#1e293b]/80 p-1.5 transition-all focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/10"
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Camera Button */}
              <button
                type="button"
                title="Tải ảnh lên"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200"
              >
                <Camera className="h-5 w-5" />
              </button>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
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
                placeholder={
                  isListening
                    ? "🎤 Đang lắng nghe..."
                    : isTyping
                      ? "AI đang trả lời..."
                      : "Nhập hoặc nói tin nhắn..."
                }
                disabled={isTyping || isListening}
                className="max-h-[120px] min-h-[36px] w-full resize-none border-0 bg-transparent py-2 pl-1 pr-2 text-[14px] text-slate-200 outline-none placeholder:text-slate-500 disabled:opacity-40"
              />

              {/* Microphone Button */}
              <button
                type="button"
                title={isListening ? "Dừng ghi âm" : "Nói tiếng Việt"}
                onClick={handleToggleListening}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                  isListening
                    ? "mic-active bg-red-500 text-white shadow-md shadow-red-500/40 hover:bg-red-400"
                    : "text-slate-400 hover:bg-slate-700/50 hover:text-violet-400"
                }`}
              >
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={(!inputValue.trim() && !selectedImage) || isTyping || isListening}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-500/20 transition-all hover:bg-violet-500 disabled:opacity-40 disabled:hover:bg-violet-600"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-1.5 text-center text-[9px] text-slate-600">
              OmniScholar AI · Powered by Gemini 2.0 Flash
            </p>
          </div>
        </div>
      )}
    </>
  );
}
