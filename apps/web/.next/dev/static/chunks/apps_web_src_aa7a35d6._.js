(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/web/src/lib/exams/cache.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// path: apps/web/src/lib/exams/cache.ts
__turbopack_context__.s([
    "clearExamRecords",
    ()=>clearExamRecords,
    "readExamMeta",
    ()=>readExamMeta,
    "readExamRecords",
    ()=>readExamRecords,
    "writeExamMeta",
    ()=>writeExamMeta,
    "writeExamRecords",
    ()=>writeExamRecords
]);
const DB_NAME = "mydtu-exams-db";
const DB_VERSION = 2;
const STORE_NAME = "exam-records";
const META_KEY = "mydtu-exams-meta-v1";
function canUseIndexedDb() {
    return ("TURBOPACK compile-time value", "object") !== "undefined" && "indexedDB" in window;
}
function getDefaultMeta() {
    return {
        lastSyncedAt: null,
        lastNoticeCount: 0,
        lastNotifiedIds: []
    };
}
function deleteDb() {
    if (!canUseIndexedDb()) return Promise.resolve();
    return new Promise((resolve, reject)=>{
        const request = window.indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = ()=>resolve();
        request.onerror = ()=>reject(request.error || new Error("Failed to delete IndexedDB database."));
        request.onblocked = ()=>reject(new Error("IndexedDB delete blocked. Please close other tabs of this app."));
    });
}
function openDbRaw(version = DB_VERSION) {
    if (!canUseIndexedDb()) {
        return Promise.reject(new Error("IndexedDB is not available in this environment."));
    }
    return new Promise((resolve, reject)=>{
        const request = window.indexedDB.open(DB_NAME, version);
        request.onupgradeneeded = ()=>{
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });
            }
        };
        request.onsuccess = ()=>resolve(request.result);
        request.onerror = ()=>reject(request.error || new Error("Failed to open IndexedDB."));
    });
}
async function openDb() {
    const db = await openDbRaw();
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        await deleteDb();
        const recreated = await openDbRaw(DB_VERSION);
        if (!recreated.objectStoreNames.contains(STORE_NAME)) {
            recreated.close();
            throw new Error(`IndexedDB store "${STORE_NAME}" was not created.`);
        }
        return recreated;
    }
    return db;
}
async function readExamRecords() {
    if (!canUseIndexedDb()) return [];
    const db = await openDb();
    try {
        return await new Promise((resolve, reject)=>{
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = ()=>resolve(request.result || []);
            request.onerror = ()=>reject(request.error || new Error("Failed to read exam records."));
        });
    } finally{
        db.close();
    }
}
async function writeExamRecords(records) {
    if (!canUseIndexedDb()) return;
    const db = await openDb();
    try {
        await new Promise((resolve, reject)=>{
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            store.clear();
            for (const record of records){
                store.put(record);
            }
            tx.oncomplete = ()=>resolve();
            tx.onerror = ()=>reject(tx.error || new Error("Failed to write exam records."));
            tx.onabort = ()=>reject(tx.error || new Error("Transaction aborted while writing exam records."));
        });
    } finally{
        db.close();
    }
}
async function clearExamRecords() {
    if (!canUseIndexedDb()) return;
    const db = await openDb();
    try {
        await new Promise((resolve, reject)=>{
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            store.clear();
            tx.oncomplete = ()=>resolve();
            tx.onerror = ()=>reject(tx.error || new Error("Failed to clear exam records."));
            tx.onabort = ()=>reject(tx.error || new Error("Transaction aborted while clearing exam records."));
        });
    } finally{
        db.close();
    }
}
function readExamMeta() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const raw = window.localStorage.getItem(META_KEY);
        if (!raw) return getDefaultMeta();
        const parsed = JSON.parse(raw);
        return {
            lastSyncedAt: typeof parsed.lastSyncedAt === "string" ? parsed.lastSyncedAt : null,
            lastNoticeCount: Number.isFinite(parsed.lastNoticeCount) ? Number(parsed.lastNoticeCount) : 0,
            lastNotifiedIds: Array.isArray(parsed.lastNotifiedIds) ? parsed.lastNotifiedIds.filter((x)=>typeof x === "string") : []
        };
    } catch  {
        return getDefaultMeta();
    }
}
function writeExamMeta(meta) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/lib/exams/notify.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// path: apps/web/src/lib/exams/notify.ts
__turbopack_context__.s([
    "ensureNotificationPermission",
    ()=>ensureNotificationPermission,
    "notifyNewExams",
    ()=>notifyNewExams
]);
function toReadableDate(value, locale = "vi-VN") {
    if (!value) return locale.startsWith("vi") ? "chưa rõ ngày" : "unknown date";
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(locale);
}
async function ensureNotificationPermission() {
    if (("TURBOPACK compile-time value", "object") === "undefined" || !("Notification" in window)) {
        return "unsupported";
    }
    if (window.Notification.permission === "granted") return "granted";
    if (window.Notification.permission === "denied") return "denied";
    return await window.Notification.requestPermission();
}
function notifyNewExams(records, locale = "vi-VN") {
    if (("TURBOPACK compile-time value", "object") === "undefined" || !("Notification" in window)) return;
    if (window.Notification.permission !== "granted") return;
    if (!records.length) return;
    const sample = records[0];
    const isVi = locale.startsWith("vi");
    const title = records.length === 1 ? isVi ? `Lịch thi mới: ${sample.courseCode || "Môn học"}` : `New exam: ${sample.courseCode || "Course"}` : isVi ? `Có ${records.length} lịch thi mới` : `${records.length} new exam records`;
    const body = records.length === 1 ? `${sample.courseName || sample.noticeTitle} • ${toReadableDate(sample.examDate, locale)} • ${sample.startTime || (isVi ? "chưa rõ giờ" : "unknown time")}` : `${records.slice(0, 3).map((r)=>r.courseCode || r.courseName || (isVi ? "Môn học" : "Course")).join(", ")}${records.length > 3 ? "..." : ""}`;
    try {
        const notification = new window.Notification(title, {
            body,
            tag: "mydtu-exams-new"
        });
        notification.onclick = ()=>{
            window.focus();
            notification.close();
        };
    } catch  {
    // ignore
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/lib/exams/parseWorkbook.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// path: apps/web/src/lib/exams/parseWorkbook.ts
__turbopack_context__.s([
    "parseWorkbookFromNotice",
    ()=>parseWorkbookFromNotice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$xlsx$40$0$2e$18$2e$5$2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/xlsx@0.18.5/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript)");
;
function normalizeSpace(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
}
function makeId(parts) {
    return parts.map((p)=>normalizeSpace(p || "")).join("||");
}
function parseDdMmYyyy(value) {
    if (!value) return null;
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm}-${dd}`;
}
function normalizeSearch(value) {
    return normalizeSpace(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}
function detectPlanType(text) {
    const s = normalizeSearch(text);
    if (s.includes("du kien")) return "tentative";
    if (s.includes("chinh thuc")) return "official";
    return "official";
}
function extractCourseMeta(text) {
    const raw = normalizeSpace(text);
    const match = raw.match(/MÔN\s*:\s*(.+?)\s*\*\s*MÃ\s*MÔN\s*:\s*([A-Z0-9\s-]+)/i);
    if (!match) {
        return {
            courseName: null,
            courseCode: ""
        };
    }
    return {
        courseName: normalizeSpace(match[1]),
        courseCode: normalizeSpace(match[2])
    };
}
function extractExamSessionMeta(text) {
    const raw = normalizeSpace(text);
    const match = raw.match(/Thời\s*gian\s*:\s*([0-9hH:]{4,8})\s*-\s*Ngày\s*([0-9/]{10})\s*-\s*Phòng\s*:\s*([^-\n]+?)(?:\s*-\s*cơ\s*sở\s*:\s*(.+))?$/i);
    if (!match) {
        return {
            examDate: null,
            startTime: null,
            endTime: null,
            room: null,
            campus: null,
            raw
        };
    }
    const [, timePart, datePart, roomPart, campusPart] = match;
    const normalizedTime = timePart.replace(/[Hh]/g, ":");
    const timeMatch = normalizedTime.match(/(\d{1,2}):(\d{2})/);
    const startTime = timeMatch ? `${String(timeMatch[1]).padStart(2, "0")}:${timeMatch[2]}` : null;
    return {
        examDate: parseDdMmYyyy(datePart),
        startTime,
        endTime: null,
        room: normalizeSpace(roomPart),
        campus: normalizeSpace(campusPart || "") || null,
        raw
    };
}
function getHeaderIndexes(row) {
    const indexes = {
        studentId: -1,
        hoVa: -1,
        ten: -1,
        fullName: -1,
        classCourse: -1,
        classStudent: -1,
        birthDate: -1,
        note: -1
    };
    row.forEach((cell, index)=>{
        const s = normalizeSearch(cell);
        if (s === "msv") indexes.studentId = index;
        if (s === "ho va") indexes.hoVa = index;
        if (s === "ten") indexes.ten = index;
        if (s.includes("ho ten")) indexes.fullName = index;
        if (s.includes("lop mon hoc")) indexes.classCourse = index;
        if (s.includes("lop sinh hoat")) indexes.classStudent = index;
        if (s.includes("ngay sinh")) indexes.birthDate = index;
        if (s.includes("ghi chu")) indexes.note = index;
    });
    return indexes;
}
function isHeaderRow(row) {
    const joined = normalizeSearch(row.join(" | "));
    return joined.includes("msv") && (joined.includes("ho va") || joined.includes("ho ten"));
}
function isLikelyDataRow(row, headerIndexes) {
    if (headerIndexes.studentId < 0) return false;
    const studentId = normalizeSpace(row[headerIndexes.studentId]);
    return /^\d{6,}$/.test(studentId);
}
function combineStudentName(row, headerIndexes) {
    if (headerIndexes.fullName >= 0) {
        const full = normalizeSpace(row[headerIndexes.fullName]);
        return full || null;
    }
    const hoVa = headerIndexes.hoVa >= 0 ? normalizeSpace(row[headerIndexes.hoVa]) : "";
    const ten = headerIndexes.ten >= 0 ? normalizeSpace(row[headerIndexes.ten]) : "";
    const full = normalizeSpace(`${hoVa} ${ten}`);
    return full || null;
}
function parseWorkbookFromNotice(notice) {
    if (!notice.attachmentBase64) return [];
    const workbook = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$xlsx$40$0$2e$18$2e$5$2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["read"](notice.attachmentBase64, {
        type: "base64"
    });
    const records = [];
    for (const sheetName of workbook.SheetNames){
        const sheet = workbook.Sheets[sheetName];
        const rows = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$xlsx$40$0$2e$18$2e$5$2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["utils"].sheet_to_json(sheet, {
            header: 1,
            raw: false,
            blankrows: false
        });
        let currentCourseName = null;
        let currentCourseCode = notice.courseCode || "";
        let currentExamMeta = {
            examDate: null,
            startTime: null,
            endTime: null,
            room: null,
            campus: null,
            raw: null
        };
        let headerIndexes = {
            studentId: -1,
            hoVa: -1,
            ten: -1,
            fullName: -1,
            classCourse: -1,
            classStudent: -1,
            birthDate: -1,
            note: -1
        };
        for (const row of rows){
            const joined = normalizeSpace(row.join(" | "));
            const joinedSearch = normalizeSearch(joined);
            if (!joined) continue;
            if (joinedSearch.includes("ma mon") && joinedSearch.includes("mon")) {
                const meta = extractCourseMeta(joined);
                currentCourseName = meta.courseName;
                if (meta.courseCode) currentCourseCode = meta.courseCode;
                continue;
            }
            if (joinedSearch.includes("thoi gian") && joinedSearch.includes("ngay")) {
                currentExamMeta = extractExamSessionMeta(joined);
                continue;
            }
            if (isHeaderRow(row)) {
                headerIndexes = getHeaderIndexes(row);
                continue;
            }
            if (!isLikelyDataRow(row, headerIndexes)) continue;
            const studentId = headerIndexes.studentId >= 0 ? normalizeSpace(row[headerIndexes.studentId]) || null : null;
            const studentName = combineStudentName(row, headerIndexes);
            const classCourse = headerIndexes.classCourse >= 0 ? normalizeSpace(row[headerIndexes.classCourse]) || null : null;
            const classStudent = headerIndexes.classStudent >= 0 ? normalizeSpace(row[headerIndexes.classStudent]) || null : null;
            const birthDate = headerIndexes.birthDate >= 0 ? normalizeSpace(row[headerIndexes.birthDate]) || null : null;
            const note = headerIndexes.note >= 0 ? normalizeSpace(row[headerIndexes.note]) || null : null;
            records.push({
                id: makeId([
                    notice.detailUrl,
                    currentCourseCode,
                    currentExamMeta.examDate,
                    currentExamMeta.startTime,
                    currentExamMeta.room,
                    studentId
                ]),
                noticeTitle: notice.title,
                planType: notice.planType || detectPlanType(notice.title),
                publishedAtRaw: notice.publishedAt?.raw || null,
                publishedAtDate: notice.publishedAt?.date ? parseDdMmYyyy(notice.publishedAt.date) : null,
                detailUrl: notice.detailUrl,
                attachmentUrl: notice.attachmentUrl,
                attachmentName: notice.attachmentName || null,
                courseCode: currentCourseCode || notice.courseCode || "",
                courseName: currentCourseName || null,
                examDate: currentExamMeta.examDate,
                startTime: currentExamMeta.startTime,
                endTime: currentExamMeta.endTime,
                room: currentExamMeta.room,
                campus: currentExamMeta.campus,
                examMetaRaw: currentExamMeta.raw,
                studentId,
                studentName,
                classCourse,
                classStudent,
                birthDate,
                note
            });
        }
    }
    return Array.from(new Map(records.map((r)=>[
            r.id,
            r
        ])).values());
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/lib/exams/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildImportPayloadFromExtensionNotices",
    ()=>buildImportPayloadFromExtensionNotices,
    "fetchExamsFromDb",
    ()=>fetchExamsFromDb,
    "importExamsToDb",
    ()=>importExamsToDb,
    "mapDbRecordToParsedRecord",
    ()=>mapDbRecordToParsedRecord,
    "mapParsedRecordToImportRecord",
    ()=>mapParsedRecordToImportRecord
]);
function assertOk(json) {
    if (!json.ok) {
        throw new Error(json.error || "Request failed");
    }
    return json;
}
function mapDbRecordToParsedRecord(item) {
    return {
        id: item.id,
        planType: item.planType,
        noticeTitle: item.noticeTitle,
        publishedAtRaw: item.publishedAtRaw,
        publishedAtDate: item.publishedAtDate,
        detailUrl: item.detailUrl,
        attachmentUrl: item.attachmentUrl,
        attachmentName: item.attachmentName,
        courseCode: item.courseCode,
        courseName: item.courseName,
        examDate: item.examDate,
        startTime: item.startTime,
        endTime: item.endTime,
        room: item.room,
        campus: item.campus,
        examMetaRaw: item.examMetaRaw,
        studentId: item.studentId,
        studentName: item.studentName,
        classCourse: item.classCourse,
        classStudent: item.classStudent,
        birthDate: item.birthDate,
        note: item.note
    };
}
function mapParsedRecordToImportRecord(record) {
    return {
        noticeTitle: record.noticeTitle,
        publishedAtRaw: record.publishedAtRaw,
        publishedAtDate: record.publishedAtDate,
        detailUrl: record.detailUrl,
        attachmentUrl: record.attachmentUrl,
        attachmentName: record.attachmentName,
        courseCode: record.courseCode,
        courseName: record.courseName,
        examDate: record.examDate,
        examDateRaw: record.examDate,
        startTime: record.startTime,
        endTime: record.endTime,
        room: record.room,
        campus: record.campus,
        examMetaRaw: record.examMetaRaw,
        studentId: record.studentId,
        studentName: record.studentName,
        classCourse: record.classCourse,
        classStudent: record.classStudent,
        birthDateRaw: record.birthDate,
        birthDate: record.birthDate,
        note: record.note,
        planType: record.planType,
        parseStatus: "parsed",
        rawRow: null
    };
}
function buildImportPayloadFromExtensionNotices(userId, notices, parsedByNotice) {
    return {
        userId,
        adapterKey: "mydtu-exams-extension",
        adapterVersion: "1.0.0",
        sourcePage: "https://pdaotao.duytan.edu.vn/EXAM_LIST/?page=1&lang=VN",
        notices: notices.map((notice, index)=>({
                title: notice.title,
                rawTitle: notice.title,
                sourceText: notice.sourceText || null,
                courseCodeHint: notice.courseCode || null,
                courseNameHint: null,
                detailUrl: notice.detailUrl,
                attachmentUrl: notice.attachmentUrl || null,
                attachmentName: notice.attachmentName || null,
                publishedAtRaw: notice.publishedAt?.raw || null,
                publishedAt: notice.publishedAt?.date || null,
                planType: notice.planType || "official",
                parseStatus: "parsed",
                detailText: notice.detailText || null,
                parseError: notice.detailError || notice.attachmentError || null,
                records: parsedByNotice[index].map(mapParsedRecordToImportRecord)
            }))
    };
}
async function fetchExamsFromDb(params) {
    const qs = new URLSearchParams();
    qs.set("userId", params.userId);
    if (params.planType) qs.set("planType", params.planType);
    if (params.courseCode) qs.set("courseCode", params.courseCode);
    if (params.studentId) qs.set("studentId", params.studentId);
    const res = await fetch(`/api/exams?${qs.toString()}`, {
        method: "GET",
        headers: {
            "content-type": "application/json"
        },
        cache: "no-store"
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch exams: ${res.status}`);
    }
    const json = assertOk(await res.json());
    return json.items.map(mapDbRecordToParsedRecord);
}
async function importExamsToDb(body) {
    const res = await fetch("/api/importExams", {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        cache: "no-store",
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to import exams: ${res.status}`);
    }
    return assertOk(await res.json());
}
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
const DEFAULT_TIMEOUT_MS = 240000;
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
        }, DEFAULT_TIMEOUT_MS, "Extension exam sync timed out.");
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
"[project]/apps/web/src/app/(app)/exams/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ExamsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/cache.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/notify.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$parseWorkbook$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/parseWorkbook.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/extensionBridge.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/useTranslation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
function normalizeText(value) {
    return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();
}
function normalizeCompact(value) {
    return normalizeText(value).replace(/[^a-z0-9]/g, "");
}
function tokenizeQuery(query) {
    return query.split(/[,;\n]+/).map((part)=>part.trim()).filter(Boolean).map((raw)=>({
            raw,
            loose: normalizeText(raw),
            compact: normalizeCompact(raw)
        }));
}
function sanitizeVisualText(value) {
    return String(value ?? "").replace(/\|{2,}/g, " | ").replace(/\s*\|\s*\|\s*/g, " | ").replace(/\s{2,}/g, " ").trim();
}
function formatDate(value, locale = "vi-VN") {
    if (!value) return locale.startsWith("vi") ? "Chưa rõ ngày" : "Unknown date";
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(locale);
}
function formatDateTime(value, locale = "vi-VN") {
    if (!value) return locale.startsWith("vi") ? "Chưa có dữ liệu" : "No data";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(locale);
}
function compareDateTimeAsc(a, b) {
    const av = `${a.examDate || "9999-12-31"} ${a.startTime || "23:59"}`;
    const bv = `${b.examDate || "9999-12-31"} ${b.startTime || "23:59"}`;
    return av.localeCompare(bv);
}
function compareDateTimeDesc(a, b) {
    return compareDateTimeAsc(b, a);
}
function getInitialPlan(searchParams) {
    const plan = searchParams.get("plan");
    if (plan === "tentative" || plan === "official") return plan;
    return "all";
}
function getInitialSort(searchParams) {
    const sort = searchParams.get("sort");
    if (sort === "date-asc" || sort === "date-desc" || sort === "course-asc" || sort === "student-asc") {
        return sort;
    }
    return "date-asc";
}
function buildSearchIndex(record) {
    const looseHaystacks = [
        record.courseCode,
        record.courseName,
        record.studentId,
        record.studentName,
        record.classCourse,
        record.classStudent,
        record.birthDate,
        record.examDate,
        record.room,
        record.campus,
        record.noticeTitle,
        record.examMetaRaw,
        record.attachmentName,
        record.publishedAtRaw
    ].map(sanitizeVisualText).map(normalizeText);
    const compactHaystacks = [
        record.courseCode,
        record.studentId,
        record.classCourse,
        record.classStudent,
        record.room,
        record.campus
    ].map(sanitizeVisualText).map(normalizeCompact);
    return {
        looseHaystacks,
        compactHaystacks
    };
}
function getDayDiff(dateValue) {
    if (!dateValue) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((target.getTime() - today.getTime()) / msPerDay);
}
function getCountdownLabel(dateValue, t) {
    const diff = getDayDiff(dateValue);
    if (diff === null) return t("exams.labels.unknownDate");
    if (diff < 0) return t("exams.labels.passedDays", {
        count: Math.abs(diff)
    });
    if (diff === 0) return t("exams.labels.today");
    if (diff === 1) return t("exams.labels.tomorrow");
    return t("exams.labels.remainingDays", {
        count: diff
    });
}
function getStatusTone(dateValue) {
    const diff = getDayDiff(dateValue);
    if (diff === null) return "app-badge-empty";
    if (diff < 0) return "app-pill";
    if (diff <= 1) return "app-pill-danger";
    if (diff <= 7) return "app-pill-warning";
    return "app-pill-success";
}
function makeHeatmapBuckets(records) {
    const countMap = new Map();
    for (const record of records){
        const key = record.examDate || "unknown";
        countMap.set(key, (countMap.get(key) || 0) + 1);
    }
    const validDates = Array.from(countMap.keys()).filter((x)=>x !== "unknown").sort((a, b)=>a.localeCompare(b));
    if (!validDates.length) return [];
    const maxCount = Math.max(...validDates.map((d)=>countMap.get(d) || 0));
    return validDates.map((date)=>{
        const count = countMap.get(date) || 0;
        const ratio = maxCount > 0 ? count / maxCount : 0;
        let level = 1;
        if (ratio >= 0.75) level = 4;
        else if (ratio >= 0.5) level = 3;
        else if (ratio >= 0.25) level = 2;
        return {
            date,
            count,
            level
        };
    });
}
function getHeatmapClass(level) {
    if (level === 4) return "bg-[var(--danger)]/90";
    if (level === 3) return "bg-[var(--warning)]/85";
    if (level === 2) return "bg-[var(--accent)]/75";
    return "bg-[var(--accent)]/35";
}
function getNewestRecordsForNotify(previousIds, nextRecords, limit = 5) {
    const known = new Set(previousIds);
    const news = nextRecords.filter((record)=>!known.has(record.id));
    news.sort(compareDateTimeAsc);
    return news.slice(0, limit);
}
function getBannerClass(tone) {
    if (tone === "success") {
        return "border border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]";
    }
    if (tone === "warning") {
        return "border border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]";
    }
    if (tone === "error") {
        return "border border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]";
    }
    return "border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent)]";
}
function mapSyncErrorMessage(raw, t) {
    const text = String(raw || "").trim();
    const normalized = text.toLowerCase();
    if (normalized.includes("receiving end does not exist") || normalized.includes("could not establish connection")) {
        return t("exams.sync.errors.extensionReload");
    }
    if (normalized.includes("timeout")) {
        return t("exams.sync.errors.timeout");
    }
    if (normalized.includes("chrome.runtime.sendmessage unavailable")) {
        return t("exams.sync.errors.extensionUnavailable");
    }
    if (normalized.includes("empty response from extension")) {
        return t("exams.sync.errors.emptyResponse");
    }
    if (normalized.includes("không scrape được danh sách thi")) {
        return t("exams.sync.errors.scrapeFailed");
    }
    if (normalized.includes("attachment fetch failed")) {
        return t("exams.sync.errors.attachmentFailed");
    }
    if (normalized.includes("fetch failed")) {
        return t("exams.sync.errors.portalFetchFailed");
    }
    return text || t("exams.sync.errors.unknown");
}
function buildRoomOptions(records) {
    return Array.from(new Set(records.map((x)=>sanitizeVisualText(x.room)).filter(Boolean))).sort((a, b)=>a.localeCompare(b));
}
function buildCampusOptions(records) {
    return Array.from(new Set(records.map((x)=>sanitizeVisualText(x.campus)).filter(Boolean))).sort((a, b)=>a.localeCompare(b));
}
function exportExamCsv(records, locale, fileLabel) {
    const rows = [
        [
            "planType",
            "courseCode",
            "courseName",
            "examDate",
            "startTime",
            "endTime",
            "room",
            "campus",
            "studentId",
            "studentName",
            "classCourse",
            "classStudent",
            "birthDate",
            "publishedAtRaw",
            "attachmentName",
            "noticeTitle",
            "detailUrl",
            "attachmentUrl",
            "examMetaRaw",
            "note"
        ],
        ...records.map((record)=>[
                record.planType,
                record.courseCode || "",
                record.courseName || "",
                record.examDate || "",
                record.startTime || "",
                record.endTime || "",
                sanitizeVisualText(record.room),
                sanitizeVisualText(record.campus),
                record.studentId || "",
                record.studentName || "",
                record.classCourse || "",
                record.classStudent || "",
                record.birthDate || "",
                record.publishedAtRaw || "",
                record.attachmentName || "",
                record.noticeTitle || "",
                record.detailUrl || "",
                record.attachmentUrl || "",
                sanitizeVisualText(record.examMetaRaw),
                record.note || ""
            ])
    ];
    const escapeCsv = (value)=>{
        const safe = String(value ?? "");
        if (safe.includes('"') || safe.includes(",") || safe.includes("\n")) {
            return `"${safe.replace(/"/g, '""')}"`;
        }
        return safe;
    };
    const csv = rows.map((row)=>row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([
        "\ufeff",
        csv
    ], {
        type: "text/csv;charset=utf-8;"
    });
    const fileDate = new Date().toLocaleDateString(locale).replace(/[^\d]+/g, "-");
    const filename = `${fileLabel}-${fileDate}.csv`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}
