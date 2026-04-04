// path: apps/web/src/components/SyncTranscriptDetailButton.tsx
"use client";

import {
  startTranscriptDetailSyncJob,
  getTranscriptDetailSyncJobStatus,
} from "@/lib/extensionBridge";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type Tone = "info" | "success" | "warning" | "error";
type SyncMode = "quick" | "full";

type SemesterSummary = {
  semester?: string;
  status?: string;
  totalItems?: number;
  totalClasses?: number;
  classesWithDetailLink?: number;
  detailFailures?: number;
  message?: string;
};

type TranscriptDetailMeta = {
  totalItems?: number;
  totalClasses?: number;
  totalSemesters?: number;
  requestedSemesters?: string[];
  scannedSemesters?: string[];
  skippedSemesters?: string[];
  totalDetailFailures?: number;
  semesterSummaries?: SemesterSummary[];
};

function normalizeSpace(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function tSafe(
  t: (key: string, options?: Record<string, unknown>) => string,
  key: string,
  defaultValue: string,
  options?: Record<string, unknown>,
) {
  return t(key, { defaultValue, ...(options ?? {}) });
}

function mapTranscriptDetailError(
  raw: string,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const text = normalizeSpace(raw);
  const low = text.toLowerCase();

  if (low.includes("timeout") || low.includes("too long") || low.includes("quá lâu")) {
    return tSafe(
      t,
      "transcriptDetail.sync.errors.timeout",
      "Đồng bộ quá lâu. Hãy giữ tab MYDTU bảng điểm chi tiết mở và thử lại.",
    );
  }

  if (
    low.includes("receiving end does not exist") ||
    low.includes("could not establish connection") ||
    low.includes("kênh đồng bộ của extension bị đóng sớm")
  ) {
    return tSafe(
      t,
      "transcriptDetail.sync.errors.extensionReload",
      "Extension chưa sẵn sàng hoặc đã bị reload. Hãy mở lại trang MYDTU rồi thử lại.",
    );
  }

  if (
    low.includes("message channel closed") ||
    low.includes("a listener indicated an asynchronous response")
  ) {
    return tSafe(
      t,
      "transcriptDetail.sync.errors.channelClosed",
      "Kênh đồng bộ bị đóng sớm. Hãy giữ tab MYDTU mở rồi thử lại.",
    );
  }

  if (low.includes("chưa đăng nhập") || low.includes("hết hạn")) {
    return tSafe(
      t,
      "transcriptDetail.sync.errors.notLoggedIn",
      "Bạn chưa đăng nhập MYDTU hoặc phiên đã hết hạn. Hãy bấm \"Kết nối MYDTU\" và đăng nhập lại.",
    );
  }

  if (low.includes("invalid transcript detail payload")) {
    return tSafe(
      t,
      "transcriptDetail.sync.errors.invalidPayload",
      "Dữ liệu lấy từ MYDTU chưa đúng cấu trúc. Hãy thử lại sau.",
    );
  }

  return (
    text ||
    tSafe(
      t,
      "transcriptDetail.sync.errors.unknown",
      "Đồng bộ bảng điểm chi tiết thất bại.",
    )
  );
}

function buildSummaryMessage(
  meta: TranscriptDetailMeta | undefined,
  counts: Record<string, unknown> | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const inserted = Number(counts?.inserted || 0);
  const skipped = Number(counts?.skipped || 0);
  const scanned = Number(meta?.scannedSemesters?.length || 0);
  // ‘requested’ = tổng học kỳ được yêu cầu (khớp với {{requested}} trong JSON)
  const requested = Number(
    meta?.requestedSemesters?.length ||
    (meta?.scannedSemesters?.length || 0) + (meta?.skippedSemesters?.length || 0) ||
    scanned ||
    0,
  );
  const detailFailures = Number(meta?.totalDetailFailures || 0);
  const totalItems = Number(meta?.totalItems || 0);

  return tSafe(
    t,
    "transcriptDetail.sync.summary",
    "Đã quét {{scanned}}/{{requested}} học kỳ, lưu {{inserted}} dòng thành phần, bỏ qua {{skipped}} dòng không khớp transcript, lỗi mở trang chi tiết ở {{detailFailures}} lớp.",
    { scanned, requested, totalItems, inserted, skipped, detailFailures },
  );
}

function buildWarningLines(
  meta: TranscriptDetailMeta | undefined,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const summaries = Array.isArray(meta?.semesterSummaries)
    ? meta?.semesterSummaries
    : [];

  // Chỉ cảnh báo học kỳ có lớp nhưng không lấy được đủ dữ liệu (partial)
  // Không cảnh báo các học kỳ rỗng (empty/missing) vì đó là bình thường
  return summaries
    .filter((item) => item.status === "partial")
    .slice(0, 3)
    .map((item) => {
      const semester =
        normalizeSpace(item.semester) ||
        tSafe(t, "transcriptDetail.sync.unknownSemester", "Học kỳ không rõ");
      const failures = item.detailFailures || 0;
      return `${semester}: ${failures} lớp không lấy được trang chi tiết.`;
    });
}

// Tính thời gian ước tính hiển thị
function estLabel(mode: SyncMode) {
  return mode === "quick" ? "~30–90 giây" : "~3–15 phút";
}

export default function SyncTranscriptDetailButton() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isExtensionReady, setIsExtensionReady] = useState(false);
  const [mode, setMode] = useState<SyncMode>("quick");
  const [tone, setTone] = useState<Tone>("info");
  const [headline, setHeadline] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [progress, setProgress] = useState<{
    percent: number;
    message: string;
  } | null>(null);
  const pollingRef = useRef(false);

  // Dừng polling khi component unmount + lắng nghe sự kiện Ready
  useEffect(() => {
    const onReady = () => setIsExtensionReady(true);
    const onIdle = () => setIsExtensionReady(false);

    window.addEventListener("mydtu:extension-ready", onReady);
    window.addEventListener("mydtu:extension-idle", onIdle);

    return () => {
      pollingRef.current = false;
      window.removeEventListener("mydtu:extension-ready", onReady);
      window.removeEventListener("mydtu:extension-idle", onIdle);
    };
  }, []);

  async function onSync() {
    if (!isExtensionReady) {
      setTone("warning");
      setHeadline(
        tSafe(
          t,
          "transcriptDetail.sync.notReady",
          "Hệ thống chưa kết nối trang nguồn MYDTU. Hãy nhấn 'Kết nối MYDTU' bên dưới và đợi trạng thái 'Sẵn sàng' rồi mới bấm Sync.",
        ),
      );
      return;
    }

    pollingRef.current = true;
    setLoading(true);
    setTone("info");
    setHeadline(null);
    setDetails([]);
    setProgress({ percent: 0, message: "Đang khởi động..." });

    try {
      // Bắt đầu job
      const started = await startTranscriptDetailSyncJob({
        maxYears: mode === "quick" ? 1 : 0,
      });

      if (!started.ok) {
        setTone("error");
        setHeadline(mapTranscriptDetailError(started.error || "", t));
        setProgress(null);
        setLoading(false);
        pollingRef.current = false;
        return;
      }

      const jobId = started.jobId;

      // Poll progress real-time
      for (let i = 0; i < 900 && pollingRef.current; i++) {
        const statusRes = await getTranscriptDetailSyncJobStatus(jobId);

        if (!statusRes.ok || !statusRes.payload) {
          // transient error — thử lại
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }

        const job = statusRes.payload;

        // Cập nhật progress bar
        if (!job.done) {
          setProgress({
            percent: job.progress || 0,
            message: job.message || "Đang xử lý...",
          });
        }

        // Job hoàn thành - thành công
        if (job.done && job.status === "success" && job.result) {
          setProgress({ percent: 100, message: "Đang lưu dữ liệu vào hệ thống..." });

          try {
            const upstream = await fetch("/api/sync/transcript-detail", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(job.result),
              credentials: "include",
              cache: "no-store",
            });

            const json = await upstream.json().catch(() => null);

            if (!upstream.ok || !json?.ok) {
              setTone("error");
              setHeadline(
                mapTranscriptDetailError(
                  json?.message || json?.error || `HTTP ${upstream.status}`,
                  t,
                ),
              );
              setDetails([]);
            } else {
              const meta = (job.result.meta || {}) as TranscriptDetailMeta;
              const scanned = Number(meta.scannedSemesters?.length || 0);
              const requested = Number(meta.requestedSemesters?.length || 0);
              const warningLines = buildWarningLines(meta, t);
              
              // Nếu quét 0/N học kỳ thì coi là Warning (có thể do trang nguồn chưa ready)
              const isScanEmpty = scanned === 0 && requested > 0;
              const hasWarnings =
                isScanEmpty ||
                warningLines.length > 0 ||
                Number(meta.totalDetailFailures || 0) > 0;

              setTone(hasWarnings ? "warning" : "success");
              setHeadline(buildSummaryMessage(meta, json?.counts, t));
              
              if (isScanEmpty) {
                setDetails([
                  tSafe(
                    t,
                    "transcriptDetail.sync.emptyScanHint",
                    "Dữ liệu quét từ MYDTU trả về trống. Hãy giữ tab MYDTU mở và đợi trang tải xong rồi mới Sync.",
                  ),
                ]);
              } else {
                setDetails(
                  warningLines.length > 0
                    ? warningLines
                    : [
                        tSafe(
                          t,
                          "transcriptDetail.sync.refreshHint",
                          "Bảng điểm chi tiết đã được cập nhật. Cuộn xuống để xem.",
                        ),
                      ],
                );
              }

              // Kích hoạt reload UI
              window.dispatchEvent(
                new CustomEvent("mydtu:transcript-detail-updated"),
              );
            }
          } catch (fetchErr) {
            setTone("error");
            setHeadline(
              mapTranscriptDetailError(
                String((fetchErr as Error)?.message || fetchErr),
                t,
              ),
            );
          }

          setProgress(null);
          setLoading(false);
          pollingRef.current = false;
          return;
        }

        // Job hoàn thành - thất bại
        if (job.done && job.status === "error") {
          setTone("error");
          setHeadline(
            mapTranscriptDetailError(job.error || job.message || "", t),
          );
          setDetails([]);
          setProgress(null);
          setLoading(false);
          pollingRef.current = false;
          return;
        }

        // Tiếp tục poll
        await new Promise((r) => setTimeout(r, 1200));
      }

      // Hết vòng poll mà job chưa xong
      setTone("error");
      setHeadline(
        tSafe(
          t,
          "transcriptDetail.sync.errors.timeout",
          "Đồng bộ quá lâu. Hãy giữ tab MYDTU mở và thử lại.",
        ),
      );
    } catch (err) {
      setTone("error");
      setHeadline(
        mapTranscriptDetailError(String((err as Error)?.message || err), t),
      );
    }

    setProgress(null);
    setLoading(false);
    pollingRef.current = false;
  }

  const messageClass =
    tone === "success"
      ? "msg-success"
      : tone === "warning"
        ? "msg-warning"
        : tone === "error"
          ? "msg-error"
          : "msg-info";

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Nút sync + chọn chế độ */}
      <div className="flex items-center gap-2">
        {/* Toggle chế độ */}
        <div className="flex items-center rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-1 text-xs font-bold">
          <button
            type="button"
            disabled={loading}
            onClick={() => setMode("quick")}
            className={`rounded-xl px-3 py-1.5 transition-all ${
              mode === "quick"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            ⚡ Nhanh
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => setMode("full")}
            className={`rounded-xl px-3 py-1.5 transition-all ${
              mode === "full"
                ? "bg-[var(--accent)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            📚 Đầy đủ
          </button>
        </div>

        {/* Nút Sync */}
        <button
          type="button"
          disabled={loading}
          onClick={() => void onSync()}
          className="app-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Đang đồng bộ...
            </>
          ) : (
            tSafe(t, "transcriptDetail.sync.button", "Sync bảng điểm chi tiết")
          )}
        </button>
      </div>

      {/* Ước tính thời gian */}
      {!loading && (
        <p className="text-right text-xs app-text-soft">
          {mode === "quick"
            ? `⚡ Chế độ nhanh — chỉ quét 1 năm học gần nhất (${estLabel("quick")})`
            : `📚 Chế độ đầy đủ — quét toàn bộ lịch sử học (${estLabel("full")})`}
        </p>
      )}

      {/* Progress bar real-time */}
      {loading && progress && (
        <div className="msg-info w-full max-w-sm rounded-2xl px-4 py-3 text-sm">
          <div className="mb-2 font-bold leading-snug">{progress.message}</div>
          <div className="relative h-2 overflow-hidden rounded-full bg-[var(--bg-main)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-all duration-700"
              style={{ width: `${Math.max(5, progress.percent)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs opacity-70">
            <span>Ước tính: {estLabel(mode)}</span>
            <span>{progress.percent}%</span>
          </div>
        </div>
      )}

      {/* Kết quả / Lỗi */}
      {!loading && headline && (
        <div className={`${messageClass} w-full max-w-sm rounded-2xl px-4 py-3 text-sm`}>
          <div className="font-bold leading-snug">{headline}</div>
          {details.length > 0 && (
            <ul className="mt-2 space-y-1 font-semibold opacity-90">
              {details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
