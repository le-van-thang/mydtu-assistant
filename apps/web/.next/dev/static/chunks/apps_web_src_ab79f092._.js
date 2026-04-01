(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/src/lib/extensionBridge.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "openExamPageInExtension",
    ()=>openExamPageInExtension,
    "openTranscriptDetailPageInExtension",
    ()=>openTranscriptDetailPageInExtension,
    "openTranscriptPageInExtension",
    ()=>openTranscriptPageInExtension,
    "requestExamSync",
    ()=>requestExamSync,
    "requestSyncFromExtension",
    ()=>requestSyncFromExtension,
    "requestTranscriptDetailSync",
    ()=>requestTranscriptDetailSync,
    "requestTranscriptSync",
    ()=>requestTranscriptSync
]);
// path: apps/web/src/lib/extensionBridge.ts
"use client";
const WEB_SOURCE = "mydtu-assistant-web";
const EXT_SOURCE = "mydtu-assistant-extension";
const DEFAULT_TIMEOUT_MS = 300000;
function makeRequestId() {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function sendToExtension(action, payload, timeoutMs = DEFAULT_TIMEOUT_MS, timeoutMessage = "Extension did not respond (timeout).") {
    const requestId = makeRequestId();
    return new Promise((resolve, reject)=>{
        const timer = window.setTimeout(()=>{
            window.removeEventListener("message", onMessage);
            reject(new Error(timeoutMessage));
        }, timeoutMs);
        function onMessage(event) {
            if (event.source !== window) return;
            const msg = event.data;
            if (!msg || typeof msg !== "object") return;
            if (msg.source !== EXT_SOURCE) return;
            if (msg.requestId !== requestId) return;
            window.clearTimeout(timer);
            window.removeEventListener("message", onMessage);
            resolve(msg);
        }
        window.addEventListener("message", onMessage);
        window.postMessage({
            source: WEB_SOURCE,
            requestId,
            action,
            payload: payload ?? null
        }, "*");
    });
}
async function requestSyncFromExtension(scope, t) {
    if (scope !== "timetable") {
        return {
            ok: false,
            error: t ? t("timetable.sync.unsupportedScope", {
                scope
            }) : `Unsupported scope: ${scope}`
        };
    }
    try {
        const res = await sendToExtension("MYDTU_SYNC_TIMETABLE", {
            lookAheadWeeks: 8,
            lookBackWeeks: 0
        }, DEFAULT_TIMEOUT_MS, t ? t("timetable.sync.timeout") : "Extension did not respond (timeout).");
        if (!res.ok) {
            return {
                ok: false,
                error: res.error || (t ? t("timetable.sync.extensionFailed") : "Extension sync failed")
            };
        }
        if (!res.data) {
            return {
                ok: false,
                error: t ? t("timetable.sync.emptyResponse") : "Extension returned empty data."
            };
        }
        return {
            ok: true,
            payload: res.data
        };
    } catch (e) {
        return {
            ok: false,
            error: String(e?.message || e)
        };
    }
}
async function requestExamSync(options) {
    try {
        const res = await sendToExtension("MYDTU_SYNC_EXAMS", {
            maxPages: options?.maxPages ?? 2,
            maxItems: options?.maxItems ?? 24
        }, DEFAULT_TIMEOUT_MS, "Extension background did not respond in time.");
        if (!res.ok) {
            return {
                ok: false,
                error: res.error || "Extension exam sync failed."
            };
        }
        if (!res.data) {
            return {
                ok: false,
                error: "Extension returned empty exam data."
            };
        }
        return {
            ok: true,
            payload: res.data
        };
    } catch (e) {
        return {
            ok: false,
            error: String(e?.message || e)
        };
    }
}
async function openExamPageInExtension() {
    try {
        const res = await sendToExtension("MYDTU_OPEN_EXAM_PAGE", null, 30000, "Open exam page timeout.");
        if (!res.ok) {
            return {
                ok: false,
                error: res.error || "Cannot open exam page."
            };
        }
        return {
            ok: true,
            payload: res.data ?? null
        };
    } catch (e) {
        return {
            ok: false,
            error: String(e?.message || e)
        };
    }
}
async function requestTranscriptSync() {
    try {
        const res = await sendToExtension("MYDTU_SYNC_TRANSCRIPT", {
            includeOverallTranscript: true,
            includeDetailedTranscript: false
        }, DEFAULT_TIMEOUT_MS, "Extension background did not respond in time.");
        if (!res.ok) {
            return {
                ok: false,
                error: res.error || "Extension transcript sync failed."
            };
        }
        if (!res.data) {
            return {
                ok: false,
                error: "Extension returned empty transcript data."
            };
        }
        return {
            ok: true,
            payload: res.data
        };
    } catch (e) {
        return {
            ok: false,
            error: String(e?.message || e)
        };
    }
}
async function openTranscriptPageInExtension() {
    try {
        const res = await sendToExtension("MYDTU_OPEN_TRANSCRIPT_PAGE", null, 30000, "Open transcript page timeout.");
        if (!res.ok) {
            return {
                ok: false,
                error: res.error || "Cannot open transcript page."
            };
        }
        return {
            ok: true,
            payload: res.data ?? null
        };
    } catch (e) {
        return {
            ok: false,
            error: String(e?.message || e)
        };
    }
}
async function requestTranscriptDetailSync() {
    try {
        const res = await sendToExtension("MYDTU_SYNC_TRANSCRIPT_DETAIL", null, DEFAULT_TIMEOUT_MS, "Extension background did not respond in time.");
        if (!res.ok) {
            return {
                ok: false,
                error: res.error || "Extension transcript detail sync failed."
            };
        }
        if (!res.data) {
            return {
                ok: false,
                error: "Extension returned empty transcript detail data."
            };
        }
        return {
            ok: true,
            payload: res.data
        };
    } catch (e) {
        return {
            ok: false,
            error: String(e?.message || e)
        };
    }
}
async function openTranscriptDetailPageInExtension() {
    try {
        const res = await sendToExtension("MYDTU_OPEN_TRANSCRIPT_DETAIL_PAGE", null, 30000, "Open transcript detail page timeout.");
        if (!res.ok) {
            return {
                ok: false,
                error: res.error || "Cannot open transcript detail page."
            };
        }
        return {
            ok: true,
            payload: res.data ?? null
        };
    } catch (e) {
        return {
            ok: false,
            error: String(e?.message || e)
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/app/(app)/transcript/detail/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TranscriptDetailExtensionConnect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/extensionBridge.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/useTranslation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
// path: apps/web/src/app/(app)/transcript/TranscriptDetailExtensionConnect.tsx
"use client";
;
;
;
function TranscriptDetailExtensionConnect() {
    _s();
    const { t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"])();
    const [status, setStatus] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState("idle");
    const [message, setMessage] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState("");
    async function handleOpen() {
        setStatus("opening");
        setMessage(t("transcriptDetail.extension.connectingMessage", "Đang mở trang bảng điểm chi tiết MYDTU. Nếu MYDTU yêu cầu đăng nhập thì hãy đăng nhập trước, sau đó quay lại ứng dụng để đồng bộ."));
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["openTranscriptDetailPageInExtension"])();
            if (!res.ok) {
                throw new Error(res.error || t("transcriptDetail.extension.openFailed", "Không thể mở trang bảng điểm chi tiết MYDTU."));
            }
            setStatus("ready");
            setMessage(t("transcriptDetail.extension.opened", "Đã kết nối MYDTU thành công. Hãy đăng nhập nếu cần, sau đó quay lại và bấm “Sync bảng điểm chi tiết”."));
        } catch (error) {
            setStatus("error");
            setMessage(String(error?.message || t("transcriptDetail.extension.errorMessage", "Kết nối MYDTU thất bại.")));
        }
    }
    const badgeStyle = status === "ready" ? {
        background: "#dcfce7",
        color: "#065f46",
        border: "1px solid #86efac",
        fontWeight: 800
    } : status === "opening" ? {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fca5a5",
        fontWeight: 800
    } : status === "error" ? {
        background: "#fee2e2",
        color: "#991b1b",
        border: "1px solid #fca5a5",
        fontWeight: 800
    } : {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #93c5fd",
        fontWeight: 800
    };
    const label = status === "ready" ? t("transcriptDetail.extension.ready", "Sẵn sàng đồng bộ") : status === "opening" ? t("transcriptDetail.extension.opening", "Đang kết nối") : status === "error" ? t("transcriptDetail.extension.error", "Kết nối lỗi") : t("transcriptDetail.extension.idle", "Chưa kết nối");
    const buttonClass = status === "opening" ? "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(185,28,28,0.35)] transition bg-gradient-to-r from-rose-600 to-red-500" : "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,99,235,0.30)] transition bg-gradient-to-r from-sky-500 to-blue-600 hover:brightness-110";
    const messageClass = status === "ready" ? "border border-emerald-400/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : status === "opening" ? "border border-rose-400/40 bg-rose-500/12 text-rose-700 dark:text-rose-200" : status === "error" ? "border border-red-400/40 bg-red-500/12 text-red-700 dark:text-red-200" : "border border-sky-400/40 bg-sky-500/12 text-sky-700 dark:text-sky-200";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "app-card rounded-3xl p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-3",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: handleOpen,
                            disabled: status === "opening",
                            className: `${buttonClass} disabled:cursor-not-allowed disabled:opacity-95`,
                            children: status === "opening" ? t("transcriptDetail.extension.openingButton", "Đang kết nối MYDTU...") : t("transcriptDetail.extension.openButton", "Kết nối MYDTU")
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/transcript/detail/page.tsx",
                            lineNumber: 114,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/transcript/detail/page.tsx",
                        lineNumber: 113,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl px-4 py-2 text-sm",
                        style: badgeStyle,
                        children: [
                            t("transcriptDetail.extension.statusLabel", "Trạng thái"),
                            ": ",
                            label
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/transcript/detail/page.tsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/transcript/detail/page.tsx",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            message ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `mt-4 rounded-2xl px-4 py-3 text-sm font-extrabold leading-7 shadow-sm ${messageClass}`,
                children: message
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/transcript/detail/page.tsx",
                lineNumber: 135,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/transcript/detail/page.tsx",
        lineNumber: 111,
        columnNumber: 5
    }, this);
}
_s(TranscriptDetailExtensionConnect, "WxGq3/pCWD8vx8txmNLAn3k9TSo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"]
    ];
});
_c = TranscriptDetailExtensionConnect;
var _c;
__turbopack_context__.k.register(_c, "TranscriptDetailExtensionConnect");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_web_src_ab79f092._.js.map