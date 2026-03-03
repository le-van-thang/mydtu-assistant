// file: packages/shared/src/academic.ts

export type TranscriptStatus =
  | "passed"
  | "failed"
  | "retaken"
  | "in_progress"
  | "unknown"
  | "absent_final"
  | "banned_final";

export type ScoreComponent = { score: number; weight: number };
export type ComponentsBreakdownRecord = Record<string, ScoreComponent>;

export type ComponentsBreakdown = Partial<{
  // diem thanh phan (0..10)
  A: number;
  P: number;
  Q: number;
  H: number;
  L: number;
  M: number;
  I: number;
  G: number;
  F: number;

  // trong so (%)
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

export function round1(n: number) {
  return Number(n.toFixed(1));
}

/** Tinh D theo dang A/a ... neu co */
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
  return round2(sum / 100);
}

/** Tinh D theo record {key:{score,weight}} */
export function calcCourseScore10FromRecord(m?: unknown): number | null {
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

/** Wrapper: record thi tinh record, khong thi fallback A/a */
export function calcCourseScore10Any(b?: unknown): number | null {
  if (b && typeof b === "object") {
    const maybe = b as any;
    const firstKey = Object.keys(maybe)[0];
    if (
      firstKey &&
      typeof maybe[firstKey] === "object" &&
      maybe[firstKey] &&
      "score" in maybe[firstKey] &&
      "weight" in maybe[firstKey]
    ) {
      return calcCourseScore10FromRecord(b);
    }
  }
  return calcCourseScore10(b);
}

export function normalizeLetter(letterRaw: string): string {
  return letterRaw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isAutoF(args: { status?: string | null; score10?: number | null; finalScore?: number | null }) {
  const st = (args.status ?? null)?.toString();

  // theo PDF: vang thi / cam thi cuoi ky => rot (F)
  if (st === "absent_final" || st === "banned_final") return true;

  // theo PDF: diem tong ket hoc phan < 4.0 => F
  if (typeof args.score10 === "number" && args.score10 < 4.0) return true;

  // theo PDF: diem ket thuc hoc phan < 1.0 => F
  if (typeof args.finalScore === "number" && args.finalScore < 1.0) return true;

  if (st === "failed" || st === "F") return true;

  return false;
}

/**
 * Bang quy doi DTU (PDF):
 * 9.5-10.0 A+ | 8.5-9.4 A | 8.0-8.4 A- | 7.5-7.9 B+ | 7.0-7.4 B
 * 6.5-6.9 B- | 6.0-6.4 C+ | 5.5-5.9 C | 4.5-5.4 C- | 4.0-4.4 D | 0-3.9 F
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
  if (x >= 4.0) return "D";
  return "F";
}

export function letterToGpa4(letterRaw: string): number | null {
  const L = normalizeLetter(letterRaw);

  // khong tinh GPA
  if (L === "P" || L === "I" || L === "X" || L === "R") return null;

  if (L === "A+" || L === "A") return 4.0;
  if (L === "A-") return 3.65;

  if (L === "B+") return 3.33;
  if (L === "B") return 3.0;
  if (L === "B-") return 2.65;

  if (L === "C+") return 2.33;
  if (L === "C") return 2.0;
  if (L === "C-") return 1.65;

  if (L === "D") return 1.0;

  return 0.0;
}

/**
 * Chuan hoa ra GPA4 de tinh GPA
 * Uu tien:
 * 1) autoF => 0
 * 2) gpa4 co san
 * 3) letter -> gpa4
 * 4) score10 -> letter -> gpa4
 */
export function normalizeGpa4(args: {
  gpa4?: number | null;
  letter?: string | null;
  score10?: number | null;
  status?: string | null;
  finalScore?: number | null;
}): { gpa4: number | null; reason?: string } {
  if (
    isAutoF({
      status: args.status,
      score10: args.score10 ?? null,
      finalScore: args.finalScore ?? null,
    })
  ) {
    return { gpa4: 0, reason: "auto_f" };
  }

  if (typeof args.gpa4 === "number" && Number.isFinite(args.gpa4)) return { gpa4: args.gpa4 };

  if (args.letter) return { gpa4: letterToGpa4(args.letter), reason: "from_letter" };

  if (typeof args.score10 === "number") {
    const letter = score10ToLetter(args.score10);
    return { gpa4: letterToGpa4(letter), reason: "from_score10" };
  }

  return { gpa4: null, reason: "missing_all" };
}
