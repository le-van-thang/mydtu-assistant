// path: apps/web/src/lib/exams/cache.ts
import type { ParsedExamRecord } from "./parseWorkbook";

const DB_NAME = "mydtu-exams-db";
const DB_VERSION = 2;
const STORE_NAME = "exam-records";
const META_KEY = "mydtu-exams-meta-v1";

export type ExamsCacheMeta = {
  lastSyncedAt: string | null;
  lastNoticeCount: number;
  lastNotifiedIds: string[];
};

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function getDefaultMeta(): ExamsCacheMeta {
  return {
    lastSyncedAt: null,
    lastNoticeCount: 0,
    lastNotifiedIds: [],
  };
}

function deleteDb(): Promise<void> {
  if (!canUseIndexedDb()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(DB_NAME);

    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error || new Error("Failed to delete IndexedDB database."));
    request.onblocked = () =>
      reject(new Error("IndexedDB delete blocked. Please close other tabs of this app."));
  });
}

function openDbRaw(version = DB_VERSION): Promise<IDBDatabase> {
  if (!canUseIndexedDb()) {
    return Promise.reject(new Error("IndexedDB is not available in this environment."));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, version);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error("Failed to open IndexedDB."));
  });
}

async function openDb(): Promise<IDBDatabase> {
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

export async function readExamRecords(): Promise<ParsedExamRecord[]> {
  if (!canUseIndexedDb()) return [];

  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as ParsedExamRecord[]) || []);
      request.onerror = () =>
        reject(request.error || new Error("Failed to read exam records."));
    });
  } finally {
    db.close();
  }
}

export async function writeExamRecords(records: ParsedExamRecord[]): Promise<void> {
  if (!canUseIndexedDb()) return;

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      store.clear();
      for (const record of records) {
        store.put(record);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error || new Error("Failed to write exam records."));
      tx.onabort = () =>
        reject(tx.error || new Error("Transaction aborted while writing exam records."));
    });
  } finally {
    db.close();
  }
}

export async function clearExamRecords(): Promise<void> {
  if (!canUseIndexedDb()) return;

  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      store.clear();

      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error || new Error("Failed to clear exam records."));
      tx.onabort = () =>
        reject(tx.error || new Error("Transaction aborted while clearing exam records."));
    });
  } finally {
    db.close();
  }
}

export function readExamMeta(): ExamsCacheMeta {
  if (typeof window === "undefined") return getDefaultMeta();

  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return getDefaultMeta();

    const parsed = JSON.parse(raw) as Partial<ExamsCacheMeta>;
    return {
      lastSyncedAt: typeof parsed.lastSyncedAt === "string" ? parsed.lastSyncedAt : null,
      lastNoticeCount: Number.isFinite(parsed.lastNoticeCount)
        ? Number(parsed.lastNoticeCount)
        : 0,
      lastNotifiedIds: Array.isArray(parsed.lastNotifiedIds)
        ? parsed.lastNotifiedIds.filter((x): x is string => typeof x === "string")
        : [],
    };
  } catch {
    return getDefaultMeta();
  }
}

export function writeExamMeta(meta: ExamsCacheMeta): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(META_KEY, JSON.stringify(meta));
}