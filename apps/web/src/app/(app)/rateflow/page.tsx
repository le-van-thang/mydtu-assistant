// path: apps/web/src/app/(app)/rateflow/page.tsx
"use client";

import {
  rateflowOpenPage,
  rateflowScanTeachers,
  rateflowFillForm,
  rateflowReloadCaptcha,
  rateflowSubmit,
  rateflowRedirectTab,
  startTranscriptDetailSyncJob,
  getTranscriptDetailSyncJobStatus,
  type TeacherToRate,
  type RatingPolicy,
  type RateflowTextTemplates,
  type CaptchaInfo,
} from "@/lib/extensionBridge";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "setup"
  | "opening"
  | "selecting"
  | "scanning"
  | "ready"
  | "filling"
  | "captcha"
  | "submitting"
  | "done";

type StatusStep = {
  id: string;
  label: string;
  state: "pending" | "active" | "done" | "error";
  detail?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const POLICY_OPTIONS: { value: RatingPolicy; label: string; desc: string; emoji: string }[] = [
  { value: "all_5",      label: "Tất cả 5 ★",       desc: "Hoàn toàn đồng ý",              emoji: "🌟" },
  { value: "all_4",      label: "Tất cả 4 ★",       desc: "Đồng ý",                        emoji: "✅" },
  { value: "all_3",      label: "Tất cả 3 ★",       desc: "Tương đối đồng ý",              emoji: "🙂" },
  { value: "random_4_5", label: "Ngẫu nhiên 4-5 ★", desc: "Tự nhiên nhất — 65% là 5★",     emoji: "🎲" },
  { value: "random_3_5", label: "Ngẫu nhiên 3-5 ★", desc: "Đa dạng, tự nhiên nhất",        emoji: "🎯" },
];

const TEXT_KEYS: { key: keyof RateflowTextTemplates; label: string }[] = [
  { key: "q49", label: "Câu 49 — Ý kiến về giảng viên" },
  { key: "q50", label: "Câu 50 — Ý kiến về hỗ trợ từ nhà trường" },
  { key: "q51", label: "Câu 51 — Ý kiến về cơ sở vật chất" },
  { key: "q52", label: "Câu 52 — Ý kiến về chương trình học" },
];

const DEFAULT_TEXTS: RateflowTextTemplates = {
  q49: "Thầy/cô giảng dạy nhiệt tình, kiến thức chuyên môn vững vàng và luôn hỗ trợ sinh viên tốt.",
  q50: "Học liệu đầy đủ, tài liệu tham khảo rõ ràng, dễ tiếp cận.",
  q51: "Cơ sở vật chất phòng học đáp ứng tốt nhu cầu học tập.",
  q52: "Môn học có nội dung thực tiễn và bổ ích, cần được duy trì và phát triển thêm.",
};

function loadSavedTexts(): RateflowTextTemplates {
  try {
    const raw = localStorage.getItem("mydtu:rateflow-texts");
    return raw ? (JSON.parse(raw) as RateflowTextTemplates) : DEFAULT_TEXTS;
  } catch { return DEFAULT_TEXTS; }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="inline-block rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin shrink-0"
    />
  );
}

