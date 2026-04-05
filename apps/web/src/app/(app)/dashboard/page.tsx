// apps/web/src/app/(app)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrainCircuit, CheckCircle2, TrendingUp, AlertTriangle, BookOpen, GraduationCap, XCircle, SlidersHorizontal, Calculator } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";

// ─────────────────────────────────────────────────────────────
// Type Definitions cho Prediction Endpoint
// ─────────────────────────────────────────────────────────────
type PredictionResponse = {
  ok: boolean;
  message?: string;
  dataWarnings?: string[];
  featureSummary?: {
    currentSemester: string;
    courseCount: number;
    totalCredits: number;
    cumulativeGPA: number | null;
    recentGpaAvg: number | null;
    totalFailedCourses: number;
    isComplete: boolean;
  };
  data?: {
    predictedFinalScore: number;
    riskLevel: "Low" | "Medium" | "High";
    confidenceLow: number;
    confidenceHigh: number;
    passProbability: number;
    explanation: string;
  };
};

function GradePredictionCard() {
  const { t } = useTranslation();
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrediction() {
      try {
        const res = await fetch("/api/analytics/ml/predict/me", { cache: "no-store" });
        const json = await res.json();
        
        // 422 nghĩa là không có dữ liệu môn học kỳ này
        if (res.status === 422) {
          setError(json.message || "Không có dữ liệu kỳ này");
        } else if (!res.ok || !json.ok) {
          throw new Error(json.message || "Prediction load failed");
        } else {
          setData(json);
        }
      } catch (err: any) {
        setError(err.message || "Lỗi tải dự đoán AI");
      } finally {
        setLoading(false);
      }
    }
    loadPrediction();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <BrainCircuit className="h-4 w-4" />
          Phân tích Học tập (AI Predict)
        </div>
        <div className="mt-4 flex gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  if (error || !data?.data || !data?.featureSummary) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <BrainCircuit className="h-4 w-4" />
          Phân tích Học tập (AI Predict)
        </div>
        <div className="mt-4 text-sm text-slate-400">
          {error || "Chưa đủ dữ liệu để mô hình hoạt động. Vui lòng đồng bộ thời khoá biểu kỳ này."}
        </div>
      </section>
    );
  }

  const { predictedFinalScore, riskLevel, passProbability, explanation } = data.data;
  const features = data.featureSummary;

  // Xác định theme màu theo Risk Level
  const theme = {
    Low: { border: "border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-400", icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" /> },
    Medium: { border: "border-amber-500/50", bg: "bg-amber-500/10", text: "text-amber-400", icon: <TrendingUp className="h-5 w-5 text-amber-400" /> },
    High: { border: "border-rose-500/50", bg: "bg-rose-500/10", text: "text-rose-400", icon: <AlertTriangle className="h-5 w-5 text-rose-400" /> },
  }[riskLevel];

  return (
    <section className={`relative overflow-hidden rounded-2xl border ${theme.border} bg-slate-950/60 p-5 shadow-lg backdrop-blur-sm transition-all hover:shadow-xl`}>
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${theme.bg} blur-3xl`} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
          <BrainCircuit className="h-4 w-4 text-cyan-400" />
          <span>PHÂN TÍCH HỌC TẬP</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">AI MODEL V1</span>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${theme.bg} ${theme.text}`}>
          {theme.icon}
          Rủi ro {riskLevel === "Low" ? "Thấp" : riskLevel === "Medium" ? "TB" : "Cao"}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-800 bg-slate-900 shadow-inner">
            <span className={`text-2xl font-bold tracking-tighter ${theme.text}`}>
              {predictedFinalScore}
            </span>
          </div>
          <span className="mt-1.5 text-[11px] font-medium uppercase text-slate-500">Dự kiến (/10)</span>
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium leading-relaxed text-slate-300">
            {explanation}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            Tỷ lệ đỗ kỳ này: <strong className="text-slate-300">{(passProbability * 100).toFixed(0)}%</strong>
          </div>
        </div>
      </div>

      {/* Feature Inputs Summary */}
      <div className="mt-5 border-t border-slate-800/50 pt-4">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Chỉ số đầu vào gốc:
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/50 p-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <div>
              <div className="text-[10px] text-slate-400">Khối lượng</div>
              <div className="text-xs font-semibold text-slate-200">{features.courseCount} môn ({features.totalCredits} TC)</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/50 p-2">
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400">GPA Tích lũy</div>
              <div className="text-xs font-semibold text-slate-200">{features.cumulativeGPA?.toFixed(2) || "N/A"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/50 p-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">GPA 2 kỳ gần</div>
              <div className="text-xs font-semibold text-slate-200">{features.recentGpaAvg?.toFixed(2) || "N/A"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-900/50 p-2">
            <XCircle className={`h-4 w-4 ${features.totalFailedCourses > 0 ? "text-rose-400" : "text-slate-500"}`} />
            <div>
              <div className="text-[10px] text-slate-400">Số môn rớt</div>
              <div className="text-xs font-semibold text-slate-200">{features.totalFailedCourses} môn</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ══════════════════════════════════════════════════════════════════
// WHAT-IF CALCULATOR COMPONENT
// Cho phép sinh viên thử các điểm cuối kỳ giả định và xem lại kết quả tổng kết ngay lập tức
// ══════════════════════════════════════════════════════════════════

type CourseEntry = {
  label: string;
  midTermScore: number;
  credits: number;
};

// Dữ liệu các môn giả định — trong thực tế có thể fetch từ Timetable API
const SAMPLE_COURSES: CourseEntry[] = [
  { label: "Cấu trúc dữ liệu & Giải thuật", midTermScore: 6.5, credits: 3 },
  { label: "Lập trình Web", midTermScore: 7.0, credits: 3 },
  { label: "Toán rời rạc", midTermScore: 5.5, credits: 2 },
  { label: "Kỹ thuật phần mềm", midTermScore: 8.0, credits: 3 },
  { label: "Mạng máy tính", midTermScore: 6.0, credits: 3 },
];

function getRiskConfig(score: number) {
  if (score >= 7.0)
    return { label: "Thấp", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/50", bar: "bg-emerald-400" };
  if (score >= 4.0)
    return { label: "Trung bình", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/50", bar: "bg-amber-400" };
  return { label: "Cao", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/50", bar: "bg-rose-400" };
}

function WhatIfCalculator() {
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [finalExamScore, setFinalExamScore] = useState(7);
  const [isExpanded, setIsExpanded] = useState(true);

  const course = SAMPLE_COURSES[selectedCourseIdx];

  // Công thức: 30% giữa kỳ + 70% cuối kỳ
  const totalScore = course.midTermScore * 0.3 + finalExamScore * 0.7;
  const totalScoreRounded = Math.round(totalScore * 10) / 10;
  const risk = getRiskConfig(totalScore);

  const sliderPercent = (finalExamScore / 10) * 100;

  return (
    <section className={`relative overflow-hidden rounded-2xl border ${risk.border} bg-slate-950/60 p-5 shadow-lg backdrop-blur-sm transition-all duration-300`}>
      {/* Background glow */}
      <div className={`pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full ${risk.bg} blur-3xl transition-colors duration-500`} />

      {/* Header */}
      <button
        className="flex w-full items-center justify-between text-left"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold tracking-wide text-slate-200">MÔ PHỎNG "WHAT IF"</span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">TINH NHAP</span>
        </div>
        <SlidersHorizontal className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-0" : "rotate-90"}`} />
      </button>

      {isExpanded && (
        <div className="mt-5 space-y-5">
          {/* Course selector */}
          <div>
            <label htmlFor="course-select" className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Chọn môn học đang học
            </label>
            <div className="relative">
              <select
                id="course-select"
                value={selectedCourseIdx}
                onChange={(e) => setSelectedCourseIdx(Number(e.target.value))}
                className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-300 outline-none transition-all focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
              >
                {SAMPLE_COURSES.map((c, idx) => (
                  <option key={idx} value={idx}>
                    {c.label} (Quá trình: {c.midTermScore}/10 · {c.credits} TC)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {/* Slider for desired final exam score */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Điểm thi cuối kỳ mong muốn
              </label>
              <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-base font-bold text-violet-300 tabular-nums">
                {finalExamScore.toFixed(1)}
              </span>
            </div>

            {/* Custom styled slider */}
            <div className="relative pt-1">
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={finalExamScore}
                onChange={(e) => setFinalExamScore(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-violet-500 outline-none focus:ring-2 focus:ring-violet-500/50"
                style={{
                  background: `linear-gradient(to right, #7c3aed ${sliderPercent}%, #1e293b ${sliderPercent}%)`,
                }}
              />
              <div className="mt-1.5 flex justify-between text-[10px] text-slate-600">
                <span>0</span><span>2.5</span><span>5</span><span>7.5</span><span>10</span>
              </div>
            </div>
          </div>

          {/* Result area */}
          <div className={`rounded-2xl border ${risk.border} ${risk.bg} p-4 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-slate-500">Điểm tổng kết tương ứng</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-4xl font-black tabular-nums tracking-tighter ${risk.color}`}>
                    {totalScoreRounded}
                  </span>
                  <span className="text-sm text-slate-500">/ 10</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  = {course.midTermScore} × 30% + {finalExamScore.toFixed(1)} × 70%
                </div>
              </div>

              <div className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 ${risk.bg}`}>
                <div className="text-[10px] font-semibold uppercase text-slate-500">Rủi ro</div>
                <div className={`text-lg font-bold ${risk.color}`}>{risk.label}</div>
                {totalScore >= 5.0
                  ? <span className="text-[10px] text-emerald-400">✅ Qua môn</span>
                  : <span className="text-[10px] text-rose-400">❌ Rớt môn</span>
                }
              </div>
            </div>

            {/* Progress bar visual */}
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[10px] text-slate-600">
                <span>0</span>
                <span className="text-slate-500">Ngưỡng đỗ: 5.0</span>
                <span>10</span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${risk.bar}`}
                  style={{ width: `${(totalScore / 10) * 100}%` }}
                />
                {/* Pass threshold marker */}
                <div className="absolute left-[50%] top-0 h-full w-0.5 bg-slate-600" />
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] font-medium text-slate-400">
            💡 Để đạt điểm tổng kết <span className="font-bold text-violet-300">{totalScoreRounded}</span>, bạn cần thi cuối kỳ được <span className="font-bold text-violet-300">{finalExamScore.toFixed(1)}</span> điểm.
          </p>
        </div>
      )}
    </section>
  );
}

type RecommendationResponse = {
  ok: boolean;
  message?: string;
  data?: {
    id: string;
    courseCode: string;
    name: string;
    credits: number;
    difficultyScore: number;
    isKillerCourse: boolean;
  }[];
  metadata?: {
    passedSubjectCount: number;
  };
};

function CourseRecommendation() {
  const [res, setRes] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useEffect(() => {
    async function loadRecs() {
      try {
        const fetchRes = await fetch("/api/recommendation/courses", { cache: "no-store" });
        const json = await fetchRes.json();
        if (!fetchRes.ok || !json.ok) {
          throw new Error(json.message || "Failed to load recommendations");
        }
        setRes(json);
      } catch (err: any) {
        setError(err.message || "Đã xảy ra lỗi tải gợi ý lộ trình");
      } finally {
        setLoading(false);
      }
    }
    loadRecs();
  }, []);

  if (loading) {
    return (
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <BookOpen className="h-4 w-4 text-blue-400" />
          🎓 Gợi ý Lộ trình Học kỳ tới
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-60 shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !res?.data) {
    return (
      <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <BookOpen className="h-4 w-4 text-rose-400" />
          🎓 Gợi ý Lộ trình Học kỳ tới
        </div>
        <div className="mt-4 text-sm text-slate-400">{error || "Hiện tại không có dữ liệu gợi ý môn học."}</div>
      </section>
    );
  }

  if (res.data.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          🎓 Gợi ý Lộ trình Học kỳ tới
        </div>
        <div className="mt-4 text-sm font-medium text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
          Chúc mừng! Bạn đã hoàn thành toàn bộ các môn học có trong dữ liệu khung chương trình!
        </div>
      </section>
    );
  }

  return (
    <>
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-950/80 to-slate-900/50 p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shadow-inner border border-blue-500/20">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-200">🎓 Gợi ý Lộ trình Học kỳ tới</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Đã qua <strong className="text-slate-300">{res.metadata?.passedSubjectCount || 0}</strong> môn. Đề xuất dựa trên DAG tiên quyết & độ ưu tiên an toàn.
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700 hover:scrollbar-thumb-slate-600">
        {res.data.map((course) => (
          <div
            key={course.id}
            onClick={() => setSelectedCourse(course)}
            className="group cursor-pointer relative flex w-64 snap-start shrink-0 flex-col justify-between rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500 hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-slate-900 px-2 py-1 text-[10px] font-bold tracking-widest text-slate-300 shadow-sm border border-slate-700/50">
                  {course.courseCode}
                </span>
                {course.isKillerCourse && (
                  <span className="flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-1 text-[9px] font-bold uppercase text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="h-3 w-3" /> Killer
                  </span>
                )}
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-slate-200 group-hover:text-blue-300 transition-colors">
                {course.name}
              </h3>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-3">
              <span className="font-medium flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 opacity-70" />
                <span className="text-slate-300">{course.credits}</span> TC
              </span>
              <span className="flex items-center gap-1.5 opacity-90">
                Độ khó: 
                <span className={`font-bold ${course.difficultyScore > 4 ? 'text-rose-400' : course.difficultyScore > 3.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {course.difficultyScore.toFixed(1)}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>

    </section>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setSelectedCourse(null)}
        >
          <div 
            className="relative w-full max-w-md scale-100 rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
            >
              <XCircle className="h-5 w-5" />
            </button>
            
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <BookOpen className="h-7 w-7" />
            </div>
            
            <h3 className="pr-8 text-xl font-bold tracking-tight text-slate-200">{selectedCourse.name}</h3>
            
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                {selectedCourse.courseCode}
              </span>
              <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                {selectedCourse.credits} Tín chỉ
              </span>
              <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                selectedCourse.difficultyScore > 4 ? "bg-rose-500/10 text-rose-400" :
                selectedCourse.difficultyScore > 3.5 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
              }`}>
                Độ khó: {selectedCourse.difficultyScore.toFixed(1)}
              </span>
            </div>
            
            <div className="mt-6 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-lg">💡</div>
                <p className="text-sm font-medium leading-relaxed text-blue-300">
                  <strong className="block mb-1 text-blue-400">AI Đề xuất:</strong>
                  Môn này là tiên quyết để mở khóa 3 môn chuyên ngành ở học kỳ sau. Cần ưu tiên hoàn thành ngay trong kỳ tới để tránh chậm tiến độ tốt nghiệp!
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedCourse(null)}
              className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <button className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 hover:bg-slate-900">
          {t("common.new")}
        </button>
      </div>

      <div className="grid gap-4">
        {/* ML Prediction Card */}
        <GradePredictionCard />

        {/* What-If Calculator */}
        <WhatIfCalculator />

        {/* Course Recommendation */}
        <CourseRecommendation />

        <div className="grid gap-3 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">{t("dashboard.card.gpa")}</div>
            <div className="mt-2 text-3xl font-semibold text-cyan-300">3.45</div>
            <div className="mt-1 text-xs text-slate-400">
              {t("dashboard.card.gpaHint")}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-sm font-semibold">{t("dashboard.card.todo")}</div>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              <li className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                {t("dashboard.card.todoItem1")}
              </li>
              <li className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
                {t("dashboard.card.todoItem2")}
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}