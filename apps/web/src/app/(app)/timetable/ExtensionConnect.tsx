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
  | "stale_extension"
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
  const message = String(
    (error as Error)?.message || error || "",
  ).toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("did not respond in time") ||
    message.includes("did not respond")
  );
}

function isInvalidatedExtensionError(error: unknown) {
  const message = String(
    (error as Error)?.message || error || "",
  ).toLowerCase();
  return (
    message.includes("extension context invalidated") ||
    message.includes("context invalidated")
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
  timeoutMs = DEFAULT_TIMEOUT_MS,
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
      "*",
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
        DEFAULT_TIMEOUT_MS,
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
  const { t, i18n } = useTranslation();

  const [status, setStatus] = React.useState<ConnectStatus>("idle");
  const [message, setMessage] = React.useState<string>("");
  const [busyAction, setBusyAction] = React.useState<"open" | "check" | null>(
    null,
  );

  const staleMessage =
    i18n.language === "en"
      ? "The extension was reloaded or updated. Please reload the extension in Chrome and hard refresh this page."
      : "Tiện ích đã bị reload hoặc cập nhật. Hãy tải lại extension trong Chrome rồi hard refresh trang này.";

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
      case "stale_extension":
        return {
          label: i18n.language === "en" ? "Extension stale" : "Extension cũ",
          tone: "warning",
        };
      case "error":
        return { label: t("settings.saveState.error"), tone: "error" };
      default:
        return { label: t("timetable.summary.notChecked"), tone: "info" };
    }
  }, [status, t, i18n.language]);

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
        i18n.language === "en"
          ? "MYDTU login page opened. Please log in there, then click Check connection."
          : "Đã mở trang đăng nhập MYDTU. Hãy đăng nhập bên đó rồi bấm Kiểm tra kết nối.",
      );
    } catch (error) {
      if (isInvalidatedExtensionError(error)) {
        setStatus("stale_extension");
        setMessage(staleMessage);
      } else {
        setStatus("error");
        setMessage(String((error as Error)?.message || error));
      }
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
        setMessage(
          i18n.language === "en"
            ? "Connection verified successfully."
            : "Kiểm tra kết nối thành công.",
        );
      } else {
        setStatus("not_connected");
        setMessage(
          i18n.language === "en" ? "Not connected yet." : "Chưa kết nối.",
        );
      }
    } catch (error) {
      if (isInvalidatedExtensionError(error)) {
        setStatus("stale_extension");
        setMessage(staleMessage);
      } else if (isTimeoutError(error)) {
        setStatus("degraded");
        setMessage(
          i18n.language === "en"
            ? "The extension responded too slowly."
            : "Extension phản hồi quá chậm.",
        );
      } else {
        setStatus("error");
        setMessage(String((error as Error)?.message || error));
      }
    } finally {
      setBusyAction(null);
    }
  }

  const badgeStyle =
    meta.tone === "success"
      ? {
          background: "#d1fae5",
          color: "#047857",
          border: "1px solid #a7f3d0",
          fontWeight: 700,
        }
      : meta.tone === "warning"
        ? {
            background: "#fef3c7",
            color: "#b45309",
            border: "1px solid #fcd34d",
            fontWeight: 700,
          }
        : meta.tone === "error"
          ? {
              background: "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              fontWeight: 700,
            }
          : {
              background: "#dbeafe",
              color: "#1d4ed8",
              border: "1px solid #93c5fd",
              fontWeight: 700,
            };

  return (
    <div className="app-card rounded-3xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenLogin}
            disabled={busyAction !== null}
            className="app-btn rounded-2xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "open"
              ? t("common.loading")
              : t("timetable.actions.connectMyDtu")}
          </button>

          <button
            type="button"
            onClick={handleCheck}
            disabled={busyAction !== null}
            className="app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyAction === "check"
              ? t("common.loading")
              : t("timetable.actions.checkConnection")}
          </button>
        </div>

        <div className="rounded-2xl px-3 py-2 text-sm" style={badgeStyle}>
          {t("timetable.summary.connectionStatus")}: {meta.label}
        </div>
      </div>

      {message ? (
        <div className="mt-3 text-sm font-medium text-[var(--text-main)]">
          {message}
        </div>
      ) : null}
    </div>
  );
}
