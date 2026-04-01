(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/src/lib/extensionBridge.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getExamSyncJobStatus",
    ()=>getExamSyncJobStatus,
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
    ()=>requestTranscriptSync,
    "startExamSyncJob",
    ()=>startExamSyncJob
]);
// path: apps/web/src/lib/extensionBridge.ts
"use client";
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
function delay(ms) {
    return new Promise((resolve)=>window.setTimeout(resolve, ms));
}
function sendToExtension(action, payload, timeoutMs = DEFAULT_TIMEOUT_MS, timeoutMessage = "Extension did not respond (timeout).") {
    const requestId = makeRequestId();
    return new Promise((resolve, reject)=>{
        let settled = false;
        const cleanup = ()=>{
            window.clearTimeout(timer);
            window.removeEventListener("message", onMessage);
        };
        const timer = window.setTimeout(()=>{
            if (settled) return;
            settled = true;
            cleanup();
            reject(new Error(timeoutMessage));
        }, timeoutMs);
        function onMessage(event) {
            if (event.source !== window) return;
            const msg = event.data;
            if (!msg || typeof msg !== "object") return;
            if (msg.source !== EXT_SOURCE) return;
            if (msg.requestId !== requestId) return;
            if (settled) return;
            settled = true;
            cleanup();
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
async function startExamSyncJob(options) {
    try {
        const res = await sendToExtension("MYDTU_START_EXAM_SYNC", {
            maxPages: options?.maxPages ?? 2,
            maxItems: options?.maxItems ?? 24
        }, OPEN_PAGE_TIMEOUT_MS, "Không khởi động được job đồng bộ lịch thi.");
        if (!res.ok || !res.data?.jobId) {
            return {
                ok: false,
                error: res.error || "Không tạo được job đồng bộ lịch thi."
            };
        }
        return {
            ok: true,
            jobId: res.data.jobId
        };
    } catch (e) {
        return {
            ok: false,
            error: String(e?.message || e)
        };
    }
}
async function getExamSyncJobStatus(jobId) {
    try {
        const res = await sendToExtension("MYDTU_GET_EXAM_SYNC_STATUS", {
            jobId
        }, 30000, "Không lấy được trạng thái job đồng bộ lịch thi.");
        if (!res.ok || !res.data) {
            return {
                ok: false,
                error: res.error || "Không đọc được trạng thái job."
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
        const started = await startExamSyncJob({
            maxPages: options?.maxPages ?? 2,
            maxItems: options?.maxItems ?? 24
        });
        if (!started.ok) {
            return {
                ok: false,
                error: started.error || "Không khởi động được đồng bộ lịch thi."
            };
        }
        for(let i = 0; i < EXAM_JOB_MAX_POLLS; i += 1){
            const statusRes = await getExamSyncJobStatus(started.jobId);
            if (!statusRes.ok) {
                return {
                    ok: false,
                    error: statusRes.error || "Không lấy được trạng thái đồng bộ lịch thi."
                };
            }
            const job = statusRes.payload;
            if (job.done && job.status === "success" && job.result) {
                return {
                    ok: true,
                    payload: job.result
                };
            }
            if (job.done && job.status === "error") {
                return {
                    ok: false,
                    error: job.error || job.message || "Đồng bộ lịch thi thất bại."
                };
            }
            await delay(EXAM_JOB_POLL_INTERVAL_MS);
        }
        return {
            ok: false,
            error: "Extension phản hồi quá chậm. Hãy thử lại."
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
        const res = await sendToExtension("MYDTU_OPEN_EXAM_PAGE", null, OPEN_PAGE_TIMEOUT_MS, "Open exam page timeout.");
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
        const res = await sendToExtension("MYDTU_OPEN_TRANSCRIPT_PAGE", null, OPEN_PAGE_TIMEOUT_MS, "Open transcript page timeout.");
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
async function requestTranscriptDetailSync(input) {
    try {
        const res = await sendToExtension("MYDTU_SYNC_TRANSCRIPT_DETAIL", {
            targetSemesters: input?.targetSemesters ?? []
        }, TRANSCRIPT_DETAIL_TIMEOUT_MS, "Extension background did not respond in time.");
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
        const res = await sendToExtension("MYDTU_OPEN_TRANSCRIPT_DETAIL_PAGE", null, OPEN_PAGE_TIMEOUT_MS, "Open transcript detail page timeout.");
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
    const adapterVersion = toNonEmptyString(payload.adapterVersion) || "1.4.0";
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
function buildSuccessMessage(language, totalItems, totalWeeks) {
    if (language === "en") {
        return `Synced successfully ${totalItems} classes across ${totalWeeks} weeks.`;
    }
    return `Đã đồng bộ thành công ${totalItems} buổi học trong ${totalWeeks} tuần.`;
}
function SyncTimetableButton() {
    _s();
    const { t, i18n } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"])();
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
            setMsg(buildSuccessMessage(i18n.language, totalItems, totalWeeks));
            window.dispatchEvent(new CustomEvent("mydtu:timetable-updated"));
        } catch (e) {
            setTone("error");
            setMsg(String(e?.message || e));
        } finally{
            setLoading(false);
        }
    }
    const messageStyle = tone === "success" ? {
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
        fontWeight: 700
    } : tone === "error" ? {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid #fca5a5",
        fontWeight: 700
    } : {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #93c5fd",
        fontWeight: 700
    };
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
                lineNumber: 252,
                columnNumber: 7
            }, this),
            msg ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "rounded-xl px-3 py-2 text-sm",
                style: messageStyle,
                children: msg
            }, void 0, false, {
                fileName: "[project]/apps/web/src/components/SyncTimetableButton.tsx",
                lineNumber: 264,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/components/SyncTimetableButton.tsx",
        lineNumber: 251,
        columnNumber: 5
    }, this);
}
_s(SyncTimetableButton, "tvAqECTvo9WbTvu+pQ6S/RfcDOw=", false, function() {
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
function isInvalidatedExtensionError(error) {
    const message = String(error?.message || error || "").toLowerCase();
    return message.includes("extension context invalidated") || message.includes("context invalidated");
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
    const { t, i18n } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"])();
    const [status, setStatus] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState("idle");
    const [message, setMessage] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState("");
    const [busyAction, setBusyAction] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].useState(null);
    const staleMessage = i18n.language === "en" ? "The extension was reloaded or updated. Please reload the extension in Chrome and hard refresh this page." : "Tiện ích đã bị reload hoặc cập nhật. Hãy tải lại extension trong Chrome rồi hard refresh trang này.";
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
                case "stale_extension":
                    return {
                        label: i18n.language === "en" ? "Extension stale" : "Extension cũ",
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
        t,
        i18n.language
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
            setMessage(i18n.language === "en" ? "MYDTU login page opened. Please log in there, then click Check connection." : "Đã mở trang đăng nhập MYDTU. Hãy đăng nhập bên đó rồi bấm Kiểm tra kết nối.");
        } catch (error) {
            if (isInvalidatedExtensionError(error)) {
                setStatus("stale_extension");
                setMessage(staleMessage);
            } else {
                setStatus("error");
                setMessage(String(error?.message || error));
            }
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
                setMessage(i18n.language === "en" ? "Connection verified successfully." : "Kiểm tra kết nối thành công.");
            } else {
                setStatus("not_connected");
                setMessage(i18n.language === "en" ? "Not connected yet." : "Chưa kết nối.");
            }
        } catch (error) {
            if (isInvalidatedExtensionError(error)) {
                setStatus("stale_extension");
                setMessage(staleMessage);
            } else if (isTimeoutError(error)) {
                setStatus("degraded");
                setMessage(i18n.language === "en" ? "The extension responded too slowly." : "Extension phản hồi quá chậm.");
            } else {
                setStatus("error");
                setMessage(String(error?.message || error));
            }
        } finally{
            setBusyAction(null);
        }
    }
    const badgeStyle = meta.tone === "success" ? {
        background: "#d1fae5",
        color: "#047857",
        border: "1px solid #a7f3d0",
        fontWeight: 700
    } : meta.tone === "warning" ? {
        background: "#fef3c7",
        color: "#b45309",
        border: "1px solid #fcd34d",
        fontWeight: 700
    } : meta.tone === "error" ? {
        background: "#fee2e2",
        color: "#b91c1c",
        border: "1px solid #fca5a5",
        fontWeight: 700
    } : {
        background: "#dbeafe",
        color: "#1d4ed8",
        border: "1px solid #93c5fd",
        fontWeight: 700
    };
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
                                className: "app-btn rounded-2xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
                                children: busyAction === "open" ? t("common.loading") : t("timetable.actions.connectMyDtu")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                                lineNumber: 306,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: handleCheck,
                                disabled: busyAction !== null,
                                className: "app-btn-primary rounded-2xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60",
                                children: busyAction === "check" ? t("common.loading") : t("timetable.actions.checkConnection")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                                lineNumber: 317,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                        lineNumber: 305,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl px-3 py-2 text-sm",
                        style: badgeStyle,
                        children: [
                            t("timetable.summary.connectionStatus"),
                            ": ",
                            meta.label
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                        lineNumber: 329,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                lineNumber: 304,
                columnNumber: 7
            }, this),
            message ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3 text-sm font-medium text-[var(--text-main)]",
                children: message
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
                lineNumber: 335,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx",
        lineNumber: 303,
        columnNumber: 5
    }, this);
}
_s(ExtensionConnect, "kB1qRC3AEKDNavRbJratKqRR8+M=", false, function() {
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
"[project]/apps/web/src/app/(app)/timetable/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TimetablePage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$styled$2d$jsx$40$5$2e$1$2e$6_react$40$19$2e$2$2e$4$2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/styled-jsx@5.1.6_react@19.2.4/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$SyncTimetableButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/components/SyncTimetableButton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/useTranslation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$app$2f28$app$292f$timetable$2f$ExtensionConnect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/app/(app)/timetable/ExtensionConnect.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
function TimetablePage() {
    _s();
    const { t, i18n } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"])();
    const [viewMode, setViewMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("week");
    const [selectedDate, setSelectedDate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(startOfToday());
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [syncMessage, setSyncMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [meta, setMeta] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [campusFilter, setCampusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [courseFilter, setCourseFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [toasts, setToasts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [syncing, setSyncing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const selectedDateInputValue = formatDateInputValue(selectedDate);
    function pushToast(tone, title, message, duration = 3600) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setToasts((prev)=>[
                ...prev,
                {
                    id,
                    tone,
                    title,
                    message
                }
            ]);
        window.setTimeout(()=>{
            setToasts((prev)=>prev.filter((item)=>item.id !== id));
        }, duration);
    }
    function removeToast(id) {
        setToasts((prev)=>prev.filter((item)=>item.id !== id));
    }
    async function load(mode = viewMode, date = selectedDate) {
        setLoading(true);
        setError(null);
        try {
            const qs = new URLSearchParams();
            qs.set("mode", mode);
            qs.set("date", formatDateInputValue(date));
            const res = await fetch(`/api/timetable?${qs.toString()}`, {
                cache: "no-store"
            });
            const text = await res.text();
            let data = null;
            try {
                data = JSON.parse(text);
            } catch  {
                data = null;
            }
            if (!res.ok) {
                setItems([]);
                setMeta(null);
                setError(data?.message || text || "Load timetable failed");
                return;
            }
            setItems(Array.isArray(data?.items) ? data.items : []);
            setMeta(data?.meta ?? null);
        } catch (e) {
            setItems([]);
            setMeta(null);
            setError(String(e?.message || e));
        } finally{
            setLoading(false);
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TimetablePage.useEffect": ()=>{
            void load(viewMode, selectedDate);
        }
    }["TimetablePage.useEffect"], [
        viewMode,
        selectedDate
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TimetablePage.useEffect": ()=>{
            const onUpdated = {
                "TimetablePage.useEffect.onUpdated": ()=>{
                    const successText = t("timetable.sync.successSimple");
                    setSyncMessage(successText);
                    setSyncing(false);
                    pushToast("success", i18n.language === "en" ? "Sync successful" : "Đồng bộ thời khoá biểu thành công", i18n.language === "en" ? "The latest timetable data has been updated from the extension." : "Dữ liệu thời khoá biểu mới nhất đã được cập nhật từ extension.");
                    void load(viewMode, selectedDate);
                }
            }["TimetablePage.useEffect.onUpdated"];
            window.addEventListener("mydtu:timetable-updated", onUpdated);
            return ({
                "TimetablePage.useEffect": ()=>{
                    window.removeEventListener("mydtu:timetable-updated", onUpdated);
                }
            })["TimetablePage.useEffect"];
        }
    }["TimetablePage.useEffect"], [
        viewMode,
        selectedDate,
        t,
        i18n.language
    ]);
    const today = startOfToday();
    const campusOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TimetablePage.useMemo[campusOptions]": ()=>{
            const set = new Set();
            for (const item of items){
                if (item.campus?.trim()) set.add(item.campus.trim());
            }
            return Array.from(set).sort();
        }
    }["TimetablePage.useMemo[campusOptions]"], [
        items
    ]);
    const filteredItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TimetablePage.useMemo[filteredItems]": ()=>{
            return items.filter({
                "TimetablePage.useMemo[filteredItems]": (item)=>{
                    const matchCampus = campusFilter === "all" ? true : (item.campus || "") === campusFilter;
                    const courseText = `${item.courseCode} ${item.courseName || ""}`.toLowerCase().trim();
                    const matchCourse = courseFilter.trim() ? courseText.includes(courseFilter.trim().toLowerCase()) : true;
                    return matchCampus && matchCourse;
                }
            }["TimetablePage.useMemo[filteredItems]"]);
        }
    }["TimetablePage.useMemo[filteredItems]"], [
        items,
        campusFilter,
        courseFilter
    ]);
    const todayItems = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TimetablePage.useMemo[todayItems]": ()=>{
            return sortByTime(filteredItems.filter({
                "TimetablePage.useMemo[todayItems]": (item)=>{
                    const d = parseOccurrenceDate(item.occurrenceDate);
                    return d ? isSameDate(d, today) : false;
                }
            }["TimetablePage.useMemo[todayItems]"]));
        }
    }["TimetablePage.useMemo[todayItems]"], [
        filteredItems,
        today
    ]);
    const groupedForDisplay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TimetablePage.useMemo[groupedForDisplay]": ()=>{
            if (viewMode === "day") {
                return [
                    {
                        key: formatDateKey(selectedDate),
                        label: formatFullDate(selectedDate, i18n.language),
                        items: sortByTime(filteredItems.filter({
                            "TimetablePage.useMemo[groupedForDisplay]": (item)=>{
                                const d = parseOccurrenceDate(item.occurrenceDate);
                                return d ? isSameDate(d, selectedDate) : false;
                            }
                        }["TimetablePage.useMemo[groupedForDisplay]"]))
                    }
                ];
            }
            return groupWeekItems(filteredItems, selectedDate, i18n.language);
        }
    }["TimetablePage.useMemo[groupedForDisplay]"], [
        filteredItems,
        selectedDate,
        viewMode,
        i18n.language
    ]);
    const monthCells = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TimetablePage.useMemo[monthCells]": ()=>{
            return buildMonthCells(filteredItems, selectedDate, today);
        }
    }["TimetablePage.useMemo[monthCells]"], [
        filteredItems,
        selectedDate,
        today
    ]);
    const periodLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "TimetablePage.useMemo[periodLabel]": ()=>{
            if (viewMode === "day") {
                return formatFullDate(selectedDate, i18n.language);
            }
            if (viewMode === "week") {
                const start = startOfWeek(selectedDate);
                const end = endOfWeek(selectedDate);
                return `${formatShortDate(start, i18n.language)} - ${formatShortDate(end, i18n.language)}`;
            }
            return formatMonthYear(selectedDate, i18n.language);
        }
    }["TimetablePage.useMemo[periodLabel]"], [
        selectedDate,
        viewMode,
        i18n.language
    ]);
    const noClassToday = todayItems.length === 0;
    const lastSyncedText = meta?.lastSyncedAt ? formatDateTime(new Date(meta.lastSyncedAt), i18n.language) : t("common.noData");
    const syncStatusTone = meta?.lastSyncStatus === "SUCCESS" ? "success" : meta?.lastSyncStatus === "PARTIAL" ? "warning" : meta?.lastSyncStatus === "FAILED" ? "error" : "info";
    const syncStatusLabel = meta?.lastSyncStatus === "SUCCESS" ? i18n.language === "en" ? "Successful" : "Thành công" : meta?.lastSyncStatus === "PARTIAL" ? i18n.language === "en" ? "Partial" : "Một phần" : meta?.lastSyncStatus === "FAILED" ? i18n.language === "en" ? "Failed" : "Thất bại" : i18n.language === "en" ? "Not checked" : "Chưa có";
    function handlePrev() {
        if (viewMode === "day") {
            setSelectedDate(addDays(selectedDate, -1));
            return;
        }
        if (viewMode === "week") {
            setSelectedDate(addDays(selectedDate, -7));
            return;
        }
        setSelectedDate(addMonths(selectedDate, -1));
    }
    function handleNext() {
        if (viewMode === "day") {
            setSelectedDate(addDays(selectedDate, 1));
            return;
        }
        if (viewMode === "week") {
            setSelectedDate(addDays(selectedDate, 7));
            return;
        }
        setSelectedDate(addMonths(selectedDate, 1));
    }
    function handleToday() {
        setSelectedDate(startOfToday());
    }
    function handleSyncClick() {
        setSyncing(true);
        setSyncMessage(null);
        pushToast("info", i18n.language === "en" ? "Sync started" : "Đang bắt đầu đồng bộ", i18n.language === "en" ? "Please wait while timetable data is fetched from the extension." : "Vui lòng chờ trong lúc hệ thống lấy dữ liệu thời khoá biểu từ extension.", 2500);
        window.setTimeout(()=>{
            setSyncing(false);
        }, 5000);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastViewport, {
                toasts: toasts,
                onClose: removeToast
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 326,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$styled$2d$jsx$40$5$2e$1$2e$6_react$40$19$2e$2$2e$4$2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "88f81953b4291933",
                children: "@keyframes toastShrink{0%{width:100%}to{width:0%}}.syncing-timetable-button button{color:#fff!important;background:linear-gradient(#ef4444 0%,#dc2626 100%)!important;border-color:#0000!important;box-shadow:0 14px 30px #ef44444d!important}.syncing-timetable-button button:hover{filter:brightness(1.03)}"
            }, void 0, false, void 0, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "jsx-88f81953b4291933" + " " + "mx-auto w-full max-w-7xl space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-88f81953b4291933" + " " + "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-88f81953b4291933",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "jsx-88f81953b4291933" + " " + "text-3xl font-bold tracking-tight",
                                        children: t("timetable.title")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 357,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "jsx-88f81953b4291933" + " " + "mt-1 text-sm app-text-muted",
                                        children: t("timetable.subtitle")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 360,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 356,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-88f81953b4291933" + " " + "flex flex-col items-start gap-2 lg:items-end",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        onClickCapture: handleSyncClick,
                                        className: "jsx-88f81953b4291933" + " " + ((syncing ? "syncing-timetable-button" : "") || ""),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$components$2f$SyncTimetableButton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                            lineNumber: 370,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 366,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            pushToast("info", i18n.language === "en" ? "Reloading data" : "Đang tải lại dữ liệu", i18n.language === "en" ? "Refreshing timetable from the current database snapshot." : "Đang làm mới thời khoá biểu từ dữ liệu hiện có trong hệ thống.", 2200);
                                            void load(viewMode, selectedDate);
                                        },
                                        style: {
                                            color: "var(--accent)"
                                        },
                                        className: "jsx-88f81953b4291933" + " " + "text-sm font-medium hover:underline",
                                        children: t("timetable.actions.reloadData")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 373,
                                        columnNumber: 13
                                    }, this),
                                    syncMessage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            background: "#dcfce7",
                                            color: "#166534",
                                            border: "1px solid #86efac"
                                        },
                                        className: "jsx-88f81953b4291933" + " " + "rounded-xl px-3 py-2 text-[15px] font-bold",
                                        children: syncMessage
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 395,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 365,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 355,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-88f81953b4291933" + " " + "rounded-[28px] border border-[var(--warning)]/20 bg-[var(--warning)]/10 px-5 py-4 text-sm text-[var(--warning)] shadow-[0_10px_30px_rgba(245,158,11,0.10)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-88f81953b4291933" + " " + "font-semibold",
                                children: i18n.language === "en" ? "Sync guide" : "Lưu ý đồng bộ"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 410,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-88f81953b4291933" + " " + "mt-2 leading-7 opacity-95",
                                children: i18n.language === "en" ? "Step 1: click “Connect MYDTU”. Step 2: click “Check connection”. Step 3: when the connection status shows connected, return here and click “Sync from Extension” to import your latest timetable." : "Bước 1: bấm “Kết nối MYDTU”. Bước 2: bấm “Kiểm tra kết nối”. Bước 3: khi trạng thái hiển thị đã kết nối thì quay lại bấm “Sync từ Extension” để nhập thời khoá biểu mới nhất."
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 413,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 409,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            background: "linear-gradient(135deg, rgba(240,253,244,0.78), rgba(220,252,231,0.62))",
                            border: "1px solid rgba(134,239,172,0.55)",
                            boxShadow: "0 8px 20px rgba(34,197,94,0.045)"
                        },
                        className: "jsx-88f81953b4291933" + " " + "rounded-[28px] px-5 py-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: "#14532d",
                                    fontSize: "18px",
                                    fontWeight: 700
                                },
                                className: "jsx-88f81953b4291933" + " " + "font-bold",
                                children: t("timetable.summary.todayNotice")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 429,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    color: "#166534",
                                    fontSize: "16px",
                                    lineHeight: 1.8,
                                    fontWeight: 500
                                },
                                className: "jsx-88f81953b4291933" + " " + "mt-2",
                                children: noClassToday ? t("timetable.notice.noClassToday") : t("timetable.notice.hasClassToday", {
                                    count: todayItems.length
                                })
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 440,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 420,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$app$2f28$app$292f$timetable$2f$ExtensionConnect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 457,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "jsx-88f81953b4291933" + " " + "grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-88f81953b4291933" + " " + "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-88f81953b4291933" + " " + "app-card rounded-3xl p-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933" + " " + "flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: handlePrev,
                                                                "aria-label": t("timetable.labels.viewPrevious"),
                                                                title: t("timetable.labels.viewPrevious"),
                                                                className: "jsx-88f81953b4291933" + " " + "app-btn inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-sm font-semibold",
                                                                children: "←"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 464,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "min-w-0 shrink whitespace-nowrap text-[clamp(1.25rem,1.8vw,1.9rem)] font-bold tracking-tight",
                                                                children: periodLabel
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 474,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: handleNext,
                                                                "aria-label": t("timetable.labels.viewNext"),
                                                                title: t("timetable.labels.viewNext"),
                                                                className: "jsx-88f81953b4291933" + " " + "app-btn inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] text-sm font-semibold",
                                                                children: "→"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 478,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: handleToday,
                                                                className: "jsx-88f81953b4291933" + " " + "app-btn-primary inline-flex h-12 shrink-0 items-center justify-center rounded-[18px] px-5 text-sm font-semibold whitespace-nowrap",
                                                                children: t("common.today")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 488,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 463,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933" + " " + "flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "timetable-date",
                                                                className: "jsx-88f81953b4291933" + " " + "sr-only",
                                                                children: t("timetable.labels.selectDate")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 498,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "relative shrink-0",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    id: "timetable-date",
                                                                    type: "date",
                                                                    value: selectedDateInputValue,
                                                                    onChange: (e)=>setSelectedDate(parseDateInputValue(e.target.value)),
                                                                    className: "jsx-88f81953b4291933" + " " + "app-input !w-[150px] min-w-[200px] max-w-[150px] h-10 shrink-0 rounded-[16px] pl-3 pr-9 text-[13px] outline-none"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                    lineNumber: 503,
                                                                    columnNumber: 21
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 502,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "app-card-strong flex shrink-0 rounded-[30px] p-1",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeButton, {
                                                                        active: viewMode === "day",
                                                                        onClick: ()=>setViewMode("day"),
                                                                        label: t("timetable.viewMode.day")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 515,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeButton, {
                                                                        active: viewMode === "week",
                                                                        onClick: ()=>setViewMode("week"),
                                                                        label: t("timetable.viewMode.week")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 520,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ModeButton, {
                                                                        active: viewMode === "month",
                                                                        onClick: ()=>setViewMode("month"),
                                                                        label: t("timetable.viewMode.month")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 525,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 514,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 497,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 462,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "campus-filter",
                                                                className: "jsx-88f81953b4291933" + " " + "sr-only",
                                                                children: t("timetable.labels.filterCampus")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 536,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                id: "campus-filter",
                                                                value: campusFilter,
                                                                onChange: (e)=>setCampusFilter(e.target.value),
                                                                title: t("timetable.labels.filterCampus"),
                                                                className: "jsx-88f81953b4291933" + " " + "app-input rounded-2xl px-3 py-2 text-sm outline-none",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "all",
                                                                        className: "jsx-88f81953b4291933",
                                                                        children: t("timetable.filters.allCampuses")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 546,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    campusOptions.map((campus)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                            value: campus,
                                                                            className: "jsx-88f81953b4291933",
                                                                            children: campus
                                                                        }, campus, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                            lineNumber: 550,
                                                                            columnNumber: 23
                                                                        }, this))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 539,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 535,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                htmlFor: "course-filter",
                                                                className: "jsx-88f81953b4291933" + " " + "sr-only",
                                                                children: t("timetable.filters.searchPlaceholder")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 558,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "course-filter",
                                                                value: courseFilter,
                                                                onChange: (e)=>setCourseFilter(e.target.value),
                                                                placeholder: t("timetable.filters.searchPlaceholder"),
                                                                className: "jsx-88f81953b4291933" + " " + "app-input rounded-2xl px-3 py-2 text-sm outline-none"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 561,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 557,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 534,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 461,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-88f81953b4291933" + " " + "app-card rounded-3xl p-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "mb-4 flex items-center justify-between",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "text-xl font-semibold",
                                                                children: viewMode === "day" ? t("timetable.content.daySchedule") : viewMode === "week" ? t("timetable.content.weekSchedule") : t("timetable.content.monthSchedule")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 575,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "mt-1 text-sm app-text-muted",
                                                                children: viewMode === "month" ? t("timetable.content.monthOverview") : t("timetable.content.fullDetails")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 582,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 574,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933" + " " + "text-sm app-text-muted",
                                                        children: loading ? t("common.loading") : t("timetable.content.classes", {
                                                            count: filteredItems.length
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 589,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 573,
                                                columnNumber: 15
                                            }, this),
                                            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                                                text: t("timetable.content.loadingTimetable")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 599,
                                                columnNumber: 17
                                            }, this) : error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                                                text: error,
                                                isError: true
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 601,
                                                columnNumber: 17
                                            }, this) : viewMode === "month" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MonthCalendar, {
                                                cells: monthCells,
                                                selectedDate: selectedDate,
                                                onPickDate: (date)=>{
                                                    setSelectedDate(date);
                                                    setViewMode("day");
                                                },
                                                language: i18n.language,
                                                t: t
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 603,
                                                columnNumber: 17
                                            }, this) : groupedForDisplay.every((group)=>group.items.length === 0) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
                                                text: viewMode === "day" ? t("timetable.content.emptyDay") : t("timetable.content.emptyWeek")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 616,
                                                columnNumber: 17
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "space-y-6",
                                                children: groupedForDisplay.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "mb-3 flex items-center justify-between",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                        className: "jsx-88f81953b4291933" + " " + "text-sm font-semibold uppercase tracking-wide app-text-soft",
                                                                        children: group.label
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 628,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "jsx-88f81953b4291933" + " " + "app-pill rounded-full px-2.5 py-1 text-xs font-medium",
                                                                        children: t("timetable.content.classes", {
                                                                            count: group.items.length
                                                                        })
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 631,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 627,
                                                                columnNumber: 23
                                                            }, this),
                                                            group.items.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "rounded-2xl border border-dashed px-4 py-4 text-sm app-text-muted",
                                                                children: t("timetable.content.noSchedule")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 639,
                                                                columnNumber: 25
                                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                style: {
                                                                    borderColor: "var(--border-main)"
                                                                },
                                                                className: "jsx-88f81953b4291933" + " " + "overflow-hidden rounded-3xl border",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-88f81953b4291933" + " " + "overflow-auto",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                                        style: {
                                                                            minWidth: 1080
                                                                        },
                                                                        className: "jsx-88f81953b4291933" + " " + "w-full text-sm",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                                                style: {
                                                                                    background: "var(--bg-soft)"
                                                                                },
                                                                                className: "jsx-88f81953b4291933" + " " + "app-text-soft",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                                    className: "jsx-88f81953b4291933" + " " + "text-left",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.date")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 657,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.weekday")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 660,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.time")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 663,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.courseCode")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 666,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.courseName")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 669,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.room")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 672,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.campus")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 675,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.mode")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 678,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                            children: t("timetable.table.week")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                            lineNumber: 681,
                                                                                            columnNumber: 35
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                    lineNumber: 656,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                lineNumber: 652,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                                                className: "jsx-88f81953b4291933",
                                                                                children: group.items.map((it)=>{
                                                                                    const occurrence = parseOccurrenceDate(it.occurrenceDate);
                                                                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                                        style: {
                                                                                            borderTop: "1px solid var(--border-main)"
                                                                                        },
                                                                                        className: "jsx-88f81953b4291933",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3 whitespace-nowrap",
                                                                                                children: occurrence ? formatShortDate(occurrence, i18n.language) : "--"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 700,
                                                                                                columnNumber: 39
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3 whitespace-nowrap",
                                                                                                children: toWeekdayLabel(it.dayOfWeek, i18n.language)
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 708,
                                                                                                columnNumber: 39
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3 whitespace-nowrap",
                                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                    style: {
                                                                                                        background: "var(--bg-soft)"
                                                                                                    },
                                                                                                    className: "jsx-88f81953b4291933" + " " + "rounded-xl px-2 py-1 text-xs font-medium",
                                                                                                    children: [
                                                                                                        it.startTime,
                                                                                                        " - ",
                                                                                                        it.endTime
                                                                                                    ]
                                                                                                }, void 0, true, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                    lineNumber: 715,
                                                                                                    columnNumber: 41
                                                                                                }, this)
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 714,
                                                                                                columnNumber: 39
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                style: {
                                                                                                    color: "var(--accent)"
                                                                                                },
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3 whitespace-nowrap font-semibold",
                                                                                                children: it.courseCode
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 724,
                                                                                                columnNumber: 39
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3",
                                                                                                children: it.courseName || ""
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 730,
                                                                                                columnNumber: 39
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3 whitespace-nowrap",
                                                                                                children: it.room
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 733,
                                                                                                columnNumber: 39
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3 whitespace-nowrap",
                                                                                                children: it.campus || ""
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 736,
                                                                                                columnNumber: 39
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3 whitespace-nowrap",
                                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DeliveryBadge, {
                                                                                                    item: it,
                                                                                                    t: t
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                    lineNumber: 740,
                                                                                                    columnNumber: 41
                                                                                                }, this)
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 739,
                                                                                                columnNumber: 39
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "jsx-88f81953b4291933" + " " + "px-4 py-3 whitespace-nowrap app-text-soft",
                                                                                                children: it.weekLabel || it.weeksIncluded || it.semester || ""
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                                lineNumber: 742,
                                                                                                columnNumber: 39
                                                                                            }, this)
                                                                                        ]
                                                                                    }, it.id, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                        lineNumber: 693,
                                                                                        columnNumber: 37
                                                                                    }, this);
                                                                                })
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                lineNumber: 686,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 648,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                    lineNumber: 647,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 643,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, group.key, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 626,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 624,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 572,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 460,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-88f81953b4291933" + " " + "space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-88f81953b4291933" + " " + "app-card rounded-3xl p-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "text-sm font-semibold uppercase tracking-wide app-text-muted",
                                                children: t("timetable.todayCard.title")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 765,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "mt-1 text-lg font-semibold",
                                                children: formatFullDate(today, i18n.language)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 768,
                                                columnNumber: 15
                                            }, this),
                                            todayItems.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "mt-4 rounded-2xl border border-dashed px-4 py-4 text-sm app-text-muted",
                                                children: t("timetable.labels.todayNoClass")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 773,
                                                columnNumber: 17
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "mt-4 space-y-3",
                                                children: todayItems.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933" + " " + "app-card-strong rounded-2xl p-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "flex items-start justify-between gap-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-88f81953b4291933",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "jsx-88f81953b4291933" + " " + "font-semibold",
                                                                                children: item.courseName || item.courseCode
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                lineNumber: 785,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                style: {
                                                                                    color: "var(--accent)"
                                                                                },
                                                                                className: "jsx-88f81953b4291933" + " " + "mt-1 text-sm",
                                                                                children: item.courseCode
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                                lineNumber: 788,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 784,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-88f81953b4291933" + " " + "app-pill rounded-xl px-2.5 py-1 text-xs font-semibold",
                                                                        children: [
                                                                            item.startTime,
                                                                            " - ",
                                                                            item.endTime
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 795,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 783,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "mt-3 flex flex-wrap items-center gap-2",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DeliveryBadge, {
                                                                    item: item,
                                                                    t: t
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                    lineNumber: 801,
                                                                    columnNumber: 25
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 800,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "mt-3 space-y-1 text-sm app-text-soft",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-88f81953b4291933",
                                                                        children: t("timetable.labels.roomLabel", {
                                                                            value: item.room || "--"
                                                                        })
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 805,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-88f81953b4291933",
                                                                        children: t("timetable.labels.campusLabel", {
                                                                            value: item.campus || "--"
                                                                        })
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 810,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "jsx-88f81953b4291933",
                                                                        children: t("timetable.labels.weekLabel", {
                                                                            value: item.weekLabel || item.weeksIncluded || item.semester || "--"
                                                                        })
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 815,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 804,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, item.id, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 779,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 777,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 764,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "jsx-88f81953b4291933" + " " + "app-card rounded-3xl p-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "text-sm font-semibold uppercase tracking-wide app-text-muted",
                                                children: t("timetable.quickOverview.title")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 832,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "mt-4 rounded-3xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55 p-4",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "jsx-88f81953b4291933" + " " + "flex items-start justify-between gap-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "jsx-88f81953b4291933",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-88f81953b4291933" + " " + "text-xs uppercase tracking-wide app-text-muted",
                                                                    children: i18n.language === "en" ? "Sync status" : "Trạng thái đồng bộ"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                    lineNumber: 839,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-88f81953b4291933" + " " + "mt-2 text-base font-semibold",
                                                                    children: syncStatusLabel
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                    lineNumber: 844,
                                                                    columnNumber: 21
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "jsx-88f81953b4291933" + " " + "mt-1 text-sm app-text-muted",
                                                                    children: i18n.language === "en" ? `Last sync: ${lastSyncedText}` : `Lần sync cuối: ${lastSyncedText}`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                    lineNumber: 847,
                                                                    columnNumber: 21
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                            lineNumber: 838,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "jsx-88f81953b4291933" + " " + ([
                                                                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                                                syncStatusTone === "success" ? "app-badge-online" : syncStatusTone === "warning" ? "app-pill-warning" : syncStatusTone === "error" ? "app-pill-danger" : "app-pill"
                                                            ].join(" ") || ""),
                                                            children: syncStatusLabel
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                            lineNumber: 854,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                    lineNumber: 837,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 836,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "app-card mt-4 rounded-3xl p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933" + " " + "text-sm font-semibold uppercase tracking-wide app-text-muted",
                                                        children: t("timetable.quickOverview.colorLegend")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 872,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "jsx-88f81953b4291933" + " " + "mt-4 space-y-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "flex items-center gap-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "jsx-88f81953b4291933" + " " + "app-badge-online rounded-full px-2.5 py-1 text-xs font-semibold",
                                                                        children: t("timetable.quickOverview.online")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 878,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "jsx-88f81953b4291933" + " " + "text-sm app-text-soft",
                                                                        children: t("timetable.labels.onlineDescription")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 881,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 877,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "jsx-88f81953b4291933" + " " + "flex items-center gap-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "jsx-88f81953b4291933" + " " + "app-badge-onsite rounded-full px-2.5 py-1 text-xs font-semibold",
                                                                        children: t("timetable.quickOverview.onsite")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 887,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "jsx-88f81953b4291933" + " " + "text-sm app-text-soft",
                                                                        children: t("timetable.labels.onsiteDescription")
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                        lineNumber: 890,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                                lineNumber: 886,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 876,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 871,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "jsx-88f81953b4291933" + " " + "mt-4 grid grid-cols-1 gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuickStatCard, {
                                                        label: t("timetable.quickOverview.currentViewMode"),
                                                        value: viewMode === "day" ? t("timetable.viewMode.day") : viewMode === "week" ? t("timetable.viewMode.week") : t("timetable.viewMode.month")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 898,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuickStatCard, {
                                                        label: t("timetable.quickOverview.visibleItems"),
                                                        value: String(filteredItems.length)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 908,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuickStatCard, {
                                                        label: t("timetable.quickOverview.todayItems"),
                                                        value: String(todayItems.length)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 912,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuickStatCard, {
                                                        label: t("timetable.quickOverview.selectedDate"),
                                                        value: formatShortDate(selectedDate, i18n.language)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 916,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(QuickStatCard, {
                                                        label: t("timetable.quickOverview.lastSync"),
                                                        value: lastSyncedText
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                        lineNumber: 920,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                lineNumber: 897,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 831,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 763,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 459,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 354,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(TimetablePage, "QsrY0WGz29lJQu8f5MC2ZXEQPM0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"]
    ];
});
_c = TimetablePage;
function ToastViewport({ toasts, onClose }) {
    if (!toasts.length) return null;
    function getToastStyle(tone) {
        if (tone === "success") {
            return {
                background: "linear-gradient(135deg, #059669, #047857)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 18px 40px rgba(16,185,129,0.25)"
            };
        }
        if (tone === "warning") {
            return {
                background: "linear-gradient(135deg, #d97706, #b45309)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 18px 40px rgba(245,158,11,0.24)"
            };
        }
        if (tone === "error") {
            return {
                background: "linear-gradient(135deg, #e11d48, #be123c)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 18px 40px rgba(244,63,94,0.24)"
            };
        }
        return {
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 18px 40px rgba(59,130,246,0.24)"
        };
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,420px)] flex-col gap-3 md:right-6 md:top-6",
        children: toasts.map((toast)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-auto overflow-hidden rounded-[24px]",
                style: getToastStyle(toast.tone),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-start gap-3 px-4 py-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                                style: {
                                    background: "rgba(255,255,255,0.14)",
                                    color: "#ffffff",
                                    border: "1px solid rgba(255,255,255,0.18)"
                                },
                                children: toast.tone === "success" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CheckCircleIcon, {}, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                    lineNumber: 996,
                                    columnNumber: 17
                                }, this) : toast.tone === "warning" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WarningIcon, {}, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                    lineNumber: 998,
                                    columnNumber: 17
                                }, this) : toast.tone === "error" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WarningIcon, {}, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                    lineNumber: 1000,
                                    columnNumber: 17
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(InfoIcon, {}, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                    lineNumber: 1002,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 987,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0 flex-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: "15px",
                                            fontWeight: 800,
                                            color: "#ffffff"
                                        },
                                        children: toast.title
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 1007,
                                        columnNumber: 15
                                    }, this),
                                    toast.message ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1",
                                        style: {
                                            fontSize: "14px",
                                            lineHeight: 1.65,
                                            fontWeight: 600,
                                            color: "#ffffff"
                                        },
                                        children: toast.message
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 1018,
                                        columnNumber: 17
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 1006,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>onClose(toast.id),
                                className: "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                style: {
                                    background: "rgba(255,255,255,0.14)",
                                    color: "#ffffff"
                                },
                                "aria-label": "Close toast",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(XSmallIcon, {}, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                    lineNumber: 1042,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 1032,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 986,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-1 w-full bg-white/10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-1 w-full animate-[toastShrink_3.6s_linear_forwards] bg-white/50"
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                            lineNumber: 1047,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 1046,
                        columnNumber: 11
                    }, this)
                ]
            }, toast.id, true, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 981,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 979,
        columnNumber: 5
    }, this);
}
_c1 = ToastViewport;
function ModeButton({ active, onClick, label }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        onClick: onClick,
        className: `inline-flex h-10 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition ${active ? "text-white shadow-[0_10px_24px_rgba(59,130,246,0.28)]" : "app-text-soft"}`,
        style: active ? {
            background: "var(--accent)"
        } : undefined,
        children: label
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1064,
        columnNumber: 5
    }, this);
}
_c2 = ModeButton;
function QuickStatCard({ label, value }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "app-card-strong rounded-2xl p-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs uppercase tracking-wide app-text-muted",
                children: label
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1082,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-1 text-lg font-semibold",
                children: value
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1085,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1081,
        columnNumber: 5
    }, this);
}
_c3 = QuickStatCard;
function EmptyState({ text, isError = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-2xl border px-4 py-5 text-sm",
        style: isError ? {
            borderColor: "rgba(220, 38, 38, 0.3)",
            background: "var(--danger-soft)",
            color: "var(--danger)"
        } : {
            borderStyle: "dashed",
            borderColor: "var(--border-main)",
            color: "var(--text-muted)"
        },
        children: text
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1098,
        columnNumber: 5
    }, this);
}
_c4 = EmptyState;
function DeliveryBadge({ item, t }) {
    const delivery = getDeliveryMode(item);
    if (delivery === "online") {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "app-badge-online rounded-full px-2.5 py-1 text-xs font-semibold",
            children: t("timetable.modeLabel.online")
        }, void 0, false, {
            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
            lineNumber: 1130,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "app-badge-onsite rounded-full px-2.5 py-1 text-xs font-semibold",
        children: t("timetable.modeLabel.onsite")
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1137,
        columnNumber: 5
    }, this);
}
_c5 = DeliveryBadge;
function MonthCalendar({ cells, selectedDate, onPickDate, language, t }) {
    const hasAnyItem = cells.some((cell)=>cell.items.length > 0);
    if (!hasAnyItem) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(EmptyState, {
            text: t("timetable.content.emptyMonth")
        }, void 0, false, {
            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
            lineNumber: 1159,
            columnNumber: 12
        }, this);
    }
    const monthWeekdayLabels = language === "en" ? [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
        "Sun"
    ] : [
        "T2",
        "T3",
        "T4",
        "T5",
        "T6",
        "T7",
        "CN"
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-7 gap-3",
                children: monthWeekdayLabels.map((label)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "px-2 text-center text-xs font-semibold uppercase tracking-wide app-text-muted",
                        children: label
                    }, label, false, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 1171,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1169,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 gap-3 md:grid-cols-7",
                children: cells.map((cell)=>{
                    const selected = isSameDate(cell.date, selectedDate);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: ()=>onPickDate(cell.date),
                        className: [
                            "app-month-cell text-left transition hover:translate-y-[-1px]",
                            cell.inCurrentMonth ? "" : "is-outside",
                            cell.isToday ? "is-today" : ""
                        ].join(" "),
                        style: selected ? {
                            boxShadow: "inset 0 0 0 1px var(--accent), var(--shadow-card)"
                        } : undefined,
                        title: formatFullDate(cell.date, language),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm font-semibold",
                                        style: cell.isToday ? {
                                            color: "var(--accent)"
                                        } : undefined,
                                        children: pad2(cell.date.getDate())
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 1205,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs app-text-muted",
                                        children: cell.items.length > 0 ? t("timetable.content.classes", {
                                            count: cell.items.length
                                        }) : ""
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 1211,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 1204,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 space-y-2",
                                children: [
                                    cell.items.slice(0, 3).map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl px-2 py-2",
                                            style: {
                                                background: "var(--bg-soft)"
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "truncate text-xs font-semibold",
                                                            style: {
                                                                color: "var(--accent)"
                                                            },
                                                            children: item.courseCode
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                            lineNumber: 1228,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DeliveryBadge, {
                                                            item: item,
                                                            t: t
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                            lineNumber: 1234,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                    lineNumber: 1227,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-1 text-xs",
                                                    children: [
                                                        item.startTime,
                                                        " - ",
                                                        item.endTime
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                    lineNumber: 1240,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-1 truncate text-xs app-text-soft",
                                                    children: item.room || "--"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                                    lineNumber: 1243,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, item.id, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                            lineNumber: 1222,
                                            columnNumber: 19
                                        }, this)),
                                    cell.items.length > 3 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs font-medium app-text-muted",
                                        children: t("timetable.content.moreClasses", {
                                            count: cell.items.length - 3
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                        lineNumber: 1250,
                                        columnNumber: 19
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                                lineNumber: 1220,
                                columnNumber: 15
                            }, this)
                        ]
                    }, cell.key, true, {
                        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                        lineNumber: 1185,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1180,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1168,
        columnNumber: 5
    }, this);
}
_c6 = MonthCalendar;
function buildMonthCells(items, selectedDate, today) {
    const monthStart = startOfMonth(selectedDate);
    const gridStart = startOfWeek(monthStart);
    const cells = Array.from({
        length: 42
    }).map((_, index)=>{
        const date = addDays(gridStart, index);
        return {
            key: formatDateKey(date),
            date,
            items: [],
            inCurrentMonth: date.getMonth() === selectedDate.getMonth(),
            isToday: isSameDate(date, today)
        };
    });
    const map = new Map(cells.map((cell)=>[
            cell.key,
            cell
        ]));
    for (const item of sortByTime(items)){
        const occurrence = parseOccurrenceDate(item.occurrenceDate);
        if (!occurrence) continue;
        const key = formatDateKey(occurrence);
        const cell = map.get(key);
        if (cell) {
            cell.items.push(item);
        }
    }
    return cells;
}
function groupWeekItems(items, selectedDate, language) {
    const weekStart = startOfWeek(selectedDate);
    const days = Array.from({
        length: 7
    }).map((_, index)=>{
        const day = addDays(weekStart, index);
        return {
            key: formatDateKey(day),
            label: `${getWeekdayShort(index + 1, language)} • ${formatShortDate(day, language)}`,
            items: []
        };
    });
    const map = new Map(days.map((day)=>[
            day.key,
            day
        ]));
    for (const item of sortByTime(items)){
        const occurrence = parseOccurrenceDate(item.occurrenceDate);
        if (!occurrence) continue;
        const key = formatDateKey(occurrence);
        const bucket = map.get(key);
        if (bucket) {
            bucket.items.push(item);
        }
    }
    return Array.from(map.values()).sort((a, b)=>a.key.localeCompare(b.key));
}
function sortByTime(items) {
    return [
        ...items
    ].sort((a, b)=>{
        const aKey = `${a.occurrenceDate || ""}_${a.startTime}_${a.courseCode}`;
        const bKey = `${b.occurrenceDate || ""}_${b.startTime}_${b.courseCode}`;
        return aKey.localeCompare(bKey);
    });
}
function getDeliveryMode(item) {
    const raw = `${item.room || ""} ${item.campus || ""}`.toLowerCase();
    if (raw.includes("online")) return "online";
    return "onsite";
}
function parseOccurrenceDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}
function startOfToday() {
    return startOfDay(new Date());
}
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function startOfWeek(date) {
    const d = startOfDay(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(d, diff);
}
function endOfWeek(date) {
    return addDays(startOfWeek(date), 6);
}
function startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}
function addDays(date, amount) {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return startOfDay(d);
}
function addMonths(date, amount) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + amount);
    return startOfDay(d);
}
function isSameDate(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDateKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function formatDateInputValue(date) {
    return formatDateKey(date);
}
function parseDateInputValue(value) {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return startOfToday();
    return new Date(year, month - 1, day);
}
function formatShortDate(date, language = "vi") {
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "vi-VN").format(date);
}
function formatFullDate(date, language = "vi") {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
}
function formatMonthYear(date, language = "vi") {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "vi-VN", {
        month: "long",
        year: "numeric"
    }).format(date);
}
function formatDateTime(date, language = "vi") {
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "vi-VN", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}
function pad2(value) {
    return String(value).padStart(2, "0");
}
function toWeekdayLabel(dayOfWeek, language = "vi") {
    const vi = {
        1: "Thứ 2",
        2: "Thứ 3",
        3: "Thứ 4",
        4: "Thứ 5",
        5: "Thứ 6",
        6: "Thứ 7",
        7: "CN"
    };
    const en = {
        1: "Mon",
        2: "Tue",
        3: "Wed",
        4: "Thu",
        5: "Fri",
        6: "Sat",
        7: "Sun"
    };
    return (language === "en" ? en : vi)[dayOfWeek] || `(${dayOfWeek})`;
}
function getWeekdayShort(dayOfWeek, language = "vi") {
    return toWeekdayLabel(dayOfWeek, language);
}
function CheckCircleIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-5 w-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 17A7 7 0 1 0 10 3A7 7 0 1 0 10 17Z",
                stroke: "currentColor",
                strokeWidth: "1.7"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1473,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 10.2L8.9 12.1L13.1 7.9",
                stroke: "currentColor",
                strokeWidth: "1.9",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1478,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1472,
        columnNumber: 5
    }, this);
}
_c7 = CheckCircleIcon;
function InfoIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-5 w-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 17A7 7 0 1 0 10 3A7 7 0 1 0 10 17Z",
                stroke: "currentColor",
                strokeWidth: "1.7"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1492,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 8.5V12",
                stroke: "currentColor",
                strokeWidth: "1.8",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1497,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 6.5H10.01",
                stroke: "currentColor",
                strokeWidth: "1.8",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1503,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1491,
        columnNumber: 5
    }, this);
}
_c8 = InfoIcon;
function WarningIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-5 w-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M9.13 4.32C9.5 3.67 10.5 3.67 10.87 4.32L15.97 13.24C16.33 13.88 15.87 14.67 15.11 14.67H4.89C4.13 14.67 3.67 13.88 4.03 13.24L9.13 4.32Z",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1516,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 7.5V10.6",
                stroke: "currentColor",
                strokeWidth: "1.8",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1522,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 12.45H10.01",
                stroke: "currentColor",
                strokeWidth: "1.8",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
                lineNumber: 1528,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1515,
        columnNumber: 5
    }, this);
}
_c9 = WarningIcon;
function XSmallIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-3.5 w-3.5",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M6 6L14 14M14 6L6 14",
            stroke: "currentColor",
            strokeWidth: "1.8",
            strokeLinecap: "round"
        }, void 0, false, {
            fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
            lineNumber: 1546,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(app)/timetable/page.tsx",
        lineNumber: 1540,
        columnNumber: 5
    }, this);
}
_c10 = XSmallIcon;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10;
__turbopack_context__.k.register(_c, "TimetablePage");
__turbopack_context__.k.register(_c1, "ToastViewport");
__turbopack_context__.k.register(_c2, "ModeButton");
__turbopack_context__.k.register(_c3, "QuickStatCard");
__turbopack_context__.k.register(_c4, "EmptyState");
__turbopack_context__.k.register(_c5, "DeliveryBadge");
__turbopack_context__.k.register(_c6, "MonthCalendar");
__turbopack_context__.k.register(_c7, "CheckCircleIcon");
__turbopack_context__.k.register(_c8, "InfoIcon");
__turbopack_context__.k.register(_c9, "WarningIcon");
__turbopack_context__.k.register(_c10, "XSmallIcon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_web_src_860b01f4._.js.map