// packages/shared/src/academic.ts

export type TranscriptStatus =
  | "passed"
  | "failed"
  | "retaken"
  | "in_progress"
  | "unknown"
  | "absent_final"
  | "banned_final";

export type ComponentsBreakdown = Partial<{
  // điểm thành phần (0..10)
  A: number; // attendance / attitude
  P: number; // practice
  Q: number; // quiz
  H: number; // homework
  L: number; // lab
  M: number; // midterm
  I: number; // in-class
  G: number; // project/group
  F: number; // final

  // trọng số (%) tương ứng
  a: number;
  p: number;
  q: number;
  h: number;
  l: number;
  m: number;
  i: number;
  g: number;
  f: number;
}>;

export function round2(n: number) {
  return Number(n.toFixed(2));
}

/** Quy chế 43: làm tròn 1 chữ số thập phân (dùng để xếp Letter) */
export function round1(n: number) {
  return Number(n.toFixed(1));
}

/**
 * Tính điểm học phần Đ theo công thức:
 * Đ = (A*a + P*p + Q*q + H*h + L*l + M*m + I*i + G*g + F*f) / 100
 * - Nếu thiếu cặp điểm/trọng số thì coi như 0 cho phần đó.
 * - Nếu không có bất kỳ trọng số nào -> return null (không đủ dữ liệu)
 *
 * Lưu ý: bạn có thể giữ 2 chữ số để “không mất thông tin”.
 * Khi quy đổi letter thì sẽ round1 đúng như MyDTU.
 */
export function calcCourseScore10(b?: unknown): number | null {
  if (!b || typeof b !== "object") return null;
  const x = b as ComponentsBreakdown;

  const pairs: Array<[keyof ComponentsBreakdown, keyof ComponentsBreakdown]> = [
    ["A", "a"],
    ["P", "p"],
    ["Q", "q"],
    ["H", "h"],
    ["L", "l"],
    ["M", "m"],
    ["I", "i"],
    ["G", "g"],
    ["F", "f"],
  ];

  let hasAnyWeight = false;
  let sum = 0;

  for (const [scoreKey, weightKey] of pairs) {
    const score = typeof x[scoreKey] === "number" ? (x[scoreKey] as number) : 0;
    const w = typeof x[weightKey] === "number" ? (x[weightKey] as number) : 0;
    if (w > 0) hasAnyWeight = true;
    sum += score * w;
  }

  if (!hasAnyWeight) return null;

  // giữ 2 số để mapping ổn định (vd 9.46)
  return round2(sum / 100);
}

/** Luật F tự động theo prompt */
export function isAutoF(args: {
  status?: string | null;
  score10?: number | null; // Đ nếu có
  finalScore?: number | null; // F nếu có
}) {
  const st = (args.status ?? null)?.toString();

  // vắng thi / đình chỉ thi
  if (st === "absent_final" || st === "banned_final") return true;

  // Đ < 4.0
  if (typeof args.score10 === "number" && args.score10 < 4.0) return true;

  // Final < 1.0
  if (typeof args.finalScore === "number" && args.finalScore < 1.0) return true;

  // status failed
  if (st === "failed" || st === "F") return true;

  return false;
}

/**
 * Chuẩn hoá letter (MyDTU hay có "A-", "A -", ...)
 * + giữ luôn các ký hiệu không tính GPA như: P, I, X, R
 */
export function normalizeLetter(letterRaw: string): string {
  return letterRaw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ""); // "A -" -> "A-"
}

/**
 * DTU (theo ảnh bạn gửi):
 * - Quy đổi dựa trên điểm đã làm tròn 1 chữ số (vd 9.46 -> 9.5 -> A+)
 *
 * Mốc đang dùng (phù hợp với pattern bạn nói + dữ liệu trong ảnh):
 * 9.5-10  : A+
 * 8.5-9.4 : A
 * 8.0-8.4 : A-
 * 7.5-7.9 : B+
 * 7.0-7.4 : B
 * 6.5-6.9 : B-
 * 6.0-6.4 : C+
 * 5.5-5.9 : C
 * 4.5-5.4 : C-
 * 4.0-4.4 : D+
 * 3.5-3.9 : D
 * 0.0-3.4 : F
 *
 * (Nếu trường bạn có mốc khác ở D/D+/F thì bạn chỉnh 3 dòng cuối.)
 */
