import crypto from "crypto";

export function sha256Json(input: unknown) {
  const json = JSON.stringify(input, Object.keys(input as any).sort());
  return crypto.createHash("sha256").update(json).digest("hex");
}