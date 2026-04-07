"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Volume2, StopCircle, RefreshCw, Sparkles, GraduationCap, Calculator, MessageCircle, Globe } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────
type Mode = "vi-friend" | "en-tutor" | "math-tutor" | "free";
type ConvState = "idle" | "listening" | "thinking" | "speaking";

type HistoryItem = { role: "user" | "assistant"; content: string };
type Turn = { id: string; speaker: "user" | "ai"; text: string };

// ─── Web Speech API Types ─────────────────────────────────────────
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── Mode Config ──────────────────────────────────────────────────
const MODES: { key: Mode; label: string; sublabel: string; icon: React.ReactNode; lang: string; gradient: string; color: string }[] = [
  {
    key: "vi-friend",
    label: "Bạn Thân",
    sublabel: "Trò chuyện tiếng Việt",
    icon: <MessageCircle className="h-5 w-5" />,
    lang: "vi-VN",
    gradient: "from-violet-600 to-purple-600",
    color: "violet",
  },
  {
    key: "en-tutor",
    label: "English",
    sublabel: "Luyện nói tiếng Anh",
    icon: <Globe className="h-5 w-5" />,
    lang: "en-US",
    gradient: "from-sky-500 to-blue-600",
    color: "sky",
  },
  {
    key: "math-tutor",
    label: "Gia sư Toán",
    sublabel: "Giải bài từng bước",
    icon: <Calculator className="h-5 w-5" />,
    lang: "vi-VN",
    gradient: "from-emerald-500 to-teal-600",
    color: "emerald",
  },
  {
    key: "free",
    label: "Tự Do",
    sublabel: "Hỏi gì cũng được",
    icon: <Sparkles className="h-5 w-5" />,
    lang: "vi-VN",
    gradient: "from-orange-500 to-rose-500",
    color: "orange",
  },
];