function StepDot({
  label, state, detail
}: { label: string; state: StatusStep["state"]; detail?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">
        {state === "done"    && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black">✓</span>}
        {state === "active"  && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]"><Spinner size={11} /></span>}
        {state === "error"   && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-black">✕</span>}
        {state === "pending" && <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[var(--border-main)] text-[var(--text-muted)] text-[10px]">·</span>}
      </div>
      <div>
        <div className={[
          "text-xs font-semibold leading-5",
          state === "active"  ? "text-[var(--accent)]"   : "",
          state === "done"    ? "text-emerald-500"       : "",
          state === "error"   ? "text-red-500"           : "",
          state === "pending" ? "app-text-muted"         : "",
        ].join(" ")}>
          {label}
        </div>
        {detail && <div className="text-[11px] app-text-muted mt-0.5">{detail}</div>}
      </div>
    </div>
  );
}

function TeacherBadge({ status }: { status: "pending" | "done" | "failed" | "skipped" | "active" }) {
  const cfg = {
    done:    { icon: "✅", cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700" },
    failed:  { icon: "❌", cls: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700" },
    skipped: { icon: "⏭️", cls: "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600" },
    pending: { icon: "⏳", cls: "bg-[var(--bg-soft)] text-[var(--text-muted)] border-[var(--border-main)]" },
    active:  { icon: "⚡", cls: "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]" },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${c.cls}`}>
      {c.icon}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function RateFlowPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [policy, setPolicy] = useState<RatingPolicy>("all_5");
  const [texts, setTexts] = useState<RateflowTextTemplates>(loadSavedTexts);

  const [teachers, setTeachers] = useState<TeacherToRate[]>([]);
  const [teacherStatus, setTeacherStatus] = useState<Record<number, "pending" | "done" | "failed" | "skipped" | "active">>({});
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  
  const [captcha, setCaptcha] = useState<CaptchaInfo | null>(null);
  const [captchaVal, setCaptchaVal] = useState("");
  const [captchaErr, setCaptchaErr] = useState("");
  const [captchaShake, setCaptchaShake] = useState(false);
  
  const [globalError, setGlobalError] = useState("");
  const [successToast, setSuccessToast] = useState<string | null>(null); // teacher name for toast
  const [doneSynced, setDoneSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasVisitedMydtu, setHasVisitedMydtu] = useState(false);

  const captchaRef = useRef<HTMLInputElement>(null);
  const statsDone = Object.values(teacherStatus).filter((s) => s === "done").length;
  const statsSkipped = Object.values(teacherStatus).filter((s) => s === "skipped").length;
  const statsTotal = teachers.length;

  // Persist texts
  useEffect(() => {
    try { localStorage.setItem("mydtu:rateflow-texts", JSON.stringify(texts)); } catch {}
  }, [texts]);

  // Auto-focus captcha
  useEffect(() => {
    if (phase === "captcha") setTimeout(() => captchaRef.current?.focus(), 200);
  }, [phase, captcha]);

  function updateTeacher(idx: number, status: "done" | "failed" | "skipped") {
    setTeacherStatus((prev) => ({ ...prev, [idx]: status }));
    if (status === "done" && teachers[idx]) {
      const name = teachers[idx].name;
      setSuccessToast(name);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  }

  async function handlePolicyChange(newPolicy: RatingPolicy) {
    setPolicy(newPolicy);
    if ((phase === "captcha" || phase === "filling") && activeIdx !== null) {
      const activeT = teachers[activeIdx];
      if (!activeT) return;
      setTeacherStatus((prev) => ({ ...prev, [activeIdx]: "active" }));
      setPhase("filling");
      
      const fillRes = await rateflowFillForm(activeT.formUrl, newPolicy, texts);
      if (!fillRes.ok || !fillRes.captcha) {
         setGlobalError(fillRes.error || "Lỗi điền form lại.");
         setTeacherStatus((prev) => ({ ...prev, [activeIdx]: "failed" }));
         return;
      }
      setCaptcha(fillRes.captcha);
      setCaptchaVal("");
      setPhase("captcha");
    }
  }

  // ── Step 1: Mở tab MYDTU ────────────────────────────────────

  async function handleConnect() {
    if (phase === "opening" || phase === "scanning") return;
    setGlobalError("");
    setCaptchaVal("");
    setTeachers([]);
    setTeacherStatus({});
    setActiveIdx(null);
    setPhase("opening");

    const openRes = await rateflowOpenPage();
    if (!openRes.ok) {
      setGlobalError(openRes.error || "Không mở được trang đánh giá");
      setPhase("setup");
      return;
    }
    
    // Đã mở tab thành công
    setPhase("selecting");
  }

  // ── Step 2: Quét danh sách ──────────────────────────────────

  async function handleScan() {
    setGlobalError("");
    setPhase("scanning");

    const scanRes = await rateflowScanTeachers();
    if (!scanRes.ok || !scanRes.teachers || scanRes.teachers.length === 0) {
      setGlobalError(
        scanRes.error ||
          "Không tìm thấy giảng viên nào! Vui lòng đảm bảo bạn đang ở mục 'Danh sách giảng viên' (không phải trang biểu mẫu) trên màn hình MYDTU."
      );
      setPhase("selecting");
      return;
    }

    const list = scanRes.teachers;
    setTeachers(list);
    const initStatus: typeof teacherStatus = {};
    list.forEach((t, i) => { initStatus[i] = t.isDone ? "done" : "pending"; });
    setTeacherStatus(initStatus);

    setPhase("ready");
  }

  // ── Step 3: Đánh giá quá trình ──────────────────────────────

  async function startAllPending() {
    const pending = teachers.map((_, i) => i).filter((i) => teacherStatus[i] === "pending");
    if (pending.length === 0) { setPhase("done"); return; }
    await evaluateTeacher(pending[0]);
  }

  async function evaluateTeacher(idx: number) {
    const teacher = teachers[idx];
    if (!teacher) { setPhase("done"); return; }

    setActiveIdx(idx);
    setTeacherStatus((p) => ({ ...p, [idx]: "active" }));
    setPhase("filling");
    setCaptchaVal("");
    setCaptchaErr("");

    const fillRes = await rateflowFillForm(teacher.formUrl, policy, texts);
    if (!fillRes.ok) {
      updateTeacher(idx, "failed");
      setGlobalError(`Lỗi điền form cho ${teacher.name}: ${fillRes.error}`);
      await advanceAfter(idx);
      return;
    }

    setCaptcha(fillRes.captcha || null);
    setPhase("captcha");
  }

  async function advanceAfter(idx: number) {
    await new Promise((r) => setTimeout(r, 400));
    // Re-check if phase is still filling/captcha/submitting (not aborted by user)
    // Actually, state variables inside async functions might be stale, but we set phase="selecting" on abort.
    // If the user aborts, nextPending won't matter because Phase is changed.
    
    // We get next pending by checking the LATEST state of teacherStatus?
    // Since we are using stale closure, we rely on setTeacherStatus
    const nextPending = teachers
      .map((_, i) => i)
      .find((i) => i > idx && (teacherStatus[i] === "pending" || !teacherStatus[i]));

    if (nextPending !== undefined) {
      await evaluateTeacher(nextPending);
    } else {
      setPhase((prev) => prev !== "selecting" ? "done" : "selecting");
      // Only redirect to done if not manually cancelled
      rateflowRedirectTab("https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_ratingchoicesemester&functionid=15");
    }
  }

  function handleCancelQueue() {
    setPhase("selecting");
    setTeachers([]);
    setTeacherStatus({});
    setActiveIdx(null);
    rateflowRedirectTab("https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_ratingchoicesemester&functionid=15");
  }

  async function handleSubmitCaptcha() {
    if (!captchaVal.trim() || activeIdx === null) return;
    setPhase("submitting");
    setCaptchaErr("");

    const submitRes = await rateflowSubmit(captchaVal.trim());

    if (!submitRes.ok) {
      updateTeacher(activeIdx, "failed");
      if (submitRes.captchaError) {
        setGlobalError("⚠️ MÃ CAPTCHA SAI HOẶC BỊ HẾT HẠN! Đã đánh dấu X lỗi và chuyển sang giảng viên tiếp theo.");
      } else {
        setGlobalError(`❌ LỖI NỘP PHIẾU: ${submitRes.error}`);
      }
      await advanceAfter(activeIdx);
      return;
    }

    if (submitRes.ok) {
      updateTeacher(activeIdx, "done");
      setGlobalError(""); // clear error banner on success
    } else {
      updateTeacher(activeIdx, "failed");
      setGlobalError(`Lỗi nộp phiếu: ${submitRes.error}`);
    }

    await advanceAfter(activeIdx);
  }

  function handleSkipTeacher() {
    if (activeIdx === null) return;
    updateTeacher(activeIdx, "skipped");
    advanceAfter(activeIdx);
  }

  async function handleReloadCaptcha() {
    const res = await rateflowReloadCaptcha();
    if (res.ok && res.captcha) { setCaptcha(res.captcha); setCaptchaErr(""); setCaptchaVal(""); }
  }

  // Reload the whole form for current teacher (like pressing "re-start" for that teacher)
  async function handleReloadForm() {
    if (activeIdx === null) return;
    const teacher = teachers[activeIdx];
    if (!teacher) return;
    setGlobalError("");
    setCaptchaErr("");
    setCaptchaVal("");
    setPhase("filling");
    const fillRes = await rateflowFillForm(teacher.formUrl, policy, texts);
    if (!fillRes.ok) {
      setCaptchaErr(fillRes.error || "Lỗi tải lại form.");
      setPhase("captcha");
      return;
    }
    setCaptcha(fillRes.captcha || null);
    setPhase("captcha");
  }

  async function handleSyncGrades() {
    setIsSyncing(true);
    try {
      const started = await startTranscriptDetailSyncJob({ maxYears: 2 });
      if (!started.ok) return;
      for (let i = 0; i < 80; i++) {
        const s = await getTranscriptDetailSyncJobStatus(started.jobId);
        if (!s.ok) break;
        if (s.payload.done) { setDoneSynced(true); break; }
        await new Promise((r) => setTimeout(r, 2000));
      }
    } finally { setIsSyncing(false); }
  }

  // ── Derived ──────────────────────────────────────────────────

  const isBusy = ["opening", "scanning"].includes(phase);
  const pendingCount = teachers.filter((_, i) => teacherStatus[i] === "pending" || teacherStatus[i] === undefined).length;
  const activeTeacher = activeIdx !== null ? teachers[activeIdx] : null;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-6xl pb-12 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.85rem] font-black tracking-tight flex items-center gap-3">
            <span className="text-3xl text-[var(--accent)]">●</span>
            RateFlow
            <span className="rounded-full bg-[var(--accent-soft)] border border-[var(--accent)]/20 px-3 py-0.5 text-sm font-bold text-[var(--accent)]">
              Đánh giá cực nhanh
            </span>
          </h1>
          <p className="mt-1 text-sm app-text-muted">
            Tự động điền hơn 50 câu đánh giá cho từng giảng viên. Không còn mỏi tay thao tác!
          </p>
        </div>
        {phase !== "setup" && phase !== "opening" && phase !== "selecting" && phase !== "done" && (
          <div className="flex items-center gap-2 shrink-0 animate-in fade-in zoom-in duration-300">
            <div className="text-center rounded-2xl bg-[var(--bg-soft)] px-3 py-1.5 border border-[var(--border-main)] shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wide app-text-muted mb-0.5">Tiến độ</div>
              <div className="text-xl font-black flex items-baseline gap-1">
                <span className="text-emerald-500">{statsDone}</span>
                <span className="text-sm app-text-muted font-semibold">/{statsTotal}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── ERROR ALERT ── */}
      {globalError && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex gap-3">
            <span className="text-xl mt-0.5">🚨</span>
            <div>
              <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-0.5">Xảy ra lỗi</div>
              <div className="text-xs text-red-600 dark:text-red-400 leading-relaxed font-medium">{globalError}</div>
            </div>
          </div>
          <button
            onClick={() => setGlobalError("")}
            className="shrink-0 rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 font-bold transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── SUCCESS TOAST (fixed position, top-right) ── */}
      {successToast && (
        <div key={successToast} className="fixed top-6 right-6 z-[9999] pointer-events-none">
          <div className="bg-emerald-600 text-white rounded-2xl shadow-2xl shadow-emerald-900/30 px-5 py-4 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 border border-emerald-500/50 backdrop-blur min-w-[260px] max-w-[360px]">
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-black">
              ✓
            </div>
            <div>
              <div className="font-black text-sm leading-tight">Đánh giá thành công!</div>
              <div className="text-xs text-emerald-100 font-semibold mt-0.5 truncate max-w-[220px]">{successToast}</div>
            </div>
            <div className="ml-auto shrink-0 w-1.5 h-8 bg-white/20 rounded-full overflow-hidden">
              <div className="w-full bg-white/70 rounded-full animate-[shrink_3.5s_linear_forwards]" style={{ height: "100%" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        
        {/* ════ COL 1: CÀI ĐẶT ════ */}
        <div className="space-y-4 lg:sticky lg:top-4">
          
          <div className="app-card rounded-[2rem] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-[var(--accent)] font-semibold text-xs tracking-widest uppercase">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Thiết lập tự động
            </div>
            
            <div className="space-y-1.5">
              {POLICY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-3 border-2 transition-all duration-200",
                    policy === opt.value
                      ? "border-[var(--accent)] bg-[var(--accent-soft)]/50"
                      : "border-transparent border-b-[var(--border-main)] hover:bg-[var(--bg-soft)] pb-[10px]", // Fake 3D effect
                  ].join(" ")}
                >
                  <div className="relative flex items-center justify-center">
                    <input
                      type="radio"
                      name="policy"
                      value={opt.value}
                      checked={policy === opt.value}
                      onChange={() => handlePolicyChange(opt.value)}
                      className="peer appearance-none w-5 h-5 rounded-full border-2 border-[var(--text-muted)] checked:border-[var(--accent)] transition-colors shrink-0"
                    />
                    {policy === opt.value && <div className="absolute w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[var(--text-main)] flex items-center gap-1.5">
                      <span className="text-base">{opt.emoji}</span> {opt.label}
                    </div>
                    <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5 opacity-80">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            
            <details className="mt-4 group border border-[var(--border-main)] rounded-2xl bg-[var(--bg-card)] overflow-hidden transition-all duration-300">
              <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 font-bold text-xs select-none hover:bg-[var(--bg-soft)] transition-colors text-[var(--text-main)]">
                <span className="text-sm">📝</span>
                <span className="flex-1 opacity-90">Sửa Nội dung câu tự luận</span>
                <svg className="w-4 h-4 text-[var(--text-muted)] group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[var(--border-main)] bg-[var(--bg-soft)]/30">
                {TEXT_KEYS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-bold mb-1.5 text-[var(--text-muted)] tracking-wide">{label}</label>
                    <textarea
                      value={texts[key] ?? ""}
                      onChange={(e) => setTexts((p) => ({ ...p, [key]: e.target.value }))}
                      rows={2}
                      className="app-input w-full rounded-xl px-3 py-2 text-xs resize-none font-medium text-[var(--text-main)] focus:ring-2 ring-[var(--accent)]/20"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setTexts(DEFAULT_TEXTS)}
                  className="w-full text-[11px] text-[var(--text-muted)] font-bold hover:text-[var(--text-main)] py-2 border border-dashed border-[var(--border-main)] rounded-xl hover:bg-[var(--bg-soft)] transition-colors"
                >
                  🔄 Đặt lại nội dung mặc định
                </button>
              </div>
            </details>
          </div>

          <div className="app-card rounded-[2rem] p-5 shadow-sm bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-soft)] border border-[var(--border-main)]">
             <div className="flex items-center gap-2 mb-3 text-sky-600 dark:text-sky-400 font-semibold text-xs tracking-widest uppercase">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Lưu ý an toàn
            </div>
            <p className="text-[11px] font-medium text-[var(--text-muted)] leading-relaxed relative z-10">
              Tool dựa trên giao diện thực tế của MYDTU. Vui lòng không đóng tab MYDTU trong lúc tiến trình đang chạy. RateFlow cam đoan không lưu trữ bất kỳ thông tin mật khẩu hay điểm số nào của bạn.
            </p>
          </div>

        </div>

        {/* ════ COL 2: SCAN & ACTION PANEL ════ */}
        <div className="app-card rounded-[2rem] p-1 flex flex-col shadow-lg border-[var(--border-main)] bg-[var(--bg-soft)] overflow-hidden">
          
          <div className="bg-[var(--bg-card)] rounded-[1.8rem] flex-1 flex flex-col border border-[var(--border-main)] shadow-sm overflow-hidden h-full">
            
            {/* SETUP & SCANNING PHASE */}
            {(phase === "setup" || phase === "opening" || phase === "selecting" || phase === "scanning") && (
              <div className="flex flex-col flex-1 p-6 lg:p-10 justify-center">
                
                <ol className="relative border-l-2 border-[var(--border-main)]/50 ml-4 max-w-lg mx-auto w-full space-y-8">                  
                  {/* Step 1 */}
                  <li className={`relative ml-8 transition-all duration-300 ${(phase === "setup" || phase === "opening") ? "opacity-100" : "opacity-40"}`}>
                    <span className={`absolute flex items-center justify-center w-10 h-10 rounded-full -left-[3.25rem] ring-4 ring-[var(--bg-card)] shadow-sm ${(phase === "setup" || phase === "opening") ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-soft)] text-[var(--text-muted)]"}`}>
                      {(phase === "opening") ? <Spinner size={16} /> : (phase === "selecting" || phase === "scanning") ? "✓" : "1"}
                    </span>
                    <h3 className="font-bold text-lg mb-1 leading-tight text-[var(--text-main)]">Mở MYDTU & Đăng nhập</h3>
                    <p className="text-xs font-medium text-[var(--text-muted)] leading-relaxed mb-4">
                      RateFlow cần kết nối với tab MYDTU của bạn.
                    </p>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handleConnect}
                      className="app-btn-primary rounded-xl px-5 py-3 text-sm font-bold shadow-md shadow-[var(--accent)]/20 disabled:scale-100 disabled:opacity-80 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      {phase === "opening" ? "Đang mở tab..." : "🔌 Kết nối MYDTU & Bắt đầu"}
                    </button>
                  </li>

                  {/* Step 2 */}
                  <li className={`relative ml-8 transition-all duration-300 ${(phase === "selecting" || phase === "scanning") ? "opacity-100 translate-y-0" : "opacity-30 pointer-events-none translate-y-4"}`}>
                    <span className={`absolute flex items-center justify-center w-10 h-10 rounded-full -left-[3.25rem] ring-4 ring-[var(--bg-card)] shadow-sm ${phase === "scanning" ? "bg-[var(--accent)] text-white" : (phase === "selecting" ? "bg-[var(--accent-soft)] border-2 border-[var(--accent)] text-[var(--accent)]" : "bg-[var(--bg-soft)] text-[var(--text-muted)]")}`}>
                      {phase === "scanning" ? <Spinner size={16} /> : "2"}
                    </span>
                    <h3 className="font-bold text-lg mb-1 leading-tight text-[var(--text-main)]">Chọn Năm Học & Quét</h3>
                    <div className="bg-[var(--accent-soft)]/30 border border-[var(--accent)]/20 rounded-2xl p-4 mb-4 mt-2 max-w-sm">
                      <p className="text-xs font-semibold text-[var(--text-main)] mb-2">Bạn bắt buộc phải thiết lập trên trang gốc:</p>
                      <ul className="text-xs font-medium text-[var(--text-muted)] space-y-1.5 list-disc pl-4 marker:text-[var(--accent)]">
                        <li>Bấm nút bên dưới để sang tab MYDTU.</li>
                        <li>Chọn <strong>Năm học</strong> & <strong>Học kỳ</strong> mong muốn.</li>
                        <li>Chờ danh sách giảng viên hiện ra trên MyDTU.</li>
                        <li>Quay lại màn hình này và bấm Quét.</li>
                      </ul>
                    </div>
                    
                    <div className="flex flex-col gap-3 max-w-sm">
                      {phase === "selecting" && !hasVisitedMydtu ? (
                        <button
                          type="button"
                          onClick={() => {
                            rateflowRedirectTab("https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_ratingchoicesemester&functionid=15");
                            setHasVisitedMydtu(true);
                          }}
                          className="relative overflow-hidden group rounded-[1.25rem] px-5 py-3.5 text-[14px] font-black shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]"
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="text-lg group-hover:scale-110 transition-transform">🎓</span> 
                          <span>Chuyển sang Tab MYDTU chọn ngay</span>
                          <span className="animate-bounce ml-1">👉</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleScan}
                          disabled={phase !== "selecting"}
                          className={`relative overflow-hidden group rounded-[1.25rem] px-5 py-3.5 text-[14px] font-black shadow-lg transition-all flex items-center justify-center gap-2.5 ${
                            phase !== "selecting" 
                              ? "bg-[var(--bg-soft)] text-[var(--text-muted)] opacity-50 cursor-not-allowed border border-transparent" 
                              : "text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:translate-y-0 border border-emerald-400/50"
                          }`}
                        >
                          {phase === "selecting" && <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          {phase === "scanning" ? <Spinner size={16} /> : (
                            <>
                              <span className="text-lg">✨</span>
                              <span>Đã chọn xong? QUÉT DANH SÁCH</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {!teachers.length && hasVisitedMydtu && <span className="absolute -bottom-6 left-0 text-[11px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-200 dark:border-red-900/60 shadow-sm animate-in slide-in-from-top-1">⚠️ Chưa tìm thấy giảng viên! Hãy xem lại tab MYDTU (Lưu ý: Bạn chọn học kỳ nào mà Lớp Học chưa hiện tên giảng viên hoặc không có Lớp thì sẽ không quét được).</span>}
                  </li>
                </ol>
                
              </div>
            )}

            {/* MAIN ACTION / CAPTCHA PHASE */}
            {(phase === "ready" || phase === "filling" || phase === "captcha" || phase === "submitting" || phase === "done") && (
              <div className="flex flex-col h-full"> 
                {/* View Toolbar */}
                <div className="flex items-center justify-between border-b border-[var(--border-main)] px-5 py-3 bg-[var(--bg-soft)]/50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-black text-sm">3</span>
                    <div className="font-bold text-sm">Xử lý đánh giá</div>
                  </div>
                  {phase === "ready" && pendingCount > 0 && (
                    <button
                      onClick={startAllPending}
                      className="app-btn-primary rounded-xl px-4 py-2 text-xs font-bold shadow-sm shadow-[var(--accent)]/20 animate-in fade-in zoom-in"
                    >
                      ⚡ Tự điền Form tất cả ngay! ({pendingCount})
                    </button>
                  )}
                  {phase !== "ready" && phase !== "filling" && phase !== "submitting" && phase !== "done" && activeTeacher && (
                    <div className="bg-[var(--accent)] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                      Đang thao tác: {activeTeacher.name}
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[400px]">
                  
                  {/* Left sub-panel: Teacher list */}
                  <div className="md:w-[280px] border-r border-[var(--border-main)] bg-[var(--bg-card)] flex flex-col">
                    <div className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border-main)] sticky top-0 bg-[var(--bg-card)]/90 backdrop-blur z-10 flex justify-between">
                      <span>Danh sách quét được</span>
                      <span className="text-[var(--text-main)]">{teachers.length}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                      {teachers.map((t, i) => {
                        const st = (activeIdx !== i && teacherStatus[i] === "active") ? "pending" : (teacherStatus[i] ?? "pending");
                        const isActive = activeIdx === i;
                        // Done teachers CANNOT be clicked (already evaluated)
                        // Failed/skipped CAN be clicked during captcha or ready phase to retry
                        const isDone = st === "done";
                        const isClickable = !isActive && !isDone && (phase === "ready" || phase === "done" || phase === "captcha");
                        
                        return (
                          <div
                            key={i}
                            title={
                              isDone ? "✅ Đã đánh giá xong — không thể đánh giá lại" :
                              isActive ? "⚡ Đang thực hiện..." :
                              isClickable ? "👆 Nhấn để đánh giá người này ngay" : ""
                            }
                            onClick={() => {
                               if (isClickable) {
                                  setTeacherStatus(p => {
                                     const p2 = { ...p, [i]: "pending" as const };
                                     if (activeIdx !== null && activeIdx !== i) p2[activeIdx] = "pending" as const;
                                     return p2;
                                  });
                                  evaluateTeacher(i);
                               }
                            }}
                            className={[
                              "flex items-center gap-2 rounded-xl px-2.5 py-2 transition-all duration-200 border group",
                              isDone 
                                ? "border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/10 opacity-60 cursor-not-allowed select-none"
                                : isClickable 
                                  ? "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
                                  : "",
                              isActive
                                ? "border-[var(--accent)] bg-[var(--accent-soft)]/50 shadow-sm"
                                : !isDone && st === "failed"
                                  ? "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                                  : !isDone && st === "skipped"
                                  ? "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                  : !isDone
                                  ? "border-transparent bg-[var(--bg-soft)]/30 hover:bg-[var(--bg-soft)] hover:border-[var(--border-main)]"
                                  : "",
                            ].join(" ")}
                          >
                            <TeacherBadge status={isActive ? "active" : st} />
                            <div className="min-w-0 flex-[1]">
                              <div className={`font-semibold text-xs truncate ${isDone && "line-through decoration-emerald-400/50 text-emerald-700 dark:text-emerald-400"}`}>
                                {t.name}
                              </div>
                              <div className="text-[9px] text-[var(--text-muted)] truncate mt-0.5 font-medium tracking-wide">
                                {[t.courseName, t.classCode].filter(Boolean).join(" · ") || "—"}
                              </div>
                            </div>
                            {/* Retry hint for failed/skipped */}
                            {isClickable && (st === "failed" || st === "skipped") && (
                              <span className="text-[9px] font-black text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">↺</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Right sub-panel: Working area (CAPTCHA / STATUS) */}
                  <div className="flex-1 bg-gradient-to-br from-[var(--bg-soft)]/20 to-[var(--bg-soft)] flex items-center justify-center p-6 relative">
                    
                    {phase === "ready" && (
                      <div className="text-center max-w-sm animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-20 h-20 bg-[var(--accent-soft)] rounded-full flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner border border-[var(--accent)]/10">
                          🔌
                        </div>
                        <h4 className="text-xl font-bold mb-2 text-[var(--text-main)]">Sẵn sàng!</h4>
                        <p className="text-sm font-medium text-[var(--text-muted)] mb-6">
                          Đã nạp {pendingCount} phiếu đánh giá. Tool sẽ tự chạy qua từng người, bạn chỉ việc gõ mã xác nhận.
                        </p>
                        <button
                          onClick={startAllPending}
                          disabled={pendingCount === 0}
                          className="app-btn-primary w-full rounded-[1rem] px-6 py-4 font-black shadow-lg shadow-[var(--accent)]/20 hover:scale-[1.02] active:scale-95 transition-all text-base mb-3"
                        >
                          {pendingCount === 0 ? "✅ Không có giảng viên cần đánh giá" : "⚡ BẦM ĐỂ BẮT ĐẦU!"}
                        </button>
                        
                        <button
                          onClick={handleCancelQueue}
                          className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors underline decoration-dotted underline-offset-4"
                        >
                          ↶ Quay lại chọn năm học
                        </button>
                      </div>
                    )}
                    
                    {phase === "filling" && (
                      <div className="text-center animate-pulse flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center mb-4">
                          <Spinner size={32} />
                        </div>
                        <div className="font-bold text-sm tracking-wide text-[var(--text-main)]">ĐANG CHUẨN BỊ FORM...</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1 font-medium">{activeTeacher?.name}</div>
                      </div>
                    )}
                    
                    {phase === "captcha" && captcha && (
                      <div className="w-full max-w-sm bg-[var(--bg-card)] p-6 rounded-[2rem] shadow-xl border border-[var(--border-main)] animate-in zoom-in-95 duration-200">
                        <div className="text-center mb-5">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] mb-3 text-xl ring-4 ring-[var(--bg-soft)]">
                            🤖
                          </div>
                          <h4 className="font-black text-lg tracking-tight text-[var(--text-main)]">Xác thực người thật</h4>
                          <p className="text-xs font-semibold text-[var(--text-muted)] mt-0.5">Bước duy nhất bạn cần làm. Form đã điền xong!</p>
                        </div>
                        
                        <div className={[
                          "rounded-2xl border-2 border-[var(--border-main)] flex items-center justify-center p-4 bg-white dark:bg-gray-200 mb-4 h-24",
                          captchaShake ? "animate-[shake_0.35s_ease_3] border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : ""
                        ].join(" ")}>
                            {captcha.base64 ? (
                              <img src={captcha.base64} alt="CAPTCHA" className="max-h-[60px] object-contain" style={{ imageRendering: "pixelated" }} />
                            ) : (
                              <span className="text-xs text-center text-red-500 font-bold">Lỗi ảnh! Bấm "Đổi CAPTCHA"</span>
                            )}
                        </div>

                        {captchaErr && <div className="text-[11px] font-bold text-red-500 text-center mb-3 animate-in fade-in">{captchaErr}</div>}

                        <input
                          ref={captchaRef}
                          type="text"
                          value={captchaVal}
                          onChange={(e) => setCaptchaVal(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter" && captchaVal.trim()) handleSubmitCaptcha(); }}
                          placeholder="••••••"
                          maxLength={8}
                          autoComplete="off"
                          className="w-full rounded-2xl border-2 border-[var(--border-main)] focus:border-[var(--accent)] px-4 py-3.5 text-center text-2xl font-mono font-black tracking-[0.5em] mb-4 bg-[var(--bg-soft)] uppercase text-[var(--text-main)] transition-colors"
                        />

                        <button
                          onClick={handleSubmitCaptcha}
                          disabled={!captchaVal.trim()}
                          className="app-btn-primary w-full rounded-[1rem] px-4 py-3.5 text-sm font-bold shadow-lg shadow-[var(--accent)]/30 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all mb-3 text-white"
                        >
                          Xong! (Enter)
                        </button>
                        
                        <div className="flex gap-2 mb-2">
                          <button onClick={handleReloadCaptcha} className="flex-1 rounded-xl px-2 py-2.5 text-[11px] font-black text-[var(--text-main)] bg-[var(--bg-soft)] border border-[var(--border-main)] hover:bg-[var(--border-main)] transition-colors flex items-center justify-center gap-1.5">
                            <span className="text-xs">🔄</span> Đổi mã
                          </button>
                          <button onClick={handleSkipTeacher} className="flex-1 rounded-xl px-2 py-2.5 text-[11px] font-black text-[var(--text-muted)] bg-[var(--bg-soft)] border border-transparent hover:bg-[var(--bg-card)] hover:border-[var(--border-main)] transition-colors flex items-center justify-center gap-1.5">
                            <span className="text-xs">⏭️</span> Bỏ qua người này
                          </button>
                        </div>

                        {/* Reload Form — fills the form again from scratch, getting a fresh CAPTCHA */}
                        <button
                          onClick={handleReloadForm}
                          className="w-full rounded-xl px-2 py-2.5 text-[11px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-1.5 mb-2"
                        >
                          <span className="text-xs">↺</span> Tải lại Form (Nhập sai thì dùng cái này)
                        </button>

                        <div className="mt-3 pt-3 border-t border-[var(--border-main)]/50 text-center">
                          <button onClick={handleCancelQueue} className="text-[10px] font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider flex items-center justify-center gap-1 mx-auto">
                            <span>🛑</span> Hủy Đợt Đánh Giá
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {phase === "submitting" && (
                      <div className="text-center animate-in fade-in zoom-in duration-300">
                        <Spinner size={40} />
                        <div className="font-bold text-sm tracking-wide text-[var(--text-main)] mt-4">ĐANG NỘP PHIẾU...</div>
                      </div>
                    )}
                    
                    {phase === "done" && (
                      <div className="text-center max-w-sm animate-in zoom-in-95 duration-500 delay-100">
                        <div className="relative w-24 h-24 mx-auto mb-4">
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                          <div className="relative flex justify-center items-center w-full h-full bg-emerald-500 rounded-full text-5xl shadow-[0_0_30px_rgba(16,185,129,0.3)] border-4 border-white dark:border-gray-800 text-white">
                            ✓
                          </div>
                        </div>
                        <h2 className="text-2xl font-black mb-1 bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">Đã xong đợt này!</h2>
                        <p className="text-sm font-semibold text-[var(--text-muted)] mb-6">
                          {statsSkipped > 0 ? `Hoàn tất (Đánh giá: ${statsDone}, Bỏ qua: ${statsSkipped}).` : `Tool đã rút ngắn ${statsDone * 5} phút cuộc đời thủ công của bạn.`}
                        </p>
                        
                        <div className="w-full rounded-[1.25rem] bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/60 p-5 mb-5 shadow-sm text-left">
                          <div className="font-black text-[13px] text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-2">
                            <span>🔓</span> Mở khóa điểm ngay!
                          </div>
                          <div className="text-xs text-blue-600/80 dark:text-blue-300/80 mb-4 font-medium leading-relaxed">
                            Điểm các môn vừa đánh giá đã sẵn sàng. Đồng bộ bảng điểm để xem ngay!
                          </div>
                          {doneSynced ? (
                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex py-2 border-t border-emerald-200 dark:border-emerald-800/50 justify-center">✅ Đã tải dữ liệu điểm mới!</div>
                          ) : (
                            <button
                              onClick={handleSyncGrades}
                              disabled={isSyncing}
                              className="app-btn w-full rounded-xl px-4 py-3 text-xs font-bold disabled:opacity-60 bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow shadow-blue-600/20"
                            >
                              {isSyncing ? "⚡ Đang đồng bộ..." : "📊 Vâng, đồng bộ bảng điểm"}
                            </button>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-3 px-2 mt-2">
                          <button
                            onClick={() => { setPhase("selecting"); setGlobalError(""); }}
                            className="w-full rounded-2xl px-5 py-4 text-sm font-black bg-gradient-to-r from-blue-600 to-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/30 border border-transparent hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                          >
                            <span className="text-xl">🔁</span> BẬT MYDTU, QUÉT ĐỢT TIẾP THEO
                          </button>
                          
                          <div className="flex justify-between items-center px-1 mt-1">
                             <Link href="/transcript" className="text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-wide flex items-center gap-1">
                              Xem bảng điểm →
                            </Link>
                            <button
                              onClick={() => { setPhase("setup"); setTeachers([]); setTeacherStatus({}); setDoneSynced(false); }}
                              className="text-[11px] font-bold text-red-400 opacity-80 hover:opacity-100 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              Khởi động lại toàn bộ
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
        
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-8px) rotate(-1deg); }
          75% { transform: translateX(8px) rotate(1deg); }
        }
        @keyframes shrink {
          from { transform: scaleY(1); }
          to { transform: scaleY(0); transform-origin: top; }
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-main); border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: var(--text-muted); }
      `}</style>
    </div>
  );
}