export function score10ToLetter(score10: number): string {
  const x = round1(score10);

  if (x >= 9.5) return "A+";
  if (x >= 8.5) return "A";
  if (x >= 8.0) return "A-";
  if (x >= 7.5) return "B+";
  if (x >= 7.0) return "B";
  if (x >= 6.5) return "B-";
  if (x >= 6.0) return "C+";
  if (x >= 5.5) return "C";
  if (x >= 4.5) return "C-";
  if (x >= 4.0) return "D+";
  if (x >= 3.5) return "D";
  return "F";
}

/**
 * Letter -> GPA4 theo MyDTU (đúng như ảnh bạn gửi):
 * A, A+ = 4.00
 * A-    = 3.65
 * B+    = 3.33
 * B     = 3.00
 * B-    = 2.65
 * C+    = 2.33
 * C     = 2.00
 * C-    = 1.65
 * D+    = 1.33
 * D     = 1.00
 * F     = 0.00
 *
 * Các loại không tính GPA: P (P/F), I, X, R -> null
 */
export function letterToGpa4(letterRaw: string): number | null {
  const L = normalizeLetter(letterRaw);

  // không tính GPA
  if (L === "P" || L === "I" || L === "X" || L === "R") return null;

  if (L === "A+" || L === "A") return 4.0;
  if (L === "A-") return 3.65;

  if (L === "B+") return 3.33;
  if (L === "B") return 3.0;
  if (L === "B-") return 2.65;

  if (L === "C+") return 2.33;
  if (L === "C") return 2.0;
  if (L === "C-") return 1.65;

  if (L === "D+") return 1.33;
  if (L === "D") return 1.0;

  return 0.0; // F và các case còn lại coi như F
}

/**
 * Chuẩn hoá ra GPA4 để tính GPA
 * Ưu tiên:
 * 1) autoF => 0
 * 2) gpa4 có sẵn
 * 3) letter -> gpa4
 * 4) score10 -> letter -> gpa4
 *
 * Lưu ý: nếu letter là P/I/X/R => gpa4=null (không tính vào GPA)
 */
export function normalizeGpa4(args: {
  gpa4?: number | null;
  letter?: string | null;
  score10?: number | null; // Đ
  status?: string | null;
  finalScore?: number | null;
}): { gpa4: number | null; reason?: string } {
  // autoF => gpa4 = 0
  if (
    isAutoF({
      status: args.status,
      score10: args.score10 ?? null,
      finalScore: args.finalScore ?? null,
    })
  ) {
    return { gpa4: 0, reason: "auto_f" };
  }

  if (typeof args.gpa4 === "number") return { gpa4: args.gpa4 };

  if (args.letter) {
    return { gpa4: letterToGpa4(args.letter), reason: "from_letter" };
  }

  if (typeof args.score10 === "number") {
    const letter = score10ToLetter(args.score10);
    return { gpa4: letterToGpa4(letter), reason: "from_score10" };
  }

  return { gpa4: null, reason: "missing_all" };
}
export type ScoreComponent = { score: number; weight: number };
export type ComponentsBreakdownRecord = Record<string, ScoreComponent>;

/** Tính Đ theo record {key:{score,weight}} */
export function calcCourseScore10FromRecord(
  m?: unknown
): number | null {
  if (!m || typeof m !== "object") return null;

  const rec = m as ComponentsBreakdownRecord;

  let hasAnyWeight = false;
  let sum = 0;

  for (const k of Object.keys(rec)) {
    const item = rec[k];
    if (!item) continue;

    const score = typeof item.score === "number" ? item.score : 0;
    const w = typeof item.weight === "number" ? item.weight : 0;

    if (w > 0) hasAnyWeight = true;
    sum += score * w;
  }

  if (!hasAnyWeight) return null;
  return round2(sum / 100);
}

/** Wrapper: nếu data là record thì tính record, còn không thì fallback kiểu A/a */
export function calcCourseScore10Any(b?: unknown): number | null {
  // record style
  if (b && typeof b === "object") {
    const maybe = b as any;
    const firstKey = Object.keys(maybe)[0];
    if (firstKey && typeof maybe[firstKey] === "object" && "score" in maybe[firstKey] && "weight" in maybe[firstKey]) {
      return calcCourseScore10FromRecord(b);
    }
  }
  // flat style
  return calcCourseScore10(b);
}