async function exportExamExcel(records, locale) {
    const XLSX = await __turbopack_context__.A("[project]/node_modules/.pnpm/xlsx@0.18.5/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript, async loader)");
    const rows = records.map((record)=>({
            "Loại lịch": record.planType === "official" ? "Chính thức" : "Dự kiến",
            "Mã môn": record.courseCode || "",
            "Tên môn": record.courseName || "",
            "Ngày thi": record.examDate || "",
            "Giờ bắt đầu": record.startTime || "",
            "Giờ kết thúc": record.endTime || "",
            "Phòng": sanitizeVisualText(record.room),
            "Cơ sở": sanitizeVisualText(record.campus),
            "MSSV": record.studentId || "",
            "Họ tên": record.studentName || "",
            "Lớp môn học": record.classCourse || "",
            "Lớp sinh hoạt": record.classStudent || "",
            "Ngày sinh": record.birthDate || "",
            "Thông báo": record.noticeTitle || "",
            "Nguồn đăng": record.publishedAtRaw || "",
            "Tệp lịch thi": record.attachmentName || "",
            "URL chi tiết": record.detailUrl || "",
            "URL tệp": record.attachmentUrl || "",
            "Ghi chú": record.note || ""
        }));
    const summary = [
        {
            "Tổng bản ghi": records.length,
            "Xuất lúc": new Date().toLocaleString(locale)
        }
    ];
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    const wsRecords = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Tong_quan");
    XLSX.utils.book_append_sheet(wb, wsRecords, "Lich_thi");
    const fileDate = new Date().toLocaleDateString(locale).replace(/[^\d]+/g, "-");
    XLSX.writeFile(wb, `lich-thi-ca-nhan-${fileDate}.xlsx`);
}
function getMonthMatrix(baseDate) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(year, month, 1 - startWeekday);
    return Array.from({
        length: 42
    }).map((_, index)=>{
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + index);
        return d;
    });
}
function ExamsPage({ userId = "demo-user-id" }) {
    _s();
    const { t, i18n } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"])();
    const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
    const isVi = locale.startsWith("vi");
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const [records, setRecords] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [planFilter, setPlanFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(getInitialPlan(searchParams));
    const [sortMode, setSortMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(getInitialSort(searchParams));
    const [groupMode, setGroupMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("date");
    const [roomFilter, setRoomFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [campusFilter, setCampusFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("all");
    const [dateFilter, setDateFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [syncing, setSyncing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [exportingExcel, setExportingExcel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [lastSyncedAt, setLastSyncedAt] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [lastNoticeCount, setLastNoticeCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [notifyPermission, setNotifyPermission] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("unsupported");
    const [bannerTone, setBannerTone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("info");
    const [bannerText, setBannerText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [onlyUpcoming, setOnlyUpcoming] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [visibleGroupsLimit, setVisibleGroupsLimit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(8);
    const [calendarMonth, setCalendarMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "ExamsPage.useState": ()=>{
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), 1);
        }
    }["ExamsPage.useState"]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ExamsPage.useEffect": ()=>{
            let cancelled = false;
            async function boot() {
                setLoading(true);
                try {
                    const meta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readExamMeta"])();
                    const permission = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensureNotificationPermission"])();
                    if (cancelled) return;
                    setNotifyPermission(permission);
                    setLastSyncedAt(meta.lastSyncedAt);
                    setLastNoticeCount(meta.lastNoticeCount);
                    try {
                        const dbRecords = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchExamsFromDb"])({
                            userId
                        });
                        if (cancelled) return;
                        setRecords(dbRecords);
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["writeExamRecords"])(dbRecords);
                        if (!dbRecords.length) {
                            setBannerTone("info");
                            setBannerText(t("exams.sync.idleHelp"));
                        } else {
                            setBannerTone("success");
                            setBannerText(t("exams.sync.cachedReady", {
                                count: dbRecords.length,
                                time: meta.lastSyncedAt ? formatDateTime(meta.lastSyncedAt, locale) : t("exams.sync.noSyncYet")
                            }));
                        }
                    } catch  {
                        const cachedRecords = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readExamRecords"])();
                        if (cancelled) return;
                        setRecords(cachedRecords);
                        if (!cachedRecords.length) {
                            setBannerTone("warning");
                            setBannerText(t("exams.sync.cacheFallback"));
                        } else {
                            setBannerTone("warning");
                            setBannerText(t("exams.sync.cachedReady", {
                                count: cachedRecords.length,
                                time: meta.lastSyncedAt ? formatDateTime(meta.lastSyncedAt, locale) : t("exams.sync.noSyncYet")
                            }));
                        }
                    }
                } catch  {
                    if (!cancelled) {
                        setBannerTone("warning");
                        setBannerText(t("exams.sync.cacheFallback"));
                    }
                } finally{
                    if (!cancelled) setLoading(false);
                }
            }
            boot();
            return ({
                "ExamsPage.useEffect": ()=>{
                    cancelled = true;
                }
            })["ExamsPage.useEffect"];
        }
    }["ExamsPage.useEffect"], [
        locale,
        t,
        userId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ExamsPage.useEffect": ()=>{
            setPlanFilter(getInitialPlan(searchParams));
            setSortMode(getInitialSort(searchParams));
        }
    }["ExamsPage.useEffect"], [
        searchParams
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ExamsPage.useEffect": ()=>{
            setVisibleGroupsLimit(8);
        }
    }["ExamsPage.useEffect"], [
        query,
        planFilter,
        sortMode,
        onlyUpcoming,
        roomFilter,
        campusFilter,
        dateFilter,
        groupMode
    ]);
    const roomOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[roomOptions]": ()=>buildRoomOptions(records)
    }["ExamsPage.useMemo[roomOptions]"], [
        records
    ]);
    const campusOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[campusOptions]": ()=>buildCampusOptions(records)
    }["ExamsPage.useMemo[campusOptions]"], [
        records
    ]);
    const tokens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[tokens]": ()=>tokenizeQuery(query)
    }["ExamsPage.useMemo[tokens]"], [
        query
    ]);
    const indexedRecords = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[indexedRecords]": ()=>records.map({
                "ExamsPage.useMemo[indexedRecords]": (record)=>({
                        record,
                        index: buildSearchIndex(record)
                    })
            }["ExamsPage.useMemo[indexedRecords]"])
    }["ExamsPage.useMemo[indexedRecords]"], [
        records
    ]);
    const filtered = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[filtered]": ()=>{
            let next = indexedRecords;
            if (planFilter !== "all") {
                next = next.filter({
                    "ExamsPage.useMemo[filtered]": ({ record })=>record.planType === planFilter
                }["ExamsPage.useMemo[filtered]"]);
            }
            if (onlyUpcoming) {
                next = next.filter({
                    "ExamsPage.useMemo[filtered]": ({ record })=>{
                        const diff = getDayDiff(record.examDate);
                        return diff !== null && diff >= 0;
                    }
                }["ExamsPage.useMemo[filtered]"]);
            }
            if (roomFilter !== "all") {
                next = next.filter({
                    "ExamsPage.useMemo[filtered]": ({ record })=>sanitizeVisualText(record.room) === sanitizeVisualText(roomFilter)
                }["ExamsPage.useMemo[filtered]"]);
            }
            if (campusFilter !== "all") {
                next = next.filter({
                    "ExamsPage.useMemo[filtered]": ({ record })=>sanitizeVisualText(record.campus) === sanitizeVisualText(campusFilter)
                }["ExamsPage.useMemo[filtered]"]);
            }
            if (dateFilter) {
                next = next.filter({
                    "ExamsPage.useMemo[filtered]": ({ record })=>record.examDate === dateFilter
                }["ExamsPage.useMemo[filtered]"]);
            }
            if (tokens.length) {
                next = next.filter({
                    "ExamsPage.useMemo[filtered]": ({ index })=>{
                        return tokens.some({
                            "ExamsPage.useMemo[filtered]": (token)=>{
                                const looseMatch = index.looseHaystacks.some({
                                    "ExamsPage.useMemo[filtered].looseMatch": (value)=>value.includes(token.loose)
                                }["ExamsPage.useMemo[filtered].looseMatch"]);
                                const compactMatch = token.compact ? index.compactHaystacks.some({
                                    "ExamsPage.useMemo[filtered]": (value)=>value.includes(token.compact)
                                }["ExamsPage.useMemo[filtered]"]) : false;
                                return looseMatch || compactMatch;
                            }
                        }["ExamsPage.useMemo[filtered]"]);
                    }
                }["ExamsPage.useMemo[filtered]"]);
            }
            const mapped = next.map({
                "ExamsPage.useMemo[filtered].mapped": (x)=>x.record
            }["ExamsPage.useMemo[filtered].mapped"]);
            if (sortMode === "date-asc") mapped.sort(compareDateTimeAsc);
            else if (sortMode === "date-desc") mapped.sort(compareDateTimeDesc);
            else if (sortMode === "course-asc") {
                mapped.sort({
                    "ExamsPage.useMemo[filtered]": (a, b)=>`${a.courseCode} ${a.courseName || ""}`.localeCompare(`${b.courseCode} ${b.courseName || ""}`, i18n.language?.startsWith("vi") ? "vi" : "en")
                }["ExamsPage.useMemo[filtered]"]);
            } else if (sortMode === "student-asc") {
                mapped.sort({
                    "ExamsPage.useMemo[filtered]": (a, b)=>`${a.studentName || ""} ${a.studentId || ""}`.localeCompare(`${b.studentName || ""} ${b.studentId || ""}`, i18n.language?.startsWith("vi") ? "vi" : "en")
                }["ExamsPage.useMemo[filtered]"]);
            }
            return mapped;
        }
    }["ExamsPage.useMemo[filtered]"], [
        campusFilter,
        dateFilter,
        i18n.language,
        indexedRecords,
        onlyUpcoming,
        planFilter,
        query,
        roomFilter,
        sortMode,
        tokens
    ]);
    const grouped = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[grouped]": ()=>{
            const map = new Map();
            for (const record of filtered){
                const key = groupMode === "date" ? record.examDate || "unknown" : record.courseCode || record.noticeTitle || "unknown";
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(record);
            }
            const entries = Array.from(map.entries());
            if (groupMode === "date") {
                entries.sort({
                    "ExamsPage.useMemo[grouped]": (a, b)=>a[0].localeCompare(b[0])
                }["ExamsPage.useMemo[grouped]"]);
            } else {
                entries.sort({
                    "ExamsPage.useMemo[grouped]": (a, b)=>a[0].localeCompare(b[0])
                }["ExamsPage.useMemo[grouped]"]);
            }
            return entries;
        }
    }["ExamsPage.useMemo[grouped]"], [
        filtered,
        groupMode
    ]);
    const visibleGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[visibleGroups]": ()=>grouped.slice(0, visibleGroupsLimit)
    }["ExamsPage.useMemo[visibleGroups]"], [
        grouped,
        visibleGroupsLimit
    ]);
    const hasMoreGroups = visibleGroupsLimit < grouped.length;
    const stats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[stats]": ()=>{
            const official = records.filter({
                "ExamsPage.useMemo[stats]": (r)=>r.planType === "official"
            }["ExamsPage.useMemo[stats]"]).length;
            const tentative = records.filter({
                "ExamsPage.useMemo[stats]": (r)=>r.planType === "tentative"
            }["ExamsPage.useMemo[stats]"]).length;
            const uniqueCourses = new Set(records.map({
                "ExamsPage.useMemo[stats]": (r)=>r.courseCode
            }["ExamsPage.useMemo[stats]"]).filter(Boolean)).size;
            const uniqueStudents = new Set(records.map({
                "ExamsPage.useMemo[stats]": (r)=>r.studentId
            }["ExamsPage.useMemo[stats]"]).filter(Boolean)).size;
            const uniqueDays = new Set(records.map({
                "ExamsPage.useMemo[stats]": (r)=>r.examDate
            }["ExamsPage.useMemo[stats]"]).filter(Boolean)).size;
            const upcoming = records.filter({
                "ExamsPage.useMemo[stats]": (r)=>{
                    const diff = getDayDiff(r.examDate);
                    return diff !== null && diff >= 0;
                }
            }["ExamsPage.useMemo[stats]"]).length;
            return {
                total: records.length,
                official,
                tentative,
                uniqueCourses,
                uniqueStudents,
                upcoming,
                visible: filtered.length,
                uniqueDays
            };
        }
    }["ExamsPage.useMemo[stats]"], [
        filtered.length,
        records
    ]);
    const heatmapDays = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[heatmapDays]": ()=>makeHeatmapBuckets(records)
    }["ExamsPage.useMemo[heatmapDays]"], [
        records
    ]);
    const heatmapHighlights = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[heatmapHighlights]": ()=>{
            return [
                ...heatmapDays
            ].sort({
                "ExamsPage.useMemo[heatmapHighlights]": (a, b)=>b.count - a.count || a.date.localeCompare(b.date)
            }["ExamsPage.useMemo[heatmapHighlights]"]).slice(0, 3);
        }
    }["ExamsPage.useMemo[heatmapHighlights]"], [
        heatmapDays
    ]);
    const nextUpcoming = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[nextUpcoming]": ()=>{
            return [
                ...records
            ].filter({
                "ExamsPage.useMemo[nextUpcoming]": (record)=>{
                    const diff = getDayDiff(record.examDate);
                    return diff !== null && diff >= 0;
                }
            }["ExamsPage.useMemo[nextUpcoming]"]).sort(compareDateTimeAsc).slice(0, 8);
        }
    }["ExamsPage.useMemo[nextUpcoming]"], [
        records
    ]);
    const topCourses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[topCourses]": ()=>{
            const map = new Map();
            for (const record of filtered){
                const key = record.courseCode || record.noticeTitle || "unknown";
                const current = map.get(key);
                if (current) {
                    current.count += 1;
                } else {
                    map.set(key, {
                        code: record.courseCode || t("exams.labels.unknownCourseCode"),
                        name: record.courseName || null,
                        count: 1
                    });
                }
            }
            return Array.from(map.values()).sort({
                "ExamsPage.useMemo[topCourses]": (a, b)=>b.count - a.count || a.code.localeCompare(b.code)
            }["ExamsPage.useMemo[topCourses]"]).slice(0, 8);
        }
    }["ExamsPage.useMemo[topCourses]"], [
        filtered,
        t
    ]);
    const monthCells = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[monthCells]": ()=>getMonthMatrix(calendarMonth)
    }["ExamsPage.useMemo[monthCells]"], [
        calendarMonth
    ]);
    const monthCountMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[monthCountMap]": ()=>{
            const map = new Map();
            for (const record of records){
                if (!record.examDate) continue;
                map.set(record.examDate, (map.get(record.examDate) || 0) + 1);
            }
            return map;
        }
    }["ExamsPage.useMemo[monthCountMap]"], [
        records
    ]);
    function replaceQueryParams(nextParams) {
        const next = new URLSearchParams(searchParams.toString());
        if (nextParams.plan) {
            if (nextParams.plan === "all") next.delete("plan");
            else next.set("plan", nextParams.plan);
        }
        if (nextParams.sort) {
            if (nextParams.sort === "date-asc") next.delete("sort");
            else next.set("sort", nextParams.sort);
        }
        const qs = next.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
    function updatePlanFilter(value) {
        setPlanFilter(value);
        replaceQueryParams({
            plan: value
        });
    }
    function updateSortMode(value) {
        setSortMode(value);
        replaceQueryParams({
            sort: value
        });
    }
    function resetFilters() {
        setQuery("");
        setOnlyUpcoming(false);
        setPlanFilter("all");
        setSortMode("date-asc");
        setGroupMode("date");
        setRoomFilter("all");
        setCampusFilter("all");
        setDateFilter("");
        router.replace(pathname);
    }
    function jumpToDetailedList(date, courseCode) {
        if (date) {
            setDateFilter(date);
            setGroupMode("date");
        } else if (courseCode) {
            setQuery(courseCode);
            setGroupMode("course");
        }
        window.setTimeout(()=>{
            document.getElementById("exam-detail-list")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }, 80);
    }
    async function handleSync() {
        setSyncing(true);
        setError(null);
        setBannerTone("info");
        setBannerText(t("exams.sync.preparing"));
        try {
            const previousMeta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readExamMeta"])();
            setBannerText(t("exams.sync.fetchingPortal"));
            const extensionRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestExamSync"])({
                maxPages: 3,
                maxItems: 40
            });
            if (!extensionRes.ok) {
                const friendly = mapSyncErrorMessage(extensionRes.error || "", t);
                setError(friendly);
                setBannerTone("error");
                setBannerText(friendly);
                return;
            }
            setBannerText(t("exams.sync.parsingWorkbook"));
            const parsedChunks = await Promise.all(extensionRes.payload.notices.map(async (notice)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$parseWorkbook$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseWorkbookFromNotice"])(notice)));
            const parsedRecords = parsedChunks.flat();
            const deduped = Array.from(new Map(parsedRecords.map((record)=>[
                    record.id,
                    record
                ])).values()).sort(compareDateTimeAsc);
            const importBody = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildImportPayloadFromExtensionNotices"])(userId, extensionRes.payload.notices, parsedChunks);
            setBannerText(isVi ? "Đang lưu dữ liệu thi vào hệ thống..." : "Saving exam data...");
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["importExamsToDb"])(importBody);
            const dbRecords = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchExamsFromDb"])({
                userId
            });
            const finalRecords = dbRecords.length ? dbRecords : deduped;
            setRecords(finalRecords);
            setLastSyncedAt(extensionRes.payload.scrapedAt);
            setLastNoticeCount(extensionRes.payload.notices.length);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["writeExamRecords"])(finalRecords);
            const newRecordsForNotify = getNewestRecordsForNotify(previousMeta.lastNotifiedIds, finalRecords, 5);
            const nextMeta = {
                lastSyncedAt: extensionRes.payload.scrapedAt,
                lastNoticeCount: extensionRes.payload.notices.length,
                lastNotifiedIds: finalRecords.map((x)=>x.id).slice(0, 300)
            };
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["writeExamMeta"])(nextMeta);
            if (newRecordsForNotify.length) {
                const permission = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensureNotificationPermission"])();
                setNotifyPermission(permission);
                if (permission === "granted") {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notifyNewExams"])(newRecordsForNotify, locale);
                }
            }
            setBannerTone("success");
            setBannerText(t("exams.sync.successDetailed", {
                totalRecords: finalRecords.length,
                totalNotices: extensionRes.payload.notices.length
            }));
        } catch (e) {
            const friendly = mapSyncErrorMessage(String(e?.message || e), t);
            setError(friendly);
            setBannerTone("error");
            setBannerText(friendly);
        } finally{
            setSyncing(false);
        }
    }
    async function handleEnableNotify() {
        const permission = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensureNotificationPermission"])();
        setNotifyPermission(permission);
        if (permission === "granted") {
            setBannerTone("success");
            setBannerText(t("exams.notify.enabled"));
        } else if (permission === "denied") {
            setBannerTone("warning");
            setBannerText(t("exams.notify.denied"));
        } else {
            setBannerTone("info");
            setBannerText(t("exams.notify.pending"));
        }
    }
    async function handleOpenPdaotao() {
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["openExamPageInExtension"])();
        if (!res.ok) {
            window.open("https://pdaotao.duytan.edu.vn/EXAM_LIST/?page=1&lang=VN", "_blank");
            setBannerTone("info");
            setBannerText(t("exams.sync.portalOpenedFallback"));
            return;
        }
        setBannerTone("info");
        setBannerText(t("exams.sync.portalOpened"));
    }
    function handleExportCsv() {
        exportExamCsv(filtered, locale, t("exams.export.fileName"));
        setBannerTone("success");
        setBannerText(t("exams.export.done", {
            count: filtered.length
        }));
    }
    async function handleExportExcel() {
        try {
            setExportingExcel(true);
            await exportExamExcel(filtered, locale);
            setBannerTone("success");
            setBannerText(isVi ? `Đã xuất ${filtered.length} bản ghi ra file Excel cá nhân hoá.` : `Exported ${filtered.length} records to personalized Excel.`);
        } catch  {
            setBannerTone("error");
            setBannerText(isVi ? "Xuất Excel thất bại." : "Excel export failed.");
        } finally{
            setExportingExcel(false);
        }
    }
    const guideText = isVi ? "Cách dùng nhanh: bấm “Mở cổng đào tạo” trước để extension đứng đúng trang lịch thi, sau đó quay lại bấm “Đồng bộ”. Nút “Đồng bộ” giờ không tự ép chuyển tab để tránh làm gián đoạn trải nghiệm." : "Quick usage: click “Open portal” first so the extension is on the exam page, then come back and click “Sync”. Sync no longer forces a tab switch.";
    const detailHintText = isVi ? "Gợi ý: phần phân tích phía trên chỉ là tóm tắt nhanh. Kéo xuống dưới để xem toàn bộ danh sách chi tiết theo ngày hoặc theo mã môn." : "Tip: the insight area above is only a quick summary. Scroll down for the full detailed list.";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "app-section p-5 md:p-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "max-w-3xl",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-3xl font-bold tracking-tight",
                                        children: t("exams.page.title")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 962,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-sm app-text-muted",
                                        children: t("exams.page.subtitle")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 963,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 961,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleOpenPdaotao,
                                        className: "app-btn",
                                        children: t("exams.actions.openPortal")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 967,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleEnableNotify,
                                        className: "app-btn",
                                        children: notifyPermission === "granted" ? t("exams.actions.notifyEnabled") : notifyPermission === "denied" ? t("exams.actions.notifyBlocked") : t("exams.actions.enableNotify")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 971,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleExportCsv,
                                        className: "app-btn",
                                        children: t("exams.actions.exportCsv")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 979,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleExportExcel,
                                        disabled: exportingExcel,
                                        className: "app-btn",
                                        children: exportingExcel ? isVi ? "Đang xuất Excel..." : "Exporting Excel..." : isVi ? "Xuất Excel" : "Export Excel"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 983,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleSync,
                                        disabled: syncing,
                                        className: "app-btn-primary",
                                        children: syncing ? t("exams.actions.syncing") : t("exams.actions.sync")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 992,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 966,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 960,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: isVi ? "Lưu ý đồng bộ" : "Sync note"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1004,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 opacity-90",
                                children: guideText
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1005,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1003,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.totalRecords")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1010,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-2xl font-bold",
                                        children: stats.total
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1013,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1009,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.visible")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1017,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-2xl font-bold",
                                        children: stats.visible
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1020,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1016,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.uniqueDays")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1024,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-2xl font-bold",
                                        children: stats.uniqueDays
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1027,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1023,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.courses")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1031,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-2xl font-bold",
                                        children: stats.uniqueCourses
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1034,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1030,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.students")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1038,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-2xl font-bold",
                                        children: stats.uniqueStudents
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1041,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1037,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.upcoming")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1045,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-2xl font-bold",
                                        children: stats.upcoming
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1048,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1044,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.official")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1052,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-2xl font-bold text-[var(--success)]",
                                        children: stats.official
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1055,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1051,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.tentative")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1059,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-2xl font-bold text-[var(--warning)]",
                                        children: stats.tentative
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1062,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1058,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1008,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-5 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_220px_220px_200px]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "exam-search",
                                        className: "sr-only",
                                        children: t("exams.filters.searchLabel")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1070,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        id: "exam-search",
                                        className: "app-input",
                                        value: query,
                                        onChange: (e)=>setQuery(e.target.value),
                                        placeholder: t("exams.filters.searchPlaceholder")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1073,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        title: t("exams.filters.planLabel"),
                                        "aria-label": t("exams.filters.planLabel"),
                                        className: "app-input",
                                        value: planFilter,
                                        onChange: (e)=>updatePlanFilter(e.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "all",
                                                children: t("exams.filters.allTypes")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1090,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "official",
                                                children: t("exams.filters.official")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1091,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "tentative",
                                                children: t("exams.filters.tentative")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1092,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1081,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        title: t("exams.filters.sortLabel"),
                                        "aria-label": t("exams.filters.sortLabel"),
                                        className: "app-input",
                                        value: sortMode,
                                        onChange: (e)=>updateSortMode(e.target.value),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "date-asc",
                                                children: t("exams.sort.dateAsc")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1106,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "date-desc",
                                                children: t("exams.sort.dateDesc")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1107,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "course-asc",
                                                children: t("exams.sort.courseAsc")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1108,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "student-asc",
                                                children: t("exams.sort.studentAsc")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1109,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1095,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "date",
                                        className: "app-input",
                                        value: dateFilter,
                                        onChange: (e)=>setDateFilter(e.target.value),
                                        title: isVi ? "Lọc theo ngày thi" : "Filter by exam date"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1112,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1069,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 grid gap-3 xl:grid-cols-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "app-input",
                                        value: roomFilter,
                                        onChange: (e)=>setRoomFilter(e.target.value),
                                        title: isVi ? "Lọc theo phòng" : "Filter by room",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "all",
                                                children: isVi ? "Tất cả phòng" : "All rooms"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1128,
                                                columnNumber: 15
                                            }, this),
                                            roomOptions.map((room)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: room,
                                                    children: room
                                                }, room, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 1130,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1122,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        className: "app-input",
                                        value: campusFilter,
                                        onChange: (e)=>setCampusFilter(e.target.value),
                                        title: isVi ? "Lọc theo cơ sở" : "Filter by campus",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "all",
                                                children: isVi ? "Tất cả cơ sở" : "All campuses"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1142,
                                                columnNumber: 15
                                            }, this),
                                            campusOptions.map((campus)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: campus,
                                                    children: campus
                                                }, campus, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 1144,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1136,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setOnlyUpcoming((v)=>!v),
                                                className: [
                                                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                                                    onlyUpcoming ? "app-btn-primary" : "app-btn"
                                                ].join(" "),
                                                children: t("exams.filters.onlyUpcoming")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1151,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setGroupMode("date"),
                                                className: [
                                                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                                                    groupMode === "date" ? "app-btn-primary" : "app-btn"
                                                ].join(" "),
                                                children: isVi ? "Nhóm theo ngày" : "Group by date"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1162,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setGroupMode("course"),
                                                className: [
                                                    "rounded-full px-3 py-1.5 text-xs font-medium transition",
                                                    groupMode === "course" ? "app-btn-primary" : "app-btn"
                                                ].join(" "),
                                                children: isVi ? "Nhóm theo môn" : "Group by course"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1173,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1150,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: resetFilters,
                                        className: "app-btn rounded-full px-3 py-1.5 text-xs",
                                        children: t("exams.actions.resetFilters")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1185,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1121,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 flex flex-wrap items-center gap-2",
                                children: tokens.length ? tokens.map((token)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium",
                                        children: token.raw
                                    }, token.raw, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1197,
                                        columnNumber: 17
                                    }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs app-text-muted",
                                    children: t("exams.filters.tip")
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1205,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1194,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs app-text-muted",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: lastSyncedAt ? t("exams.meta.lastSyncAt", {
                                            time: formatDateTime(lastSyncedAt, locale)
                                        }) : t("exams.meta.noSyncYet")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1210,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t("exams.meta.noticeCount", {
                                            count: lastNoticeCount
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1217,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t("exams.meta.visibleCount", {
                                            count: stats.visible
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1218,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t("exams.meta.groupCount", {
                                            count: grouped.length
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1219,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t("exams.meta.notifyStatus", {
                                            status: notifyPermission === "granted" ? t("exams.notify.statusGranted") : notifyPermission === "denied" ? t("exams.notify.statusDenied") : notifyPermission === "default" ? t("exams.notify.statusDefault") : t("exams.notify.statusUnsupported")
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1220,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1209,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1068,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `mt-4 rounded-2xl px-4 py-3 text-sm ${getBannerClass(bannerTone)}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-medium",
                                children: loading ? t("common.loading") : bannerText || t("exams.sync.idleHelp")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1236,
                                columnNumber: 11
                            }, this),
                            !syncing && !loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-xs opacity-80",
                                children: t("exams.sync.hint")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1240,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1235,
                        columnNumber: 9
                    }, this),
                    error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1245,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 959,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "grid gap-6 xl:grid-cols-[1.2fr_0.8fr]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-section p-5 md:p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap items-center justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-lg font-semibold",
                                                        children: t("exams.insights.title")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1256,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-sm app-text-muted",
                                                        children: t("exams.insights.subtitle")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1257,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1255,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>document.getElementById("exam-detail-list")?.scrollIntoView({
                                                        behavior: "smooth"
                                                    }),
                                                className: "app-btn rounded-full px-3 py-1 text-xs",
                                                children: isVi ? "Xem danh sách chi tiết phía dưới" : "View detailed list below"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1259,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1254,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "font-medium",
                                                children: isVi ? "Gợi ý sử dụng" : "Helpful tip"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1269,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1 opacity-90",
                                                children: detailHintText
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1270,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1268,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-5 grid gap-4 lg:grid-cols-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "rounded-2xl border border-[var(--border-main)] p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-base font-semibold",
                                                        children: t("exams.insights.peakDays")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1275,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-sm app-text-muted",
                                                        children: t("exams.insights.peakDaysHint")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1276,
                                                        columnNumber: 17
                                                    }, this),
                                                    heatmapHighlights.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 rounded-2xl app-soft p-4 text-sm app-text-muted",
                                                        children: t("exams.insights.noHeatmap")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1279,
                                                        columnNumber: 19
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 space-y-3",
                                                        children: heatmapHighlights.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>jumpToDetailedList(item.date, null),
                                                                className: "block w-full rounded-2xl border border-transparent text-left transition hover:border-[var(--accent)]/20 hover:bg-[var(--bg-soft)]/60 p-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "mb-1 flex items-center justify-between gap-3 text-sm",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "font-medium",
                                                                                children: formatDate(item.date, locale)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1292,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "app-text-muted",
                                                                                children: t("exams.insights.recordCount", {
                                                                                    count: item.count
                                                                                })
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1293,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1291,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "h-3 rounded-full bg-[var(--bg-soft)]",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: `h-3 rounded-full ${getHeatmapClass(item.level)}`,
                                                                            style: {
                                                                                width: `${Math.max(12, item.count / Math.max(...heatmapHighlights.map((x)=>x.count)) * 100)}%`
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 1298,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1297,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, item.date, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1285,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1283,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1274,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "rounded-2xl border border-[var(--border-main)] p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-base font-semibold",
                                                        children: t("exams.insights.courseLoad")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1315,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-sm app-text-muted",
                                                        children: t("exams.insights.courseLoadHint")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1316,
                                                        columnNumber: 17
                                                    }, this),
                                                    topCourses.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 rounded-2xl app-soft p-4 text-sm app-text-muted",
                                                        children: t("exams.insights.noCourseLoad")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1321,
                                                        columnNumber: 19
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 space-y-3",
                                                        children: topCourses.map((course)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>jumpToDetailedList(null, course.code),
                                                                className: "w-full rounded-2xl bg-[var(--bg-soft)] p-3 text-left transition hover:opacity-90",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "flex items-start justify-between gap-3",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "min-w-0",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: "truncate font-semibold",
                                                                                    children: course.code
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 1335,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: "mt-1 truncate text-sm app-text-muted",
                                                                                    children: course.name || "—"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 1336,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 1334,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium",
                                                                            children: course.count
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 1340,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 1333,
                                                                    columnNumber: 25
                                                                }, this)
                                                            }, `${course.code}-${course.name || ""}`, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1327,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1325,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1314,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1273,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1253,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-section p-5 md:p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-base font-semibold",
                                                        children: isVi ? "Mini calendar tháng" : "Mini monthly calendar"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1355,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-sm app-text-muted",
                                                        children: isVi ? "Bấm vào một ngày để lọc nhanh danh sách thi theo ngày đó." : "Click a day to filter the exam list quickly."
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1358,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1354,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "app-btn rounded-full px-3 py-1.5 text-xs",
                                                        onClick: ()=>setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)),
                                                        children: "←"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1366,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-medium",
                                                        children: calendarMonth.toLocaleDateString(locale, {
                                                            month: "long",
                                                            year: "numeric"
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1377,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "app-btn rounded-full px-3 py-1.5 text-xs",
                                                        onClick: ()=>setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)),
                                                        children: "→"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1383,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1365,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1353,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 grid grid-cols-7 gap-2 text-center text-xs app-text-muted",
                                        children: (isVi ? [
                                            "T2",
                                            "T3",
                                            "T4",
                                            "T5",
                                            "T6",
                                            "T7",
                                            "CN"
                                        ] : [
                                            "Mon",
                                            "Tue",
                                            "Wed",
                                            "Thu",
                                            "Fri",
                                            "Sat",
                                            "Sun"
                                        ]).map((label)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "py-1 font-medium",
                                                children: label
                                            }, label, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1402,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1397,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 grid grid-cols-7 gap-2",
                                        children: monthCells.map((day)=>{
                                            const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                                            const count = monthCountMap.get(key) || 0;
                                            const inMonth = day.getMonth() === calendarMonth.getMonth();
                                            const active = dateFilter === key;
                                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setDateFilter((prev)=>prev === key ? "" : key),
                                                className: [
                                                    "rounded-2xl border p-2 text-left transition",
                                                    active ? "border-[var(--accent)] bg-[var(--accent)]/15" : "border-[var(--border-main)] bg-[var(--bg-soft)] hover:bg-[var(--bg-card-strong)]",
                                                    !inMonth ? "opacity-40" : ""
                                                ].join(" "),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-semibold",
                                                        children: day.getDate()
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1431,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-[11px] app-text-muted",
                                                        children: count > 0 ? isVi ? `${count} lịch thi` : `${count} exams` : "—"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1432,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, key, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1419,
                                                columnNumber: 19
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1408,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1352,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1252,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "app-section p-5 md:p-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-base font-semibold",
                                            children: t("exams.insights.timelineTitle")
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 1445,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-1 text-sm app-text-muted",
                                            children: t("exams.insights.timelineHint")
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 1446,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1444,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-3 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3 text-xs app-text-muted",
                                    children: isVi ? "Ghi chú: bấm vào một thẻ để lọc nhanh và cuộn xuống phần danh sách chi tiết." : "Note: click a card to filter quickly and jump to the detailed list."
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1449,
                                    columnNumber: 13
                                }, this),
                                nextUpcoming.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 rounded-2xl app-soft p-4 text-sm app-text-muted",
                                    children: t("exams.insights.noTimeline")
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1456,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 space-y-3",
                                    children: nextUpcoming.map((record)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>jumpToDetailedList(record.examDate, null),
                                            className: "w-full rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4 text-left transition hover:border-[var(--accent)]/25 hover:bg-[var(--bg-soft)]",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap items-start justify-between gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "min-w-0",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "font-semibold",
                                                                children: [
                                                                    record.courseCode || t("exams.labels.unknownCourseCode"),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "app-text-muted font-normal",
                                                                        children: record.courseName ? ` • ${record.courseName}` : ""
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1472,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1470,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-sm app-text-muted",
                                                                children: [
                                                                    formatDate(record.examDate, locale),
                                                                    " •",
                                                                    " ",
                                                                    record.startTime || t("exams.labels.unknownTime"),
                                                                    " •",
                                                                    " ",
                                                                    sanitizeVisualText(record.room) || t("exams.labels.unknownRoom"),
                                                                    record.campus ? ` • ${sanitizeVisualText(record.campus)}` : ""
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1477,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-2 text-xs app-text-muted",
                                                                children: [
                                                                    record.studentName || t("exams.labels.unknownStudent"),
                                                                    record.studentId ? ` • ${record.studentId}` : ""
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1484,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1469,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: [
                                                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                                            getStatusTone(record.examDate)
                                                        ].join(" "),
                                                        children: getCountdownLabel(record.examDate, t)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1490,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1468,
                                                columnNumber: 21
                                            }, this)
                                        }, record.id, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 1462,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1460,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 1443,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1442,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 1251,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                id: "exam-detail-list",
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: isVi ? "Ghi chú danh sách" : "List note"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1509,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 opacity-90",
                                children: isVi ? "Tại đây là danh sách thi chi tiết. Bạn có thể lọc theo ngày, môn, phòng, cơ sở; hoặc bấm từ phần Lịch sắp diễn ra / Ngày thi cao điểm để nhảy nhanh xuống đây." : "This is the detailed exam list. Filter by date, course, room, or campus, or click from the timeline/peak-day panels above to jump here quickly."
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1510,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1508,
                        columnNumber: 9
                    }, this),
                    grouped.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "app-section p-8 text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-lg font-semibold",
                                children: t("exams.empty.title")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1519,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 text-sm app-text-muted",
                                children: t("exams.empty.subtitle")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1520,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1518,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            visibleGroups.map(([groupKey, items])=>{
                                const first = items[0];
                                const groupLabel = groupMode === "date" ? formatDate(groupKey, locale) : `${groupKey}${first?.courseName ? ` • ${first.courseName}` : ""}`;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "app-section overflow-hidden",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "border-b border-[var(--border-main)] px-5 py-4",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap items-center justify-between gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-lg font-semibold",
                                                                children: groupLabel
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1536,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-sm app-text-muted",
                                                                children: t("exams.table.recordCount", {
                                                                    count: items.length
                                                                })
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1537,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1535,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            groupMode === "date" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: [
                                                                    "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                                                    getStatusTone(groupKey)
                                                                ].join(" "),
                                                                children: getCountdownLabel(groupKey, t)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1544,
                                                                columnNumber: 27
                                                            }, this) : null,
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>groupMode === "date" ? setDateFilter(groupKey === "unknown" ? "" : groupKey) : setQuery(groupKey),
                                                                className: "app-btn rounded-full px-3 py-1 text-xs",
                                                                children: isVi ? "Giữ bộ lọc này" : "Keep this filter"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1554,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1542,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1534,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 1533,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "overflow-x-auto",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                className: "min-w-[1320px] w-full text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            className: "border-b border-[var(--border-main)] bg-[var(--bg-soft)] text-left",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: t("exams.table.type")
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 1573,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: t("exams.table.course")
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 1574,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: t("exams.table.time")
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 1575,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: t("exams.table.room")
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 1576,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: t("exams.table.student")
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 1577,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: t("exams.table.class")
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 1578,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: t("exams.table.source")
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 1579,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 1572,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1571,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                        children: items.map((record)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                className: "border-b border-[var(--border-main)]/70 align-top",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "space-y-2",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: [
                                                                                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                                                                        record.planType === "official" ? "app-pill-success" : "app-pill-warning"
                                                                                    ].join(" "),
                                                                                    children: record.planType === "official" ? t("exams.filters.official") : t("exams.filters.tentative")
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 1590,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                        className: [
                                                                                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                                                                            getStatusTone(record.examDate)
                                                                                        ].join(" "),
                                                                                        children: getCountdownLabel(record.examDate, t)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 1604,
                                                                                        columnNumber: 35
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 1603,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 1589,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1588,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: record.courseCode || t("exams.labels.unknownCourseCode")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1617,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-1 app-text-muted",
                                                                                children: record.courseName || record.noticeTitle
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1620,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1616,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                children: record.startTime || t("exams.labels.unknownTime")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1626,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-1 text-xs app-text-muted",
                                                                                children: sanitizeVisualText(record.examMetaRaw) || ""
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1627,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1625,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                children: sanitizeVisualText(record.room) || t("exams.labels.unknownRoom")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1633,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            record.campus ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-1 text-xs app-text-muted",
                                                                                children: sanitizeVisualText(record.campus)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1635,
                                                                                columnNumber: 33
                                                                            }, this) : null
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1632,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "font-medium",
                                                                                children: record.studentName || t("exams.labels.unknownStudent")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1642,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-1 text-xs app-text-muted",
                                                                                children: [
                                                                                    record.studentId || t("exams.labels.unknownStudentId"),
                                                                                    record.birthDate ? ` • ${record.birthDate}` : ""
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1645,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1641,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                children: record.classCourse || "—"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1652,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            record.classStudent ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-1 text-xs app-text-muted",
                                                                                children: record.classStudent
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1654,
                                                                                columnNumber: 33
                                                                            }, this) : null
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1651,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs app-text-muted",
                                                                                children: record.publishedAtRaw || t("exams.labels.unknownPublishTime")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1661,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            record.attachmentName ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-1 text-xs app-text-muted",
                                                                                children: record.attachmentName
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1666,
                                                                                columnNumber: 33
                                                                            }, this) : null,
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-2 flex flex-wrap gap-2",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                        href: record.detailUrl,
                                                                                        target: "_blank",
                                                                                        rel: "noreferrer",
                                                                                        className: "app-btn rounded-xl px-3 py-1.5 text-xs",
                                                                                        title: t("exams.actions.openDetail"),
                                                                                        children: t("exams.actions.openDetail")
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 1672,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    record.attachmentUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                        href: record.attachmentUrl,
                                                                                        target: "_blank",
                                                                                        rel: "noreferrer",
                                                                                        className: "app-btn rounded-xl px-3 py-1.5 text-xs",
                                                                                        title: isVi ? "Tải file lịch thi" : "Download exam file",
                                                                                        children: isVi ? "Tải file lịch thi" : "Download exam file"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 1683,
                                                                                        columnNumber: 35
                                                                                    }, this) : null
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1671,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "mt-2 text-[11px] app-text-muted",
                                                                                children: isVi ? "Mẹo: nếu file Excel gốc khó tìm, hãy lọc ngay trong hệ thống rồi dùng nút Xuất Excel để lấy file cá nhân hoá dễ tra cứu hơn." : "Tip: if the original Excel is hard to search, filter here first and export a personalized Excel file instead."
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 1695,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1660,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                ]
                                                            }, record.id, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1584,
                                                                columnNumber: 27
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1582,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1570,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 1569,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, groupKey, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1532,
                                    columnNumber: 17
                                }, this);
                            }),
                            hasMoreGroups ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setVisibleGroupsLimit((v)=>v + 8),
                                    className: "app-btn-primary",
                                    children: t("exams.actions.loadMore")
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1712,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1711,
                                columnNumber: 15
                            }, this) : null
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 1507,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 958,
        columnNumber: 5
    }, this);
}
_s(ExamsPage, "QzJgwsuboi3wvoC3Yatsjf6P8Hk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c = ExamsPage;
var _c;
__turbopack_context__.k.register(_c, "ExamsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_web_src_aa7a35d6._.js.map