// path: apps/web/src/lib/extensionBridge.ts
"use client";

export type TimetableItemFromExtension = {
  semester: string;
  courseCode: string;
  courseName: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  campus: string | null;
  weeksIncluded: string | null;
  weeksCanceled: string | null;
  rawTitle?: string;
};

export type TimetableSyncPayload = {
  adapterKey: string;
  adapterVersion: string;
  semester: string;
  sourcePage: string;
  items: TimetableItemFromExtension[];
  meta?: {
    weeksSynced?: string[];
    totalWeeks?: number;
    totalItems?: number;
  };
};

export type ExamNoticeFromExtension = {
  detailUrl: string;
  title: string;
  courseCode: string;
  courseName?: string | null;
  isNew: boolean;
  planType: "tentative" | "official";
  publishedAt: {
    raw: string;
    time: string;
    date: string;
  } | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentBase64: string | null;
  attachmentMimeType?: string | null;
  detailText?: string;
  detailError?: string;
  attachmentError?: string;
  sourceText?: string;
};

export type ExamSyncPayload = {
  adapterKey: string;
  adapterVersion: string;
  sourcePage: string;
  scrapedAt: string;
  notices: ExamNoticeFromExtension[];
};

export type TranscriptItemFromExtension = {
  semester: string;
  courseCode: string;
  classCode?: string | null;
  courseName: string;
  credits: number;
  score10: number | null;
  letter: string | null;
  gpa4: number | null;
  status: string | null;
  componentsBreakdown?: Record<string, unknown> | null;
  rawRow?: string | null;
};

export type TranscriptSyncPayload = {
  adapterKey: string;
  adapterVersion: string;
  sourcePage: string;
  scrapedAt: string;
  student: {
    studentId: string | null;
    fullName: string | null;
  } | null;
  items: TranscriptItemFromExtension[];
  meta?: {
    totalSemesters?: number;
    totalItems?: number;
  };
};

export type TranscriptDetailRowFromExtension = {
  semester: string;
  academicYear?: string | null;
  term?: string | null;

  classCode: string;
  courseCode: string;
  courseName: string;

  method?: string | null;
  level?: string | null;
  detailUrl?: string | null;

  componentKey?: string | null;
  componentLabel: string;

  score1: number | null;
  score2: number | null;
  scaleScore: number | null;
  weightPercent: number | null;
  contributionMax: number | null;
  contributionScore: number | null;

  displayOrder?: number;
  rawText?: string | null;
};

export type TranscriptDetailSyncPayload = {
  adapterKey: string;
  adapterVersion: string;
  sourcePage: string;
  scrapedAt: string;
  items: TranscriptDetailRowFromExtension[];
  meta?: {
    totalItems?: number;
    totalClasses?: number;
    totalSemesters?: number;
    requestedSemesters?: string[];
    scannedSemesters?: string[];
    skippedSemesters?: string[];
  };
};

export type ExtensionResponse<T = unknown> = {
  source: "mydtu-assistant-extension";
  requestId: string;
  ok: boolean;
  data?: T;
  error?: string | null;
};

export type ExamSyncJobState = {
  ok: boolean;
  done: boolean;
  status: "queued" | "running" | "success" | "error";
  progress: number;
  message: string;
  error: string | null;
  result: ExamSyncPayload | null;
  createdAt: number;
  updatedAt: number;
};

const WEB_SOURCE = "mydtu-assistant-web";
const EXT_SOURCE = "mydtu-assistant-extension";

const DEFAULT_TIMEOUT_MS = 300000;
const OPEN_PAGE_TIMEOUT_MS = 30000;
const TRANSCRIPT_DETAIL_TIMEOUT_MS = 720000;
const EXAM_JOB_POLL_INTERVAL_MS = 1500;
const EXAM_JOB_MAX_POLLS = 800; // ~20 phút

function makeRequestId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function sendToExtension<T = unknown>(
  action: string,
  payload?: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  timeoutMessage = "Extension did not respond (timeout).",
): Promise<ExtensionResponse<T>> {
  const requestId = makeRequestId();

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;

      const msg = event.data as ExtensionResponse<T>;
      if (!msg || typeof msg !== "object") return;
      if (msg.source !== EXT_SOURCE) return;
      if (msg.requestId !== requestId) return;

      if (settled) return;
      settled = true;
      cleanup();
      resolve(msg);
    }

    window.addEventListener("message", onMessage);

    window.postMessage(
      {
        source: WEB_SOURCE,
        requestId,
        action,
        payload: payload ?? null,
      },
      "*",
    );
  });
}

