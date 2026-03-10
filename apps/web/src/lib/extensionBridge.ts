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

export type ExtensionResponse<T = unknown> = {
  source: "mydtu-assistant-extension";
  requestId: string;
  ok: boolean;
  data?: T;
  error?: string | null;
};

const WEB_SOURCE = "mydtu-assistant-web";
const EXT_SOURCE = "mydtu-assistant-extension";
const DEFAULT_TIMEOUT_MS = 240000;

function makeRequestId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sendToExtension<T = unknown>(
  action: string,
  payload?: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  timeoutMessage = "Extension did not respond (timeout)."
): Promise<ExtensionResponse<T>> {
  const requestId = makeRequestId();

  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      const msg = event.data as ExtensionResponse<T>;
      if (!msg || typeof msg !== "object") return;
      if (msg.source !== EXT_SOURCE) return;
      if (msg.requestId !== requestId) return;

      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
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
      "*"
    );
  });
}

export async function requestSyncFromExtension(
  scope: "timetable",
  t?: (key: string, options?: Record<string, unknown>) => string
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
      t ? t("timetable.sync.timeout") : "Extension did not respond (timeout)."
    );

    if (!res.ok) {
      return {
        ok: false as const,
        error: res.error || (t ? t("timetable.sync.extensionFailed") : "Extension sync failed"),
      };
    }

    if (!res.data) {
      return {
        ok: false as const,
        error: t ? t("timetable.sync.emptyResponse") : "Extension returned empty data.",
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