// apps/api/src/logic/academic.ts

export type Feasibility = "reachable" | "need_perfect" | "impossible" | "already_reached";

export function normalizeLetter(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!s) return null;

  // PF / special => not counted
  if (s === "P" || s === "I" || s === "X" || s === "R") return null;

  return s;
}

export function letterToGpa4(letter: unknown): number | null {
  const s = normalizeLetter(letter);
  if (!s) return null;

  switch (s) {
    case "A+":
    case "A":
      return 4.0;
    case "A-":
      return 3.65;
    case "B+":
      return 3.33;
    case "B":
      return 3.0;
    case "B-":
      return 2.65;
    case "C+":
      return 2.33;
    case "C":
      return 2.0;
    case "C-":
      return 1.65;
    case "D":
      return 1.0;
    case "F":
      return 0.0;
    default:
      return null;
  }
}

/**
 * DTU score10 -> GPA4 (theo PDF):
 * 9.5–10 A+ (4.0)
 * 8.5–9.4 A  (4.0)
 * 8.0–8.4 A- (3.65)
 * 7.5–7.9 B+ (3.33)
 * 7.0–7.4 B  (3.0)
 * 6.5–6.9 B- (2.65)
 * 6.0–6.4 C+ (2.33)
 * 5.5–5.9 C  (2.0)
 * 4.5–5.4 C- (1.65)
 * 4.0–4.4 D  (1.0)
 * 0.0–3.9 F  (0.0)
 */
export function score10ToGpa4(score10: unknown): number | null {
  if (typeof score10 !== "number" || Number.isNaN(score10)) return null;

  // clamp a bit: nếu input lỡ >10 hoặc <0 thì coi như invalid
  if (score10 < 0 || score10 > 10) return null;

  const x = score10;

  if (x >= 9.5) return 4.0; // A+
  if (x >= 8.5) return 4.0; // A
  if (x >= 8.0) return 3.65; // A-
  if (x >= 7.5) return 3.33; // B+
  if (x >= 7.0) return 3.0; // B
  if (x >= 6.5) return 2.65; // B-
  if (x >= 6.0) return 2.33; // C+
  if (x >= 5.5) return 2.0; // C
  if (x >= 4.5) return 1.65; // C-
  if (x >= 4.0) return 1.0; // D
  return 0.0; // F
}

function isAutoF(args: { status?: unknown; score10?: unknown; finalScore?: unknown }) {
  const st = String(args.status ?? "").trim();

  // absent_final / banned_final => F
  if (st === "absent_final" || st === "banned_final") return true;

  // total score < 4.0 => F
  if (typeof args.score10 === "number" && Number.isFinite(args.score10) && args.score10 < 4.0) return true;

  // finalScore < 1.0 => F
  if (typeof args.finalScore === "number" && Number.isFinite(args.finalScore) && args.finalScore < 1.0) return true;

  return false;
}

export function toGpa4(t: {
  gpa4: number | null;
  score10: number | null;
  letter?: string | null;
  status?: string | null;
  finalScore?: number | null;
}): number | null {
  // 0) auto-F override
  if (isAutoF({ status: t.status, score10: t.score10, finalScore: t.finalScore })) return 0.0;

  // 1) if already stored gpa4, trust it
  if (typeof t.gpa4 === "number" && !Number.isNaN(t.gpa4)) return t.gpa4;

  // 2) prefer letter if available
  const fromLetter = letterToGpa4(t.letter);
  if (typeof fromLetter === "number") return fromLetter;

  // 3) fallback to score10 mapping
  const fromScore10 = score10ToGpa4(t.score10);
  if (typeof fromScore10 === "number") return fromScore10;

  return null;
}

export function round2(n: number): number {
  return Number(n.toFixed(2));
}

export function calcWeightedGpa(items: Array<{ credits: number; gpa4: number }>) {
  let sum = 0;
  let credits = 0;

  for (const it of items) {
    const c = Number(it.credits);
    if (!Number.isFinite(c) || c <= 0) continue;

    sum += it.gpa4 * c;
    credits += c;
  }

  const gpa4 = credits > 0 ? sum / credits : 0;
  return { gpa4, credits, sum };
}

export function requiredAverageForTarget(params: {
  currentCredits: number;
  currentWeightedSum: number; // Σ(gpa4 * credits)
  remainingCredits: number;
  targetGpa4: number;
}) {
  const { currentCredits, currentWeightedSum, remainingCredits, targetGpa4 } = params;

  if (!Number.isFinite(remainingCredits) || remainingCredits <= 0) {
    throw new Error("remainingCredits must be positive");
  }

  const requiredAvgRaw =
    (targetGpa4 * (currentCredits + remainingCredits) - currentWeightedSum) / remainingCredits;

  const requiredAvg = round2(requiredAvgRaw);

  let feasibility: Feasibility;
  if (requiredAvg > 4) feasibility = "impossible";
  else if (requiredAvg === 4) feasibility = "need_perfect";
  else if (requiredAvg < 0) feasibility = "already_reached";
  else feasibility = "reachable";

  return { requiredAvg, feasibility };
}
