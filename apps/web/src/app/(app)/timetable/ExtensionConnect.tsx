// path: apps/web/src/app/(app)/timetable/ExtensionConnect.tsx
"use client";

import React from "react";
import { useTranslation } from "react-i18next";

type ExtResponse = {
  source: "mydtu-assistant-extension";
  requestId: string;
  ok: boolean;
  data?: any;
  error?: string | null;
};

type ConnectStatus =
  | "idle"
  | "checking"
  | "connected"
  | "not_connected"
  | "degraded"
  | "error";

const WEB_SOURCE = "mydtu-assistant-web";
const EXT_SOURCE = "mydtu-assistant-extension";

const DEFAULT_TIMEOUT_MS = 15000;
const CHECK_RETRY_COUNT = 1;
const CHECK_RETRY_DELAY_MS = 1200;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTimeoutError(error: unknown) {
  const message = String((error as Error)?.message || error || "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("did not respond in time") ||
    message.includes("did not respond")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function normalizeExtResponse(value: unknown): ExtResponse | null {
  if (!isObject(value)) return null;
  if (value.source !== EXT_SOURCE) return null;
  if (typeof value.requestId !== "string") return null;
  if (typeof value.ok !== "boolean") return null;

  return {
    source: EXT_SOURCE,
    requestId: value.requestId,
    ok: value.ok,
    data: "data" in value ? value.data : undefined,
    error: typeof value.error === "string" ? value.error : null,
  };
}

function sendToExtension(
  action: string,
  payload?: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<ExtResponse> {
  const requestId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
    };

    const finishResolve = (value: ExtResponse) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const finishReject = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const timer = window.setTimeout(() => {
      finishReject(new Error("Extension did not respond in time."));
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;

      const msg = normalizeExtResponse(event.data);
      if (!msg) return;
      if (msg.requestId !== requestId) return;

      finishResolve(msg);
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

async function checkSessionWithRetry() {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= CHECK_RETRY_COUNT; attempt++) {
    try {
      const response = await sendToExtension(
        "MYDTU_CHECK_SESSION",
        null,
        DEFAULT_TIMEOUT_MS
      );

      if (!response.ok) {
        throw new Error(response.error || "Check session failed");
      }

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < CHECK_RETRY_COUNT) {
        await delay(CHECK_RETRY_DELAY_MS);
        continue;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError || "Check session failed"));
}

export default function ExtensionConnect() {
  const { t } = useTranslation();

  const [status, setStatus] = React.useState<ConnectStatus>("idle");
  const [message, setMessage] = React.useState<string>("");
  const [busyAction, setBusyAction] = React.useState<"open" | "check" | null>(
    null
  );

  const meta = React.useMemo(() => {
    switch (status) {
      case "connected":
        return { label: t("timetable.summary.connected"), tone: "success" };
      case "checking":
        return { label: t("settings.saveState.saving"), tone: "info" };
      case "not_connected":
        return { label: t("timetable.summary.notChecked"), tone: "warning" };
      case "degraded":
        return { label: t("common.unknown"), tone: "warning" };
      case "error":
        return { label: t("settings.saveState.error"), tone: "error" };
      default:
        return { label: t("timetable.summary.notChecked"), tone: "info" };
    }
  }, [status, t]);

  async function handleOpenLogin() {
    if (busyAction) return;

    setBusyAction("open");
    setMessage("");

    try {
      const res = await sendToExtension("MYDTU_OPEN_LOGIN", null, 15000);

      if (!res.ok) {
        throw new Error(res.error || "Open login failed");
      }

      setStatus((prev) => (prev === "connected" ? prev : "idle"));
      setMessage(
        t("timetable.actions.connectMyDtu") +
          " OK. " +
          t("timetable.actions.checkConnection")
      );
    } catch (error) {
      setStatus("error");
      setMessage(String((error as Error)?.message || error));
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCheck() {
    if (busyAction) return;

    setBusyAction("check");
    setStatus("checking");
    setMessage("");

    try {
      const res = await checkSessionWithRetry();
      const connected = !!res.data?.connected;

      if (connected) {
        setStatus("connected");
        setMessage(t("timetable.summary.connected"));
      } else {
        setStatus("not_connected");
        setMessage(t("timetable.summary.notChecked"));
      }
    } catch (error) {
      if (isTimeoutError(error)) {
        setStatus("degraded");
        setMessage(t("common.unknown"));
      } else {
        setStatus("error");
        setMessage(String((error as Error)?.message || error));
      }
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="app-card rounded-3xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenLogin}
            disabled={busyAction !== null}
            className="app-btn rounded-2xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "open"
              ? t("common.loading")
              : t("timetable.actions.connectMyDtu")}
          </button>

          <button
            type="button"
            onClick={handleCheck}
            disabled={busyAction !== null}
            className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "check"
              ? t("common.loading")
              : t("timetable.actions.checkConnection")}
          </button>
        </div>

        <div
          className={`rounded-2xl px-3 py-2 text-sm font-medium ${
            meta.tone === "success"
              ? "bg-[var(--success-soft)] text-[var(--success)]"
              : meta.tone === "warning"
              ? "bg-[var(--warning-soft)] text-[var(--warning)]"
              : meta.tone === "error"
              ? "bg-[var(--danger-soft)] text-[var(--danger)]"
              : "bg-[var(--accent-soft)] text-[var(--accent)]"
          }`}
        >
          {t("timetable.summary.connectionStatus")}: {meta.label}
        </div>
      </div>

      {message ? <div className="mt-3 text-sm text-[var(--text-soft)]">{message}</div> : null}
    </div>
  );
}