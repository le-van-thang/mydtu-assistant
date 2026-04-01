(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:4000";
function apiUrl(path) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}
function isHtmlLike(value) {
    const s = String(value || "").trim().toLowerCase();
    return s.startsWith("<!doctype html") || s.startsWith("<html") || s.includes("<body");
}
function toSafeErrorMessage(input, fallback) {
    const raw = String(input ?? "").trim();
    if (!raw) return fallback;
    if (isHtmlLike(raw)) return fallback;
    return raw;
}
function assertOk(json) {
    if (!json.ok) {
        throw new Error(toSafeErrorMessage(json.error, "Request failed"));
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
    const res = await fetch(apiUrl(`/exams?${qs.toString()}`), {
        method: "GET",
        headers: {
            "content-type": "application/json"
        },
        cache: "no-store",
        credentials: "include"
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(toSafeErrorMessage(text, `Failed to fetch exams: ${res.status}`));
    }
    const json = assertOk(await res.json());
    return json.items.map(mapDbRecordToParsedRecord);
}
async function importExamsToDb(body) {
    const res = await fetch(apiUrl("/import/exams"), {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(toSafeErrorMessage(text, `Failed to import exams: ${res.status}`));
    }
    return assertOk(await res.json());
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
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
function cleanVisualSeparators(value) {
    return normalizeSpace(value).replace(/\|{2,}/g, " | ").replace(/\s*\|\s*\|\s*/g, " | ").replace(/\s*\|\s*/g, " | ").replace(/\s{2,}/g, " ").trim();
}
function stripTrailingMetaNoise(value) {
    return cleanVisualSeparators(value).replace(/\|\s*Lần\s*thi\s*:?\s*\d+\s*$/i, "").replace(/\|\s*$/g, "").trim();
}
function cleanRoomText(value) {
    return stripTrailingMetaNoise(value).replace(/^phòng\s*:?\s*/i, "").trim();
}
function cleanCampusText(value) {
    return stripTrailingMetaNoise(value).replace(/^cơ\s*sở\s*:?\s*/i, "").trim();
}
function cleanAttemptText(value) {
    return cleanVisualSeparators(value).replace(/^lần\s*thi\s*:?\s*/i, "").replace(/[|]+/g, "").trim();
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
        courseName: normalizeSpace(match[1]) || null,
        courseCode: normalizeSpace(match[2])
    };
}
function buildMetaRaw(params) {
    const parts = [
        params.startTime ? `Thời gian: ${params.startTime}` : "",
        params.datePart ? `Ngày: ${params.datePart}` : "",
        params.room ? `Phòng: ${params.room}` : "",
        params.campus ? `Cơ sở: ${params.campus}` : "",
        params.attempt ? `Lần thi: ${params.attempt}` : ""
    ].filter(Boolean);
    return parts.join(" | ") || null;
}
function extractExamSessionMeta(text) {
    const raw = cleanVisualSeparators(text);
    const regexes = [
        /Thời\s*gian\s*:?\s*([0-9hH:]{4,8})\s*-\s*Ngày\s*([0-9/]{10})\s*-\s*Phòng\s*:?\s*([^|\n-]+?)(?:\s*-\s*cơ\s*sở\s*:?\s*([^|]+?))?(?:\s*\|\s*Lần\s*thi\s*:?\s*(\d+))?$/i,
        /Thời\s*gian\s*:?\s*([0-9hH:]{4,8})\s*-\s*Ngày\s*([0-9/]{10})\s*-\s*Phòng\s*:?\s*(.+)$/i
    ];
    let match = null;
    for (const regex of regexes){
        match = raw.match(regex);
        if (match) break;
    }
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
    const timePart = match[1] || null;
    const datePart = match[2] || null;
    let roomPart = match[3] || "";
    let campusPart = match[4] || "";
    let attemptPart = match[5] || "";
    if (!campusPart && roomPart.includes(" - cơ sở")) {
        const pieces = roomPart.split(/\s*-\s*cơ\s*sở\s*:?\s*/i);
        roomPart = pieces[0] || "";
        campusPart = pieces.slice(1).join(" - ") || "";
    }
    if (!attemptPart) {
        const attemptMatch = raw.match(/\bLần\s*thi\s*:?\s*(\d+)/i);
        attemptPart = attemptMatch?.[1] || "";
    }
    const normalizedTime = String(timePart || "").replace(/[Hh]/g, ":");
    const timeMatch = normalizedTime.match(/(\d{1,2}):(\d{2})/);
    const startTime = timeMatch ? `${String(timeMatch[1]).padStart(2, "0")}:${timeMatch[2]}` : null;
    const room = cleanRoomText(roomPart) || null;
    const campus = cleanCampusText(campusPart) || null;
    const attempt = cleanAttemptText(attemptPart) || null;
    return {
        examDate: parseDdMmYyyy(datePart),
        startTime,
        endTime: null,
        room,
        campus,
        raw: buildMetaRaw({
            startTime,
            datePart,
            room,
            campus,
            attempt
        })
    };
}
function emptyHeaderIndexes() {
    return {
        studentId: -1,
        hoVa: -1,
        ten: -1,
        fullName: -1,
        classCourse: -1,
        classStudent: -1,
        birthDate: -1,
        note: -1
    };
}
function getHeaderIndexes(row) {
    const indexes = emptyHeaderIndexes();
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
function cleanBirthDate(value) {
    const raw = normalizeSpace(value);
    if (!raw) return null;
    return raw;
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
        let headerIndexes = emptyHeaderIndexes();
        for (const row of rows){
            const joined = cleanVisualSeparators(row.join(" | "));
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
            const birthDate = headerIndexes.birthDate >= 0 ? cleanBirthDate(row[headerIndexes.birthDate]) : null;
            const note = headerIndexes.note >= 0 ? cleanVisualSeparators(row[headerIndexes.note]) || null : null;
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
"[project]/apps/web/src/app/(app)/exams/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ExamsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/cache.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/notify.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$parseWorkbook$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/parseWorkbook.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/extensionBridge.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/react-i18next@15.7.4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5/node_modules/react-i18next/dist/es/useTranslation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
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
    return String(value ?? "").replace(/\|{2,}/g, " | ").replace(/\s*\|\s*\|\s*/g, " | ").replace(/\s*\|\s*/g, " | ").replace(/\s{2,}/g, " ").replace(/\|\s*:\s*\|/g, ": ").replace(/\s{2,}/g, " ").trim();
}
function sanitizeExamMeta(value) {
    const raw = sanitizeVisualText(value);
    return raw.replace(/Thời gian\s*:?\s*/gi, "Thời gian: ").replace(/Ngày\s*:?\s*/gi, "Ngày: ").replace(/Phòng\s*:?\s*/gi, "Phòng: ").replace(/cơ sở\s*:?\s*/gi, "Cơ sở: ").replace(/Lần thi\s*:?\s*/gi, "Lần thi: ").replace(/\s+\|\s+\|\s+/g, " | ").replace(/\|\s*$/g, "").trim();
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
function mapSyncErrorMessage(raw, t, isVi) {
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
    if (normalized.includes("invalid userid")) {
        return isVi ? "Không tìm thấy người dùng hợp lệ để đồng bộ. Vui lòng đăng nhập lại." : "Cannot find a valid user for sync. Please sign in again.";
    }
    if (normalized.includes("transaction not found") || normalized.includes("transaction api error") || normalized.includes("closed transaction")) {
        return isVi ? "Đồng bộ thất bại vì server xử lý quá lâu. Đã tăng timeout phía API, hãy thử lại." : "Sync failed because the server transaction timed out. Please try again.";
    }
    if (normalized.startsWith("<!doctype html") || normalized.startsWith("<html") || normalized.includes("this page could not be found") || normalized.includes("next-router-not-mounted") || normalized.includes("__next")) {
        return isVi ? "Đồng bộ thất bại do lỗi phía server hoặc API importExams/exams trả về không hợp lệ." : "Sync failed because the server/API returned an invalid response.";
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
                sanitizeExamMeta(record.examMetaRaw),
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
async function exportExamExcel(records, locale, sheetName = "Danh_sach_loc") {
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
            "Thông tin ca thi": sanitizeExamMeta(record.examMetaRaw),
            "Ghi chú": record.note || ""
        }));
    const summary = [
        {
            "Tổng bản ghi": records.length,
            "Loại xuất": "Danh sách đã lọc",
            "Xuất lúc": new Date().toLocaleString(locale)
        }
    ];
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summary);
    const wsRecords = XLSX.utils.json_to_sheet(rows);
    const summaryCols = Object.keys(summary[0] || {}).map((key)=>({
            wch: Math.max(key.length + 4, 18)
        }));
    const recordHeaders = Object.keys(rows[0] || {});
    const recordCols = recordHeaders.map((header)=>{
        const maxContent = Math.max(header.length, ...rows.map((row)=>String(row[header] ?? "").length));
        return {
            wch: Math.min(Math.max(maxContent + 2, 14), 38)
        };
    });
    wsSummary["!cols"] = summaryCols;
    wsRecords["!cols"] = recordCols;
    wsRecords["!autofilter"] = {
        ref: XLSX.utils.encode_range({
            s: {
                r: 0,
                c: 0
            },
            e: {
                r: Math.max(rows.length, 1),
                c: Math.max(recordHeaders.length - 1, 0)
            }
        })
    };
    XLSX.utils.book_append_sheet(wb, wsSummary, "Tong_quan");
    XLSX.utils.book_append_sheet(wb, wsRecords, sheetName);
    const fileDate = new Date().toLocaleDateString(locale).replace(/[^\d]+/g, "-");
    XLSX.writeFile(wb, `danh-sach-lich-thi-da-loc-${fileDate}.xlsx`);
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
function buildSessionSummaries(records) {
    const map = new Map();
    for (const record of records){
        const key = [
            record.planType,
            record.courseCode || "",
            record.courseName || "",
            record.examDate || "",
            record.startTime || "",
            record.room || "",
            record.campus || "",
            record.detailUrl || ""
        ].join("|||");
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(record);
    }
    return Array.from(map.values()).map((items)=>{
        const first = items[0];
        return {
            id: [
                first.planType,
                first.courseCode,
                first.examDate,
                first.startTime,
                first.room,
                first.campus
            ].map((x)=>x || "").join("::"),
            planType: first.planType,
            courseCode: first.courseCode,
            courseName: first.courseName,
            examDate: first.examDate,
            startTime: first.startTime,
            endTime: first.endTime,
            room: first.room,
            campus: first.campus,
            examMetaRaw: first.examMetaRaw,
            detailUrl: first.detailUrl,
            attachmentUrl: first.attachmentUrl,
            attachmentName: first.attachmentName,
            publishedAtRaw: first.publishedAtRaw,
            noticeTitle: first.noticeTitle,
            studentCount: new Set(items.map((x)=>x.studentId).filter(Boolean)).size || items.length,
            classCourseCount: new Set(items.map((x)=>x.classCourse).filter(Boolean)).size,
            classStudentCount: new Set(items.map((x)=>x.classStudent).filter(Boolean)).size,
            records: items.slice().sort(compareDateTimeAsc)
        };
    }).sort((a, b)=>{
        const av = `${a.examDate || "9999-12-31"} ${a.startTime || "23:59"} ${a.courseCode || ""}`;
        const bv = `${b.examDate || "9999-12-31"} ${b.startTime || "23:59"} ${b.courseCode || ""}`;
        return av.localeCompare(bv);
    });
}
function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function SyncedHorizontalTable({ children, minWidthClassName = "min-w-[1280px]", stickyTop = "top-[78px] md:top-[86px]" }) {
    _s();
    const topScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const bottomScrollRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const contentMeasureRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const syncingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [metrics, setMetrics] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        clientWidth: 0,
        scrollWidth: 0,
        hasOverflow: false
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SyncedHorizontalTable.useEffect": ()=>{
            const updateMetrics = {
                "SyncedHorizontalTable.useEffect.updateMetrics": ()=>{
                    const bottomEl = bottomScrollRef.current;
                    const contentEl = contentMeasureRef.current;
                    if (!bottomEl || !contentEl) return;
                    const clientWidth = bottomEl.clientWidth;
                    const scrollWidth = contentEl.scrollWidth;
                    setMetrics({
                        clientWidth,
                        scrollWidth,
                        hasOverflow: scrollWidth > clientWidth + 4
                    });
                }
            }["SyncedHorizontalTable.useEffect.updateMetrics"];
            updateMetrics();
            const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver({
                "SyncedHorizontalTable.useEffect": ()=>updateMetrics()
            }["SyncedHorizontalTable.useEffect"]) : null;
            if (bottomScrollRef.current) resizeObserver?.observe(bottomScrollRef.current);
            if (contentMeasureRef.current) resizeObserver?.observe(contentMeasureRef.current);
            window.addEventListener("resize", updateMetrics);
            return ({
                "SyncedHorizontalTable.useEffect": ()=>{
                    resizeObserver?.disconnect();
                    window.removeEventListener("resize", updateMetrics);
                }
            })["SyncedHorizontalTable.useEffect"];
        }
    }["SyncedHorizontalTable.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SyncedHorizontalTable.useEffect": ()=>{
            const topEl = topScrollRef.current;
            const bottomEl = bottomScrollRef.current;
            if (!topEl || !bottomEl) return;
            const syncFromTop = {
                "SyncedHorizontalTable.useEffect.syncFromTop": ()=>{
                    if (syncingRef.current === "bottom") return;
                    syncingRef.current = "top";
                    bottomEl.scrollLeft = topEl.scrollLeft;
                    requestAnimationFrame({
                        "SyncedHorizontalTable.useEffect.syncFromTop": ()=>{
                            if (syncingRef.current === "top") syncingRef.current = null;
                        }
                    }["SyncedHorizontalTable.useEffect.syncFromTop"]);
                }
            }["SyncedHorizontalTable.useEffect.syncFromTop"];
            const syncFromBottom = {
                "SyncedHorizontalTable.useEffect.syncFromBottom": ()=>{
                    if (syncingRef.current === "top") return;
                    syncingRef.current = "bottom";
                    topEl.scrollLeft = bottomEl.scrollLeft;
                    requestAnimationFrame({
                        "SyncedHorizontalTable.useEffect.syncFromBottom": ()=>{
                            if (syncingRef.current === "bottom") syncingRef.current = null;
                        }
                    }["SyncedHorizontalTable.useEffect.syncFromBottom"]);
                }
            }["SyncedHorizontalTable.useEffect.syncFromBottom"];
            topEl.addEventListener("scroll", syncFromTop, {
                passive: true
            });
            bottomEl.addEventListener("scroll", syncFromBottom, {
                passive: true
            });
            return ({
                "SyncedHorizontalTable.useEffect": ()=>{
                    topEl.removeEventListener("scroll", syncFromTop);
                    bottomEl.removeEventListener("scroll", syncFromBottom);
                }
            })["SyncedHorizontalTable.useEffect"];
        }
    }["SyncedHorizontalTable.useEffect"], [
        metrics.hasOverflow
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative",
        children: [
            metrics.hasOverflow ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `sticky z-20 mb-2 ${stickyTop}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "rounded-xl border border-[var(--border-main)] bg-[var(--bg-card-strong)]/95 px-3 py-2 shadow-lg backdrop-blur",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Kéo ngang nhanh"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 707,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "↔"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 708,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 706,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            ref: topScrollRef,
                            className: "overflow-x-auto overflow-y-hidden rounded-full",
                            style: {
                                scrollbarWidth: "thin"
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    width: metrics.scrollWidth || metrics.clientWidth || 1,
                                    height: 8
                                },
                                className: "rounded-full bg-[var(--accent)]/20"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 716,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 711,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 705,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 704,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: bottomScrollRef,
                className: "overflow-x-auto pb-2",
                style: {
                    scrollbarWidth: "thin"
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    ref: contentMeasureRef,
                    className: minWidthClassName,
                    children: children
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 733,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 728,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 702,
        columnNumber: 5
    }, this);
}
_s(SyncedHorizontalTable, "W3Se8x6QwlAJt8k0Mu1KjWt9GNQ=");
_c = SyncedHorizontalTable;
function ExamsPage({ userId: initialUserId }) {
    _s1();
    const { t, i18n } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"])();
    const locale = i18n.language?.startsWith("vi") ? "vi-VN" : "en-US";
    const isVi = locale.startsWith("vi");
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const [resolvedUserId, setResolvedUserId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialUserId ?? null);
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
    const [activeSession, setActiveSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [exportingSessionExcel, setExportingSessionExcel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [stickyFilters, setStickyFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ExamsPage.useEffect": ()=>{
            const onScroll = {
                "ExamsPage.useEffect.onScroll": ()=>{
                    setStickyFilters(window.scrollY > 180);
                }
            }["ExamsPage.useEffect.onScroll"];
            onScroll();
            window.addEventListener("scroll", onScroll, {
                passive: true
            });
            return ({
                "ExamsPage.useEffect": ()=>window.removeEventListener("scroll", onScroll)
            })["ExamsPage.useEffect"];
        }
    }["ExamsPage.useEffect"], []);
    function printMiniExamSlip(record, session) {
        const title = isVi ? "Phiếu dự thi mini" : "Mini exam slip";
        const examDateText = formatDate(record.examDate, locale);
        const examTimeText = [
            record.startTime || null,
            record.endTime || null
        ].filter(Boolean).join(" - ") || record.startTime || (isVi ? "Chưa rõ giờ" : "Unknown time");
        const roomText = sanitizeVisualText(record.room) || (isVi ? "Chưa rõ phòng" : "Unknown room");
        const campusText = sanitizeVisualText(record.campus) || "—";
        const courseCodeText = record.courseCode || (isVi ? "Chưa rõ mã môn" : "Unknown course code");
        const courseNameText = record.courseName || record.noticeTitle || "—";
        const studentIdText = record.studentId || "—";
        const studentNameText = record.studentName || "—";
        const birthDateText = record.birthDate || "—";
        const classCourseText = record.classCourse || "—";
        const classStudentText = record.classStudent || "—";
        const planTypeText = record.planType === "official" ? isVi ? "Chính thức" : "Official" : isVi ? "Dự kiến" : "Tentative";
        const metaText = sanitizeExamMeta(record.examMetaRaw) || "—";
        const publishText = record.publishedAtRaw || "—";
        const attachmentText = record.attachmentName || "—";
        const noticeTitleText = record.noticeTitle || "—";
        const studentCountText = session?.studentCount != null ? String(session.studentCount) : isVi ? "Không rõ" : "Unknown";
        const html = `<!doctype html>
<html lang="${isVi ? "vi" : "en"}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #f5f7fb;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 16mm;
    }
    .card {
      background: #ffffff;
      border: 1px solid #dbe3ef;
      border-radius: 18px;
      padding: 18px;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.08);
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 16px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.2;
    }
    .subtitle {
      color: #475569;
      font-size: 12px;
      margin-top: 4px;
    }
    .badge {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      background: #e2e8f0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .item {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 10px 12px;
      background: #fafcff;
    }
    .label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: .04em;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .value {
      font-size: 14px;
      font-weight: 600;
      line-height: 1.45;
      word-break: break-word;
    }
    .wide {
      grid-column: 1 / -1;
    }
    .hint {
      margin-top: 14px;
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
    }
    .foot {
      margin-top: 12px;
      font-size: 11px;
      color: #64748b;
    }
    @media print {
      html, body {
        background: #fff;
      }
      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
      }
      .card {
        box-shadow: none;
        border: 1px solid #cbd5e1;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="card">
      <div class="topbar">
        <div>
          <div class="brand">${escapeHtml(title)}</div>
          <div class="subtitle">
            ${escapeHtml(isVi ? "Dùng để tra cứu nhanh thông tin ca thi của riêng sinh viên." : "Quick reference for an individual student's exam session.")}
          </div>
        </div>
        <div class="badge">${escapeHtml(planTypeText)}</div>
      </div>

      <div class="grid">
        <div class="item">
          <div class="label">${escapeHtml(isVi ? "MSSV" : "Student ID")}</div>
          <div class="value">${escapeHtml(studentIdText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Họ tên" : "Student name")}</div>
          <div class="value">${escapeHtml(studentNameText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Ngày sinh" : "Birth date")}</div>
          <div class="value">${escapeHtml(birthDateText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Lớp sinh hoạt" : "Student class")}</div>
          <div class="value">${escapeHtml(classStudentText)}</div>
        </div>

        <div class="item wide">
          <div class="label">${escapeHtml(isVi ? "Môn học" : "Course")}</div>
          <div class="value">${escapeHtml(`${courseCodeText}${courseNameText !== "—" ? ` • ${courseNameText}` : ""}`)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Ngày thi" : "Exam date")}</div>
          <div class="value">${escapeHtml(examDateText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Giờ thi" : "Exam time")}</div>
          <div class="value">${escapeHtml(examTimeText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Phòng thi" : "Room")}</div>
          <div class="value">${escapeHtml(roomText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Cơ sở" : "Campus")}</div>
          <div class="value">${escapeHtml(campusText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Lớp môn học" : "Course class")}</div>
          <div class="value">${escapeHtml(classCourseText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Số SV cùng ca" : "Students in session")}</div>
          <div class="value">${escapeHtml(studentCountText)}</div>
        </div>

        <div class="item wide">
          <div class="label">${escapeHtml(isVi ? "Thông tin ca thi" : "Exam session details")}</div>
          <div class="value">${escapeHtml(metaText)}</div>
        </div>

        <div class="item wide">
          <div class="label">${escapeHtml(isVi ? "Thông báo" : "Notice")}</div>
          <div class="value">${escapeHtml(noticeTitleText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Nguồn đăng" : "Published at")}</div>
          <div class="value">${escapeHtml(publishText)}</div>
        </div>

        <div class="item">
          <div class="label">${escapeHtml(isVi ? "Tệp lịch thi" : "Attachment")}</div>
          <div class="value">${escapeHtml(attachmentText)}</div>
        </div>
      </div>

      <div class="hint">
        ${escapeHtml(isVi ? "Phiếu này chỉ là bản mini để tra cứu/in nhanh, không thay thế giấy tờ hoặc quy định chính thức của nhà trường." : "This mini slip is for quick lookup/printing only and does not replace official school documents or rules.")}
      </div>

      <div class="foot">
        ${escapeHtml(isVi ? `In lúc: ${new Date().toLocaleString(locale)}` : `Printed at: ${new Date().toLocaleString(locale)}`)}
      </div>
    </div>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () {
        window.print();
      }, 180);
    };
  </script>
</body>
</html>`;
        const printWindow = window.open("", "_blank", "width=980,height=720");
        if (!printWindow) {
            const msg = isVi ? "Trình duyệt chặn cửa sổ in. Hãy cho phép pop-up rồi thử lại." : "The browser blocked the print window. Please allow pop-ups and try again.";
            setBannerTone("warning");
            setBannerText(msg);
            return;
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
    }
    async function fetchCurrentUserId() {
        try {
            const res = await fetch("/api/auth/me", {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json?.user?.id ?? null;
        } catch  {
            return null;
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ExamsPage.useEffect": ()=>{
            let cancelled = false;
            async function boot() {
                setLoading(true);
                try {
                    const uid = initialUserId ?? await fetchCurrentUserId();
                    if (cancelled) return;
                    if (!uid) {
                        setResolvedUserId(null);
                        setRecords([]);
                        setBannerTone("warning");
                        setBannerText(isVi ? "Không xác định được người dùng hiện tại. Vui lòng đăng nhập lại." : "Cannot resolve current user. Please sign in again.");
                        return;
                    }
                    setResolvedUserId(uid);
                    const meta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readExamMeta"])();
                    const permission = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensureNotificationPermission"])();
                    if (cancelled) return;
                    setNotifyPermission(permission);
                    setLastSyncedAt(meta.lastSyncedAt);
                    setLastNoticeCount(meta.lastNoticeCount);
                    try {
                        const dbRecords = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchExamsFromDb"])({
                            userId: uid
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
        initialUserId,
        isVi,
        locale,
        t
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
        roomFilter,
        sortMode,
        tokens
    ]);
    const filteredSessions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[filteredSessions]": ()=>buildSessionSummaries(filtered)
    }["ExamsPage.useMemo[filteredSessions]"], [
        filtered
    ]);
    const grouped = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[grouped]": ()=>{
            const map = new Map();
            for (const session of filteredSessions){
                const key = groupMode === "date" ? session.examDate || "unknown" : session.courseCode || session.noticeTitle || "unknown";
                if (!map.has(key)) map.set(key, []);
                map.get(key).push(session);
            }
            const entries = Array.from(map.entries());
            entries.sort({
                "ExamsPage.useMemo[grouped]": (a, b)=>a[0].localeCompare(b[0])
            }["ExamsPage.useMemo[grouped]"]);
            return entries;
        }
    }["ExamsPage.useMemo[grouped]"], [
        filteredSessions,
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
                visibleSessions: filteredSessions.length,
                uniqueDays
            };
        }
    }["ExamsPage.useMemo[stats]"], [
        filtered.length,
        filteredSessions.length,
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
    const sessionSummaries = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[sessionSummaries]": ()=>buildSessionSummaries(records)
    }["ExamsPage.useMemo[sessionSummaries]"], [
        records
    ]);
    const nextUpcomingSessions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[nextUpcomingSessions]": ()=>{
            return sessionSummaries.filter({
                "ExamsPage.useMemo[nextUpcomingSessions]": (session)=>{
                    const diff = getDayDiff(session.examDate);
                    return diff !== null && diff >= 0;
                }
            }["ExamsPage.useMemo[nextUpcomingSessions]"]).slice(0, 8);
        }
    }["ExamsPage.useMemo[nextUpcomingSessions]"], [
        sessionSummaries
    ]);
    const topCourses = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[topCourses]": ()=>{
            const map = new Map();
            for (const session of filteredSessions){
                const key = session.courseCode || session.noticeTitle || "unknown";
                const current = map.get(key);
                if (current) {
                    current.count += session.studentCount;
                } else {
                    map.set(key, {
                        code: session.courseCode || t("exams.labels.unknownCourseCode"),
                        name: session.courseName || null,
                        count: session.studentCount
                    });
                }
            }
            return Array.from(map.values()).sort({
                "ExamsPage.useMemo[topCourses]": (a, b)=>b.count - a.count || a.code.localeCompare(b.code)
            }["ExamsPage.useMemo[topCourses]"]).slice(0, 8);
        }
    }["ExamsPage.useMemo[topCourses]"], [
        filteredSessions,
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
            const uid = resolvedUserId ?? initialUserId ?? await fetchCurrentUserId();
            if (!uid) {
                const msg = isVi ? "Không tìm thấy userId hợp lệ để đồng bộ. Vui lòng đăng nhập lại." : "Cannot find a valid userId for sync. Please sign in again.";
                setError(msg);
                setBannerTone("error");
                setBannerText(msg);
                return;
            }
            setResolvedUserId(uid);
            const previousMeta = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readExamMeta"])();
            setBannerText(t("exams.sync.fetchingPortal"));
            const extensionRes = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["requestExamSync"])({
                maxPages: 2,
                maxItems: 24
            });
            if (!extensionRes.ok) {
                const friendly = mapSyncErrorMessage(extensionRes.error || "", t, isVi);
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
            const importBody = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildImportPayloadFromExtensionNotices"])(uid, extensionRes.payload.notices, parsedChunks);
            setBannerText(isVi ? "Đang lưu dữ liệu thi vào hệ thống..." : "Saving exam data...");
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["importExamsToDb"])(importBody);
            const dbRecords = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchExamsFromDb"])({
                userId: uid
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
            const friendly = mapSyncErrorMessage(String(e?.message || e), t, isVi);
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
    async function handleExportCurrentSession(session) {
        try {
            setExportingSessionExcel(true);
            await exportExamExcel(session.records, locale, sanitizeVisualText(session.courseCode || "Lich_ca_thi").slice(0, 28) || "Lich_ca_thi");
            setBannerTone("success");
            setBannerText(isVi ? `Đã xuất danh sách của ca thi ${session.courseCode || ""} với ${session.studentCount} sinh viên.` : `Exported session ${session.courseCode || ""} with ${session.studentCount} students.`);
        } catch  {
            setBannerTone("error");
            setBannerText(isVi ? "Xuất lịch phiên thi thất bại." : "Failed to export session.");
        } finally{
            setExportingSessionExcel(false);
        }
    }
    const guideText = isVi ? "Cách dùng nhanh: bấm “Mở cổng đào tạo” trước để extension đứng đúng trang lịch thi, sau đó quay lại bấm “Đồng bộ”. Nút “Đồng bộ” không tự ép chuyển tab để tránh làm gián đoạn trải nghiệm." : "Quick usage: click “Open portal” first so the extension is on the exam page, then come back and click “Sync”.";
    const detailHintText = isVi ? "Mình đã thêm thanh kéo ngang nổi ở trên bảng để không cần cuộn xuống tận cuối mới kéo ngang. Trải nghiệm dùng bảng dài sẽ thuận tiện hơn nhiều." : "A floating horizontal scrollbar is added above the table for better usability on large datasets.";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "app-section p-4 md:p-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "max-w-3xl",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[1.9rem] font-bold tracking-tight",
                                        children: t("exams.page.title")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1634,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-sm app-text-muted",
                                        children: t("exams.page.subtitle")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1635,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1633,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleOpenPdaotao,
                                        className: "app-btn text-sm",
                                        children: t("exams.actions.openPortal")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1639,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleEnableNotify,
                                        className: "app-btn text-sm",
                                        children: notifyPermission === "granted" ? t("exams.actions.notifyEnabled") : notifyPermission === "denied" ? t("exams.actions.notifyBlocked") : t("exams.actions.enableNotify")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1643,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleExportCsv,
                                        className: "app-btn text-sm",
                                        children: t("exams.actions.exportCsv")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1651,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleExportExcel,
                                        disabled: exportingExcel,
                                        className: "app-btn text-sm",
                                        children: exportingExcel ? isVi ? "Đang xuất Excel..." : "Exporting Excel..." : isVi ? "Xuất Excel" : "Export Excel"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1655,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleSync,
                                        disabled: syncing,
                                        className: "app-btn-primary text-sm",
                                        children: syncing ? t("exams.actions.syncing") : t("exams.actions.sync")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1670,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1638,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1632,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/10 px-4 py-3 text-sm text-[var(--warning)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: isVi ? "Lưu ý đồng bộ" : "Sync note"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1682,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 opacity-90",
                                children: guideText
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1683,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1681,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-3.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.totalRecords")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1688,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-2xl font-bold",
                                        children: stats.total
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1691,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1687,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-3.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.visible")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1695,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-2xl font-bold",
                                        children: stats.visible
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1698,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1694,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-3.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] uppercase tracking-wide app-text-muted",
                                        children: isVi ? "Phiên đang hiển thị" : "Visible sessions"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1702,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-2xl font-bold",
                                        children: stats.visibleSessions
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1705,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1701,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-3.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.uniqueDays")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1709,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-2xl font-bold",
                                        children: stats.uniqueDays
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1712,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1708,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-3.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.courses")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1716,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-2xl font-bold",
                                        children: stats.uniqueCourses
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1719,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1715,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-3.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.students")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1723,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-2xl font-bold",
                                        children: stats.uniqueStudents
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1726,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1722,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-3.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.official")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1730,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-2xl font-bold text-[var(--success)]",
                                        children: stats.official
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1733,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1729,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-panel p-3.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[11px] uppercase tracking-wide app-text-muted",
                                        children: t("exams.stats.tentative")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1737,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 text-2xl font-bold text-[var(--warning)]",
                                        children: stats.tentative
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1740,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1736,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1686,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: [
                            "mt-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-4 transition-all duration-200",
                            stickyFilters ? "sticky top-4 z-30 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-[color:rgba(10,20,40,0.85)]" : ""
                        ].join(" "),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mb-3 flex flex-wrap items-center justify-between gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm font-semibold",
                                                children: isVi ? "Thanh lọc nhanh" : "Quick filter bar"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1756,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs app-text-muted",
                                                children: isVi ? "Đã thu gọn kích thước để nhìn cân đối hơn khi thao tác." : "Compact sizing for a more balanced layout."
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1759,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1755,
                                        columnNumber: 13
                                    }, this),
                                    stickyFilters ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium",
                                        children: isVi ? "Đang ghim" : "Pinned"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1767,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1754,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_200px_200px_180px]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        htmlFor: "exam-search",
                                        className: "sr-only",
                                        children: t("exams.filters.searchLabel")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1774,
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
                                        lineNumber: 1777,
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
                                                lineNumber: 1794,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "official",
                                                children: t("exams.filters.official")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1795,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "tentative",
                                                children: t("exams.filters.tentative")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1796,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1785,
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
                                                lineNumber: 1810,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "date-desc",
                                                children: t("exams.sort.dateDesc")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1811,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "course-asc",
                                                children: t("exams.sort.courseAsc")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1812,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "student-asc",
                                                children: t("exams.sort.studentAsc")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1813,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1799,
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
                                        lineNumber: 1816,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1773,
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
                                                lineNumber: 1832,
                                                columnNumber: 15
                                            }, this),
                                            roomOptions.map((room)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: room,
                                                    children: room
                                                }, room, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 1834,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1826,
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
                                                lineNumber: 1846,
                                                columnNumber: 15
                                            }, this),
                                            campusOptions.map((campus)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: campus,
                                                    children: campus
                                                }, campus, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 1848,
                                                    columnNumber: 17
                                                }, this))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1840,
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
                                                lineNumber: 1855,
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
                                                lineNumber: 1866,
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
                                                lineNumber: 1877,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1854,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: resetFilters,
                                        className: "app-btn justify-center",
                                        children: t("exams.actions.resetFilters")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1889,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1825,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 flex flex-wrap items-center gap-2",
                                children: tokens.length ? tokens.map((token)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium",
                                        children: token.raw
                                    }, token.raw, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1901,
                                        columnNumber: 17
                                    }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs app-text-muted",
                                    children: t("exams.filters.tip")
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1909,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1898,
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
                                        lineNumber: 1914,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t("exams.meta.noticeCount", {
                                            count: lastNoticeCount
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1921,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t("exams.meta.visibleCount", {
                                            count: stats.visible
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1922,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t("exams.meta.groupCount", {
                                            count: grouped.length
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1923,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t("exams.meta.notifyStatus", {
                                            status: notifyPermission === "granted" ? t("exams.notify.statusGranted") : notifyPermission === "denied" ? t("exams.notify.statusDenied") : notifyPermission === "default" ? t("exams.notify.statusDefault") : t("exams.notify.statusUnsupported")
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1924,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1913,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1746,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `mt-4 rounded-xl px-4 py-3 text-sm ${getBannerClass(bannerTone)}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-medium",
                                children: loading ? t("common.loading") : bannerText || t("exams.sync.idleHelp")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1940,
                                columnNumber: 11
                            }, this),
                            !syncing && !loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-xs opacity-80",
                                children: t("exams.sync.hint")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1944,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1939,
                        columnNumber: 9
                    }, this),
                    error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-3 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1949,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 1631,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "grid gap-5 xl:grid-cols-[1.2fr_0.8fr]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-section p-4 md:p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap items-center justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-base font-semibold",
                                                        children: t("exams.insights.title")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1960,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-sm app-text-muted",
                                                        children: t("exams.insights.subtitle")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1961,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1959,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>document.getElementById("exam-detail-list")?.scrollIntoView({
                                                        behavior: "smooth"
                                                    }),
                                                className: "app-btn text-sm",
                                                children: isVi ? "Xem danh sách chi tiết phía dưới" : "View detailed list below"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1963,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1958,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "font-medium",
                                                children: isVi ? "Gợi ý sử dụng" : "Helpful tip"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1977,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1 opacity-90",
                                                children: detailHintText
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1978,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1976,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 grid gap-4 lg:grid-cols-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "rounded-2xl border border-[var(--border-main)] p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-semibold",
                                                        children: t("exams.insights.peakDays")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1983,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-xs app-text-muted",
                                                        children: t("exams.insights.peakDaysHint")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1984,
                                                        columnNumber: 17
                                                    }, this),
                                                    heatmapHighlights.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 rounded-xl app-soft p-4 text-sm app-text-muted",
                                                        children: t("exams.insights.noHeatmap")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1987,
                                                        columnNumber: 19
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 space-y-3",
                                                        children: heatmapHighlights.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>jumpToDetailedList(item.date, null),
                                                                className: "block w-full rounded-xl border border-transparent p-2 text-left transition hover:border-[var(--accent)]/20 hover:bg-[var(--bg-soft)]/60",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "mb-1 flex items-center justify-between gap-3 text-sm",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "font-medium",
                                                                                children: formatDate(item.date, locale)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2000,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "app-text-muted",
                                                                                children: t("exams.insights.recordCount", {
                                                                                    count: item.count
                                                                                })
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2001,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 1999,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "h-2.5 rounded-full bg-[var(--bg-soft)]",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: `h-2.5 rounded-full ${getHeatmapClass(item.level)}`,
                                                                            style: {
                                                                                width: `${Math.max(12, item.count / Math.max(...heatmapHighlights.map((x)=>x.count)) * 100)}%`
                                                                            }
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2006,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2005,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, item.date, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 1993,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 1991,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 1982,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "rounded-2xl border border-[var(--border-main)] p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-semibold",
                                                        children: t("exams.insights.courseLoad")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2024,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-xs app-text-muted",
                                                        children: t("exams.insights.courseLoadHint")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2025,
                                                        columnNumber: 17
                                                    }, this),
                                                    topCourses.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 rounded-xl app-soft p-4 text-sm app-text-muted",
                                                        children: t("exams.insights.noCourseLoad")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2030,
                                                        columnNumber: 19
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-4 space-y-3",
                                                        children: topCourses.map((course)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>jumpToDetailedList(null, course.code),
                                                                className: "w-full rounded-xl bg-[var(--bg-soft)] p-3 text-left transition hover:opacity-90",
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
                                                                                    lineNumber: 2044,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: "mt-1 truncate text-sm app-text-muted",
                                                                                    children: course.name || "—"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2045,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2043,
                                                                            columnNumber: 27
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium",
                                                                            children: course.count
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2049,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2042,
                                                                    columnNumber: 25
                                                                }, this)
                                                            }, `${course.code}-${course.name || ""}`, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2036,
                                                                columnNumber: 23
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2034,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2023,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1981,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1957,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-section p-4 md:p-5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-semibold",
                                                        children: isVi ? "Mini calendar tháng" : "Mini monthly calendar"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2064,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-xs app-text-muted",
                                                        children: isVi ? "Bấm vào một ngày để lọc nhanh danh sách thi theo ngày đó." : "Click a day to filter the exam list quickly."
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2067,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2063,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "app-btn rounded-xl px-3 py-1.5 text-xs",
                                                        onClick: ()=>setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)),
                                                        children: "←"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2075,
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
                                                        lineNumber: 2086,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "app-btn rounded-xl px-3 py-1.5 text-xs",
                                                        onClick: ()=>setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)),
                                                        children: "→"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2092,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2074,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2062,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 grid grid-cols-7 gap-2 text-center text-[11px] app-text-muted",
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
                                                lineNumber: 2111,
                                                columnNumber: 17
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2106,
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
                                                    "rounded-xl border p-2 text-left transition",
                                                    active ? "border-[var(--accent)] bg-[var(--accent)]/15" : "border-[var(--border-main)] bg-[var(--bg-soft)] hover:bg-[var(--bg-card-strong)]",
                                                    !inMonth ? "opacity-40" : ""
                                                ].join(" "),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm font-semibold",
                                                        children: day.getDate()
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2140,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-[10px] app-text-muted",
                                                        children: count > 0 ? isVi ? `${count} lịch` : `${count} exams` : "—"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2141,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, key, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2128,
                                                columnNumber: 19
                                            }, this);
                                        })
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2117,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2061,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 1956,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-5",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "app-section p-4 md:p-5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm font-semibold",
                                            children: t("exams.insights.timelineTitle")
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2154,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-1 text-xs app-text-muted",
                                            children: isVi ? "Khối này chỉ hiển thị phiên thi tổng hợp theo ca, không còn hiển thị 1 sinh viên đại diện." : "This block only shows aggregated exam sessions."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2155,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2153,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] px-4 py-3 text-xs app-text-muted",
                                    children: isVi ? "Mỗi thẻ là một phiên thi hoàn chỉnh: môn, ngày, giờ, phòng và số sinh viên. Bấm vào để xem chi tiết danh sách sinh viên." : "Each card represents one complete exam session. Click for student details."
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2162,
                                    columnNumber: 13
                                }, this),
                                nextUpcomingSessions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 rounded-xl app-soft p-4 text-sm app-text-muted",
                                    children: t("exams.insights.noTimeline")
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2169,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 space-y-3",
                                    children: nextUpcomingSessions.map((session)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setActiveSession(session),
                                            className: "w-full rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-3.5 text-left transition hover:border-[var(--accent)]/25 hover:bg-[var(--bg-soft)]",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap items-start justify-between gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "min-w-0",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "font-semibold text-sm",
                                                                children: [
                                                                    session.courseCode || t("exams.labels.unknownCourseCode"),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "app-text-muted font-normal",
                                                                        children: session.courseName ? ` • ${session.courseName}` : ""
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2185,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2183,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-xs app-text-muted",
                                                                children: [
                                                                    formatDate(session.examDate, locale),
                                                                    " •",
                                                                    " ",
                                                                    session.startTime || t("exams.labels.unknownTime"),
                                                                    " •",
                                                                    " ",
                                                                    sanitizeVisualText(session.room) || t("exams.labels.unknownRoom"),
                                                                    session.campus ? ` • ${sanitizeVisualText(session.campus)}` : ""
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2190,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-2 flex flex-wrap gap-2 text-xs app-text-muted",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "inline-flex rounded-full app-pill px-2.5 py-1",
                                                                        children: isVi ? `${session.studentCount} sinh viên` : `${session.studentCount} students`
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2198,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    session.classCourseCount > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "inline-flex rounded-full app-pill px-2.5 py-1",
                                                                        children: isVi ? `${session.classCourseCount} lớp môn học` : `${session.classCourseCount} course classes`
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2204,
                                                                        columnNumber: 29
                                                                    }, this) : null
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2197,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2182,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: [
                                                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                                            getStatusTone(session.examDate)
                                                        ].join(" "),
                                                        children: getCountdownLabel(session.examDate, t)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2213,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2181,
                                                columnNumber: 21
                                            }, this)
                                        }, session.id, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2175,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2173,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 2152,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 2151,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 1955,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                id: "exam-detail-list",
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "font-semibold",
                                children: isVi ? "Danh sách phiên thi" : "Exam session list"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2232,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 opacity-90",
                                children: isVi ? "Bảng dưới đã tối ưu lại để hiển thị theo phiên thi tổng hợp. Đồng thời có thêm thanh kéo ngang nổi để không phải cuộn xuống tận cuối." : "The table is grouped by sessions and now includes a floating horizontal scrollbar."
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2233,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 2231,
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
                                lineNumber: 2242,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 text-sm app-text-muted",
                                children: t("exams.empty.subtitle")
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2243,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 2241,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            visibleGroups.map(([groupKey, items])=>{
                                const first = items[0];
                                const groupLabel = groupMode === "date" ? formatDate(groupKey, locale) : `${groupKey}${first?.courseName ? ` • ${first.courseName}` : ""}`;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "app-section",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "border-b border-[var(--border-main)] px-4 py-4",
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
                                                                lineNumber: 2259,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-sm app-text-muted",
                                                                children: isVi ? `${items.length} phiên thi` : `${items.length} exam sessions`
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2260,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2258,
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
                                                                lineNumber: 2269,
                                                                columnNumber: 27
                                                            }, this) : null,
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onClick: ()=>groupMode === "date" ? setDateFilter(groupKey === "unknown" ? "" : groupKey) : setQuery(groupKey),
                                                                className: "app-btn text-sm",
                                                                children: isVi ? "Giữ bộ lọc này" : "Keep this filter"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2279,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2267,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2257,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2256,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "px-4 pb-3 pt-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mb-2 flex items-center justify-between gap-3 text-xs app-text-muted",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: isVi ? "Có thanh kéo ngang nổi ở trên để kéo nhanh." : "Use the floating top scrollbar for quick horizontal navigation."
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 2296,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: isVi ? "Bảng đã thu gọn kích thước" : "Compact table mode"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 2301,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2295,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SyncedHorizontalTable, {
                                                    minWidthClassName: "min-w-[1280px]",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                        className: "w-full text-sm",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                    className: "border-b border-[var(--border-main)] bg-[var(--bg-soft)] text-left",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                            className: "px-4 py-3 font-semibold whitespace-nowrap",
                                                                            children: t("exams.table.type")
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2308,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                            className: "px-4 py-3 font-semibold whitespace-nowrap",
                                                                            children: t("exams.table.course")
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2311,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                            className: "px-4 py-3 font-semibold whitespace-nowrap",
                                                                            children: isVi ? "Lịch thi" : "Exam session"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2314,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                            className: "px-4 py-3 font-semibold whitespace-nowrap",
                                                                            children: isVi ? "Quy mô" : "Scale"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2317,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                            className: "px-4 py-3 font-semibold whitespace-nowrap",
                                                                            children: t("exams.table.class")
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2320,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                            className: "px-4 py-3 font-semibold whitespace-nowrap",
                                                                            children: isVi ? "Thao tác" : "Actions"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2323,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                            className: "px-4 py-3 font-semibold whitespace-nowrap",
                                                                            children: t("exams.table.source")
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2326,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2307,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2306,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                                children: items.map((session)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
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
                                                                                                session.planType === "official" ? "app-pill-success" : "app-pill-warning"
                                                                                            ].join(" "),
                                                                                            children: session.planType === "official" ? t("exams.filters.official") : t("exams.filters.tentative")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2339,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: [
                                                                                                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                                                                                    getStatusTone(session.examDate)
                                                                                                ].join(" "),
                                                                                                children: getCountdownLabel(session.examDate, t)
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 2353,
                                                                                                columnNumber: 37
                                                                                            }, this)
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2352,
                                                                                            columnNumber: 35
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2338,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2337,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                className: "px-4 py-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "font-semibold",
                                                                                        children: session.courseCode || t("exams.labels.unknownCourseCode")
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2366,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-1 text-sm app-text-muted",
                                                                                        children: session.courseName || session.noticeTitle
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2369,
                                                                                        columnNumber: 33
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2365,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                className: "px-4 py-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "font-medium",
                                                                                        children: [
                                                                                            formatDate(session.examDate, locale),
                                                                                            " •",
                                                                                            " ",
                                                                                            session.startTime || t("exams.labels.unknownTime")
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2375,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-1 text-sm app-text-muted",
                                                                                        children: [
                                                                                            sanitizeVisualText(session.room) || t("exams.labels.unknownRoom"),
                                                                                            session.campus ? ` • ${sanitizeVisualText(session.campus)}` : ""
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2379,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-1 max-w-[360px] text-xs leading-5 app-text-muted",
                                                                                        children: sanitizeExamMeta(session.examMetaRaw) || "—"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2385,
                                                                                        columnNumber: 33
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2374,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                className: "px-4 py-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-semibold",
                                                                                        children: isVi ? `${session.studentCount} sinh viên` : `${session.studentCount} students`
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2391,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-2 space-y-1 text-xs app-text-muted",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                children: [
                                                                                                    isVi ? "Lớp môn học" : "Course classes",
                                                                                                    ":",
                                                                                                    " ",
                                                                                                    session.classCourseCount || 0
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 2398,
                                                                                                columnNumber: 35
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                children: [
                                                                                                    isVi ? "Lớp sinh hoạt" : "Student classes",
                                                                                                    ":",
                                                                                                    " ",
                                                                                                    session.classStudentCount || 0
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 2402,
                                                                                                columnNumber: 35
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2397,
                                                                                        columnNumber: 33
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2390,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                className: "px-4 py-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        children: session.records[0]?.classCourse || "—"
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2410,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    session.records[0]?.classStudent ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-1 text-xs app-text-muted",
                                                                                        children: session.records[0].classStudent
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2412,
                                                                                        columnNumber: 35
                                                                                    }, this) : null
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2409,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                className: "px-4 py-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "flex flex-wrap gap-2",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>setActiveSession(session),
                                                                                                className: "app-btn text-sm",
                                                                                                children: isVi ? "Xem ca thi" : "View session"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 2420,
                                                                                                columnNumber: 35
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>handleExportCurrentSession(session),
                                                                                                disabled: exportingSessionExcel,
                                                                                                className: "app-btn-primary text-sm",
                                                                                                children: isVi ? "Xuất phiên thi" : "Export session"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 2428,
                                                                                                columnNumber: 35
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2419,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-2 text-[11px] leading-5 app-text-muted",
                                                                                        children: isVi ? "Chi tiết sinh viên chỉ xem trong modal phiên thi để tránh lặp dữ liệu và làm bảng quá rộng." : "Student details are moved into the session modal to keep the table clean."
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2438,
                                                                                        columnNumber: 33
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2418,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                className: "px-4 py-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "text-xs app-text-muted",
                                                                                        children: session.publishedAtRaw || t("exams.labels.unknownPublishTime")
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2446,
                                                                                        columnNumber: 33
                                                                                    }, this),
                                                                                    session.attachmentName ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-1 text-xs app-text-muted",
                                                                                        children: session.attachmentName
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2451,
                                                                                        columnNumber: 35
                                                                                    }, this) : null,
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "mt-2 flex flex-wrap gap-2",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                                href: session.detailUrl,
                                                                                                target: "_blank",
                                                                                                rel: "noreferrer",
                                                                                                className: "app-btn text-sm",
                                                                                                title: t("exams.actions.openDetail"),
                                                                                                children: t("exams.actions.openDetail")
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 2457,
                                                                                                columnNumber: 35
                                                                                            }, this),
                                                                                            session.attachmentUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                                href: session.attachmentUrl,
                                                                                                target: "_blank",
                                                                                                rel: "noreferrer",
                                                                                                className: "app-btn text-sm",
                                                                                                title: isVi ? "Tải file lịch thi" : "Download exam file",
                                                                                                children: isVi ? "Tải file lịch thi" : "Download exam file"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 2468,
                                                                                                columnNumber: 37
                                                                                            }, this) : null
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2456,
                                                                                        columnNumber: 33
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2445,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, session.id, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2333,
                                                                        columnNumber: 29
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2331,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2305,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2304,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2294,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, groupKey, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2255,
                                    columnNumber: 17
                                }, this);
                            }),
                            hasMoreGroups ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setVisibleGroupsLimit((v)=>v + 8),
                                    className: "app-btn-primary text-sm",
                                    children: t("exams.actions.loadMore")
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2492,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2491,
                                columnNumber: 15
                            }, this) : null
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 2230,
                columnNumber: 7
            }, this),
            activeSession ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-2xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-start justify-between gap-4 border-b border-[var(--border-main)] px-5 py-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-lg font-bold",
                                            children: [
                                                activeSession.courseCode || t("exams.labels.unknownCourseCode"),
                                                activeSession.courseName ? ` • ${activeSession.courseName}` : ""
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2510,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-1 text-sm app-text-muted",
                                            children: [
                                                formatDate(activeSession.examDate, locale),
                                                " •",
                                                " ",
                                                activeSession.startTime || t("exams.labels.unknownTime"),
                                                " •",
                                                " ",
                                                sanitizeVisualText(activeSession.room) || t("exams.labels.unknownRoom"),
                                                activeSession.campus ? ` • ${sanitizeVisualText(activeSession.campus)}` : ""
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2514,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2509,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setActiveSession(null),
                                    className: "app-btn text-sm",
                                    children: t("common.close")
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2522,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 2508,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "max-h-[calc(90vh-88px)] overflow-auto px-5 py-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "grid gap-4 lg:grid-cols-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-[var(--border-main)] p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[11px] uppercase app-text-muted",
                                                    children: isVi ? "Loại lịch" : "Plan type"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2534,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-2 font-semibold",
                                                    children: activeSession.planType === "official" ? t("exams.filters.official") : t("exams.filters.tentative")
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2537,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2533,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-[var(--border-main)] p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[11px] uppercase app-text-muted",
                                                    children: isVi ? "Sinh viên" : "Students"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2545,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-2 font-semibold",
                                                    children: activeSession.studentCount
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2548,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2544,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-[var(--border-main)] p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[11px] uppercase app-text-muted",
                                                    children: isVi ? "Lớp môn học" : "Course classes"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2552,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-2 font-semibold",
                                                    children: activeSession.classCourseCount
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2555,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2551,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "rounded-xl border border-[var(--border-main)] p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-[11px] uppercase app-text-muted",
                                                    children: isVi ? "Trạng thái" : "Status"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2559,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-2",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: [
                                                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                                                            getStatusTone(activeSession.examDate)
                                                        ].join(" "),
                                                        children: getCountdownLabel(activeSession.examDate, t)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2563,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2562,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2558,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2532,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm font-semibold",
                                            children: isVi ? "Thông tin phiên thi" : "Session details"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2576,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-2 text-sm app-text-muted",
                                            children: sanitizeExamMeta(activeSession.examMetaRaw) || "—"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2579,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-4 flex flex-wrap gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>handleExportCurrentSession(activeSession),
                                                    disabled: exportingSessionExcel,
                                                    className: "app-btn-primary text-sm",
                                                    children: exportingSessionExcel ? isVi ? "Đang xuất..." : "Exporting..." : isVi ? "Xuất danh sách của ca thi này" : "Export this session"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2584,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: activeSession.detailUrl,
                                                    target: "_blank",
                                                    rel: "noreferrer",
                                                    className: "app-btn text-sm",
                                                    children: t("exams.actions.openDetail")
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2599,
                                                    columnNumber: 19
                                                }, this),
                                                activeSession.attachmentUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: activeSession.attachmentUrl,
                                                    target: "_blank",
                                                    rel: "noreferrer",
                                                    className: "app-btn text-sm",
                                                    children: isVi ? "Tải file lịch thi" : "Download exam file"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2609,
                                                    columnNumber: 21
                                                }, this) : null
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2583,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2575,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mb-3 flex flex-wrap items-center justify-between gap-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-base font-semibold",
                                                    children: isVi ? `Danh sách sinh viên (${activeSession.records.length})` : `Students (${activeSession.records.length})`
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2623,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-xs app-text-muted",
                                                    children: isVi ? "Chỉ giữ thao tác hữu ích nhất là in phiếu mini cho từng sinh viên." : "Only the most useful action is kept: print mini slip."
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2628,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2622,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "overflow-x-auto rounded-2xl border border-[var(--border-main)]",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                className: "min-w-[1100px] w-full text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                            className: "bg-[var(--bg-soft)] text-left",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: isVi ? "MSSV" : "Student ID"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2639,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: isVi ? "Họ tên" : "Name"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2640,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: isVi ? "Lớp môn học" : "Course class"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2641,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: isVi ? "Lớp sinh hoạt" : "Student class"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2644,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: isVi ? "Ngày sinh" : "Birth date"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2647,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                    className: "px-4 py-3 font-semibold",
                                                                    children: isVi ? "Thao tác" : "Actions"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2650,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 2638,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2637,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                        children: activeSession.records.map((record)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                className: "border-t border-[var(--border-main)]/70",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: record.studentId || "—"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2661,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: record.studentName || "—"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2662,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: record.classCourse || "—"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2663,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: record.classStudent || "—"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2664,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: record.birthDate || "—"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2665,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                        className: "px-4 py-3",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            type: "button",
                                                                            onClick: ()=>printMiniExamSlip(record, activeSession),
                                                                            className: "app-btn-primary text-sm",
                                                                            children: isVi ? "In phiếu mini" : "Print mini slip"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2667,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2666,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, record.id, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2657,
                                                                columnNumber: 25
                                                            }, this))
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2655,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2636,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2635,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-3 text-xs app-text-muted",
                                            children: isVi ? "Sinh viên chỉ hiển thị trong modal chi tiết phiên thi. Đây là cách trình bày đúng và sạch hơn cho dữ liệu nhiều sinh viên." : "Student data is intentionally kept inside the session modal for cleaner presentation."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2681,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2621,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 2531,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 2507,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 2506,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 1630,
        columnNumber: 5
    }, this);
}
_s1(ExamsPage, "lN11UsWm5zjFvVfFw5jnVu7PAWY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c1 = ExamsPage;
var _c, _c1;
__turbopack_context__.k.register(_c, "SyncedHorizontalTable");
__turbopack_context__.k.register(_c1, "ExamsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_web_src_62ce0c62._.js.map