// ─── Animated AI Avatar ───────────────────────────────────────────
function AiAvatar({ state, gradient }: { state: ConvState; gradient: string }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer rings — only when speaking or listening */}
      {(state === "speaking" || state === "listening") && (
        <>
          <span className={`absolute h-52 w-52 rounded-full bg-gradient-to-br ${gradient} opacity-10 animate-ping`} style={{ animationDuration: "2s" }} />
          <span className={`absolute h-40 w-40 rounded-full bg-gradient-to-br ${gradient} opacity-15 animate-ping`} style={{ animationDuration: "1.5s", animationDelay: "0.3s" }} />
          <span className={`absolute h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-20 animate-ping`} style={{ animationDuration: "1.2s", animationDelay: "0.15s" }} />
        </>
      )}

      {/* Thinking pulse */}
      {state === "thinking" && (
        <span className="absolute h-24 w-24 rounded-full border-2 border-white/30 animate-spin" style={{ animationDuration: "2s" }} />
      )}

      {/* Main circle */}
      <div className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-2xl transition-transform duration-500 ${state === "speaking" ? "scale-105" : "scale-100"}`}>
        <GraduationCap className="h-10 w-10 text-white drop-shadow-lg" />
      </div>
    </div>
  );
}

// ─── Sound Wave Bars (listening) ─────────────────────────────────
function SoundWave({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-end justify-center gap-1 h-10">
      {Array.from({ length: 9 }).map((_, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-red-400"
          style={{
            animation: active ? `waveBar 0.6s ease-in-out ${i * 0.07}s infinite alternate` : "none",
            height: active ? `${20 + Math.sin(i) * 15}px` : "4px",
            opacity: active ? 1 : 0.3,
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Conversation Transcript Strip ────────────────────────────────
function TranscriptStrip({ turns }: { turns: Turn[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  if (turns.length === 0) return null;

  return (
    <div ref={ref} className="h-full overflow-y-auto space-y-2.5 px-1 scrollbar-none">
      {turns.map((turn) => (
        <div key={turn.id} className={`flex ${turn.speaker === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-md ${
              turn.speaker === "user"
                ? "rounded-br-sm bg-slate-600 text-white"
                : "rounded-bl-sm bg-violet-900/80 text-violet-50 border border-violet-500/40"
            }`}
          >
            {turn.text}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function CognitiveStudioPage() {
  const [mode, setMode] = useState<Mode>("vi-friend");
  const [convState, setConvState] = useState<ConvState>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [statusText, setStatusText] = useState("Chọn chế độ và nhấn Micro để bắt đầu");
  const [isSupported, setIsSupported] = useState(true);
  const [liveCaption, setLiveCaption] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const activeMode = MODES.find((m) => m.key === mode)!;

  useEffect(() => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) setIsSupported(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── Send text to AI ───────────────────────────────────────────
  const sendToAI = useCallback(async (userText: string) => {
    const userTurn: Turn = { id: Date.now().toString(), speaker: "user", text: userText };
    setTurns((prev) => [...prev, userTurn]);

    const newHistory = [...history, { role: "user" as const, content: userText }];
    setHistory(newHistory);
    setConvState("thinking");
    setStatusText("OmniScholar AI đang suy nghĩ...");

    try {
      const res = await fetch("/api/voice-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: userText, mode, history: newHistory.slice(-12) }),
      });

      const json = await res.json().catch(() => ({ ok: false, message: "Lỗi phân tích dữ liệu trả về từ server." }));
      
      if (!res.ok || !json.ok) {
        const errorMessage = json.message || json.error || `Lỗi máy chủ (${res.status})`;
        console.warn("[voice-chat] Server response error:", errorMessage);
        setConvState("idle");
        setStatusText(
          res.status === 429 
            ? "⚠️ AI đang quá tải (Hết Token). Vui lòng đợi chút nhé!" 
            : "⚠️ Có lỗi kết nối AI. Vui lòng thử lại!"
        );
        return;
      }

      const reply: string = json.reply;
      const aiTurn: Turn = { id: (Date.now() + 1).toString(), speaker: "ai", text: reply };
      setTurns((prev) => [...prev, aiTurn]);
      setHistory((prev) => [...prev, { role: "assistant", content: reply }]);

      // Speak the reply
      await speakText(reply, activeMode.lang);
    } catch (err) {
      console.error("[voice-chat] network/fetch error:", err);
      setConvState("idle");
      setStatusText("⚠️ Lỗi mạng hoặc kết nối bị gián đoạn. Thử lại nhé!");
    }
  }, [history, mode, activeMode.lang]);

  // ── Text-to-Speech ────────────────────────────────────────────
  const speakText = useCallback((text: string, lang: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();

      // Clean markdown
      const clean = text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`(.*?)`/g, "$1")
        .replace(/#{1,6}\s/g, "")
        .replace(/\n/g, " ");

      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = lang;
      utter.rate = lang === "vi-VN" ? 0.92 : 0.95;
      utter.pitch = 1.1;

      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (match) utter.voice = match;

      setConvState("speaking");
      setStatusText("AI đang nói...");

      utter.onend = () => {
        resolve();
        setConvState("idle");
        setStatusText("Nhấn 🎤 để trả lời hoặc hỏi tiếp...");
      };
      utter.onerror = () => { resolve(); setConvState("idle"); };

      window.speechSynthesis.speak(utter);
    });
  }, []);

  // ── Speech Recognition ────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechAPI) return;

    window.speechSynthesis?.cancel();

    try {
      const recognition = new SpeechAPI();
      recognition.lang = activeMode.lang;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setConvState("listening");
        setStatusText("Đang nghe... Nói đi bạn!");
        setLiveCaption("");
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setLiveCaption("");
        const finalText = (recognition as any)._finalText;
        if (finalText?.trim()) {
          sendToAI(finalText.trim());
        } else {
          setConvState("idle");
          setStatusText("Không nghe thấy gì. Thử lại nhé!");
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== "no-speech") console.warn("[STT]", event.error);
        setConvState("idle");
        setStatusText("Nhấn 🎤 để bắt đầu nói");
        setLiveCaption("");
      };

      // Save final result for onend
      let _final = "";
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) _final += t;
          else interim += t;
        }
        (recognition as any)._finalText = _final;
        setLiveCaption(_final || interim);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("[STT] init error:", err);
    }
  }, [activeMode.lang, sendToAI]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const stopAll = useCallback(() => {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    setConvState("idle");
    setStatusText("Đã dừng. Nhấn 🎤 để tiếp tục");
    setLiveCaption("");
  }, []);

  const resetConversation = useCallback(() => {
    stopAll();
    setTurns([]);
    setHistory([]);
    setStatusText("Chọn chế độ và nhấn Micro để bắt đầu");
  }, [stopAll]);

  const handleMicClick = () => {
    if (convState === "listening") {
      stopListening();
    } else if (convState === "speaking" || convState === "thinking") {
      stopAll();
    } else {
      startListening();
    }
  };

  const micIsActive = convState === "listening";
  const canPressMic = convState === "idle" || convState === "listening" || convState === "speaking" || convState === "thinking";

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.3); opacity: 0.6; }
          to   { transform: scaleY(1.0); opacity: 1;   }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>

      <div className="mx-auto flex h-[calc(100vh-80px)] max-w-xl flex-col items-center gap-4 px-4 py-4">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="w-full text-center shrink-0">
          <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
            Cognitive Studio
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">Nói chuyện với AI như một người thật</p>
        </div>

        {/* ── Mode Selector ────────────────────────────────── */}
        <div className="grid w-full grid-cols-4 gap-1.5 px-1 shrink-0">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => { setMode(m.key); resetConversation(); }}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all duration-200 active:scale-95 ${
                mode === m.key
                  ? `bg-gradient-to-br ${m.gradient} border-transparent text-white shadow-lg`
                  : "border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-violet-500/40 hover:text-[var(--text-main)]"
              }`}
            >
              <div className="scale-90">{m.icon}</div>
              <span className="text-[10px] font-bold leading-tight text-center">{m.label}</span>
            </button>
          ))}
        </div>

        {/* ── AI Avatar + Status ────────────────────────────── */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="relative">
            <AiAvatar state={convState} gradient={activeMode.gradient} />
            {/* Sound wave overlay when listening */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <SoundWave active={convState === "listening"} />
            </div>
          </div>

          {/* Status text */}
          <div className="text-center px-4 min-h-[28px] flex flex-col justify-center">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
              convState === "listening" ? "text-red-400"
              : convState === "thinking" ? "text-amber-400"
              : convState === "speaking" ? "text-violet-400"
              : "text-slate-500"
            }`}>
              {statusText}
            </p>

            {/* Live caption bubble */}
            {liveCaption && (
              <div className="mt-1 rounded-full bg-white/10 px-3 py-1 backdrop-blur-md border border-white/10">
                <p className="text-[11px] font-medium italic text-slate-200 line-clamp-1">
                  "{liveCaption}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Transcript ──────────────────────────────────────── */}
        <div className="w-full flex-1 min-h-0 px-2">
          <div className="h-full rounded-2xl border border-white/8 bg-slate-900/50 p-3 overflow-hidden relative shadow-inner">
            <TranscriptStrip turns={turns} />
            {turns.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-[13px] text-slate-500 leading-relaxed max-w-[220px]">
                  {mode === "en-tutor"
                    ? "Let's start talking! Press the mic and speak in English 🇺🇸"
                    : mode === "vi-friend"
                    ? "Nhấn mic và bắt đầu nói chuyện với Hana nhé! 😊"
                    : mode === "math-tutor"
                    ? "Hỏi bài toán bất kỳ, mình sẽ giải từng bước! 🔢"
                    : "Hỏi bất cứ điều gì bạn muốn biết! ✨"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Controls ─────────────────────────────────────────── */}
        <div className="flex w-full items-center justify-center gap-8 pb-2 shrink-0">
          {/* Reset */}
          <button
            onClick={resetConversation}
            title="Bắt đầu lại"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-800/50 text-slate-400 transition-all hover:bg-slate-700 hover:text-rose-400 active:scale-95 shadow-lg"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          {/* Main Mic Button */}
          {!isSupported ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-slate-700 text-slate-600">
              <MicOff className="h-7 w-7" />
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={handleMicClick}
                disabled={!canPressMic}
                title={
                  convState === "listening" ? "Dừng nghe"
                  : convState === "speaking" ? "Dừng nói"
                  : convState === "thinking" ? "Đang xử lý..."
                  : "Giữ để nói"
                }
                className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 active:scale-95 disabled:opacity-50 ${
                  micIsActive
                    ? "bg-red-500 text-white shadow-2xl shadow-red-500/50"
                    : convState === "thinking"
                    ? "bg-amber-500/20 text-amber-400 border-2 border-amber-500/50"
                    : convState === "speaking"
                    ? `bg-gradient-to-br ${activeMode.gradient} text-white shadow-2xl opacity-80`
                    : `bg-gradient-to-br ${activeMode.gradient} text-white shadow-2xl shadow-violet-500/40 hover:scale-105`
                }`}
              >
                {convState === "thinking" ? (
                  <RefreshCw className="h-8 w-8 animate-spin" />
                ) : convState === "speaking" ? (
                  <Volume2 className="h-8 w-8" />
                ) : micIsActive ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>

              {/* Ripple when listening */}
              {micIsActive && (
                <>
                  <span className="absolute inset-0 z-0 animate-ping rounded-full bg-red-400/30" />
                  <span className="absolute -inset-4 z-0 animate-ping rounded-full bg-red-400/15" style={{ animationDelay: "0.2s" }} />
                </>
              )}
            </div>
          )}

          {/* Stop All */}
          <button
            onClick={stopAll}
            title="Dừng tất cả"
            disabled={convState === "idle"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-800/50 text-slate-400 transition-all hover:bg-slate-700 hover:text-slate-200 active:scale-95 disabled:opacity-30 shadow-lg"
          >
            <StopCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Browser notice */}
        {!isSupported && (
          <p className="text-center text-xs text-rose-500 shrink-0">
            ⚠️ Trình duyệt không hỗ trợ Voice. Vui lòng dùng Chrome hoặc Edge.
          </p>
        )}
        {isSupported && (
          <p className="text-center text-[10px] text-slate-600 shrink-0 -mt-2">
            Powered by Gemini 2.5 Flash · Web Speech API · {activeMode.label} Mode
          </p>
        )}
      </div>
    </>
  );
}
