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
const IMPORT_NOTICE_BATCH_SIZE = 4;
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
function chunkArray(items, size) {
    if (size <= 0) return [
        items
    ];
    const result = [];
    for(let i = 0; i < items.length; i += size){
        result.push(items.slice(i, i + size));
    }
    return result;
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
        note: item.note,
        sheetName: item.sheetName ?? null,
        sheetIndex: item.sheetIndex ?? null,
        rowIndex: item.rowIndex ?? null,
        sessionOrder: item.sessionOrder ?? null,
        recordOrder: item.recordOrder ?? null
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
        sheetName: record.sheetName ?? null,
        sheetIndex: record.sheetIndex ?? null,
        rowIndex: record.rowIndex ?? null,
        sessionOrder: record.sessionOrder ?? null,
        recordOrder: record.recordOrder ?? null,
        parseStatus: "parsed",
        rawRow: undefined
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
                sourceText: null,
                courseCodeHint: notice.courseCode || null,
                courseNameHint: notice.courseName || null,
                detailUrl: notice.detailUrl,
                attachmentUrl: notice.attachmentUrl || null,
                attachmentName: notice.attachmentName || null,
                publishedAtRaw: notice.publishedAt?.raw || null,
                publishedAt: notice.publishedAt?.date || null,
                planType: notice.planType || "official",
                parseStatus: "parsed",
                detailText: null,
                parseError: notice.detailError || notice.attachmentError || null,
                records: (parsedByNotice[index] || []).map(mapParsedRecordToImportRecord)
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
async function importSingleExamBatch(body) {
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
async function importExamsToDb(body) {
    const noticeChunks = chunkArray(body.notices || [], IMPORT_NOTICE_BATCH_SIZE);
    let noticesUpserted = 0;
    let recordsUpserted = 0;
    let lastImportId;
    for (const notices of noticeChunks){
        const chunkBody = {
            ...body,
            notices
        };
        const result = await importSingleExamBatch(chunkBody);
        noticesUpserted += Number(result.noticesUpserted || 0);
        recordsUpserted += Number(result.recordsUpserted || 0);
        if (result.importId) {
            lastImportId = result.importId;
        }
    }
    return {
        ok: true,
        importId: lastImportId,
        noticesUpserted,
        recordsUpserted
    };
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
"[project]/apps/web/src/lib/exams/exporters.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "exportExamCsv",
    ()=>exportExamCsv,
    "exportExamSessionWorkbook",
    ()=>exportExamSessionWorkbook,
    "exportExamWorkbook",
    ()=>exportExamWorkbook,
    "openPrintableExamSlip",
    ()=>openPrintableExamSlip
]);
"use client";
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
function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
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
            records: items.slice()
        };
    }).sort((a, b)=>{
        const av = `${a.examDate || "9999-12-31"} ${a.startTime || "23:59"} ${a.courseCode || ""}`;
        const bv = `${b.examDate || "9999-12-31"} ${b.startTime || "23:59"} ${b.courseCode || ""}`;
        return av.localeCompare(bv);
    });
}
function buildStudentRows(records, isVi) {
    return records.map((record)=>({
            [isVi ? "Loại lịch" : "Plan type"]: record.planType === "official" ? isVi ? "Chính thức" : "Official" : isVi ? "Dự kiến" : "Tentative",
            [isVi ? "Mã môn" : "Course code"]: record.courseCode || "",
            [isVi ? "Tên môn" : "Course name"]: record.courseName || "",
            [isVi ? "Ngày thi" : "Exam date"]: record.examDate || "",
            [isVi ? "Giờ bắt đầu" : "Start time"]: record.startTime || "",
            [isVi ? "Giờ kết thúc" : "End time"]: record.endTime || "",
            [isVi ? "Phòng" : "Room"]: sanitizeVisualText(record.room),
            [isVi ? "Cơ sở" : "Campus"]: sanitizeVisualText(record.campus),
            MSSV: record.studentId || "",
            [isVi ? "Họ tên" : "Student name"]: record.studentName || "",
            [isVi ? "Lớp môn học" : "Course class"]: record.classCourse || "",
            [isVi ? "Lớp sinh hoạt" : "Student class"]: record.classStudent || "",
            [isVi ? "Ngày sinh" : "Birth date"]: record.birthDate || "",
            [isVi ? "Thông báo" : "Notice"]: record.noticeTitle || "",
            [isVi ? "Nguồn đăng" : "Published at"]: record.publishedAtRaw || "",
            [isVi ? "Tệp lịch thi" : "Attachment"]: record.attachmentName || "",
            [isVi ? "URL chi tiết" : "Detail URL"]: record.detailUrl || "",
            [isVi ? "URL tệp" : "Attachment URL"]: record.attachmentUrl || "",
            [isVi ? "Thông tin ca thi" : "Exam session info"]: sanitizeExamMeta(record.examMetaRaw),
            [isVi ? "Ghi chú" : "Note"]: record.note || ""
        }));
}
function buildSessionRows(sessions, isVi) {
    return sessions.map((session)=>({
            [isVi ? "Loại lịch" : "Plan type"]: session.planType === "official" ? isVi ? "Chính thức" : "Official" : isVi ? "Dự kiến" : "Tentative",
            [isVi ? "Mã môn" : "Course code"]: session.courseCode || "",
            [isVi ? "Tên môn" : "Course name"]: session.courseName || "",
            [isVi ? "Ngày thi" : "Exam date"]: session.examDate || "",
            [isVi ? "Giờ bắt đầu" : "Start time"]: session.startTime || "",
            [isVi ? "Giờ kết thúc" : "End time"]: session.endTime || "",
            [isVi ? "Phòng" : "Room"]: sanitizeVisualText(session.room),
            [isVi ? "Cơ sở" : "Campus"]: sanitizeVisualText(session.campus),
            [isVi ? "Sinh viên" : "Students"]: session.studentCount,
            [isVi ? "Số lớp môn học" : "Course classes"]: session.classCourseCount,
            [isVi ? "Số lớp sinh hoạt" : "Student classes"]: session.classStudentCount,
            [isVi ? "Thông tin ca thi" : "Exam session info"]: sanitizeExamMeta(session.examMetaRaw),
            [isVi ? "Thông báo" : "Notice"]: session.noticeTitle || "",
            [isVi ? "Nguồn đăng" : "Published at"]: session.publishedAtRaw || "",
            [isVi ? "Tệp lịch thi" : "Attachment"]: session.attachmentName || "",
            [isVi ? "URL chi tiết" : "Detail URL"]: session.detailUrl || "",
            [isVi ? "URL tệp" : "Attachment URL"]: session.attachmentUrl || ""
        }));
}
function buildOverviewRows(records, sessions, isVi, locale) {
    const official = records.filter((r)=>r.planType === "official").length;
    const tentative = records.filter((r)=>r.planType === "tentative").length;
    const uniqueCourses = new Set(records.map((r)=>r.courseCode).filter(Boolean)).size;
    const uniqueStudents = new Set(records.map((r)=>r.studentId).filter(Boolean)).size;
    const uniqueDays = new Set(records.map((r)=>r.examDate).filter(Boolean)).size;
    return [
        {
            [isVi ? "Chỉ số" : "Metric"]: isVi ? "Tổng bản ghi sinh viên" : "Total student rows",
            [isVi ? "Giá trị" : "Value"]: records.length
        },
        {
            [isVi ? "Chỉ số" : "Metric"]: isVi ? "Tổng phiên thi" : "Total sessions",
            [isVi ? "Giá trị" : "Value"]: sessions.length
        },
        {
            [isVi ? "Chỉ số" : "Metric"]: isVi ? "Lịch chính thức" : "Official rows",
            [isVi ? "Giá trị" : "Value"]: official
        },
        {
            [isVi ? "Chỉ số" : "Metric"]: isVi ? "Lịch dự kiến" : "Tentative rows",
            [isVi ? "Giá trị" : "Value"]: tentative
        },
        {
            [isVi ? "Chỉ số" : "Metric"]: isVi ? "Số môn học" : "Unique courses",
            [isVi ? "Giá trị" : "Value"]: uniqueCourses
        },
        {
            [isVi ? "Chỉ số" : "Metric"]: isVi ? "Số sinh viên" : "Unique students",
            [isVi ? "Giá trị" : "Value"]: uniqueStudents
        },
        {
            [isVi ? "Chỉ số" : "Metric"]: isVi ? "Số ngày thi" : "Unique exam days",
            [isVi ? "Giá trị" : "Value"]: uniqueDays
        },
        {
            [isVi ? "Chỉ số" : "Metric"]: isVi ? "Xuất lúc" : "Exported at",
            [isVi ? "Giá trị" : "Value"]: new Date().toLocaleString(locale)
        }
    ];
}
function getColumnWidths(rows) {
    const headers = Object.keys(rows[0] || {});
    return headers.map((header)=>{
        const maxContent = Math.max(header.length, ...rows.map((row)=>String(row[header] ?? "").length));
        return {
            wch: Math.min(Math.max(maxContent + 2, 14), 42)
        };
    });
}
function applyAutoFilter(XLSX, ws, rowCount, colCount) {
    ws["!autofilter"] = {
        ref: XLSX.utils.encode_range({
            s: {
                r: 0,
                c: 0
            },
            e: {
                r: Math.max(rowCount, 1),
                c: Math.max(colCount - 1, 0)
            }
        })
    };
}
function downloadWorkbook(XLSX, wb, filename) {
    XLSX.writeFile(wb, filename);
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
async function exportExamWorkbook(records, locale, options) {
    const XLSX = await __turbopack_context__.A("[project]/node_modules/.pnpm/xlsx@0.18.5/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript, async loader)");
    const isVi = options?.isVi ?? locale.startsWith("vi");
    const sessions = buildSessionSummaries(records);
    const studentRows = buildStudentRows(records, isVi);
    const sessionRows = buildSessionRows(sessions, isVi);
    const overviewRows = buildOverviewRows(records, sessions, isVi, locale);
    const wb = XLSX.utils.book_new();
    const wsStudents = XLSX.utils.json_to_sheet(studentRows);
    const wsSessions = XLSX.utils.json_to_sheet(sessionRows);
    const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
    wsStudents["!cols"] = getColumnWidths(studentRows);
    wsSessions["!cols"] = getColumnWidths(sessionRows);
    wsOverview["!cols"] = getColumnWidths(overviewRows);
    applyAutoFilter(XLSX, wsStudents, studentRows.length, Object.keys(studentRows[0] || {}).length);
    applyAutoFilter(XLSX, wsSessions, sessionRows.length, Object.keys(sessionRows[0] || {}).length);
    applyAutoFilter(XLSX, wsOverview, overviewRows.length, Object.keys(overviewRows[0] || {}).length);
    XLSX.utils.book_append_sheet(wb, wsStudents, isVi ? "Danh_sach_sinh_vien" : "Student_List");
    XLSX.utils.book_append_sheet(wb, wsSessions, isVi ? "Phien_thi" : "Sessions");
    XLSX.utils.book_append_sheet(wb, wsOverview, isVi ? "Tong_quan" : "Overview");
    const fileDate = new Date().toLocaleDateString(locale).replace(/[^\d]+/g, "-");
    const prefix = options?.filePrefix || (isVi ? "bao-cao-lich-thi" : "exam-report");
    downloadWorkbook(XLSX, wb, `${prefix}-${fileDate}.xlsx`);
}
async function exportExamSessionWorkbook(session, locale, options) {
    const XLSX = await __turbopack_context__.A("[project]/node_modules/.pnpm/xlsx@0.18.5/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript, async loader)");
    const isVi = options?.isVi ?? locale.startsWith("vi");
    const studentRows = buildStudentRows(session.records, isVi);
    const sessionInfoRows = [
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Mã môn" : "Course code",
            [isVi ? "Giá trị" : "Value"]: session.courseCode || ""
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Tên môn" : "Course name",
            [isVi ? "Giá trị" : "Value"]: session.courseName || ""
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Loại lịch" : "Plan type",
            [isVi ? "Giá trị" : "Value"]: session.planType === "official" ? isVi ? "Chính thức" : "Official" : isVi ? "Dự kiến" : "Tentative"
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Ngày thi" : "Exam date",
            [isVi ? "Giá trị" : "Value"]: session.examDate || ""
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Giờ bắt đầu" : "Start time",
            [isVi ? "Giá trị" : "Value"]: session.startTime || ""
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Giờ kết thúc" : "End time",
            [isVi ? "Giá trị" : "Value"]: session.endTime || ""
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Phòng" : "Room",
            [isVi ? "Giá trị" : "Value"]: sanitizeVisualText(session.room)
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Cơ sở" : "Campus",
            [isVi ? "Giá trị" : "Value"]: sanitizeVisualText(session.campus)
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Sinh viên" : "Students",
            [isVi ? "Giá trị" : "Value"]: session.studentCount
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Thông tin ca thi" : "Exam session info",
            [isVi ? "Giá trị" : "Value"]: sanitizeExamMeta(session.examMetaRaw)
        },
        {
            [isVi ? "Trường" : "Field"]: isVi ? "Thông báo" : "Notice",
            [isVi ? "Giá trị" : "Value"]: session.noticeTitle || ""
        }
    ];
    const wb = XLSX.utils.book_new();
    const wsStudents = XLSX.utils.json_to_sheet(studentRows);
    const wsInfo = XLSX.utils.json_to_sheet(sessionInfoRows);
    wsStudents["!cols"] = getColumnWidths(studentRows);
    wsInfo["!cols"] = getColumnWidths(sessionInfoRows);
    applyAutoFilter(XLSX, wsStudents, studentRows.length, Object.keys(studentRows[0] || {}).length);
    applyAutoFilter(XLSX, wsInfo, sessionInfoRows.length, Object.keys(sessionInfoRows[0] || {}).length);
    XLSX.utils.book_append_sheet(wb, wsStudents, isVi ? "Danh_sach_sinh_vien" : "Student_List");
    XLSX.utils.book_append_sheet(wb, wsInfo, isVi ? "Thong_tin_ca_thi" : "Session_Info");
    const fileDate = new Date().toLocaleDateString(locale).replace(/[^\d]+/g, "-");
    const safeCode = sanitizeVisualText(session.courseCode || "ca-thi").replace(/[^\w-]+/g, "-");
    const prefix = options?.filePrefix || (isVi ? "ds-ca-thi" : "session-list");
    downloadWorkbook(XLSX, wb, `${prefix}-${safeCode}-${fileDate}.xlsx`);
}
function openPrintableExamSlip({ record, session, locale, isVi }) {
    const title = isVi ? "Phiếu thông tin dự thi cá nhân" : "Personal exam information slip";
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
            ${escapeHtml(isVi ? "Biểu mẫu cá nhân để tra cứu / in nhanh thông tin dự thi." : "Personal form for quick lookup / printing.")}
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
        ${escapeHtml(isVi ? "Biểu mẫu này dùng để tra cứu và in nhanh cho cá nhân, không thay thế thông báo chính thức của nhà trường." : "This form is for quick lookup and printing only and does not replace the official school notice.")}
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
    if (!printWindow) return false;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    return true;
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

__turbopack_context__.s([
    "parseWorkbookFromNotice",
    ()=>parseWorkbookFromNotice
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$xlsx$40$0$2e$18$2e$5$2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/xlsx@0.18.5/node_modules/xlsx/xlsx.mjs [app-client] (ecmascript)");
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("apps/web/src/lib/exams/parseWorkbook.ts")}`;
    }
};
;
function normalizeSpace(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
}
function cleanVisualSeparators(value) {
    return normalizeSpace(value).replace(/\|{2,}/g, " | ").replace(/\s*\|\s*\|\s*/g, " | ").replace(/\s*\|\s*/g, " | ").replace(/\s{2,}/g, " ").trim();
}
function makeId(parts) {
    return parts.map((p)=>normalizeSpace(p ?? "")).join("||");
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
    const match = raw.match(/MÔN\s*:\s*(.+?)\s*\*?\s*SỐ\s*TÍN\s*CHỈ\s*:\s*(\d+)?\s*MÃ\s*MÔN\s*:\s*([A-Z0-9\s-]+)/i);
    if (match) {
        return {
            courseName: normalizeSpace(match[1]) || null,
            courseCode: normalizeSpace(match[3]) || ""
        };
    }
    const fallback = raw.match(/MÔN\s*:\s*(.+?)\s*MÃ\s*MÔN\s*:\s*([A-Z0-9\s-]+)/i);
    if (fallback) {
        return {
            courseName: normalizeSpace(fallback[1]) || null,
            courseCode: normalizeSpace(fallback[2]) || ""
        };
    }
    return {
        courseName: null,
        courseCode: ""
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
    const timeMatch = raw.match(/Thời\s*gian\s*:\s*([0-9]{1,2}[:hH][0-9]{2})/i) || null;
    const dateMatch = raw.match(/(\d{2}\/\d{2}\/\d{4})/);
    const roomMatch = raw.match(/Phòng\s*:\s*([^|]+?)(?:\s{2,}|$)/i) || raw.match(/Phòng\s*:\s*(.+)$/i);
    const attemptMatch = raw.match(/Lần\s*thi\s*:\s*(\d+)/i);
    let roomRaw = normalizeSpace(roomMatch?.[1] || "");
    let campus = null;
    if (roomRaw.includes("-")) {
        const parts = roomRaw.split(/\s*-\s*/);
        if (parts.length >= 2) {
            roomRaw = normalizeSpace(parts[0]);
            campus = normalizeSpace(parts.slice(1).join(" - ")) || null;
        }
    }
    const normalizedTime = String(timeMatch?.[1] || "").replace(/[Hh]/g, ":");
    const m = normalizedTime.match(/(\d{1,2}):(\d{2})/);
    const startTime = m ? `${String(m[1]).padStart(2, "0")}:${m[2]}` : null;
    const datePart = dateMatch?.[1] || null;
    const examDate = parseDdMmYyyy(datePart);
    return {
        examDate,
        startTime,
        endTime: null,
        room: roomRaw || null,
        campus,
        raw: buildMetaRaw({
            startTime,
            datePart,
            room: roomRaw || null,
            campus,
            attempt: attemptMatch?.[1] || null
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
        if (s === "msv" || s === "ma sv") indexes.studentId = index;
        if (s === "ho va") indexes.hoVa = index;
        if (s === "ten") indexes.ten = index;
        if (s.includes("ho ten")) indexes.fullName = index;
        if (s.includes("lop hoc phan") || s.includes("lop mon hoc")) {
            indexes.classCourse = index;
        }
        if (s.includes("lop sh") || s.includes("lop sinh hoat")) {
            indexes.classStudent = index;
        }
        if (s.includes("ngay sinh")) indexes.birthDate = index;
        if (s.includes("ghi chu")) indexes.note = index;
    });
    return indexes;
}
function isHeaderRow(row) {
    const joined = normalizeSearch(row.join(" | "));
    return (joined.includes("msv") || joined.includes("ma sv")) && (joined.includes("ho va") || joined.includes("ho ten"));
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
function getAttachmentKind(notice) {
    const mime = String(notice.attachmentMimeType || "").toLowerCase();
    const name = String(notice.attachmentName || notice.attachmentUrl || "").toLowerCase();
    if (mime.includes("spreadsheet") || mime.includes("excel")) return "excel";
    if (mime.includes("pdf")) return "pdf";
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
    if (name.endsWith(".pdf")) return "pdf";
    return "unknown";
}
function uint8FromBase64(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for(let i = 0; i < binary.length; i += 1){
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
let pdfJsPromise = null;
async function getPdfJs() {
    if (!pdfJsPromise) {
        pdfJsPromise = __turbopack_context__.A("[project]/node_modules/.pnpm/pdfjs-dist@5.5.207/node_modules/pdfjs-dist/legacy/build/pdf.mjs [app-client] (ecmascript, async loader)").then((pdfjs)=>{
            if (!pdfjs.GlobalWorkerOptions.workerSrc) {
                pdfjs.GlobalWorkerOptions.workerSrc = new __turbopack_context__.U(__turbopack_context__.r("[project]/node_modules/.pnpm/pdfjs-dist@5.5.207/node_modules/pdfjs-dist/build/pdf.worker.min.mjs (static in ecmascript)")).toString();
            }
            return pdfjs;
        });
    }
    return pdfJsPromise;
}
async function extractPdfLines(base64) {
    const pdfjs = await getPdfJs();
    const data = uint8FromBase64(base64);
    const doc = await pdfjs.getDocument({
        data,
        useWorkerFetch: false,
        isEvalSupported: false,
        disableFontFace: true
    }).promise;
    const lines = [];
    for(let pageNo = 1; pageNo <= doc.numPages; pageNo += 1){
        const page = await doc.getPage(pageNo);
        const textContent = await page.getTextContent();
        const buckets = new Map();
        for (const item of textContent.items){
            const str = normalizeSpace(item?.str || "");
            if (!str) continue;
            const y = Math.round(item.transform?.[5] || 0);
            if (!buckets.has(y)) buckets.set(y, []);
            buckets.get(y).push(str);
        }
        const sorted = Array.from(buckets.entries()).sort((a, b)=>b[0] - a[0]);
        for (const [, parts] of sorted){
            const line = normalizeSpace(parts.join(" "));
            if (line) lines.push(line);
        }
    }
    return lines;
}
function parsePdfStudentLine(line, context) {
    const normalized = normalizeSpace(line);
    if (!/^\d+\s+\d{6,}/.test(normalized)) return null;
    const sttAndId = normalized.match(/^(\d+)\s+(\d{6,})\s+(.+)$/);
    if (!sttAndId) return null;
    const studentId = sttAndId[2];
    const rest = sttAndId[3];
    const courseCodePattern = context.courseCode ? context.courseCode.replace(/\s+/g, "\\s+") : "";
    let classCourse = null;
    let classStudent = null;
    let studentName = null;
    if (courseCodePattern) {
        const re = new RegExp(`^(.+?)\\s+(${courseCodePattern}\\s+\\S+)\\s+([A-Za-z0-9-]+)$`, "i");
        const m = rest.match(re);
        if (m) {
            studentName = normalizeSpace(m[1]) || null;
            classCourse = normalizeSpace(m[2]) || null;
            classStudent = normalizeSpace(m[3]) || null;
        }
    }
    if (!studentName) {
        const fallback = rest.split(/\s+/);
        if (fallback.length >= 3) {
            classStudent = fallback[fallback.length - 1] || null;
            studentName = normalizeSpace(fallback.slice(0, fallback.length - 1).join(" ")) || null;
        } else {
            studentName = rest || null;
        }
    }
    return {
        id: makeId([
            context.notice.detailUrl,
            context.courseCode,
            context.sessionMeta.examDate,
            context.sessionMeta.startTime,
            context.sessionMeta.room,
            studentId,
            context.sheetIndex,
            context.rowIndex
        ]),
        noticeTitle: context.notice.title,
        planType: context.notice.planType || detectPlanType(context.notice.title),
        publishedAtRaw: context.notice.publishedAt?.raw || null,
        publishedAtDate: context.notice.publishedAt?.date ? parseDdMmYyyy(context.notice.publishedAt.date) : null,
        detailUrl: context.notice.detailUrl,
        attachmentUrl: context.notice.attachmentUrl,
        attachmentName: context.notice.attachmentName || null,
        courseCode: context.courseCode || context.notice.courseCode || "",
        courseName: context.courseName || context.notice.courseName || null,
        examDate: context.sessionMeta.examDate,
        startTime: context.sessionMeta.startTime,
        endTime: context.sessionMeta.endTime,
        room: context.sessionMeta.room,
        campus: context.sessionMeta.campus,
        examMetaRaw: context.sessionMeta.raw,
        studentId,
        studentName,
        classCourse,
        classStudent,
        birthDate: null,
        note: null,
        sheetName: "PDF",
        sheetIndex: context.sheetIndex,
        rowIndex: context.rowIndex,
        sessionOrder: context.sessionOrder,
        recordOrder: context.recordOrder
    };
}
async function parsePdfNotice(notice) {
    if (!notice.attachmentBase64) return [];
    const lines = await extractPdfLines(notice.attachmentBase64);
    let currentCourseCode = notice.courseCode || "";
    let currentCourseName = notice.courseName || null;
    let currentMeta = {
        examDate: null,
        startTime: null,
        endTime: null,
        room: null,
        campus: null,
        raw: null
    };
    let sessionOrder = -1;
    let recordOrder = 0;
    const records = [];
    for(let i = 0; i < lines.length; i += 1){
        const line = lines[i];
        const search = normalizeSearch(line);
        if (search.includes("mon:") || search.includes("ma mon") || search.includes("mon") && search.includes("hk")) {
            const meta = extractCourseMeta(line);
            if (meta.courseCode) currentCourseCode = meta.courseCode;
            if (meta.courseName) currentCourseName = meta.courseName;
        }
        if (search.includes("thoi gian") && search.includes("phong")) {
            currentMeta = extractExamSessionMeta(line);
            sessionOrder += 1;
            continue;
        }
        if (search.includes("ma sv") && search.includes("lop hoc phan")) {
            continue;
        }
        const row = parsePdfStudentLine(line, {
            courseCode: currentCourseCode,
            sessionMeta: currentMeta,
            notice,
            courseName: currentCourseName,
            rowIndex: i,
            recordOrder,
            sessionOrder,
            sheetIndex: 0
        });
        if (row) {
            records.push(row);
            recordOrder += 1;
        }
    }
    return records;
}
function parseExcelNotice(notice) {
    if (!notice.attachmentBase64) return [];
    const workbook = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$xlsx$40$0$2e$18$2e$5$2f$node_modules$2f$xlsx$2f$xlsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["read"](notice.attachmentBase64, {
        type: "base64"
    });
    const records = [];
    let globalRecordOrder = 0;
    workbook.SheetNames.forEach((sheetName, sheetIndex)=>{
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
        let sessionOrder = -1;
        rows.forEach((row, rowIndex)=>{
            const joined = cleanVisualSeparators(row.join(" | "));
            const joinedSearch = normalizeSearch(joined);
            if (!joined) return;
            if (joinedSearch.includes("ma mon") && joinedSearch.includes("mon")) {
                const meta = extractCourseMeta(joined);
                currentCourseName = meta.courseName;
                if (meta.courseCode) currentCourseCode = meta.courseCode;
                return;
            }
            if (joinedSearch.includes("thoi gian") && (joinedSearch.includes("ngay") || joinedSearch.includes("phong"))) {
                currentExamMeta = extractExamSessionMeta(joined);
                sessionOrder += 1;
                return;
            }
            if (isHeaderRow(row)) {
                headerIndexes = getHeaderIndexes(row);
                return;
            }
            if (!isLikelyDataRow(row, headerIndexes)) return;
            const studentId = headerIndexes.studentId >= 0 ? normalizeSpace(row[headerIndexes.studentId]) || null : null;
            const studentName = combineStudentName(row, headerIndexes);
            const classCourse = headerIndexes.classCourse >= 0 ? normalizeSpace(row[headerIndexes.classCourse]) || null : null;
            const classStudent = headerIndexes.classStudent >= 0 ? normalizeSpace(row[headerIndexes.classStudent]) || null : null;
            const birthDate = headerIndexes.birthDate >= 0 ? normalizeSpace(row[headerIndexes.birthDate]) || null : null;
            const note = headerIndexes.note >= 0 ? cleanVisualSeparators(row[headerIndexes.note]) || null : null;
            records.push({
                id: makeId([
                    notice.detailUrl,
                    currentCourseCode,
                    currentExamMeta.examDate,
                    currentExamMeta.startTime,
                    currentExamMeta.room,
                    studentId,
                    sheetIndex,
                    rowIndex
                ]),
                noticeTitle: notice.title,
                planType: notice.planType || detectPlanType(notice.title),
                publishedAtRaw: notice.publishedAt?.raw || null,
                publishedAtDate: notice.publishedAt?.date ? parseDdMmYyyy(notice.publishedAt.date) : null,
                detailUrl: notice.detailUrl,
                attachmentUrl: notice.attachmentUrl,
                attachmentName: notice.attachmentName || null,
                courseCode: currentCourseCode || notice.courseCode || "",
                courseName: currentCourseName || notice.courseName || null,
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
                note,
                sheetName,
                sheetIndex,
                rowIndex,
                sessionOrder,
                recordOrder: globalRecordOrder++
            });
        });
    });
    return records;
}
async function parseWorkbookFromNotice(notice) {
    if (!notice.attachmentBase64) return [];
    const kind = getAttachmentKind(notice);
    if (kind === "pdf") {
        return await parsePdfNotice(notice);
    }
    return parseExcelNotice(notice);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/web/src/lib/exams/sessionUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildSessionSummaries",
    ()=>buildSessionSummaries,
    "formatDate",
    ()=>formatDate,
    "formatDateTime",
    ()=>formatDateTime,
    "getCountdownLabel",
    ()=>getCountdownLabel,
    "getDayDiff",
    ()=>getDayDiff,
    "getStatusTone",
    ()=>getStatusTone,
    "sanitizeExamMeta",
    ()=>sanitizeExamMeta,
    "sanitizeVisualText",
    ()=>sanitizeVisualText
]);
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
function buildSessionSummaries(records) {
    const map = new Map();
    for (const record of records){
        const key = [
            record.sheetIndex ?? "",
            record.sessionOrder ?? "",
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
        const sortedItems = items.slice().sort((a, b)=>{
            const sa = a.sheetIndex ?? 999999;
            const sb = b.sheetIndex ?? 999999;
            if (sa !== sb) return sa - sb;
            const xa = a.sessionOrder ?? 999999;
            const xb = b.sessionOrder ?? 999999;
            if (xa !== xb) return xa - xb;
            const ra = a.rowIndex ?? 999999;
            const rb = b.rowIndex ?? 999999;
            if (ra !== rb) return ra - rb;
            const oa = a.recordOrder ?? 999999;
            const ob = b.recordOrder ?? 999999;
            return oa - ob;
        });
        const first = sortedItems[0];
        return {
            id: [
                first.planType,
                first.courseCode,
                first.examDate,
                first.startTime,
                first.room,
                first.campus,
                first.sheetIndex ?? "",
                first.sessionOrder ?? ""
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
            studentCount: new Set(sortedItems.map((x)=>x.studentId).filter(Boolean)).size || sortedItems.length,
            classCourseCount: new Set(sortedItems.map((x)=>x.classCourse).filter(Boolean)).size,
            classStudentCount: new Set(sortedItems.map((x)=>x.classStudent).filter(Boolean)).size,
            records: sortedItems,
            sheetIndex: first.sheetIndex,
            sessionOrder: first.sessionOrder,
            firstRowIndex: first.rowIndex,
            firstRecordOrder: first.recordOrder
        };
    }).sort((a, b)=>{
        const sa = a.sheetIndex ?? 999999;
        const sb = b.sheetIndex ?? 999999;
        if (sa !== sb) return sa - sb;
        const xa = a.sessionOrder ?? 999999;
        const xb = b.sessionOrder ?? 999999;
        if (xa !== xb) return xa - xb;
        const ra = a.firstRowIndex ?? 999999;
        const rb = b.firstRowIndex ?? 999999;
        if (ra !== rb) return ra - rb;
        const oa = a.firstRecordOrder ?? 999999;
        const ob = b.firstRecordOrder ?? 999999;
        return oa - ob;
    });
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
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
"[project]/apps/web/src/app/(app)/exams/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ExamsPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$styled$2d$jsx$40$5$2e$1$2e$6_react$40$19$2e$2$2e$4$2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/styled-jsx@5.1.6_react@19.2.4/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$cache$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/cache.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$exporters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/exporters.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/notify.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$parseWorkbook$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/parseWorkbook.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/exams/sessionUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/extensionBridge.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
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
;
;
;
;
const BTN_NEUTRAL = "inline-flex h-11 items-center justify-center rounded-2xl border border-[#cfd8e6] bg-white px-4 text-sm font-bold text-[#0f172a] shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-[1px] hover:border-[#b8c4d8] hover:bg-[#f8fbff]";
const BTN_SOFT_INFO = "inline-flex h-11 items-center justify-center rounded-2xl border border-[#bfd3ff] bg-[#edf4ff] px-4 text-sm font-bold text-[#1d4ed8] shadow-[0_10px_24px_rgba(37,99,235,0.10)] transition hover:-translate-y-[1px] hover:bg-[#e3efff]";
const BTN_SOFT_SUCCESS = "inline-flex h-11 items-center justify-center rounded-2xl border border-[#b7ead9] bg-[#ecfdf5] px-4 text-sm font-bold text-[#047857] shadow-[0_10px_24px_rgba(5,150,105,0.10)] transition hover:-translate-y-[1px] hover:bg-[#dff8ee]";
const BTN_SOFT_WARNING = "inline-flex h-11 items-center justify-center rounded-2xl border border-[#f5d7a6] bg-[#fff7e8] px-4 text-sm font-bold text-[#b45309] shadow-[0_10px_24px_rgba(217,119,6,0.10)] transition hover:-translate-y-[1px] hover:bg-[#fff1d6]";
const BTN_PRIMARY = "inline-flex h-11 items-center justify-center rounded-2xl border border-transparent bg-[linear-gradient(180deg,#5b95ff_0%,#2563eb_100%)] px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition hover:-translate-y-[1px] hover:brightness-105";
const BTN_PRIMARY_ACTIVE = "inline-flex h-11 items-center justify-center rounded-2xl border border-transparent bg-[linear-gradient(180deg,#6ea3ff_0%,#3b82f6_100%)] px-4 text-sm font-bold text-white shadow-[0_16px_34px_rgba(59,130,246,0.28)] transition";
const BTN_DANGER = "inline-flex h-11 items-center justify-center rounded-2xl border border-transparent bg-[linear-gradient(180deg,#ef4444_0%,#dc2626_100%)] px-4 text-sm font-bold text-white shadow-[0_14px_30px_rgba(239,68,68,0.22)] transition hover:-translate-y-[1px] hover:brightness-105";
const BTN_DETAIL_LINK = "inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border-main)] bg-[rgba(255,255,255,0.035)] px-4 text-sm font-bold text-[var(--text-main)] shadow-[0_8px_20px_rgba(2,8,23,0.16)] transition hover:-translate-y-[1px] hover:border-[var(--border-strong)] hover:bg-[rgba(255,255,255,0.06)]";
const BTN_DOWNLOAD_LINK = "inline-flex h-10 items-center justify-center rounded-xl border border-[var(--accent)]/18 bg-[var(--accent)]/10 px-4 text-sm font-bold text-[var(--accent)] shadow-[0_8px_20px_rgba(59,130,246,0.14)] transition hover:-translate-y-[1px] hover:bg-[var(--accent)]/14";
const EXAM_NOTIFY_ENABLED_KEY = "exam-notify-enabled";
function ActionHint({ title, items }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
        className: "group rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                className: "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-[12px] font-bold uppercase tracking-[0.04em] text-[var(--text-soft)]",
                                children: title || "Quick guide"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-1 text-xs text-[var(--text-muted)]",
                                children: [
                                    items.length,
                                    " ",
                                    items.length === 1 ? "item" : "items"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 121,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 117,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] text-[var(--text-muted)] transition group-open:rotate-180",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChevronDownIcon, {}, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 127,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 116,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-t border-[var(--border-main)] px-4 py-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
                    children: items.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] px-4 py-3 text-[13px] leading-5 text-[var(--text-muted)] shadow-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mb-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--accent)]/12 px-2 text-[11px] font-bold text-[var(--accent)]",
                                    children: String(index + 1).padStart(2, "0")
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 138,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: item
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 141,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, `${title || "hint"}-${index}`, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 134,
                            columnNumber: 13
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 132,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 131,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 115,
        columnNumber: 5
    }, this);
}
_c = ActionHint;
function SectionTitle({ title, subtitle }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[1.05rem] font-bold text-[var(--text-main)]",
                children: title
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            subtitle ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-1 text-sm text-[var(--text-muted)]",
                children: subtitle
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 163,
                columnNumber: 9
            }, this) : null
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 158,
        columnNumber: 5
    }, this);
}
_c1 = SectionTitle;
function groupSessionRecordsByClass(records) {
    const map = new Map();
    for (const record of records){
        const classCourse = record.classCourse || "—";
        const key = classCourse;
        if (!map.has(key)) {
            map.set(key, {
                classCourse,
                classStudentSample: record.classStudent || null,
                count: 0,
                records: []
            });
        }
        const item = map.get(key);
        item.count += 1;
        if (!item.classStudentSample && record.classStudent) {
            item.classStudentSample = record.classStudent;
        }
        item.records.push(record);
    }
    return Array.from(map.values()).sort((a, b)=>b.count - a.count || a.classCourse.localeCompare(b.classCourse));
}
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
function compareDateTimeAsc(a, b) {
    const av = `${a.examDate || "9999-12-31"} ${a.startTime || "23:59"}`;
    const bv = `${b.examDate || "9999-12-31"} ${b.startTime || "23:59"}`;
    return av.localeCompare(bv);
}
function compareDateTimeDesc(a, b) {
    return compareDateTimeAsc(b, a);
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
    ].map(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"]).map(normalizeText);
    const compactHaystacks = [
        record.courseCode,
        record.studentId,
        record.classCourse,
        record.classStudent,
        record.room,
        record.campus
    ].map(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"]).map(normalizeCompact);
    return {
        looseHaystacks,
        compactHaystacks
    };
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
        return isVi ? "Đồng bộ thất bại vì server xử lý quá lâu. Hãy thử lại." : "Sync failed because the server transaction timed out. Please try again.";
    }
    if (normalized.startsWith("<!doctype html") || normalized.startsWith("<html") || normalized.includes("this page could not be found") || normalized.includes("next-router-not-mounted") || normalized.includes("__next")) {
        return isVi ? "Đồng bộ thất bại do API trả về phản hồi không hợp lệ." : "Sync failed because the API returned an invalid response.";
    }
    return text || t("exams.sync.errors.unknown");
}
function buildRoomOptions(records) {
    return Array.from(new Set(records.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(x.room)).filter(Boolean))).sort((a, b)=>a.localeCompare(b));
}
function buildCampusOptions(records) {
    return Array.from(new Set(records.map((x)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(x.campus)).filter(Boolean))).sort((a, b)=>a.localeCompare(b));
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
function buildNoticeReportHref(detailUrl) {
    return `/exams/report?notice=${encodeURIComponent(detailUrl)}`;
}
function isUpcomingDate(dateValue) {
    if (!dateValue) return false;
    const today = new Date();
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const exam = new Date(`${dateValue}T00:00:00`).getTime();
    if (Number.isNaN(exam)) return false;
    return exam >= current;
}
function readExamNotifyEnabled() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        return window.localStorage.getItem(EXAM_NOTIFY_ENABLED_KEY) === "1";
    } catch  {
        return false;
    }
}
function writeExamNotifyEnabled(enabled) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        window.localStorage.setItem(EXAM_NOTIFY_ENABLED_KEY, enabled ? "1" : "0");
    } catch  {
    // ignore
    }
}
function SearchIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-4 w-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8.75 3.75A5 5 0 1 0 8.75 13.75A5 5 0 1 0 8.75 3.75Z",
                stroke: "currentColor",
                strokeWidth: "1.7"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 493,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M12.5 12.5L16.25 16.25",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 498,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 492,
        columnNumber: 5
    }, this);
}
_c2 = SearchIcon;
function LayersIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-4 w-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 3.75L16 7L10 10.25L4 7L10 3.75Z",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 511,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 10.25L10 13.5L16 10.25",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 517,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 13.5L10 16.25L16 13.5",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 523,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 510,
        columnNumber: 5
    }, this);
}
_c3 = LayersIcon;
function SortIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-4 w-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M6 4.5V15.5",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 536,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3.75 13.25L6 15.5L8.25 13.25",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 542,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M14 15.5V4.5",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 549,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M11.75 6.75L14 4.5L16.25 6.75",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 555,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 535,
        columnNumber: 5
    }, this);
}
_c4 = SortIcon;
function RoomIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-4 w-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4.5 16V6.5C4.5 5.4 5.4 4.5 6.5 4.5H13.5C14.6 4.5 15.5 5.4 15.5 6.5V16",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 569,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3.5 16H16.5",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 575,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8 8.25H12",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 581,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8 11H12",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 587,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 568,
        columnNumber: 5
    }, this);
}
_c5 = RoomIcon;
function CampusIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-4 w-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 16.25C10 16.25 14.25 12.2 14.25 8.75A4.25 4.25 0 1 0 5.75 8.75C5.75 12.2 10 16.25 10 16.25Z",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 600,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 10.5A1.75 1.75 0 1 0 10 7A1.75 1.75 0 1 0 10 10.5Z",
                stroke: "currentColor",
                strokeWidth: "1.7"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 606,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 599,
        columnNumber: 5
    }, this);
}
_c6 = CampusIcon;
function XIcon() {
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
            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
            lineNumber: 623,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 617,
        columnNumber: 5
    }, this);
}
_c7 = XIcon;
function ChevronDownIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-4 w-4",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M5 7.5L10 12.5L15 7.5",
            stroke: "currentColor",
            strokeWidth: "1.8",
            strokeLinecap: "round",
            strokeLinejoin: "round"
        }, void 0, false, {
            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
            lineNumber: 636,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 635,
        columnNumber: 5
    }, this);
}
_c8 = ChevronDownIcon;
function BellIcon() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 20 20",
        fill: "none",
        "aria-hidden": "true",
        className: "h-5 w-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 3.5A3.75 3.75 0 0 1 13.75 7.25V9.08C13.75 9.78 13.98 10.47 14.41 11.03L15.22 12.08C15.83 12.87 15.26 14 14.25 14H5.75C4.74 14 4.17 12.87 4.78 12.08L5.59 11.03C6.02 10.47 6.25 9.78 6.25 9.08V7.25A3.75 3.75 0 0 1 10 3.5Z",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 650,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M8.25 15.25C8.55 16.02 9.2 16.5 10 16.5C10.8 16.5 11.45 16.02 11.75 15.25",
                stroke: "currentColor",
                strokeWidth: "1.7",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 656,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 649,
        columnNumber: 5
    }, this);
}
_c9 = BellIcon;
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
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 669,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M7 10.2L8.9 12.1L13.1 7.9",
                stroke: "currentColor",
                strokeWidth: "1.9",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 674,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 668,
        columnNumber: 5
    }, this);
}
_c10 = CheckCircleIcon;
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
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 688,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 8.5V12",
                stroke: "currentColor",
                strokeWidth: "1.8",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 693,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 6.5H10.01",
                stroke: "currentColor",
                strokeWidth: "1.8",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 699,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 687,
        columnNumber: 5
    }, this);
}
_c11 = InfoIcon;
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
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 712,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 7.5V10.6",
                stroke: "currentColor",
                strokeWidth: "1.8",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 718,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M10 12.45H10.01",
                stroke: "currentColor",
                strokeWidth: "1.8",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 724,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 711,
        columnNumber: 5
    }, this);
}
_c12 = WarningIcon;
function SelectField({ id, label, value, onChange, options, icon, className = "" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `relative min-w-0 ${className}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: id,
                className: "sr-only",
                children: label
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 753,
                columnNumber: 7
            }, this),
            icon ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--text-muted)]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--bg-soft)]",
                    children: icon
                }, void 0, false, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 759,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 758,
                columnNumber: 9
            }, this) : null,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[var(--text-muted)]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChevronDownIcon, {}, void 0, false, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 766,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 765,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                id: id,
                value: value,
                onChange: (e)=>onChange(e.target.value),
                title: label,
                className: [
                    "h-14 w-full appearance-none rounded-[22px] border border-[var(--border-main)] bg-[var(--bg-card-strong)] pr-12 text-[15px] font-semibold text-[var(--text-main)] shadow-sm outline-none transition",
                    icon ? "pl-16" : "pl-5",
                    "hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[rgba(59,130,246,0.14)]"
                ].join(" "),
                children: options.map((option)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                        value: option.value,
                        children: option.label
                    }, `${id}-${option.value}`, false, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 781,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 769,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 752,
        columnNumber: 5
    }, this);
}
_c13 = SelectField;
function FilterChip({ label, onClear }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "inline-flex h-9 items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 text-xs font-medium text-[var(--accent)]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "max-w-[220px] truncate",
                children: label
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 799,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: onClear,
                className: "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)]/12 hover:bg-[var(--accent)]/18",
                "aria-label": `Clear ${label}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(XIcon, {}, void 0, false, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 806,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 800,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 798,
        columnNumber: 5
    }, this);
}
_c14 = FilterChip;
function SyncedHorizontalTable({ children, minWidthClassName = "min-w-[1280px]", stickyTop = "top-[98px] md:top-[106px]" }) {
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
                    className: "rounded-xl border border-[var(--border-main)] bg-[var(--bg-card-strong)]/98 px-3 py-2 shadow-lg backdrop-blur",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-1 flex items-center justify-between text-[11px] text-[var(--text-muted)]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Kéo ngang nhanh"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 906,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "↔"
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 907,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 905,
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
                                lineNumber: 915,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 910,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 904,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 903,
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
                    lineNumber: 932,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 927,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 901,
        columnNumber: 5
    }, this);
}
_s(SyncedHorizontalTable, "W3Se8x6QwlAJt8k0Mu1KjWt9GNQ=");
_c15 = SyncedHorizontalTable;
function DisplayModeBar({ isVi, onlyUpcoming, setOnlyUpcoming, groupMode, setGroupMode }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-[26px] border border-[var(--border-main)] bg-[var(--bg-soft)]/55 p-4 md:p-5",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-start xl:gap-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-w-0 xl:max-w-[220px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-[15px] font-bold text-[var(--text-main)]",
                            children: isVi ? "Chế độ hiển thị" : "Display mode"
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 957,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mt-1 text-sm text-[var(--text-muted)]",
                            children: isVi ? "Chọn cách xem nhanh dữ liệu và kiểu nhóm danh sách thi." : "Choose how exam data should be displayed and grouped."
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 960,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 956,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-nowrap items-center gap-3 overflow-x-auto pb-1 xl:justify-end",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>setOnlyUpcoming((v)=>!v),
                            className: `${onlyUpcoming ? BTN_PRIMARY_ACTIVE : BTN_NEUTRAL} min-w-[205px] shrink-0 whitespace-nowrap px-5`,
                            children: isVi ? "Chỉ xem lịch sắp thi" : "Upcoming only"
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 968,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>setGroupMode("date"),
                            className: `${groupMode === "date" ? BTN_PRIMARY_ACTIVE : BTN_NEUTRAL} min-w-[110px] shrink-0 whitespace-nowrap px-5`,
                            children: isVi ? "Nhóm theo ngày" : "Group by date"
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 976,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>setGroupMode("course"),
                            className: `${groupMode === "course" ? BTN_PRIMARY_ACTIVE : BTN_NEUTRAL} min-w-[110px] shrink-0 whitespace-nowrap px-5`,
                            children: isVi ? "Nhóm theo môn" : "Group by course"
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 984,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 967,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
            lineNumber: 955,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 954,
        columnNumber: 5
    }, this);
}
_c16 = DisplayModeBar;
function ToastViewport({ toasts, onClose }) {
    if (!toasts.length) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "jsx-6645e022c16f3fbd" + " " + "pointer-events-none fixed right-4 top-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-3 md:right-6 md:top-6",
        children: [
            toasts.map((toast)=>{
                const toneClass = toast.tone === "success" ? "border-emerald-400/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,150,105,0.10))] text-emerald-50 shadow-[0_18px_40px_rgba(16,185,129,0.18)]" : toast.tone === "warning" ? "border-amber-400/30 bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(217,119,6,0.10))] text-amber-50 shadow-[0_18px_40px_rgba(245,158,11,0.16)]" : toast.tone === "error" ? "border-rose-400/30 bg-[linear-gradient(135deg,rgba(244,63,94,0.18),rgba(225,29,72,0.10))] text-rose-50 shadow-[0_18px_40px_rgba(244,63,94,0.18)]" : "border-sky-400/30 bg-[linear-gradient(135deg,rgba(59,130,246,0.18),rgba(37,99,235,0.10))] text-sky-50 shadow-[0_18px_40px_rgba(59,130,246,0.18)]";
                const iconClass = toast.tone === "success" ? "bg-emerald-400/16 text-emerald-200 ring-1 ring-emerald-300/18" : toast.tone === "warning" ? "bg-amber-400/16 text-amber-200 ring-1 ring-amber-300/18" : toast.tone === "error" ? "bg-rose-400/16 text-rose-200 ring-1 ring-rose-300/18" : "bg-sky-400/16 text-sky-200 ring-1 ring-sky-300/18";
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "jsx-6645e022c16f3fbd" + " " + `pointer-events-auto overflow-hidden rounded-[24px] border backdrop-blur-xl ${toneClass}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-6645e022c16f3fbd" + " " + "flex items-start gap-3 px-4 py-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-6645e022c16f3fbd" + " " + `mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClass}`,
                                    children: toast.tone === "success" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CheckCircleIcon, {}, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1037,
                                        columnNumber: 19
                                    }, this) : toast.tone === "warning" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WarningIcon, {}, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1039,
                                        columnNumber: 19
                                    }, this) : toast.tone === "error" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WarningIcon, {}, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1041,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BellIcon, {}, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1043,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1033,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "jsx-6645e022c16f3fbd" + " " + "min-w-0 flex-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-6645e022c16f3fbd" + " " + "text-sm font-bold tracking-[0.01em]",
                                            children: toast.title
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 1048,
                                            columnNumber: 17
                                        }, this),
                                        toast.message ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "jsx-6645e022c16f3fbd" + " " + "mt-1 text-[13px] leading-5 text-white/78",
                                            children: toast.message
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 1052,
                                            columnNumber: 19
                                        }, this) : null
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1047,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>onClose(toast.id),
                                    "aria-label": "Close toast",
                                    className: "jsx-6645e022c16f3fbd" + " " + "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/75 transition hover:bg-white/14 hover:text-white",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(XIcon, {}, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 1064,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 1058,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 1032,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "jsx-6645e022c16f3fbd" + " " + "h-1 w-full bg-white/10",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "jsx-6645e022c16f3fbd" + " " + "h-1 w-full animate-[toastShrink_3.6s_linear_forwards] bg-white/50"
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 1069,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 1068,
                            columnNumber: 13
                        }, this)
                    ]
                }, toast.id, true, {
                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                    lineNumber: 1028,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$styled$2d$jsx$40$5$2e$1$2e$6_react$40$19$2e$2$2e$4$2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "6645e022c16f3fbd",
                children: "@keyframes toastShrink{0%{width:100%}to{width:0%}}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
        lineNumber: 1007,
        columnNumber: 5
    }, this);
}
_c17 = ToastViewport;
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
    const [notificationsEnabled, setNotificationsEnabled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
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
    const [activeSessionSearch, setActiveSessionSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [stickyFilters, setStickyFilters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toasts, setToasts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const pushToast = (tone, title, message, duration = 3600)=>{
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
    };
    const removeToast = (id)=>{
        setToasts((prev)=>prev.filter((item)=>item.id !== id));
    };
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
                    const savedNotifyEnabled = readExamNotifyEnabled();
                    setNotificationsEnabled(permission === "granted" ? savedNotifyEnabled : false);
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
                                time: meta.lastSyncedAt ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(meta.lastSyncedAt, locale) : t("exams.sync.noSyncYet")
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
                                time: meta.lastSyncedAt ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(meta.lastSyncedAt, locale) : t("exams.sync.noSyncYet")
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
    const roomOptionsRaw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[roomOptionsRaw]": ()=>buildRoomOptions(records)
    }["ExamsPage.useMemo[roomOptionsRaw]"], [
        records
    ]);
    const campusOptionsRaw = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[campusOptionsRaw]": ()=>buildCampusOptions(records)
    }["ExamsPage.useMemo[campusOptionsRaw]"], [
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
                    "ExamsPage.useMemo[filtered]": ({ record })=>isUpcomingDate(record.examDate)
                }["ExamsPage.useMemo[filtered]"]);
            }
            if (roomFilter !== "all") {
                next = next.filter({
                    "ExamsPage.useMemo[filtered]": ({ record })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(record.room) === (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(roomFilter)
                }["ExamsPage.useMemo[filtered]"]);
            }
            if (campusFilter !== "all") {
                next = next.filter({
                    "ExamsPage.useMemo[filtered]": ({ record })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(record.campus) === (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(campusFilter)
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
        "ExamsPage.useMemo[filteredSessions]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildSessionSummaries"])(filtered)
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
            return {
                total: records.length,
                official,
                tentative,
                uniqueCourses,
                uniqueStudents,
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
        "ExamsPage.useMemo[sessionSummaries]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buildSessionSummaries"])(records)
    }["ExamsPage.useMemo[sessionSummaries]"], [
        records
    ]);
    const nextUpcomingSessions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[nextUpcomingSessions]": ()=>{
            return sessionSummaries.slice(0, 8);
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
    const planOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[planOptions]": ()=>[
                {
                    value: "all",
                    label: t("exams.filters.allTypes")
                },
                {
                    value: "official",
                    label: t("exams.filters.official")
                },
                {
                    value: "tentative",
                    label: t("exams.filters.tentative")
                }
            ]
    }["ExamsPage.useMemo[planOptions]"], [
        t
    ]);
    const sortOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[sortOptions]": ()=>[
                {
                    value: "date-asc",
                    label: t("exams.sort.dateAsc")
                },
                {
                    value: "date-desc",
                    label: t("exams.sort.dateDesc")
                },
                {
                    value: "course-asc",
                    label: t("exams.sort.courseAsc")
                },
                {
                    value: "student-asc",
                    label: t("exams.sort.studentAsc")
                }
            ]
    }["ExamsPage.useMemo[sortOptions]"], [
        t
    ]);
    const roomOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[roomOptions]": ()=>[
                {
                    value: "all",
                    label: isVi ? "Tất cả phòng" : "All rooms"
                },
                ...roomOptionsRaw.map({
                    "ExamsPage.useMemo[roomOptions]": (room)=>({
                            value: room,
                            label: room
                        })
                }["ExamsPage.useMemo[roomOptions]"])
            ]
    }["ExamsPage.useMemo[roomOptions]"], [
        isVi,
        roomOptionsRaw
    ]);
    const campusOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[campusOptions]": ()=>[
                {
                    value: "all",
                    label: isVi ? "Tất cả cơ sở" : "All campuses"
                },
                ...campusOptionsRaw.map({
                    "ExamsPage.useMemo[campusOptions]": (campus)=>({
                            value: campus,
                            label: campus
                        })
                }["ExamsPage.useMemo[campusOptions]"])
            ]
    }["ExamsPage.useMemo[campusOptions]"], [
        campusOptionsRaw,
        isVi
    ]);
    const activeFilterChips = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[activeFilterChips]": ()=>{
            const chips = [];
            if (planFilter !== "all") {
                chips.push({
                    key: "plan",
                    label: `${isVi ? "Loại lịch" : "Plan"}: ${planFilter === "official" ? t("exams.filters.official") : t("exams.filters.tentative")}`,
                    clear: {
                        "ExamsPage.useMemo[activeFilterChips]": ()=>setPlanFilter("all")
                    }["ExamsPage.useMemo[activeFilterChips]"]
                });
            }
            if (sortMode !== "date-asc") {
                const label = sortMode === "date-desc" ? t("exams.sort.dateDesc") : sortMode === "course-asc" ? t("exams.sort.courseAsc") : t("exams.sort.studentAsc");
                chips.push({
                    key: "sort",
                    label: `${isVi ? "Sắp xếp" : "Sort"}: ${label}`,
                    clear: {
                        "ExamsPage.useMemo[activeFilterChips]": ()=>setSortMode("date-asc")
                    }["ExamsPage.useMemo[activeFilterChips]"]
                });
            }
            if (roomFilter !== "all") {
                chips.push({
                    key: "room",
                    label: `${isVi ? "Phòng" : "Room"}: ${roomFilter}`,
                    clear: {
                        "ExamsPage.useMemo[activeFilterChips]": ()=>setRoomFilter("all")
                    }["ExamsPage.useMemo[activeFilterChips]"]
                });
            }
            if (campusFilter !== "all") {
                chips.push({
                    key: "campus",
                    label: `${isVi ? "Cơ sở" : "Campus"}: ${campusFilter}`,
                    clear: {
                        "ExamsPage.useMemo[activeFilterChips]": ()=>setCampusFilter("all")
                    }["ExamsPage.useMemo[activeFilterChips]"]
                });
            }
            if (dateFilter) {
                chips.push({
                    key: "date",
                    label: `${isVi ? "Ngày thi" : "Exam date"}: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(dateFilter, locale)}`,
                    clear: {
                        "ExamsPage.useMemo[activeFilterChips]": ()=>setDateFilter("")
                    }["ExamsPage.useMemo[activeFilterChips]"]
                });
            }
            if (onlyUpcoming) {
                chips.push({
                    key: "upcoming",
                    label: isVi ? "Chỉ lịch sắp thi" : "Upcoming only",
                    clear: {
                        "ExamsPage.useMemo[activeFilterChips]": ()=>setOnlyUpcoming(false)
                    }["ExamsPage.useMemo[activeFilterChips]"]
                });
            }
            if (groupMode === "course") {
                chips.push({
                    key: "group",
                    label: isVi ? "Nhóm theo môn" : "Grouped by course",
                    clear: {
                        "ExamsPage.useMemo[activeFilterChips]": ()=>setGroupMode("date")
                    }["ExamsPage.useMemo[activeFilterChips]"]
                });
            }
            tokens.forEach({
                "ExamsPage.useMemo[activeFilterChips]": (token, index)=>{
                    chips.push({
                        key: `token-${index}`,
                        label: `${isVi ? "Từ khóa" : "Keyword"}: ${token.raw}`,
                        clear: {
                            "ExamsPage.useMemo[activeFilterChips]": ()=>{
                                const parts = tokenizeQuery(query).filter({
                                    "ExamsPage.useMemo[activeFilterChips].parts": (_, i)=>i !== index
                                }["ExamsPage.useMemo[activeFilterChips].parts"]).map({
                                    "ExamsPage.useMemo[activeFilterChips].parts": (x)=>x.raw
                                }["ExamsPage.useMemo[activeFilterChips].parts"]);
                                setQuery(parts.join(", "));
                            }
                        }["ExamsPage.useMemo[activeFilterChips]"]
                    });
                }
            }["ExamsPage.useMemo[activeFilterChips]"]);
            return chips;
        }
    }["ExamsPage.useMemo[activeFilterChips]"], [
        campusFilter,
        dateFilter,
        groupMode,
        isVi,
        locale,
        onlyUpcoming,
        planFilter,
        query,
        roomFilter,
        sortMode,
        t,
        tokens
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
                pushToast("error", isVi ? "Đồng bộ thất bại" : "Sync failed", msg);
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
                pushToast("error", isVi ? "Đồng bộ thất bại" : "Sync failed", friendly);
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
                if (permission === "granted" && notificationsEnabled) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notifyNewExams"])(newRecordsForNotify, locale);
                }
            }
            setBannerTone("success");
            setBannerText(t("exams.sync.successDetailed", {
                totalRecords: finalRecords.length,
                totalNotices: extensionRes.payload.notices.length
            }));
            pushToast("success", isVi ? "Đồng bộ thành công" : "Sync completed", isVi ? `Đã cập nhật ${finalRecords.length} bản ghi từ ${extensionRes.payload.notices.length} thông báo.` : `Updated ${finalRecords.length} records from ${extensionRes.payload.notices.length} notices.`);
        } catch (e) {
            const friendly = mapSyncErrorMessage(String(e?.message || e), t, isVi);
            setError(friendly);
            setBannerTone("error");
            setBannerText(friendly);
            pushToast("error", isVi ? "Đồng bộ thất bại" : "Sync failed", friendly);
        } finally{
            setSyncing(false);
        }
    }
    async function handleEnableNotify() {
        if (notifyPermission === "granted") {
            const nextEnabled = !notificationsEnabled;
            setNotificationsEnabled(nextEnabled);
            writeExamNotifyEnabled(nextEnabled);
            setBannerTone(nextEnabled ? "success" : "info");
            setBannerText(nextEnabled ? isVi ? "Đã bật thông báo lịch thi trong ứng dụng." : "Exam notifications are enabled in the app." : isVi ? "Đã tắt thông báo lịch thi trong ứng dụng." : "Exam notifications are disabled in the app.");
            pushToast(nextEnabled ? "success" : "info", nextEnabled ? isVi ? "Đã bật thông báo" : "Notifications enabled" : isVi ? "Đã tắt thông báo" : "Notifications disabled", nextEnabled ? isVi ? "Bạn sẽ nhận thông báo khi có lịch thi mới sau các lần đồng bộ tiếp theo." : "You will receive alerts when new exam schedules appear after future syncs." : isVi ? "Thông báo lịch thi đã được tắt trong ứng dụng." : "Exam schedule notifications have been turned off in the app.");
            return;
        }
        const permission = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$notify$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ensureNotificationPermission"])();
        setNotifyPermission(permission);
        if (permission === "granted") {
            setNotificationsEnabled(true);
            writeExamNotifyEnabled(true);
            setBannerTone("success");
            setBannerText(isVi ? "Đã bật thông báo lịch thi trong ứng dụng." : "Exam notifications are enabled in the app.");
            pushToast("success", isVi ? "Đã bật thông báo" : "Notifications enabled", isVi ? "Trình duyệt đã cho phép và ứng dụng sẽ báo lịch thi mới ở góc phải." : "Browser permission has been granted and the app will show exam alerts in the top-right corner.");
        } else if (permission === "denied") {
            setNotificationsEnabled(false);
            writeExamNotifyEnabled(false);
            setBannerTone("warning");
            setBannerText(isVi ? "Trình duyệt đang chặn thông báo. Hãy bật quyền trong cài đặt trang nếu muốn dùng." : "Browser notifications are blocked. Enable site permission in browser settings to use them.");
            pushToast("warning", isVi ? "Thông báo đang bị chặn" : "Notifications blocked", isVi ? "Hãy mở quyền thông báo của trình duyệt cho trang này để sử dụng." : "Enable browser notification permission for this site to use alerts.");
        } else {
            setNotificationsEnabled(false);
            writeExamNotifyEnabled(false);
            setBannerTone("info");
            setBannerText(t("exams.notify.pending"));
            pushToast("info", isVi ? "Chưa bật thông báo" : "Notifications pending", isVi ? "Quyền thông báo chưa sẵn sàng. Hãy thử lại sau." : "Notification permission is not ready yet. Please try again.");
        }
    }
    async function handleOpenPdaotao() {
        const res = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$extensionBridge$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["openExamPageInExtension"])();
        if (!res.ok) {
            window.open("https://pdaotao.duytan.edu.vn/EXAM_LIST/?page=1&lang=VN", "_blank");
            setBannerTone("info");
            setBannerText(t("exams.sync.portalOpenedFallback"));
            pushToast("info", isVi ? "Đã mở cổng đào tạo" : "Portal opened", isVi ? "Extension chưa phản hồi nên hệ thống đã mở cổng đào tạo ở tab mới." : "The extension did not respond, so the portal was opened in a new tab.");
            return;
        }
        setBannerTone("info");
        setBannerText(t("exams.sync.portalOpened"));
        pushToast("info", isVi ? "Đã mở cổng đào tạo" : "Portal opened", isVi ? "Bạn có thể quay lại đây và bấm Đồng bộ khi trang lịch thi đã sẵn sàng." : "You can come back here and click Sync after the exam portal page is ready.");
    }
    async function handleExportExcel() {
        try {
            setExportingExcel(true);
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$exporters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["exportExamWorkbook"])(filtered, locale, {
                isVi,
                filePrefix: isVi ? "bao-cao-lich-thi" : "exam-report"
            });
            setBannerTone("success");
            setBannerText(isVi ? `Đã xuất báo cáo lịch thi với ${filtered.length} dòng dữ liệu. File gồm danh sách sinh viên, phiên thi và tổng quan.` : `Exported exam report with ${filtered.length} rows. The file includes students, sessions, and overview sheets.`);
            pushToast("success", isVi ? "Xuất báo cáo thành công" : "Report exported", isVi ? `Đã tạo file báo cáo với ${filtered.length} dòng dữ liệu.` : `Created a report file with ${filtered.length} rows.`);
        } catch  {
            setBannerTone("error");
            setBannerText(isVi ? "Xuất báo cáo thất bại." : "Report export failed.");
            pushToast("error", isVi ? "Xuất báo cáo thất bại" : "Report export failed", isVi ? "Có lỗi khi tạo file báo cáo lịch thi." : "An error occurred while generating the exam report file.");
        } finally{
            setExportingExcel(false);
        }
    }
    const guideText = isVi ? "Cách dùng nhanh: bấm “Mở cổng đào tạo” trước để extension đứng đúng trang lịch thi, sau đó quay lại bấm “Đồng bộ”. Dữ liệu sẽ được tái dựng thành giao diện web dễ đọc hơn Excel gốc." : "Quick usage: click “Open portal” first, then come back and click “Sync”. Data will be rebuilt into a cleaner web view.";
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ExamsPage.useEffect": ()=>{
            setActiveSessionSearch("");
        }
    }["ExamsPage.useEffect"], [
        activeSession
    ]);
    const activeSessionTokens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[activeSessionTokens]": ()=>tokenizeQuery(activeSessionSearch)
    }["ExamsPage.useMemo[activeSessionTokens]"], [
        activeSessionSearch
    ]);
    const activeSessionFilteredRecords = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[activeSessionFilteredRecords]": ()=>{
            if (!activeSession) return [];
            if (!activeSessionTokens.length) return activeSession.records;
            return activeSession.records.filter({
                "ExamsPage.useMemo[activeSessionFilteredRecords]": (record)=>{
                    const index = buildSearchIndex(record);
                    return activeSessionTokens.some({
                        "ExamsPage.useMemo[activeSessionFilteredRecords]": (token)=>{
                            const looseMatch = index.looseHaystacks.some({
                                "ExamsPage.useMemo[activeSessionFilteredRecords].looseMatch": (value)=>value.includes(token.loose)
                            }["ExamsPage.useMemo[activeSessionFilteredRecords].looseMatch"]);
                            const compactMatch = token.compact ? index.compactHaystacks.some({
                                "ExamsPage.useMemo[activeSessionFilteredRecords]": (value)=>value.includes(token.compact)
                            }["ExamsPage.useMemo[activeSessionFilteredRecords]"]) : false;
                            return looseMatch || compactMatch;
                        }
                    }["ExamsPage.useMemo[activeSessionFilteredRecords]"]);
                }
            }["ExamsPage.useMemo[activeSessionFilteredRecords]"]);
        }
    }["ExamsPage.useMemo[activeSessionFilteredRecords]"], [
        activeSession,
        activeSessionTokens
    ]);
    const activeSessionClassGroups = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ExamsPage.useMemo[activeSessionClassGroups]": ()=>groupSessionRecordsByClass(activeSessionFilteredRecords)
    }["ExamsPage.useMemo[activeSessionClassGroups]"], [
        activeSessionFilteredRecords
    ]);
    const detailHintText = isVi ? "Nút mới “Mở hồ sơ lịch” sẽ mở form web đẹp cho toàn bộ file lịch tương ứng, thay vì xuất Excel thô khó đọc." : "The new “Open roster view” button opens a clean in-app view for the whole workbook instead of a raw spreadsheet export.";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastViewport, {
                toasts: toasts,
                onClose: removeToast
            }, void 0, false, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 2035,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-5",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "app-section p-4 md:p-5",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "max-w-3xl",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[1.9rem] font-bold tracking-tight",
                                                children: t("exams.page.title")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2041,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-sm app-text-muted",
                                                children: t("exams.page.subtitle")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2044,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2040,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: handleOpenPdaotao,
                                                        className: BTN_NEUTRAL,
                                                        title: isVi ? "Mở đúng trang lịch thi của cổng đào tạo để extension chuẩn bị đồng bộ" : "Open the exam portal page so the extension can prepare syncing",
                                                        "aria-label": isVi ? "Mở cổng đào tạo" : "Open portal",
                                                        children: t("exams.actions.openPortal")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2051,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: handleEnableNotify,
                                                        className: notifyPermission === "denied" ? BTN_SOFT_WARNING : notificationsEnabled ? BTN_SOFT_SUCCESS : BTN_SOFT_INFO,
                                                        title: notifyPermission === "denied" ? isVi ? "Trình duyệt đang chặn thông báo" : "Browser notifications are blocked" : notificationsEnabled ? isVi ? "Tắt thông báo lịch thi trong ứng dụng" : "Disable exam notifications" : isVi ? "Bật thông báo khi có lịch thi mới" : "Enable notifications for new exam schedules",
                                                        "aria-label": isVi ? "Bật hoặc tắt thông báo lịch thi" : "Toggle exam notifications",
                                                        children: notifyPermission === "denied" ? isVi ? "Thông báo bị chặn" : "Notifications blocked" : notificationsEnabled ? isVi ? "Tắt thông báo" : "Turn off notifications" : isVi ? "Bật thông báo" : "Turn on notifications"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2065,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: handleExportExcel,
                                                        disabled: exportingExcel,
                                                        className: `${BTN_SOFT_SUCCESS} disabled:opacity-60`,
                                                        title: isVi ? "Xuất toàn bộ dữ liệu đang lọc thành file Excel" : "Export the currently filtered data to Excel",
                                                        "aria-label": isVi ? "Xuất báo cáo Excel" : "Export Excel report",
                                                        children: exportingExcel ? isVi ? "Đang xuất..." : "Exporting..." : isVi ? "Xuất báo cáo" : "Export report"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2107,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: handleSync,
                                                        disabled: syncing,
                                                        className: `${syncing ? BTN_DANGER : BTN_PRIMARY} disabled:opacity-60`,
                                                        title: isVi ? "Lấy lại dữ liệu lịch thi mới nhất từ extension" : "Sync the latest exam schedules from the extension",
                                                        "aria-label": isVi ? "Đồng bộ lịch thi" : "Sync exams",
                                                        children: syncing ? t("exams.actions.syncing") : t("exams.actions.sync")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2130,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2050,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ActionHint, {
                                                title: isVi ? "Giải thích nhanh các nút" : "Quick action guide",
                                                items: isVi ? [
                                                    "Mở cổng đào tạo: mở đúng trang nguồn để extension đứng sẵn ở chỗ cần lấy dữ liệu.",
                                                    "Đồng bộ lịch thi: lấy dữ liệu mới nhất từ cổng đào tạo và cập nhật lại hệ thống.",
                                                    "Bật thông báo: báo khi có lịch thi mới sau những lần đồng bộ tiếp theo.",
                                                    "Xuất báo cáo: tải file Excel từ chính dữ liệu bạn đang lọc trên màn hình."
                                                ] : [
                                                    "Open portal: open the source exam page so the extension is ready.",
                                                    "Sync exams: fetch the latest schedules from the portal and update the app.",
                                                    "Turn on notifications: alert you when new exam schedules appear after later syncs.",
                                                    "Export report: download an Excel file from the data currently filtered on screen."
                                                ]
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2148,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2049,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2039,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 rounded-2xl border border-[var(--warning)]/18 bg-[var(--warning)]/10 px-5 py-4 text-sm text-[var(--warning)]",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-semibold",
                                        children: isVi ? "Lưu ý đồng bộ" : "Sync note"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2170,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1.5 opacity-95",
                                        children: guideText
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2173,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2169,
                                columnNumber: 11
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
                                                lineNumber: 2178,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-2xl font-bold",
                                                children: stats.total
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2181,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2177,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "app-panel p-3.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] uppercase tracking-wide app-text-muted",
                                                children: t("exams.stats.visible")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2185,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-2xl font-bold",
                                                children: stats.visible
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2188,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2184,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "app-panel p-3.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] uppercase tracking-wide app-text-muted",
                                                children: isVi ? "Phiên đang hiển thị" : "Visible sessions"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2192,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-2xl font-bold",
                                                children: stats.visibleSessions
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2195,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2191,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "app-panel p-3.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] uppercase tracking-wide app-text-muted",
                                                children: t("exams.stats.uniqueDays")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2201,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-2xl font-bold",
                                                children: stats.uniqueDays
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2204,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2200,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "app-panel p-3.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] uppercase tracking-wide app-text-muted",
                                                children: t("exams.stats.courses")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2210,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-2xl font-bold",
                                                children: stats.uniqueCourses
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2213,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2209,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "app-panel p-3.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] uppercase tracking-wide app-text-muted",
                                                children: t("exams.stats.students")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2219,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-2xl font-bold",
                                                children: stats.uniqueStudents
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2222,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2218,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "app-panel p-3.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] uppercase tracking-wide app-text-muted",
                                                children: t("exams.stats.official")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2228,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-2xl font-bold text-[var(--success)]",
                                                children: stats.official
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2231,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2227,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "app-panel p-3.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-[11px] uppercase tracking-wide app-text-muted",
                                                children: t("exams.stats.tentative")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2237,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1.5 text-2xl font-bold text-[var(--warning)]",
                                                children: stats.tentative
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2240,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2236,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2176,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: [
                                    "mt-4 rounded-[32px] border border-[var(--border-main)] bg-[var(--bg-card-strong)]/98 p-5 md:p-6 shadow-sm transition-all duration-200",
                                    stickyFilters ? "sticky top-[88px] z-20 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-[var(--bg-card-strong)]/95 md:top-[96px]" : ""
                                ].join(" "),
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mb-5 flex flex-wrap items-start justify-between gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-[1.15rem] font-bold text-[var(--text-main)]",
                                                        children: isVi ? "Thanh lọc nhanh" : "Quick filters"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2256,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 text-sm text-[var(--text-muted)]",
                                                        children: isVi ? "Bố cục được canh lại gọn, rõ và cân đối hơn để không lệch hàng hoặc đè nội dung." : "Cleaner, more balanced layout to avoid overlap and awkward spacing."
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2259,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2255,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "inline-flex h-11 items-center rounded-full border border-[#bfd3ff] bg-[#edf4ff] px-4 text-sm font-bold text-[#2563eb] shadow-[0_8px_18px_rgba(37,99,235,0.08)]",
                                                        children: isVi ? `${stats.visible} kết quả` : `${stats.visible} results`
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2267,
                                                        columnNumber: 17
                                                    }, this),
                                                    stickyFilters ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "inline-flex h-11 items-center rounded-full border border-[#d8e2f0] bg-[#f8fbff] px-4 text-sm font-semibold text-[#4f6b95] shadow-[0_8px_18px_rgba(15,23,42,0.05)]",
                                                        children: isVi ? "Đang ghim" : "Pinned"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2274,
                                                        columnNumber: 19
                                                    }, this) : null
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2266,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2254,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "grid grid-cols-1 gap-4 xl:grid-cols-12",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative min-w-0 xl:col-span-12 2xl:col-span-9",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                        htmlFor: "exam-search",
                                                        className: "sr-only",
                                                        children: t("exams.filters.searchPlaceholder")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2283,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex h-11 w-full items-center overflow-hidden rounded-[22px] border-[2px] border-[var(--border-strong)] bg-[var(--bg-card-strong)] transition hover:border-[var(--border-strong)] focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent)]/20",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex h-full shrink-0 items-center",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "flex h-11 w-10 items-center justify-center rounded-[16px] bg-[var(--accent)]/18 text-[var(--accent)] shadow-sm",
                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SearchIcon, {}, void 0, false, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2290,
                                                                            columnNumber: 23
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2289,
                                                                        columnNumber: 21
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "ml-1 h-8 w-px bg-[var(--border-strong)]/55"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2292,
                                                                        columnNumber: 21
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2288,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                id: "exam-search",
                                                                className: "h-full min-w-0 flex-1 bg-transparent pl-4 pr-[54px] text-[15px] font-semibold text-[var(--text-main)] outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-[var(--text-soft)]",
                                                                value: query,
                                                                onChange: (e)=>setQuery(e.target.value),
                                                                placeholder: isVi ? "Tìm mã môn, tên môn, MSSV, họ tên, lớp, phòng thi..." : "Search course, student, class, room"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2295,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2287,
                                                        columnNumber: 17
                                                    }, this),
                                                    query.trim().length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>setQuery(""),
                                                        className: "absolute right-3 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--bg-soft)] text-[var(--text-muted)] transition hover:bg-[var(--accent)]/15 hover:text-[var(--accent)]",
                                                        "aria-label": isVi ? "Xóa nội dung tìm kiếm" : "Clear search",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(XIcon, {}, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 2315,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2309,
                                                        columnNumber: 19
                                                    }, this) : null
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2282,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "xl:col-span-4 2xl:col-span-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SelectField, {
                                                    id: "exam-plan-filter",
                                                    label: t("exams.filters.planLabel"),
                                                    value: planFilter,
                                                    onChange: (value)=>updatePlanFilter(value),
                                                    options: planOptions,
                                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LayersIcon, {}, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2327,
                                                        columnNumber: 25
                                                    }, void 0)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2321,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2320,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "xl:col-span-4 2xl:col-span-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SelectField, {
                                                    id: "exam-sort-filter",
                                                    label: t("exams.filters.sortLabel"),
                                                    value: sortMode,
                                                    onChange: (value)=>updateSortMode(value),
                                                    options: sortOptions,
                                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SortIcon, {}, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2338,
                                                        columnNumber: 25
                                                    }, void 0)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2332,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2331,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "xl:col-span-3 2xl:col-span-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "date",
                                                    className: "app-input h-14 w-full rounded-[22px] px-5 pr-12 text-[15px] font-semibold text-[var(--text-main)]",
                                                    value: dateFilter,
                                                    onChange: (e)=>setDateFilter(e.target.value),
                                                    title: isVi ? "Lọc theo ngày thi" : "Filter by exam date"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2343,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2342,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "xl:col-span-4",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SelectField, {
                                                    id: "exam-room-filter",
                                                    label: isVi ? "Lọc theo phòng" : "Filter by room",
                                                    value: roomFilter,
                                                    onChange: setRoomFilter,
                                                    options: roomOptions,
                                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RoomIcon, {}, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2359,
                                                        columnNumber: 25
                                                    }, void 0)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2353,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2352,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "xl:col-span-4",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SelectField, {
                                                    id: "exam-campus-filter",
                                                    label: isVi ? "Lọc theo cơ sở" : "Filter by campus",
                                                    value: campusFilter,
                                                    onChange: setCampusFilter,
                                                    options: campusOptions,
                                                    icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CampusIcon, {}, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2370,
                                                        columnNumber: 25
                                                    }, void 0)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2364,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2363,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "xl:col-span-3",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: resetFilters,
                                                    className: `${BTN_NEUTRAL} h-14 w-full text-[15px]`,
                                                    children: t("exams.actions.resetFilters")
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2375,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2374,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "xl:col-span-12",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DisplayModeBar, {
                                                    isVi: isVi,
                                                    onlyUpcoming: onlyUpcoming,
                                                    setOnlyUpcoming: setOnlyUpcoming,
                                                    groupMode: groupMode,
                                                    setGroupMode: setGroupMode
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2385,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2384,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2281,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-4 space-y-3",
                                        children: [
                                            activeFilterChips.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-2",
                                                children: activeFilterChips.map((chip)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FilterChip, {
                                                        label: chip.label,
                                                        onClear: chip.clear
                                                    }, chip.key, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2399,
                                                        columnNumber: 21
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2397,
                                                columnNumber: 17
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-[var(--text-muted)]",
                                                children: t("exams.filters.tip")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2407,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--text-muted)]",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: lastSyncedAt ? t("exams.meta.lastSyncAt", {
                                                            time: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDateTime"])(lastSyncedAt, locale)
                                                        }) : t("exams.meta.noSyncYet")
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2413,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: t("exams.meta.noticeCount", {
                                                            count: lastNoticeCount
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2420,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: t("exams.meta.visibleCount", {
                                                            count: stats.visible
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2423,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: t("exams.meta.groupCount", {
                                                            count: grouped.length
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2426,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: t("exams.meta.notifyStatus", {
                                                            status: notifyPermission === "denied" ? isVi ? "trình duyệt chặn" : "browser blocked" : notifyPermission === "granted" ? notificationsEnabled ? isVi ? "đã bật" : "enabled" : isVi ? "đã tắt" : "disabled" : notifyPermission === "default" ? t("exams.notify.statusDefault") : t("exams.notify.statusUnsupported")
                                                        })
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2429,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2412,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2395,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2246,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `mt-4 rounded-2xl px-4 py-3 text-sm ${getBannerClass(bannerTone)}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-medium",
                                        children: loading ? t("common.loading") : bannerText || t("exams.sync.idleHelp")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2456,
                                        columnNumber: 13
                                    }, this),
                                    !syncing && !loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1 text-xs opacity-80",
                                        children: t("exams.sync.hint")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2462,
                                        columnNumber: 15
                                    }, this) : null
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2453,
                                columnNumber: 11
                            }, this),
                            error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2469,
                                columnNumber: 13
                            }, this) : null
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 2038,
                        columnNumber: 9
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
                                                                lineNumber: 2480,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-sm app-text-muted",
                                                                children: t("exams.insights.subtitle")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2483,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2479,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>document.getElementById("exam-detail-list")?.scrollIntoView({
                                                                behavior: "smooth"
                                                            }),
                                                        className: BTN_NEUTRAL,
                                                        children: isVi ? "Xem danh sách chi tiết phía dưới" : "View detailed list below"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2487,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2478,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-4 rounded-2xl border border-[var(--accent)]/16 bg-[var(--accent)]/10 px-4 py-3 text-sm text-[var(--accent)]",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "font-medium",
                                                        children: isVi ? "Gợi ý sử dụng" : "Helpful tip"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2503,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-1 opacity-90",
                                                        children: detailHintText
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2506,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2502,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-4 grid gap-4 lg:grid-cols-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "rounded-2xl border border-[var(--border-main)] p-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-bold",
                                                                children: t("exams.insights.peakDays")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2511,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-xs app-text-muted",
                                                                children: t("exams.insights.peakDaysHint")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2514,
                                                                columnNumber: 19
                                                            }, this),
                                                            heatmapHighlights.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-4 rounded-xl app-soft p-4 text-sm app-text-muted",
                                                                children: t("exams.insights.noHeatmap")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2519,
                                                                columnNumber: 21
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
                                                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(item.date, locale)
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2532,
                                                                                        columnNumber: 29
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                        className: "app-text-muted",
                                                                                        children: t("exams.insights.recordCount", {
                                                                                            count: item.count
                                                                                        })
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2535,
                                                                                        columnNumber: 29
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2531,
                                                                                columnNumber: 27
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
                                                                                    lineNumber: 2542,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2541,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, item.date, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2525,
                                                                        columnNumber: 25
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2523,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2510,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "rounded-2xl border border-[var(--border-main)] p-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-bold",
                                                                children: t("exams.insights.courseLoad")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2563,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-xs app-text-muted",
                                                                children: t("exams.insights.courseLoadHint")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2566,
                                                                columnNumber: 19
                                                            }, this),
                                                            topCourses.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-4 rounded-xl app-soft p-4 text-sm app-text-muted",
                                                                children: t("exams.insights.noCourseLoad")
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2571,
                                                                columnNumber: 21
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
                                                                                            lineNumber: 2585,
                                                                                            columnNumber: 31
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-1 truncate text-sm app-text-muted",
                                                                                            children: course.name || "—"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2588,
                                                                                            columnNumber: 31
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2584,
                                                                                    columnNumber: 29
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium",
                                                                                    children: course.count
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2592,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2583,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    }, `${course.code}-${course.name || ""}`, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2577,
                                                                        columnNumber: 25
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2575,
                                                                columnNumber: 21
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2562,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2509,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2477,
                                        columnNumber: 13
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
                                                                lineNumber: 2607,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-xs app-text-muted",
                                                                children: isVi ? "Bấm vào một ngày để lọc nhanh danh sách thi theo ngày đó." : "Click a day to filter the exam list quickly."
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2610,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2606,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                className: `${BTN_NEUTRAL} h-9 px-3 text-xs`,
                                                                onClick: ()=>setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)),
                                                                children: "←"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2618,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-medium",
                                                                children: calendarMonth.toLocaleDateString(locale, {
                                                                    month: "long",
                                                                    year: "numeric"
                                                                })
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2633,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                className: `${BTN_NEUTRAL} h-9 px-3 text-xs`,
                                                                onClick: ()=>setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)),
                                                                children: "→"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2639,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2617,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2605,
                                                columnNumber: 15
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
                                                        lineNumber: 2662,
                                                        columnNumber: 19
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2657,
                                                columnNumber: 15
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
                                                                lineNumber: 2695,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mt-1 text-[10px] app-text-muted",
                                                                children: count > 0 ? isVi ? `${count} lịch` : `${count} exams` : "—"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2698,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, key, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2681,
                                                        columnNumber: 21
                                                    }, this);
                                                })
                                            }, void 0, false, {
                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                lineNumber: 2668,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2604,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2476,
                                columnNumber: 11
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
                                                    lineNumber: 2715,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-1 text-xs app-text-muted",
                                                    children: isVi ? "Mỗi thẻ là một phiên thi. Từ đây có thể mở hồ sơ lịch đầy đủ của cả file." : "Each card is one exam session. You can also open the full roster view of the source file."
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2718,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2714,
                                            columnNumber: 15
                                        }, this),
                                        nextUpcomingSessions.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-4 rounded-xl app-soft p-4 text-sm app-text-muted",
                                            children: t("exams.insights.noTimeline")
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2726,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-4 space-y-3",
                                            children: nextUpcomingSessions.map((session)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "rounded-[28px] border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4 shadow-[0_10px_30px_rgba(2,8,23,0.10)]",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex flex-col gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-start justify-between gap-3",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "min-w-0",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "text-[15px] font-semibold leading-6",
                                                                            children: [
                                                                                session.courseCode || t("exams.labels.unknownCourseCode"),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    className: "app-text-muted font-normal",
                                                                                    children: session.courseName ? ` • ${session.courseName}` : ""
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2742,
                                                                                    columnNumber: 31
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2739,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "mt-1 text-xs app-text-muted",
                                                                            children: [
                                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(session.examDate, locale),
                                                                                " •",
                                                                                " ",
                                                                                session.startTime || t("exams.labels.unknownTime"),
                                                                                " ",
                                                                                "•",
                                                                                " ",
                                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(session.room) || t("exams.labels.unknownRoom")
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2749,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2738,
                                                                    columnNumber: 27
                                                                }, this)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2737,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex flex-wrap items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "inline-flex rounded-full app-pill px-3 py-1.5 text-xs font-medium",
                                                                        children: isVi ? `${session.studentCount} sinh viên` : `${session.studentCount} students`
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2761,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: [
                                                                            "inline-flex rounded-full px-3 py-1.5 text-xs font-semibold",
                                                                            (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStatusTone"])(session.examDate)
                                                                        ].join(" "),
                                                                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCountdownLabel"])(session.examDate, t)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2767,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2760,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex flex-nowrap items-center gap-2 overflow-x-auto pb-1",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        type: "button",
                                                                        onClick: ()=>setActiveSession(session),
                                                                        className: `${BTN_NEUTRAL} shrink-0 whitespace-nowrap`,
                                                                        title: isVi ? "Mở danh sách sinh viên của đúng ca thi này" : "Open the student list for this exact exam session",
                                                                        "aria-label": isVi ? "Xem ca thi" : "View exam session",
                                                                        children: isVi ? "Xem ca thi" : "View session"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2778,
                                                                        columnNumber: 27
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: buildNoticeReportHref(session.detailUrl),
                                                                        className: `${BTN_PRIMARY} shrink-0 whitespace-nowrap`,
                                                                        title: isVi ? "Mở toàn bộ hồ sơ lịch của file nguồn dưới dạng web gọn hơn" : "Open the full roster view of the source file in a cleaner web layout",
                                                                        "aria-label": isVi ? "Mở hồ sơ lịch" : "Open roster view",
                                                                        children: isVi ? "Mở hồ sơ lịch" : "Open roster view"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2794,
                                                                        columnNumber: 27
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2777,
                                                                columnNumber: 25
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ActionHint, {
                                                                items: isVi ? [
                                                                    "Xem ca thi: chỉ xem riêng ca đang chọn, phù hợp khi cần tra nhanh sinh viên.",
                                                                    "Mở hồ sơ lịch: mở cả file nguồn ở dạng web để xem đầy đủ hơn PDF hoặc Excel gốc."
                                                                ] : [
                                                                    "View session: open only the selected session for quick student lookup.",
                                                                    "Open roster view: open the full source workbook in a cleaner web form."
                                                                ]
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 2810,
                                                                columnNumber: 25
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2736,
                                                        columnNumber: 23
                                                    }, this)
                                                }, session.id, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2732,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2730,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 2713,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2712,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 2475,
                        columnNumber: 9
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
                                        children: isVi ? "Danh sách phiên thi" : "Exam session list"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2834,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-1 opacity-90",
                                        children: isVi ? "Đã đổi logic: không còn xuất Excel theo ca thi ở đây nữa. Thay vào đó là nút mở hồ sơ lịch đầy đủ cho cả file nguồn." : "Session export is replaced by a full in-app roster view for the source workbook."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2837,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2833,
                                columnNumber: 11
                            }, this),
                            grouped.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "app-section p-8 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-lg font-semibold",
                                        children: t("exams.empty.title")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2846,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 text-sm app-text-muted",
                                        children: t("exams.empty.subtitle")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 2849,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                lineNumber: 2845,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    visibleGroups.map(([groupKey, items])=>{
                                        const first = items[0];
                                        const groupLabel = groupMode === "date" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(groupKey, locale) : `${groupKey}${first?.courseName ? ` • ${first.courseName}` : ""}`;
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "app-section",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "border-b border-[var(--border-main)] px-4 py-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex flex-wrap items-center justify-between gap-3",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold",
                                                                    children: groupLabel
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2867,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "mt-1 text-sm app-text-muted",
                                                                    children: isVi ? `${items.length} phiên thi` : `${items.length} exam sessions`
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2870,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 2866,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2865,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2864,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "px-4 pb-3 pt-3",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SyncedHorizontalTable, {
                                                        minWidthClassName: "min-w-[1320px]",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                            className: "w-full text-sm",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                        className: "border-b border-[var(--border-main)] bg-[var(--bg-soft)] text-left",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                className: "whitespace-nowrap px-4 py-3 font-semibold",
                                                                                children: t("exams.table.type")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2884,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                className: "whitespace-nowrap px-4 py-3 font-semibold",
                                                                                children: t("exams.table.course")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2887,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                className: "whitespace-nowrap px-4 py-3 font-semibold",
                                                                                children: isVi ? "Lịch thi" : "Exam session"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2890,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                className: "whitespace-nowrap px-4 py-3 font-semibold",
                                                                                children: isVi ? "Quy mô" : "Scale"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2893,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                className: "whitespace-nowrap px-4 py-3 font-semibold",
                                                                                children: t("exams.table.class")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2896,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                className: "whitespace-nowrap px-4 py-3 font-semibold",
                                                                                children: isVi ? "Thao tác" : "Actions"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2899,
                                                                                columnNumber: 31
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                className: "whitespace-nowrap px-4 py-3 font-semibold",
                                                                                children: t("exams.table.source")
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 2902,
                                                                                columnNumber: 31
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 2883,
                                                                        columnNumber: 29
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2882,
                                                                    columnNumber: 27
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
                                                                                                lineNumber: 2915,
                                                                                                columnNumber: 37
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                    className: [
                                                                                                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                                                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStatusTone"])(session.examDate)
                                                                                                    ].join(" "),
                                                                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCountdownLabel"])(session.examDate, t)
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                    lineNumber: 2929,
                                                                                                    columnNumber: 39
                                                                                                }, this)
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 2928,
                                                                                                columnNumber: 37
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 2914,
                                                                                        columnNumber: 35
                                                                                    }, this)
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2913,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                    className: "px-4 py-3",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "font-semibold",
                                                                                            children: session.courseCode || t("exams.labels.unknownCourseCode")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2942,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-1 text-sm app-text-muted",
                                                                                            children: session.courseName || session.noticeTitle
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2946,
                                                                                            columnNumber: 35
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2941,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                    className: "px-4 py-3",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "font-medium",
                                                                                            children: [
                                                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(session.examDate, locale),
                                                                                                " •",
                                                                                                " ",
                                                                                                session.startTime || t("exams.labels.unknownTime")
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2952,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-1 text-sm app-text-muted",
                                                                                            children: [
                                                                                                (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(session.room) || t("exams.labels.unknownRoom"),
                                                                                                session.campus ? ` • ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(session.campus)}` : ""
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2957,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-1 max-w-[360px] text-xs leading-5 app-text-muted",
                                                                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeExamMeta"])(session.examMetaRaw) || "—"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2964,
                                                                                            columnNumber: 35
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2951,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                    className: "px-4 py-3",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-semibold",
                                                                                            children: isVi ? `${session.studentCount} sinh viên` : `${session.studentCount} students`
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2971,
                                                                                            columnNumber: 35
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
                                                                                                    lineNumber: 2978,
                                                                                                    columnNumber: 37
                                                                                                }, this),
                                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                    children: [
                                                                                                        isVi ? "Lớp sinh hoạt" : "Student classes",
                                                                                                        ": ",
                                                                                                        session.classStudentCount || 0
                                                                                                    ]
                                                                                                }, void 0, true, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                    lineNumber: 2982,
                                                                                                    columnNumber: 37
                                                                                                }, this)
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2977,
                                                                                            columnNumber: 35
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2970,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                    className: "px-4 py-3",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            children: session.records[0]?.classCourse || "—"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2992,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        session.records[0]?.classStudent ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-1 text-xs app-text-muted",
                                                                                            children: session.records[0].classStudent
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 2996,
                                                                                            columnNumber: 37
                                                                                        }, this) : null
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 2991,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                    className: "px-4 py-3",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "flex flex-nowrap items-center gap-2 overflow-x-auto pb-1",
                                                                                            children: [
                                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                    type: "button",
                                                                                                    onClick: ()=>setActiveSession(session),
                                                                                                    className: `${BTN_NEUTRAL} shrink-0 whitespace-nowrap`,
                                                                                                    title: isVi ? "Mở nhanh ca thi này để xem danh sách sinh viên" : "Quickly open this session to inspect the student list",
                                                                                                    "aria-label": isVi ? "Xem ca thi" : "View session",
                                                                                                    children: isVi ? "Xem ca thi" : "View session"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                    lineNumber: 3004,
                                                                                                    columnNumber: 37
                                                                                                }, this),
                                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                                                                    href: buildNoticeReportHref(session.detailUrl),
                                                                                                    className: `${BTN_PRIMARY} shrink-0 whitespace-nowrap`,
                                                                                                    title: isVi ? "Mở toàn bộ hồ sơ lịch của file nguồn tương ứng" : "Open the full roster view for the related source file",
                                                                                                    "aria-label": isVi ? "Mở hồ sơ lịch" : "Open roster view",
                                                                                                    children: isVi ? "Mở hồ sơ lịch" : "Open roster view"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                    lineNumber: 3020,
                                                                                                    columnNumber: 37
                                                                                                }, this)
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3003,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-2 max-w-[360px] text-[12px] leading-5 text-[var(--text-muted)]",
                                                                                            children: isVi ? "Xem ca thi để tra nhanh theo 1 phiên. Mở hồ sơ lịch để xem toàn bộ file nguồn theo bố cục web rõ ràng hơn." : "Use View session for one session only. Use Open roster view for the full source workbook in a cleaner layout."
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3042,
                                                                                            columnNumber: 35
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 3002,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                    className: "px-4 py-3",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "text-xs app-text-muted",
                                                                                            children: session.publishedAtRaw || t("exams.labels.unknownPublishTime")
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3049,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        session.attachmentName ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-1 text-xs app-text-muted",
                                                                                            children: session.attachmentName
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3055,
                                                                                            columnNumber: 37
                                                                                        }, this) : null,
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-2 flex flex-nowrap items-center gap-2 overflow-x-auto pb-1",
                                                                                            children: [
                                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                                    href: session.detailUrl,
                                                                                                    target: "_blank",
                                                                                                    rel: "noreferrer",
                                                                                                    className: `${BTN_DETAIL_LINK} shrink-0 whitespace-nowrap`,
                                                                                                    title: isVi ? "Mở trang chi tiết gốc của thông báo trên cổng đào tạo" : "Open the original notice detail page on the training portal",
                                                                                                    "aria-label": isVi ? "Mở nguồn chi tiết" : "Open source detail",
                                                                                                    children: t("exams.actions.openDetail")
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                    lineNumber: 3061,
                                                                                                    columnNumber: 37
                                                                                                }, this),
                                                                                                session.attachmentUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                                    href: session.attachmentUrl,
                                                                                                    target: "_blank",
                                                                                                    rel: "noreferrer",
                                                                                                    className: `${BTN_DOWNLOAD_LINK} shrink-0 whitespace-nowrap`,
                                                                                                    title: isVi ? "Tải file PDF hoặc Excel gốc từ trường" : "Download the original PDF or Excel file from the school",
                                                                                                    "aria-label": isVi ? "Tải file lịch thi" : "Download exam file",
                                                                                                    children: isVi ? "Tải file lịch thi" : "Download exam file"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                    lineNumber: 3081,
                                                                                                    columnNumber: 39
                                                                                                }, this) : null
                                                                                            ]
                                                                                        }, void 0, true, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3060,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "mt-2 max-w-[360px] text-[12px] leading-5 text-[var(--text-muted)]",
                                                                                            children: isVi ? "Mở nguồn chi tiết để kiểm tra thông báo gốc. Tải file lịch thi để mở đúng file PDF/Excel trường cung cấp." : "Open source detail to verify the original notice. Download exam file to open the original PDF/Excel from the school."
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3104,
                                                                                            columnNumber: 35
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 3048,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            ]
                                                                        }, session.id, true, {
                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                            lineNumber: 2909,
                                                                            columnNumber: 31
                                                                        }, this))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 2907,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 2881,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 2880,
                                                        columnNumber: 23
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 2879,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, groupKey, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 2863,
                                            columnNumber: 19
                                        }, this);
                                    }),
                                    hasMoreGroups ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setVisibleGroupsLimit((v)=>v + 8),
                                            className: BTN_PRIMARY,
                                            children: t("exams.actions.loadMore")
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 3122,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                        lineNumber: 3121,
                                        columnNumber: 17
                                    }, this) : null
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 2832,
                        columnNumber: 9
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
                                            className: "min-w-0",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-lg font-bold",
                                                    children: [
                                                        activeSession.courseCode || t("exams.labels.unknownCourseCode"),
                                                        activeSession.courseName ? ` • ${activeSession.courseName}` : ""
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3140,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-1 text-sm app-text-muted",
                                                    children: [
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(activeSession.examDate, locale),
                                                        " •",
                                                        " ",
                                                        activeSession.startTime || t("exams.labels.unknownTime"),
                                                        " •",
                                                        " ",
                                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(activeSession.room) || t("exams.labels.unknownRoom"),
                                                        activeSession.campus ? ` • ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeVisualText"])(activeSession.campus)}` : ""
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3147,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 3139,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: ()=>setActiveSession(null),
                                            className: BTN_NEUTRAL,
                                            title: isVi ? "Đóng cửa sổ xem nhanh" : "Close quick preview",
                                            children: t("common.close")
                                        }, void 0, false, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 3158,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 3138,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "max-h-[calc(90vh-88px)] overflow-auto px-5 py-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55 px-4 py-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-[11px] uppercase app-text-muted",
                                                            children: isVi ? "Loại lịch" : "Plan type"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3171,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "mt-1.5 font-bold",
                                                            children: activeSession.planType === "official" ? t("exams.filters.official") : t("exams.filters.tentative")
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3174,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3170,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55 px-4 py-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-[11px] uppercase app-text-muted",
                                                            children: isVi ? "Sinh viên" : "Students"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3182,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "mt-1.5 font-bold",
                                                            children: activeSession.studentCount
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3185,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3181,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55 px-4 py-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-[11px] uppercase app-text-muted",
                                                            children: isVi ? "Lớp môn học" : "Course classes"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3191,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "mt-1.5 font-bold",
                                                            children: activeSession.classCourseCount
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3194,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3190,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55 px-4 py-3",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-[11px] uppercase app-text-muted",
                                                            children: isVi ? "Trạng thái" : "Status"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3200,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "mt-1.5",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: [
                                                                    "inline-flex rounded-full px-3 py-1 text-xs font-bold",
                                                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getStatusTone"])(activeSession.examDate)
                                                                ].join(" "),
                                                                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCountdownLabel"])(activeSession.examDate, t)
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 3204,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3203,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3199,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 3169,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-4 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55 p-4",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                                    title: isVi ? "Thông tin phiên thi" : "Session details",
                                                    subtitle: isVi ? "Bản xem nhanh của đúng 1 ca thi, chia rõ theo lớp để đỡ rối." : "Quick preview of one exam session with clearer class separation."
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3217,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-3 text-sm app-text-muted",
                                                    children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$exams$2f$sessionUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeExamMeta"])(activeSession.examMetaRaw) || "—"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3226,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-4 flex flex-wrap gap-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                            href: buildNoticeReportHref(activeSession.detailUrl),
                                                            className: BTN_PRIMARY,
                                                            title: isVi ? "Mở toàn bộ hồ sơ lịch của file nguồn này" : "Open the full roster view of this source file",
                                                            children: isVi ? "Mở hồ sơ lịch đầy đủ" : "Open full roster view"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3231,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: activeSession.detailUrl,
                                                            target: "_blank",
                                                            rel: "noreferrer",
                                                            className: BTN_DETAIL_LINK,
                                                            title: isVi ? "Mở trang chi tiết gốc trên cổng đào tạo" : "Open the original detail page on the portal",
                                                            children: t("exams.actions.openDetail")
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3243,
                                                            columnNumber: 21
                                                        }, this),
                                                        activeSession.attachmentUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: activeSession.attachmentUrl,
                                                            target: "_blank",
                                                            rel: "noreferrer",
                                                            className: BTN_DOWNLOAD_LINK,
                                                            title: isVi ? "Tải file lịch thi gốc" : "Download the original exam file",
                                                            children: isVi ? "Tải file lịch thi" : "Download exam file"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3258,
                                                            columnNumber: 23
                                                        }, this) : null
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3230,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "mt-3 text-[12px] leading-5 text-[var(--text-muted)]",
                                                    children: isVi ? "Xem ca thi giờ ưu tiên tra cứu nhanh: có nhóm theo lớp, ô tìm kiếm nội bộ và danh sách sinh viên lọc ngay trong modal." : "View session is now optimized for quick lookup with class grouping, in-modal search, and a filtered student list."
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3274,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 3216,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "mb-3 flex flex-wrap items-center justify-between gap-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                                                        title: isVi ? `Nhóm lớp môn học (${activeSessionClassGroups.length})` : `Course class groups (${activeSessionClassGroups.length})`,
                                                                        subtitle: isVi ? "Nhìn nhanh lớp nào đông, bấm vào từng nhóm để xem sinh viên." : "See which classes are dense and expand each group when needed."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 3285,
                                                                        columnNumber: 25
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium",
                                                                        children: isVi ? `${activeSessionFilteredRecords.length}/${activeSession.records.length} sinh viên` : `${activeSessionFilteredRecords.length}/${activeSession.records.length} students`
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 3297,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 3284,
                                                                columnNumber: 23
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "space-y-3",
                                                                children: activeSessionClassGroups.map((group)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                                                                        className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-soft)]/55",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                                                                className: "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "min-w-0",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "truncate font-semibold",
                                                                                                children: group.classCourse
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 3312,
                                                                                                columnNumber: 33
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                className: "mt-1 text-xs app-text-muted",
                                                                                                children: group.classStudentSample || "—"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 3315,
                                                                                                columnNumber: 33
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 3311,
                                                                                        columnNumber: 31
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "inline-flex rounded-full app-pill px-3 py-1 text-xs font-medium",
                                                                                        children: group.count
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 3320,
                                                                                        columnNumber: 31
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 3310,
                                                                                columnNumber: 29
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "border-t border-[var(--border-main)] px-4 py-3",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                    className: "space-y-2",
                                                                                    children: group.records.map((record)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                            className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] px-3 py-2 text-sm",
                                                                                            children: [
                                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                    className: "min-w-0",
                                                                                                    children: [
                                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                            className: "font-medium",
                                                                                                            children: record.studentName || "—"
                                                                                                        }, void 0, false, {
                                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                            lineNumber: 3333,
                                                                                                            columnNumber: 39
                                                                                                        }, this),
                                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                            className: "mt-1 text-xs app-text-muted",
                                                                                                            children: [
                                                                                                                record.studentId || "—",
                                                                                                                record.classStudent ? ` • ${record.classStudent}` : ""
                                                                                                            ]
                                                                                                        }, void 0, true, {
                                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                            lineNumber: 3336,
                                                                                                            columnNumber: 39
                                                                                                        }, this)
                                                                                                    ]
                                                                                                }, void 0, true, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                    lineNumber: 3332,
                                                                                                    columnNumber: 37
                                                                                                }, this),
                                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                                    className: "text-xs app-text-muted",
                                                                                                    children: record.birthDate || "—"
                                                                                                }, void 0, false, {
                                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                    lineNumber: 3343,
                                                                                                    columnNumber: 37
                                                                                                }, this)
                                                                                            ]
                                                                                        }, record.id, true, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3328,
                                                                                            columnNumber: 35
                                                                                        }, this))
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 3326,
                                                                                    columnNumber: 31
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 3325,
                                                                                columnNumber: 29
                                                                            }, this)
                                                                        ]
                                                                    }, group.classCourse, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 3306,
                                                                        columnNumber: 27
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                lineNumber: 3304,
                                                                columnNumber: 23
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                        lineNumber: 3283,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3282,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "space-y-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                                                    title: isVi ? "Tìm trong ca thi" : "Search this session",
                                                                    subtitle: isVi ? "Lọc theo MSSV, họ tên, lớp môn học, lớp sinh hoạt." : "Filter by student ID, name, course class, or student class."
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 3358,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "mt-3",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                        value: activeSessionSearch,
                                                                        onChange: (e)=>setActiveSessionSearch(e.target.value),
                                                                        className: "app-input h-12 text-sm",
                                                                        placeholder: isVi ? "Tìm MSSV, họ tên, lớp..." : "Search student ID, name, class..."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 3370,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 3369,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3357,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card-strong)] p-4",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "mb-3 flex flex-wrap items-center justify-between gap-3",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SectionTitle, {
                                                                        title: isVi ? `Danh sách sinh viên (${activeSessionFilteredRecords.length})` : `Students (${activeSessionFilteredRecords.length})`,
                                                                        subtitle: isVi ? "Bảng đầy đủ sau khi áp dụng tìm kiếm trong modal." : "Full table after applying the in-modal search."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 3387,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 3386,
                                                                    columnNumber: 23
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "overflow-x-auto rounded-2xl border border-[var(--border-main)]",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                                                        className: "min-w-[980px] w-full text-sm",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                                    className: "bg-[var(--bg-soft)] text-left",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "px-4 py-3 font-bold",
                                                                                            children: isVi ? "MSSV" : "Student ID"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3405,
                                                                                            columnNumber: 31
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "px-4 py-3 font-bold",
                                                                                            children: isVi ? "Họ tên" : "Name"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3408,
                                                                                            columnNumber: 31
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "px-4 py-3 font-bold",
                                                                                            children: isVi ? "Lớp môn học" : "Course class"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3411,
                                                                                            columnNumber: 31
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "px-4 py-3 font-bold",
                                                                                            children: isVi ? "Lớp sinh hoạt" : "Student class"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3414,
                                                                                            columnNumber: 31
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                                                            className: "px-4 py-3 font-bold",
                                                                                            children: isVi ? "Ngày sinh" : "Birth date"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                            lineNumber: 3417,
                                                                                            columnNumber: 31
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                    lineNumber: 3404,
                                                                                    columnNumber: 29
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 3403,
                                                                                columnNumber: 27
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                                                                children: activeSessionFilteredRecords.map((record)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                                                        className: "border-t border-[var(--border-main)]/70",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "px-4 py-3",
                                                                                                children: record.studentId || "—"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 3428,
                                                                                                columnNumber: 33
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "px-4 py-3",
                                                                                                children: record.studentName || "—"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 3431,
                                                                                                columnNumber: 33
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "px-4 py-3",
                                                                                                children: record.classCourse || "—"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 3434,
                                                                                                columnNumber: 33
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "px-4 py-3",
                                                                                                children: record.classStudent || "—"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 3437,
                                                                                                columnNumber: 33
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                                                                className: "px-4 py-3",
                                                                                                children: record.birthDate || "—"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                                lineNumber: 3440,
                                                                                                columnNumber: 33
                                                                                            }, this)
                                                                                        ]
                                                                                    }, record.id, true, {
                                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                        lineNumber: 3424,
                                                                                        columnNumber: 31
                                                                                    }, this))
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                                lineNumber: 3422,
                                                                                columnNumber: 27
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                        lineNumber: 3402,
                                                                        columnNumber: 25
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                                    lineNumber: 3401,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                            lineNumber: 3385,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                                    lineNumber: 3356,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                            lineNumber: 3281,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                                    lineNumber: 3168,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                            lineNumber: 3137,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                        lineNumber: 3136,
                        columnNumber: 11
                    }, this) : null
                ]
            }, void 0, true, {
                fileName: "[project]/apps/web/src/app/(app)/exams/page.tsx",
                lineNumber: 2037,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s1(ExamsPage, "JXAVOL5jHLL0CEst9ruvq7EbyiM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$react$2d$i18next$40$15$2e$7$2e$4_i18nex_2cb1b8d79cc72435b3673ef4f52e90d5$2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$useTranslation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTranslation"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c18 = ExamsPage;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11, _c12, _c13, _c14, _c15, _c16, _c17, _c18;
__turbopack_context__.k.register(_c, "ActionHint");
__turbopack_context__.k.register(_c1, "SectionTitle");
__turbopack_context__.k.register(_c2, "SearchIcon");
__turbopack_context__.k.register(_c3, "LayersIcon");
__turbopack_context__.k.register(_c4, "SortIcon");
__turbopack_context__.k.register(_c5, "RoomIcon");
__turbopack_context__.k.register(_c6, "CampusIcon");
__turbopack_context__.k.register(_c7, "XIcon");
__turbopack_context__.k.register(_c8, "ChevronDownIcon");
__turbopack_context__.k.register(_c9, "BellIcon");
__turbopack_context__.k.register(_c10, "CheckCircleIcon");
__turbopack_context__.k.register(_c11, "InfoIcon");
__turbopack_context__.k.register(_c12, "WarningIcon");
__turbopack_context__.k.register(_c13, "SelectField");
__turbopack_context__.k.register(_c14, "FilterChip");
__turbopack_context__.k.register(_c15, "SyncedHorizontalTable");
__turbopack_context__.k.register(_c16, "DisplayModeBar");
__turbopack_context__.k.register(_c17, "ToastViewport");
__turbopack_context__.k.register(_c18, "ExamsPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_web_src_6eaad442._.js.map