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
    totalDetailFailures?: number;
    semesterSummaries?: Array<{
      semester: string;
      status: string;
      totalItems?: number;
      totalClasses?: number;
      classesWithDetailLink?: number;
      detailFailures?: number;
      message?: string;
    }>;
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

export type TranscriptDetailSyncJobState = {
  ok: boolean;
  done: boolean;
  status: "queued" | "running" | "success" | "error";
  progress: number;
  message: string;
  error: string | null;
  result: TranscriptDetailSyncPayload | null;
  createdAt: number;
  updatedAt: number;
};

const WEB_SOURCE = "mydtu-assistant-web";
const EXT_SOURCE = "mydtu-assistant-extension";

const DEFAULT_TIMEOUT_MS = 300000;
const OPEN_PAGE_TIMEOUT_MS = 30000;
const TRANSCRIPT_DETAIL_TIMEOUT_MS = 720000;
const EXAM_JOB_POLL_INTERVAL_MS = 1500;
const EXAM_JOB_MAX_POLLS = 800;
const TRANSCRIPT_DETAIL_JOB_POLL_INTERVAL_MS = 1200;
const TRANSCRIPT_DETAIL_JOB_MAX_POLLS = 900; 

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
      "Kh�ng khởi động được job đồng bộ lịch thi.",
    );

    if (!res.ok || !res.data?.jobId) {
      return {
        ok: false as const,
        error: res.error || "Kh�ng tạo được job đồng bộ lịch thi.",
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
      "Kh�ng lấy được trạng th�i job đồng bộ lịch thi.",
    );

    if (!res.ok || !res.data) {
      return {
        ok: false as const,
        error: res.error || "Kh�ng đọc được trạng th�i job.",
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
 * Giữ nguy�n API cũ cho UI hiện tại.
 * Nhưng b�n trong chuyển sang luồng async job + polling,
 * n�n kh�ng c�n bị timeout kiểu blocking nữa.
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
        error: started.error || "Kh�ng khởi động được đồng bộ lịch thi.",
      };
    }

    for (let i = 0; i < EXAM_JOB_MAX_POLLS; i += 1) {
      const statusRes = await getExamSyncJobStatus(started.jobId);

      if (!statusRes.ok) {
        return {
          ok: false as const,
          error: statusRes.error || "Kh�ng lấy được trạng th�i đồng bộ lịch thi.",
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
      error: "Extension phản hồi qu� chậm. H�y thử lại.",
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

export async function startTranscriptDetailSyncJob(input?: {
  targetSemesters?: string[];
  maxYears?: number;
}) {
  try {
    const res = await sendToExtension<{ jobId: string }>(
      "MYDTU_SYNC_TRANSCRIPT_DETAIL",
      {
        targetSemesters: input?.targetSemesters ?? [],
        maxYears: input?.maxYears ?? 0,
      },
      OPEN_PAGE_TIMEOUT_MS,
      "Không khởi động được đồng bộ bảng điểm chi tiết.",
    );

    if (!res.ok || !res.data?.jobId) {
      return {
        ok: false as const,
        error: res.error || "Không tạo được job đồng bộ bảng điểm chi tiết.",
      };
    }

    return { ok: true as const, jobId: res.data.jobId };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function requestTranscriptDetailSync(input?: {
  targetSemesters?: string[];
  maxYears?: number;
}) {
  try {
    const started = await startTranscriptDetailSyncJob(input);

    if (!started.ok) {
      return {
        ok: false as const,
        error: started.error || "Could not start transcript detail sync.",
      };
    }

    for (let i = 0; i < TRANSCRIPT_DETAIL_JOB_MAX_POLLS; i += 1) {
      const statusRes = await sendToExtension<TranscriptDetailSyncJobState>(
        "MYDTU_GET_TRANSCRIPT_DETAIL_SYNC_STATUS",
        { jobId: started.jobId },
        30000,
        "Could not get transcript detail sync job status.",
      );

      if (!statusRes.ok || !statusRes.data) {
        return {
          ok: false as const,
          error:
            statusRes.error || "Could not read transcript detail sync status.",
        };
      }

      const job = statusRes.data;

      if (job.done && job.status === "success" && job.result) {
        return {
          ok: true as const,
          payload: job.result,
        };
      }

      if (job.done && job.status === "error") {
        return {
          ok: false as const,
          error:
            job.error || job.message || "Transcript detail sync failed.",
        };
      }

      await delay(TRANSCRIPT_DETAIL_JOB_POLL_INTERVAL_MS);
    }

    return {
      ok: false as const,
      error: "Đồng bộ quá lâu. Hãy giữ tab MYDTU mở và thử lại.",
    };
  } catch (e) {
    return {
      ok: false as const,
      error: String((e as Error)?.message || e),
    };
  }
}

export async function getTranscriptDetailSyncJobStatus(jobId: string) {
  try {
    const res = await sendToExtension<TranscriptDetailSyncJobState>(
      "MYDTU_GET_TRANSCRIPT_DETAIL_SYNC_STATUS",
      { jobId },
      30000,
      "Could not get transcript detail sync job status.",
    );

    if (!res.ok || !res.data) {
      return {
        ok: false as const,
        error: res.error || "Could not read transcript detail sync status.",
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

// ═══════════════════════════════════════════════════════════════
// RATEFLOW — Đánh giá giảng viên nhanh
// ═══════════════════════════════════════════════════════════════

export type TeacherToRate = {
  index: number;
  name: string;
  courseName: string;
  classCode: string;
  isDone: boolean;
  formUrl: string;
  instructorId: string;
  classId: string;
};

export type RatingPolicy =
  | "all_5"
  | "all_4"
  | "all_3"
  | "random_4_5"
  | "random_3_5";

export type RateflowTextTemplates = {
  q49?: string;
  q50?: string;
  q51?: string;
  q52?: string;
};

export type CaptchaInfo = {
  ok: boolean;
  base64: string | null;
  src?: string;
  width?: number;
  height?: number;
  error?: string;
};

export type RateflowFillResult = {
  ok: boolean;
  fillResult?: { filledRadioGroups: number; filledTextareas: number };
  captcha?: CaptchaInfo;
  error?: string;
};

export type RateflowSubmitResult = {
  ok: boolean;
  captchaError?: boolean;
  redirectedTo?: string;
  error?: string;
};

const RATEFLOW_TIMEOUT_MS = 45000;

export async function rateflowOpenPage() {
  try {
    const res = await sendToExtension<{ tabId: number; reused: boolean }>(
      "MYDTU_RATEFLOW_OPEN_PAGE",
      null,
      OPEN_PAGE_TIMEOUT_MS,
      "Không mở được trang đánh giá giảng viên.",
    );
    if (!res.ok) return { ok: false as const, error: res.error || "Cannot open rating page." };
    return { ok: true as const, payload: res.data ?? null };
  } catch (e) {
    return { ok: false as const, error: String((e as Error)?.message || e) };
  }
}

export async function rateflowRedirectTab(url: string) {
  try {
    const res = await sendToExtension(
      "MYDTU_RATEFLOW_REDIRECT",
      { url },
      10000,
      "Không thể điều hướng tab MYDTU.",
    );
    if (!res.ok) return { ok: false as const, error: res.error || "Redirect failed." };
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: String((e as Error)?.message || e) };
  }
}

export async function rateflowScanTeachers() {
  try {
    const res = await sendToExtension<{ teachers: TeacherToRate[] }>(
      "MYDTU_RATEFLOW_SCAN",
      null,
      RATEFLOW_TIMEOUT_MS,
      "Không lấy được danh sách giảng viên.",
    );
    if (!res.ok || !res.data)
      return { ok: false as const, error: res.error || "Scan teachers failed." };
    return { ok: true as const, teachers: res.data.teachers ?? [] };
  } catch (e) {
    return { ok: false as const, error: String((e as Error)?.message || e) };
  }
}

export async function rateflowFillForm(
  formUrl: string,
  policy: RatingPolicy,
  texts: RateflowTextTemplates,
): Promise<RateflowFillResult> {
  try {
    const res = await sendToExtension<RateflowFillResult>(
      "MYDTU_RATEFLOW_FILL_FORM",
      { formUrl, policy, texts },
      RATEFLOW_TIMEOUT_MS,
      "Không fill được form đánh giá.",
    );
    if (!res.ok) return { ok: false, error: res.error || "Fill form failed." };
    return { ok: true, ...(res.data ?? {}) };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

export async function rateflowReloadCaptcha(): Promise<{ ok: boolean; captcha?: CaptchaInfo; error?: string }> {
  try {
    const res = await sendToExtension<{ captcha: CaptchaInfo }>(
      "MYDTU_RATEFLOW_RELOAD_CAPTCHA",
      null,
      15000,
      "Không reload được CAPTCHA.",
    );
    if (!res.ok) return { ok: false, error: res.error || "Reload captcha failed." };
    return { ok: true, captcha: res.data?.captcha };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}

export async function rateflowSubmit(captchaText: string): Promise<RateflowSubmitResult> {
  try {
    const res = await sendToExtension<RateflowSubmitResult>(
      "MYDTU_RATEFLOW_SUBMIT",
      { captchaText },
      20000,
      "Không submit được form đánh giá.",
    );
    if (!res.ok) {
      // Must preserve custom error metadata like captchaError from the background script
      return { ok: false, error: res.error || "Submit failed.", ...(res as any) };
    }
    return { ok: true, ...(res.data ?? {}) };
  } catch (e) {
    return { ok: false, error: String((e as Error)?.message || e) };
  }
}
