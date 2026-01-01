import crypto from "crypto";

/**
 * Stable stringify: sort key để JSON luôn ra cùng chuỗi => hash ổn định.
 */
function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }

  const keys = Object.keys(value).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(value[k]))
      .join(",") +
    "}"
  );
}

export function sha256Payload(obj: any): string {
  const s = stableStringify(obj);
  return crypto.createHash("sha256").update(s).digest("hex");
}
