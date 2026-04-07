"use client";

import { useTranslation } from "react-i18next";
import { BrainCircuit, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-4xl py-12 px-6 flex flex-col items-center justify-center text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-500/20 to-indigo-500/10 shadow-inner border border-violet-500/20">
        <BrainCircuit className="h-12 w-12 text-violet-400" />
      </div>

      <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400 mb-6 drop-shadow-sm">
        Chào mừng đến với OmniScholar AI
      </h1>
      
      <p className="text-lg text-slate-300 max-w-xl mx-auto leading-relaxed mb-10">
        Nền tảng trí tuệ nhân tạo giáo dục đa phương thức. Hãy tải lên bảng điểm để bắt đầu phân tích năng lực và cá nhân hóa lộ trình của bạn.
      </p>

      <Link 
        href="/transcript"
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 px-12 text-lg font-bold text-white shadow-xl shadow-violet-500/20 transition-all hover:scale-105 hover:shadow-violet-500/40 active:scale-95"
      >
        <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/20 blur-3xl transition-all group-hover:bg-white/30"></span>
        <UploadCloud className="h-6 w-6 relative z-10" />
        <span className="relative z-10">Tải lên Bảng điểm OCR</span>
      </Link>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="text-xl font-bold text-white mb-2 tracking-wide">Pathways</div>
          <p className="text-sm text-slate-400">Định vị lộ trình kỹ năng và rút ngắn khoảng cách đến công việc mơ ước.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
           <div className="text-xl font-bold text-white mb-2 tracking-wide">Cognitive Studio</div>
          <p className="text-sm text-slate-400">Không gian học vi mô với Flashcard tự tạo và phòng luyện tương tác AI bằng giọng nói.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm">
           <div className="text-xl font-bold text-white mb-2 tracking-wide">OCR Transcripts</div>
          <p className="text-sm text-slate-400">Bóc tách PDF bảng điểm nhờ công nghệ Computer Vision để dự báo năng lực.</p>
        </div>
      </div>
    </div>
  );
}