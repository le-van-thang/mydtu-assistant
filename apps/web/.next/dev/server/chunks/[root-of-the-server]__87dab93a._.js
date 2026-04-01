module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/apps/web/src/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "signToken",
    ()=>signToken,
    "verifyToken",
    ()=>verifyToken
]);
// apps/web/src/lib/auth.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jsonwebtoken$40$9$2e$0$2e$3$2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/jsonwebtoken@9.0.3/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
;
function getJwtSecret() {
    const s = process.env.JWT_SECRET;
    if (!s) {
        throw new Error("Missing env JWT_SECRET (check apps/web/.env.local)");
    }
    return s;
}
function signToken(payload) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jsonwebtoken$40$9$2e$0$2e$3$2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sign(payload, getJwtSecret(), {
        expiresIn: "7d"
    });
}
function verifyToken(token) {
    const decoded = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$jsonwebtoken$40$9$2e$0$2e$3$2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, getJwtSecret());
    if (typeof decoded === "string") {
        throw new Error("Invalid token payload");
    }
    const obj = decoded;
    if (!obj.id || !obj.role) {
        throw new Error("Invalid token payload shape");
    }
    return {
        id: String(obj.id),
        role: obj.role === "admin" ? "admin" : "user"
    };
}
}),
"[project]/apps/web/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
// apps/web/src/lib/prisma.ts
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$prisma$2b$client$40$6$2e$19$2e$2_prism_6b2b1af085fe6797f5a5ea830937a8e3$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/.pnpm/@prisma+client@6.19.2_prism_6b2b1af085fe6797f5a5ea830937a8e3/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$prisma$2b$client$40$6$2e$19$2e$2_prism_6b2b1af085fe6797f5a5ea830937a8e3$2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time truthy", 1) ? [
        "query",
        "error",
        "warn"
    ] : "TURBOPACK unreachable"
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/apps/web/src/lib/settings/prefs.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// path: apps/web/src/lib/settings/prefs.ts
__turbopack_context__.s([
    "SETTINGS_EVENT",
    ()=>SETTINGS_EVENT,
    "applyPrefsToDom",
    ()=>applyPrefsToDom,
    "broadcastSettingsUpdated",
    ()=>broadcastSettingsUpdated,
    "clearSettingsPrefs",
    ()=>clearSettingsPrefs,
    "defaultSettingsPrefs",
    ()=>defaultSettingsPrefs,
    "downloadJsonFile",
    ()=>downloadJsonFile,
    "formatDate",
    ()=>formatDate,
    "formatDateTime",
    ()=>formatDateTime,
    "normalizeSettingsPrefs",
    ()=>normalizeSettingsPrefs,
    "persistSettingsPatchToServer",
    ()=>persistSettingsPatchToServer,
    "readSettingsPrefs",
    ()=>readSettingsPrefs,
    "updateSettingsPrefsClient",
    ()=>updateSettingsPrefsClient,
    "writeSettingsPrefs",
    ()=>writeSettingsPrefs
]);
const STORAGE_KEY = "mydtu.settings.v1";
const SETTINGS_EVENT = "mydtu:settings-updated";
const defaultSettingsPrefs = {
    theme: "system",
    language: "vi",
    density: "comfortable",
    notifications: {
        emailAlerts: true,
        webPush: false,
        timetableReminders: true,
        deadlineReminders: true,
        gradeAlerts: true,
        weeklySummary: false
    },
    privacy: {
        rememberDevice: true,
        analyticsOptIn: false
    },
    data: {
        onboardingDismissed: false,
        lastManualSyncAt: null,
        lastExportAt: null
    }
};
function isObject(value) {
    return typeof value === "object" && value !== null;
}
function clonePrefs(value) {
    return JSON.parse(JSON.stringify(value));
}
function mergePrefs(input) {
    const base = clonePrefs(defaultSettingsPrefs);
    if (!isObject(input)) return base;
    if (input.theme === "light" || input.theme === "dark" || input.theme === "system") {
        base.theme = input.theme;
    }
    if (input.language === "vi" || input.language === "en") {
        base.language = input.language;
    }
    if (input.density === "comfortable" || input.density === "compact") {
        base.density = input.density;
    }
    if (isObject(input.notifications)) {
        base.notifications.emailAlerts = typeof input.notifications.emailAlerts === "boolean" ? input.notifications.emailAlerts : base.notifications.emailAlerts;
        base.notifications.webPush = typeof input.notifications.webPush === "boolean" ? input.notifications.webPush : base.notifications.webPush;
        base.notifications.timetableReminders = typeof input.notifications.timetableReminders === "boolean" ? input.notifications.timetableReminders : base.notifications.timetableReminders;
        base.notifications.deadlineReminders = typeof input.notifications.deadlineReminders === "boolean" ? input.notifications.deadlineReminders : base.notifications.deadlineReminders;
        base.notifications.gradeAlerts = typeof input.notifications.gradeAlerts === "boolean" ? input.notifications.gradeAlerts : base.notifications.gradeAlerts;
        base.notifications.weeklySummary = typeof input.notifications.weeklySummary === "boolean" ? input.notifications.weeklySummary : base.notifications.weeklySummary;
    }
    if (isObject(input.privacy)) {
        base.privacy.rememberDevice = typeof input.privacy.rememberDevice === "boolean" ? input.privacy.rememberDevice : base.privacy.rememberDevice;
        base.privacy.analyticsOptIn = typeof input.privacy.analyticsOptIn === "boolean" ? input.privacy.analyticsOptIn : base.privacy.analyticsOptIn;
    }
    if (isObject(input.data)) {
        base.data.onboardingDismissed = typeof input.data.onboardingDismissed === "boolean" ? input.data.onboardingDismissed : base.data.onboardingDismissed;
        base.data.lastManualSyncAt = typeof input.data.lastManualSyncAt === "string" || input.data.lastManualSyncAt === null ? input.data.lastManualSyncAt : base.data.lastManualSyncAt;
        base.data.lastExportAt = typeof input.data.lastExportAt === "string" || input.data.lastExportAt === null ? input.data.lastExportAt : base.data.lastExportAt;
    }
    return base;
}
function normalizeSettingsPrefs(input) {
    return mergePrefs(input);
}
function readSettingsPrefs() {
    if ("TURBOPACK compile-time truthy", 1) return clonePrefs(defaultSettingsPrefs);
    //TURBOPACK unreachable
    ;
}
function writeSettingsPrefs(prefs) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function clearSettingsPrefs() {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function applyPrefsToDom(prefs, setTheme) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function broadcastSettingsUpdated(detail) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function updateSettingsPrefsClient(updater, options) {
    const prev = readSettingsPrefs();
    const next = normalizeSettingsPrefs(updater(clonePrefs(prev)));
    writeSettingsPrefs(next);
    applyPrefsToDom(next, options?.setTheme);
    broadcastSettingsUpdated({
        settings: next,
        user: options?.user,
        source: options?.source ?? "client-update"
    });
    return next;
}
async function persistSettingsPatchToServer(patch) {
    try {
        await fetch("/api/settings", {
            method: "PATCH",
            headers: {
                "content-type": "application/json"
            },
            cache: "no-store",
            body: JSON.stringify(patch)
        });
    } catch  {
    // im lặng, UI local vẫn chạy bình thường
    }
}
function downloadJsonFile(filename, data) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const blob = undefined;
    const url = undefined;
    const a = undefined;
}
function formatDateTime(value, locale = "vi-VN", fallback = "Chưa có") {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}
function formatDate(value, locale = "vi-VN", fallback = "Chưa có") {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium"
    }).format(date);
}
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/apps/web/src/app/api/settings/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "PATCH",
    ()=>PATCH,
    "PUT",
    ()=>PUT
]);
// path: apps/web/src/app/api/settings/route.ts
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/prisma.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$settings$2f$prefs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/web/src/lib/settings/prefs.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/headers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.1.6_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
;
;
;
;
;
;
const FullSettingsPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    theme: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "light",
        "dark",
        "system"
    ]),
    language: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "vi",
        "en"
    ]),
    density: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "comfortable",
        "compact"
    ]),
    notifications: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        emailAlerts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        webPush: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        timetableReminders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        deadlineReminders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        gradeAlerts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        weeklySummary: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    }),
    privacy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        rememberDevice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        analyticsOptIn: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    }),
    data: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        onboardingDismissed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        lastManualSyncAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable(),
        lastExportAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable()
    }),
    avatarDataUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(2_000_000).nullable().optional()
});
const PartialSettingsPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    theme: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "light",
        "dark",
        "system"
    ]).optional(),
    language: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "vi",
        "en"
    ]).optional(),
    density: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "comfortable",
        "compact"
    ]).optional(),
    notifications: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        emailAlerts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        webPush: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        timetableReminders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        deadlineReminders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        gradeAlerts: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        weeklySummary: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional()
    }).optional(),
    privacy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        rememberDevice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        analyticsOptIn: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional()
    }).optional(),
    data: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        onboardingDismissed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
        lastManualSyncAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().optional(),
        lastExportAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().nullable().optional()
    }).optional(),
    avatarDataUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(2_000_000).nullable().optional()
});
async function getCurrentUserId() {
    const token = (await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["cookies"])()).get("token")?.value;
    if (!token) return null;
    try {
        const payload = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["verifyToken"])(token);
        return payload.id;
    } catch  {
        return null;
    }
}
function toDateOrNull(value) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
}
async function getUserWithSettings(userId) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            settings: {
                select: {
                    theme: true,
                    language: true,
                    density: true,
                    emailAlerts: true,
                    webPush: true,
                    timetableReminders: true,
                    deadlineReminders: true,
                    gradeAlerts: true,
                    weeklySummary: true,
                    rememberDevice: true,
                    analyticsOptIn: true,
                    onboardingDismissed: true,
                    lastManualSyncAt: true,
                    lastExportAt: true,
                    avatarDataUrl: true
                }
            }
        }
    });
}
function shapeResponse(user) {
    if (!user) return null;
    const settings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$settings$2f$prefs$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeSettingsPrefs"])({
        theme: user.settings?.theme,
        language: user.settings?.language,
        density: user.settings?.density,
        notifications: {
            emailAlerts: user.settings?.emailAlerts,
            webPush: user.settings?.webPush,
            timetableReminders: user.settings?.timetableReminders,
            deadlineReminders: user.settings?.deadlineReminders,
            gradeAlerts: user.settings?.gradeAlerts,
            weeklySummary: user.settings?.weeklySummary
        },
        privacy: {
            rememberDevice: user.settings?.rememberDevice,
            analyticsOptIn: user.settings?.analyticsOptIn
        },
        data: {
            onboardingDismissed: user.settings?.onboardingDismissed,
            lastManualSyncAt: user.settings?.lastManualSyncAt?.toISOString() ?? null,
            lastExportAt: user.settings?.lastExportAt?.toISOString() ?? null
        }
    });
    return {
        ok: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarDataUrl: user.settings?.avatarDataUrl ?? null
        },
        settings
    };
}
async function GET() {
    const userId = await getCurrentUserId();
    if (!userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "UNAUTHORIZED"
        }, {
            status: 401
        });
    }
    const user = await getUserWithSettings(userId);
    if (!user) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "USER_NOT_FOUND"
        }, {
            status: 404
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(shapeResponse(user));
}
async function PUT(req) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "UNAUTHORIZED"
        }, {
            status: 401
        });
    }
    try {
        const raw = await req.json();
        const data = FullSettingsPayloadSchema.parse(raw);
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].userSettings.upsert({
            where: {
                userId
            },
            create: {
                userId,
                theme: data.theme,
                language: data.language,
                density: data.density,
                emailAlerts: data.notifications.emailAlerts,
                webPush: data.notifications.webPush,
                timetableReminders: data.notifications.timetableReminders,
                deadlineReminders: data.notifications.deadlineReminders,
                gradeAlerts: data.notifications.gradeAlerts,
                weeklySummary: data.notifications.weeklySummary,
                rememberDevice: data.privacy.rememberDevice,
                analyticsOptIn: data.privacy.analyticsOptIn,
                onboardingDismissed: data.data.onboardingDismissed,
                lastManualSyncAt: toDateOrNull(data.data.lastManualSyncAt),
                lastExportAt: toDateOrNull(data.data.lastExportAt),
                avatarDataUrl: data.avatarDataUrl ?? null
            },
            update: {
                theme: data.theme,
                language: data.language,
                density: data.density,
                emailAlerts: data.notifications.emailAlerts,
                webPush: data.notifications.webPush,
                timetableReminders: data.notifications.timetableReminders,
                deadlineReminders: data.notifications.deadlineReminders,
                gradeAlerts: data.notifications.gradeAlerts,
                weeklySummary: data.notifications.weeklySummary,
                rememberDevice: data.privacy.rememberDevice,
                analyticsOptIn: data.privacy.analyticsOptIn,
                onboardingDismissed: data.data.onboardingDismissed,
                lastManualSyncAt: toDateOrNull(data.data.lastManualSyncAt),
                lastExportAt: toDateOrNull(data.data.lastExportAt),
                avatarDataUrl: data.avatarDataUrl ?? null
            }
        });
        const user = await getUserWithSettings(userId);
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: "USER_NOT_FOUND"
            }, {
                status: 404
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(shapeResponse(user));
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: "VALIDATION_ERROR",
                details: error.flatten()
            }, {
                status: 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "INTERNAL_ERROR",
            message: error?.message ?? "Error"
        }, {
            status: 500
        });
    }
}
async function PATCH(req) {
    const userId = await getCurrentUserId();
    if (!userId) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "UNAUTHORIZED"
        }, {
            status: 401
        });
    }
    try {
        const raw = await req.json();
        const patch = PartialSettingsPayloadSchema.parse(raw);
        const currentUser = await getUserWithSettings(userId);
        if (!currentUser) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: "USER_NOT_FOUND"
            }, {
                status: 404
            });
        }
        const current = {
            theme: currentUser.settings?.theme ?? "system",
            language: currentUser.settings?.language ?? "vi",
            density: currentUser.settings?.density ?? "comfortable",
            emailAlerts: currentUser.settings?.emailAlerts ?? true,
            webPush: currentUser.settings?.webPush ?? false,
            timetableReminders: currentUser.settings?.timetableReminders ?? true,
            deadlineReminders: currentUser.settings?.deadlineReminders ?? true,
            gradeAlerts: currentUser.settings?.gradeAlerts ?? true,
            weeklySummary: currentUser.settings?.weeklySummary ?? false,
            rememberDevice: currentUser.settings?.rememberDevice ?? true,
            analyticsOptIn: currentUser.settings?.analyticsOptIn ?? false,
            onboardingDismissed: currentUser.settings?.onboardingDismissed ?? false,
            lastManualSyncAt: currentUser.settings?.lastManualSyncAt ?? null,
            lastExportAt: currentUser.settings?.lastExportAt ?? null,
            avatarDataUrl: currentUser.settings?.avatarDataUrl ?? null
        };
        await __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$web$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].userSettings.upsert({
            where: {
                userId
            },
            create: {
                userId,
                theme: patch.theme ?? current.theme,
                language: patch.language ?? current.language,
                density: patch.density ?? current.density,
                emailAlerts: patch.notifications?.emailAlerts ?? current.emailAlerts,
                webPush: patch.notifications?.webPush ?? current.webPush,
                timetableReminders: patch.notifications?.timetableReminders ?? current.timetableReminders,
                deadlineReminders: patch.notifications?.deadlineReminders ?? current.deadlineReminders,
                gradeAlerts: patch.notifications?.gradeAlerts ?? current.gradeAlerts,
                weeklySummary: patch.notifications?.weeklySummary ?? current.weeklySummary,
                rememberDevice: patch.privacy?.rememberDevice ?? current.rememberDevice,
                analyticsOptIn: patch.privacy?.analyticsOptIn ?? current.analyticsOptIn,
                onboardingDismissed: patch.data?.onboardingDismissed ?? current.onboardingDismissed,
                lastManualSyncAt: patch.data?.lastManualSyncAt !== undefined ? toDateOrNull(patch.data.lastManualSyncAt) : current.lastManualSyncAt,
                lastExportAt: patch.data?.lastExportAt !== undefined ? toDateOrNull(patch.data.lastExportAt) : current.lastExportAt,
                avatarDataUrl: patch.avatarDataUrl !== undefined ? patch.avatarDataUrl : current.avatarDataUrl
            },
            update: {
                theme: patch.theme ?? current.theme,
                language: patch.language ?? current.language,
                density: patch.density ?? current.density,
                emailAlerts: patch.notifications?.emailAlerts ?? current.emailAlerts,
                webPush: patch.notifications?.webPush ?? current.webPush,
                timetableReminders: patch.notifications?.timetableReminders ?? current.timetableReminders,
                deadlineReminders: patch.notifications?.deadlineReminders ?? current.deadlineReminders,
                gradeAlerts: patch.notifications?.gradeAlerts ?? current.gradeAlerts,
                weeklySummary: patch.notifications?.weeklySummary ?? current.weeklySummary,
                rememberDevice: patch.privacy?.rememberDevice ?? current.rememberDevice,
                analyticsOptIn: patch.privacy?.analyticsOptIn ?? current.analyticsOptIn,
                onboardingDismissed: patch.data?.onboardingDismissed ?? current.onboardingDismissed,
                lastManualSyncAt: patch.data?.lastManualSyncAt !== undefined ? toDateOrNull(patch.data.lastManualSyncAt) : current.lastManualSyncAt,
                lastExportAt: patch.data?.lastExportAt !== undefined ? toDateOrNull(patch.data.lastExportAt) : current.lastExportAt,
                avatarDataUrl: patch.avatarDataUrl !== undefined ? patch.avatarDataUrl : current.avatarDataUrl
            }
        });
        const user = await getUserWithSettings(userId);
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: "USER_NOT_FOUND"
            }, {
                status: 404
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(shapeResponse(user));
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$zod$40$3$2e$25$2e$76$2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                ok: false,
                error: "VALIDATION_ERROR",
                details: error.flatten()
            }, {
                status: 400
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$1$2e$6_react$2d$dom$40$19$2e$2$2e$4_react$40$19$2e$2$2e$4_$5f$react$40$19$2e$2$2e$4$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            ok: false,
            error: "INTERNAL_ERROR",
            message: error?.message ?? "Error"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__87dab93a._.js.map