export async function requestSyncFromExtension(
  scope: "timetable",
  t?: (key: string, options?: Record<string, unknown>) => string,
) {
  if (scope !== "timetable") {
    return {
      ok: false as const,
      error: t
        ? t("timetable.sync.unsupportedScope", { scope })
        : `Unsupported scope: ${scope}`,
    };
  }

  try {
    const res = await sendToExtension<TimetableSyncPayload>(
      "MYDTU_SYNC_TIMETABLE",
      {
        lookAheadWeeks: 8,
        lookBackWeeks: 0,
      },
      DEFAULT_TIMEOUT_MS,
      t ? t("timetable.sync.timeout") : "Extension did not respond (timeout).",
    );

    if (!res.ok) {
      return {
        ok: false as const,
        error:
          res.error ||
          (t ? t("timetable.sync.extensionFailed") : "Extension sync failed"),
      };
    }

    if (!res.data) {
      return {
        ok: false as const,
        error: t
          ? t("timetable.sync.emptyResponse")
          : "Extension returned empty data.",
      };
    }

    return { ok: true as const, payload: res.data };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function startExamSyncJob(options?: {
  maxPages?: number;
  maxItems?: number;
}) {
  try {
    const res = await sendToExtension<{ jobId: string }>(
      "MYDTU_START_EXAM_SYNC",
      {
        maxPages: options?.maxPages ?? 2,
        maxItems: options?.maxItems ?? 24,
      },
      OPEN_PAGE_TIMEOUT_MS,
      "Không khởi động được job đồng bộ lịch thi.",
    );

    if (!res.ok || !res.data?.jobId) {
      return {
        ok: false as const,
        error: res.error || "Không tạo được job đồng bộ lịch thi.",
      };
    }

    return {
      ok: true as const,
      jobId: res.data.jobId,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function getExamSyncJobStatus(jobId: string) {
  try {
    const res = await sendToExtension<ExamSyncJobState>(
      "MYDTU_GET_EXAM_SYNC_STATUS",
      { jobId },
      30000,
      "Không lấy được trạng thái job đồng bộ lịch thi.",
    );

    if (!res.ok || !res.data) {
      return {
        ok: false as const,
        error: res.error || "Không đọc được trạng thái job.",
      };
    }

    return {
      ok: true as const,
      payload: res.data,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

/**
 * Giữ nguyên API cũ cho UI hiện tại.
 * Nhưng bên trong chuyển sang luồng async job + polling,
 * nên không còn bị timeout kiểu blocking nữa.
 */
export async function requestExamSync(options?: {
  maxPages?: number;
  maxItems?: number;
}) {
  try {
    const started = await startExamSyncJob({
      maxPages: options?.maxPages ?? 2,
      maxItems: options?.maxItems ?? 24,
    });

    if (!started.ok) {
      return {
        ok: false as const,
        error: started.error || "Không khởi động được đồng bộ lịch thi.",
      };
    }

    for (let i = 0; i < EXAM_JOB_MAX_POLLS; i += 1) {
      const statusRes = await getExamSyncJobStatus(started.jobId);

      if (!statusRes.ok) {
        return {
          ok: false as const,
          error: statusRes.error || "Không lấy được trạng thái đồng bộ lịch thi.",
        };
      }

      const job = statusRes.payload;

      if (job.done && job.status === "success" && job.result) {
        return {
          ok: true as const,
          payload: job.result,
        };
      }

      if (job.done && job.status === "error") {
        return {
          ok: false as const,
          error: job.error || job.message || "Đồng bộ lịch thi thất bại.",
        };
      }

      await delay(EXAM_JOB_POLL_INTERVAL_MS);
    }

    return {
      ok: false as const,
      error: "Extension phản hồi quá chậm. Hãy thử lại.",
    };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function openExamPageInExtension() {
  try {
    const res = await sendToExtension<{ tabId: number; reused: boolean }>(
      "MYDTU_OPEN_EXAM_PAGE",
      null,
      OPEN_PAGE_TIMEOUT_MS,
      "Open exam page timeout.",
    );

    if (!res.ok) {
      return {
        ok: false as const,
        error: res.error || "Cannot open exam page.",
      };
    }

    return { ok: true as const, payload: res.data ?? null };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function requestTranscriptSync() {
  try {
    const res = await sendToExtension<TranscriptSyncPayload>(
      "MYDTU_SYNC_TRANSCRIPT",
      {
        includeOverallTranscript: true,
        includeDetailedTranscript: false,
      },
      DEFAULT_TIMEOUT_MS,
      "Extension background did not respond in time.",
    );

    if (!res.ok) {
      return {
        ok: false as const,
        error: res.error || "Extension transcript sync failed.",
      };
    }

    if (!res.data) {
      return {
        ok: false as const,
        error: "Extension returned empty transcript data.",
      };
    }

    return { ok: true as const, payload: res.data };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function openTranscriptPageInExtension() {
  try {
    const res = await sendToExtension<{ tabId: number; reused: boolean }>(
      "MYDTU_OPEN_TRANSCRIPT_PAGE",
      null,
      OPEN_PAGE_TIMEOUT_MS,
      "Open transcript page timeout.",
    );

    if (!res.ok) {
      return {
        ok: false as const,
        error: res.error || "Cannot open transcript page.",
      };
    }

    return { ok: true as const, payload: res.data ?? null };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function requestTranscriptDetailSync(input?: {
  targetSemesters?: string[];
}) {
  try {
    const res = await sendToExtension<TranscriptDetailSyncPayload>(
      "MYDTU_SYNC_TRANSCRIPT_DETAIL",
      {
        targetSemesters: input?.targetSemesters ?? [],
      },
      TRANSCRIPT_DETAIL_TIMEOUT_MS,
      "Extension background did not respond in time.",
    );

    if (!res.ok) {
      return {
        ok: false as const,
        error: res.error || "Extension transcript detail sync failed.",
      };
    }

    if (!res.data) {
      return {
        ok: false as const,
        error: "Extension returned empty transcript detail data.",
      };
    }

    return { ok: true as const, payload: res.data };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function openTranscriptDetailPageInExtension() {
  try {
    const res = await sendToExtension<{ tabId: number; reused: boolean }>(
      "MYDTU_OPEN_TRANSCRIPT_DETAIL_PAGE",
      null,
      OPEN_PAGE_TIMEOUT_MS,
      "Open transcript detail page timeout.",
    );

    if (!res.ok) {
      return {
        ok: false as const,
        error: res.error || "Cannot open transcript detail page.",
      };
    }

    return { ok: true as const, payload: res.data ?? null };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}