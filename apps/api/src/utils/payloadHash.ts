// file: apps/api/src/utils/payloadHash.ts

import crypto from "crypto";

function stableStringify(value: any): string {
  if (value === null) return "null";

  const t = typeof value;

  if (t === "number") {
    if (!Number.isFinite(value)) return "null";
    return String(value);
  }

  if (t === "boolean") return value ? "true" : "false";
  if (t === "string") return JSON.stringify(value);

  if (t === "undefined" || t === "function" || t === "symbol") return "null";

  if (Array.isArray(value)) {
    const items = value.map((v) => {
      if (v === undefined || typeof v === "function" || typeof v === "symbol") return "null";
      return stableStringify(v);
    });
    return `[${items.join(",")}]`;
  }

  if (t === "object") {
    const keys = Object.keys(value).sort();
    const parts: string[] = [];

    for (const k of keys) {
      const v = value[k];
      if (v === undefined || typeof v === "function" || typeof v === "symbol") continue;
      parts.push(`${JSON.stringify(k)}:${stableStringify(v)}`);
    }

    return `{${parts.join(",")}}`;
  }

  return "null";
}

export function sha256Payload(obj: unknown): string {
  const s = stableStringify(obj);
  return crypto.createHash("sha256").update(s).digest("hex");
}
