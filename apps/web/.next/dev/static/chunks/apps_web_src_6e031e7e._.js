(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/src/components/common/InAppNotice.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>InAppNotice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// path: apps/web/src/components/common/InAppNotice.tsx
"use client";
;
function InAppNotice({ tone = "info", title, message }) {
    const toneClass = tone === "success" ? "border-[color:var(--success)]/30 bg-[var(--success-soft)] text-[var(--success)]" : tone === "warning" ? "border-[color:var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--warning)]" : tone === "error" ? "border-[color:var(--danger)]/30 bg-[var(--danger-soft)] text-[var(--danger)]" : "border-[color:var(--accent)]/30 bg-[var(--accent-soft)] text-[var(--accent)]";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `rounded-2xl border px-4 py-3 ${toneClass}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-sm font-semibold",
                children: title
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/common/InAppNotice.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-1 text-sm opacity-90",
                children: message
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/common/InAppNotice.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/components/common/InAppNotice.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
_c = InAppNotice;
var _c;
__turbopack_context__.k.register(_c, "InAppNotice");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/lib/extensionBridge.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "openExamPageInExtension",
    ()=>openExamPageInExtension,
    "requestExamSync",
    ()=>requestExamSync,
    "requestSyncFromExtension",
    ()=>requestSyncFromExtension
]);
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/components/SyncTimetableButton.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SyncTimetableButton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/extensionBridge.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/useTranslation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function isObject(value) {
    return typeof value === "object" && value !== null;
}
function toNonEmptyString(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function toDayOfWeek(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
        const n = Math.trunc(value);
        return n >= 1 && n <= 7 ? n : null;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const n = Number(trimmed);
        if (Number.isFinite(n)) {
            const intVal = Math.trunc(n);
            return intVal >= 1 && intVal <= 7 ? intVal : null;
        }
    }
    return null;
}
function buildImportBody(rawPayload, t) {
    if (!isObject(rawPayload)) {
        throw new Error(t("timetable.sync.invalidPayload"));
    }
    const payload = rawPayload;
    const adapterKey = toNonEmptyString(payload.adapterKey) || "mydtu_timetable_v1";
    const adapterVersion = toNonEmptyString(payload.adapterVersion) || "1.2.0";
    const semester = toNonEmptyString(payload.semester) || "MYDTU_TIMETABLE";
    const sourcePage = toNonEmptyString(payload.sourcePage) || "https://mydtu.duytan.edu.vn/sites/index.aspx?p=home_timetable&functionid=13";
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    if (rawItems.length === 0) {
        throw new Error(t("timetable.sync.emptyItems"));
    }
    const items = rawItems.map((item, index)=>{
        const row = index + 1;
        const courseCode = toNonEmptyString(item.courseCode);
        const dayOfWeek = toDayOfWeek(item.dayOfWeek);
        const startTime = toNonEmptyString(item.startTime);
        const endTime = toNonEmptyString(item.endTime);
        const room = toNonEmptyString(item.room);
        if (!courseCode) {
            throw new Error(t("timetable.sync.missingCourseCode", {
                row
            }));
        }
        if (!dayOfWeek) {
            throw new Error(t("timetable.sync.missingDayOfWeek", {
                row
            }));
        }
        if (!startTime) {
            throw new Error(t("timetable.sync.missingStartTime", {
                row
            }));
        }
        if (!endTime) {
            throw new Error(t("timetable.sync.missingEndTime", {
                row
            }));
        }
        if (!room) {
            throw new Error(t("timetable.sync.missingRoom", {
                row
            }));
        }
        return {
            semester: toNonEmptyString(item.semester) || semester,
            courseCode,
            courseName: toNonEmptyString(item.courseName),
            dayOfWeek,
            startTime,
            endTime,
            room,
            campus: toNonEmptyString(item.campus),
            weeksIncluded: toNonEmptyString(item.weeksIncluded) ?? "",
            weeksCanceled: toNonEmptyString(item.weeksCanceled) ?? ""
        };
    });
    return {
        adapterKey,
        adapterVersion,
        semester,
        sourcePage,
        items
    };
}
function SyncTimetableButton() {
    _s();
    const { t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"])();
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [msg, setMsg] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [tone, setTone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("info");
    async function onSync() {
        setLoading(true);
        setMsg(t("timetable.sync.scanning"));
        setTone("info");
        try {
            const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestSyncFromExtension"])("timetable", t);
            if (!res.ok) {
                setTone("error");
                setMsg(res.error || t("timetable.sync.extensionFailed"));
                return;
            }
            const importBody = buildImportBody(res.payload, t);
            // SỬA CHỖ NÀY: gọi đúng endpoint sync timetable
            const upstream = await fetch("/api/sync/timetable", {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify(importBody),
                cache: "no-store",
                credentials: "include"
            });
            const json = await upstream.json().catch(()=>null);
            if (!upstream.ok) {
                setTone("error");
                setMsg(json?.message || json?.error || t("timetable.sync.importFailedWithStatus", {
                    status: upstream.status
                }));
                return;
            }
            const totalWeeks = Number(res.payload?.meta?.totalWeeks || 0);
            const totalItems = Number(res.payload?.meta?.totalItems || importBody.items.length);
            setTone("success");
            setMsg(t("timetable.sync.success", {
                totalItems,
                totalWeeks
            }));
            window.dispatchEvent(new CustomEvent("mydtu:timetable-updated"));
        } catch (e) {
            setTone("error");
            setMsg(String(e?.message || e));
        } finally{
            setLoading(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-end gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: onSync,
                disabled: loading,
                className: "app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold disabled:opacity-60",
                children: loading ? t("timetable.sync.syncing") : t("timetable.actions.syncExtension")
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/SyncTimetableButton.tsx",
                lineNumber: 225,
                columnNumber: 7
            }, this),
            msg ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `rounded-xl px-3 py-2 text-sm ${tone === "success" ? "bg-[var(--success-soft)] text-[var(--success)]" : tone === "error" ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`,
                children: msg
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/SyncTimetableButton.tsx",
                lineNumber: 237,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/components/SyncTimetableButton.tsx",
        lineNumber: 224,
        columnNumber: 5
    }, this);
}
_s(SyncTimetableButton, "bXZoN7LjNZqOHTxaNWoMzXI7g34=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"]
    ];
});
_c = SyncTimetableButton;
var _c;
__turbopack_context__.k.register(_c, "SyncTimetableButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ExtensionConnect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/useTranslation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
// path: apps/web/src/app/(app)/timetable/ExtensionConnect.tsx
"use client";
;
;
const WEB_SOURCE = "mydtu-assistant-web";
const EXT_SOURCE = "mydtu-assistant-extension";
const DEFAULT_TIMEOUT_MS = 15000;
const CHECK_RETRY_COUNT = 1;
const CHECK_RETRY_DELAY_MS = 1200;
function isObject(value) {
    return typeof value === "object" && value !== null;
}
function isTimeoutError(error) {
    const message = String(error?.message || error || "").toLowerCase();
    return message.includes("timeout") || message.includes("did not respond in time") || message.includes("did not respond");
}
function delay(ms) {
    return new Promise((resolve)=>window.setTimeout(resolve, ms));
}
function normalizeExtResponse(value) {
    if (!isObject(value)) return null;
    if (value.source !== EXT_SOURCE) return null;
    if (typeof value.requestId !== "string") return null;
    if (typeof value.ok !== "boolean") return null;
    return {
        source: EXT_SOURCE,
        requestId: value.requestId,
        ok: value.ok,
        data: "data" in value ? value.data : undefined,
        error: typeof value.error === "string" ? value.error : null
    };
}
function sendToExtension(action, payload, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const requestId = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    return new Promise((resolve, reject)=>{
        let settled = false;
        const cleanup = ()=>{
            window.clearTimeout(timer);
            window.removeEventListener("message", onMessage);
        };
        const finishResolve = (value)=>{
            if (settled) return;
            settled = true;
            cleanup();
            resolve(value);
        };
        const finishReject = (error)=>{
            if (settled) return;
            settled = true;
            cleanup();
            reject(error);
        };
        const timer = window.setTimeout(()=>{
            finishReject(new Error("Extension did not respond in time."));
        }, timeoutMs);
        function onMessage(event) {
            if (event.source !== window) return;
            const msg = normalizeExtResponse(event.data);
            if (!msg) return;
            if (msg.requestId !== requestId) return;
            finishResolve(msg);
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
async function checkSessionWithRetry() {
    let lastError = null;
    for(let attempt = 0; attempt <= CHECK_RETRY_COUNT; attempt++){
        try {
            const response = await sendToExtension("MYDTU_CHECK_SESSION", null, DEFAULT_TIMEOUT_MS);
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
    throw lastError instanceof Error ? lastError : new Error(String(lastError || "Check session failed"));
}
function ExtensionConnect() {
    _s();
    const { t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"])();
    const [status, setStatus] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState("idle");
    const [message, setMessage] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState("");
    const [busyAction, setBusyAction] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(null);
    const meta = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useMemo({
        "ExtensionConnect.useMemo[meta]": ()=>{
            switch(status){
                case "connected":
                    return {
                        label: t("timetable.summary.connected"),
                        tone: "success"
                    };
                case "checking":
                    return {
                        label: t("settings.saveState.saving"),
                        tone: "info"
                    };
                case "not_connected":
                    return {
                        label: t("timetable.summary.notChecked"),
                        tone: "warning"
                    };
                case "degraded":
                    return {
                        label: t("common.unknown"),
                        tone: "warning"
                    };
                case "error":
                    return {
                        label: t("settings.saveState.error"),
                        tone: "error"
                    };
                default:
                    return {
                        label: t("timetable.summary.notChecked"),
                        tone: "info"
                    };
            }
        }
    }["ExtensionConnect.useMemo[meta]"], [
        status,
        t
    ]);
    async function handleOpenLogin() {
        if (busyAction) return;
        setBusyAction("open");
        setMessage("");
        try {
            const res = await sendToExtension("MYDTU_OPEN_LOGIN", null, 15000);
            if (!res.ok) {
                throw new Error(res.error || "Open login failed");
            }
            setStatus((prev)=>prev === "connected" ? prev : "idle");
            setMessage(t("timetable.actions.connectMyDtu") + " OK. " + t("timetable.actions.checkConnection"));
        } catch (error) {
            setStatus("error");
            setMessage(String(error?.message || error));
        } finally{
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
                setMessage(String(error?.message || error));
            }
        } finally{
            setBusyAction(null);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "app-card rounded-3xl p-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap items-center gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: handleOpenLogin,
                                disabled: busyAction !== null,
                                className: "app-btn rounded-2xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60",
                                children: busyAction === "open" ? t("common.loading") : t("timetable.actions.connectMyDtu")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                                lineNumber: 237,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: handleCheck,
                                disabled: busyAction !== null,
                                className: "app-btn-primary rounded-2xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60",
                                children: busyAction === "check" ? t("common.loading") : t("timetable.actions.checkConnection")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                                lineNumber: 248,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                        lineNumber: 236,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `rounded-2xl px-3 py-2 text-sm font-medium ${meta.tone === "success" ? "bg-[var(--success-soft)] text-[var(--success)]" : meta.tone === "warning" ? "bg-[var(--warning-soft)] text-[var(--warning)]" : meta.tone === "error" ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--accent-soft)] text-[var(--accent)]"}`,
                        children: [
                            t("timetable.summary.connectionStatus"),
                            ": ",
                            meta.label
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                        lineNumber: 260,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                lineNumber: 235,
                columnNumber: 7
            }, this),
            message ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 text-sm text-[var(--text-soft)]",
                children: message
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                lineNumber: 275,
                columnNumber: 18
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
        lineNumber: 234,
        columnNumber: 5
    }, this);
}
_s(ExtensionConnect, "f0Wi7JnX1A0NzNHdA/W/rNkxFW4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"]
    ];
});
_c = ExtensionConnect;
var _c;
__turbopack_context__.k.register(_c, "ExtensionConnect");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/app/(app)/timetable/page.tsx [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const e = new Error("Could not parse module '[project]/apps/web/src/app/(app)/timetable/page.tsx'\n\nExpected unicode escape");
e.code = 'MODULE_UNPARSABLE';
throw e;
}),
]);

//# sourceMappingURL=apps_web_src_6e031e7e._.js.map