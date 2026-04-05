// path: apps/extension/content_bridge.js
(() => {
  const SOURCE = "mydtu-assistant-web";
  const TARGET = "mydtu-assistant-extension";
  const SEND_TIMEOUT_MS = 600000;

  function isObject(value) {
    return typeof value === "object" && value !== null;
  }

  function postLegacyResponse(requestId, ok, payload, error) {
    window.postMessage(
      {
        type: "MYDTU_SYNC_RESPONSE",
        requestId,
        ok: !!ok,
        payload: payload ?? null,
        error: error ?? null,
      },
      "*",
    );
  }

  function postBridgeResponse(requestId, ok, data, error) {
    window.postMessage(
      {
        source: TARGET,
        requestId,
        ok: !!ok,
        data: data ?? null,
        error: error ?? null,
      },
      "*",
    );
  }

  function normalizeBridgeError(rawMessage) {
    const text = String(rawMessage || "Runtime sendMessage failed");
    const lowered = text.toLowerCase();

    if (lowered.includes("context invalidated")) {
      return "Extension context invalidated. Hãy reload extension và hard refresh trang web.";
    }

    if (
      lowered.includes("message channel closed") ||
      lowered.includes("a listener indicated an asynchronous response")
    ) {
      return "Kênh đồng bộ của extension bị đóng sớm. Hãy giữ tab MYDTU mở và thử lại.";
    }

    return text;
  }

  function safeSend(message, onDone) {
    if (
      !globalThis.chrome ||
      !chrome.runtime ||
      typeof chrome.runtime.sendMessage !== "function"
    ) {
      onDone({
        ok: false,
        error:
          "chrome.runtime.sendMessage unavailable. Hãy reload extension và hard refresh trang web.",
      });
      return;
    }

    let settled = false;

    const done = (value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      onDone(value);
    };

    const timer = window.setTimeout(() => {
      done({
        ok: false,
        error: "Extension background did not respond in time.",
      });
    }, SEND_TIMEOUT_MS);

    try {
      chrome.runtime.sendMessage(message, (response) => {
        const err = chrome.runtime?.lastError;
        if (err) {
          done({
            ok: false,
            error: normalizeBridgeError(err.message),
          });
          return;
        }

        done(response || { ok: false, error: "Empty response from extension" });
      });
    } catch (e) {
      done({
        ok: false,
        error: normalizeBridgeError(e?.message || e),
      });
    }
  }

  console.log("[MYDTU Sync] content_bridge injected:", location.href);

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const msg = event.data;
    if (!isObject(msg)) return;

    if (msg.type === "MYDTU_SYNC_REQUEST") {
      const requestId = typeof msg.requestId === "string" ? msg.requestId : "";
      const scope = msg.scope;

      if (scope !== "timetable") {
        postLegacyResponse(
          requestId,
          false,
          null,
          `Unsupported scope: ${String(scope)}`,
        );
        return;
      }

      safeSend(
        {
          type: "WEB_TO_EXTENSION",
          requestId,
          action: "MYDTU_SYNC_TIMETABLE",
          payload: null,
        },
        (response) => {
          if (!response?.ok) {
            postLegacyResponse(
              requestId,
              false,
              null,
              response?.error || "Sync failed",
            );
            return;
          }

          postLegacyResponse(requestId, true, response.data ?? null, null);
        },
      );

      return;
    }

    if (msg.source === SOURCE) {
      const requestId = typeof msg.requestId === "string" ? msg.requestId : "";
      const action = typeof msg.action === "string" ? msg.action : "";

      if (!requestId || !action) {
        postBridgeResponse(
          requestId || "unknown",
          false,
          null,
          "Invalid bridge message",
        );
        return;
      }

      safeSend(
        {
          type: "WEB_TO_EXTENSION",
          requestId,
          action,
          payload: msg.payload ?? null,
        },
        (response) => {
          postBridgeResponse(
            requestId,
            !!response?.ok,
            response?.data ?? null,
            response?.error ?? null,
          );
        },
      );
    }
  });
})();
