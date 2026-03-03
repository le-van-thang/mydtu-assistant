// file: packages/shared/src/academic/gradeDistribution.ts

export type GradePlanCourse = {
  courseCode: string;
  credits: number;
};
  
export type GradePlanItem = {
  courseCode: string;
  credits: number;
  gpa4: number;
  letter: string;
};

export type GradePlan = {
  avgGpa4: number;
  totalCredits: number;
  items: GradePlanItem[];
};

// DTU scale theo PDF (khong co D+)
const GRADE_SCALE: Array<{ letter: string; gpa4: number }> = [
  { letter: "A+", gpa4: 4.0 },
  { letter: "A", gpa4: 4.0 },
  { letter: "A-", gpa4: 3.65 },
  { letter: "B+", gpa4: 3.33 },
  { letter: "B", gpa4: 3.0 },
  { letter: "B-", gpa4: 2.65 },
  { letter: "C+", gpa4: 2.33 },
  { letter: "C", gpa4: 2.0 },
  { letter: "C-", gpa4: 1.65 },
  { letter: "D", gpa4: 1.0 },
  { letter: "F", gpa4: 0.0 },
];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function weightedAvg(items: Array<{ credits: number; gpa4: number }>) {
  let sum = 0;
  let credits = 0;
  for (const it of items) {
    const c = Number(it.credits);
    if (!Number.isFinite(c) || c <= 0) continue;
    sum += it.gpa4 * c;
    credits += c;
  }
  return { avg: credits > 0 ? sum / credits : 0, sum, credits };
}

/**
 * Build some feasible grade distributions to reach required GPA (4.0 scale)
 * It returns a small set of candidate plans (not exhaustive), good enough for UI suggestions.
 */
export function buildGradeDistributionOptions(input: {
  requiredGpa: number;
  courses: GradePlanCourse[];
  limit?: number; // default 20
}) {
  const requiredGpa = Number(input.requiredGpa);
  const courses = Array.isArray(input.courses) ? input.courses : [];
  const limit = Number.isFinite(input.limit as any) ? Number(input.limit) : 20;

  if (!Number.isFinite(requiredGpa) || requiredGpa < 0 || requiredGpa > 4) {
    throw new Error("requiredGpa must be in [0, 4]");
  }

  const cleanCourses = courses
    .map((c) => ({ courseCode: String(c.courseCode), credits: Number(c.credits) }))
    .filter((c) => c.courseCode && Number.isFinite(c.credits) && c.credits > 0);

  if (cleanCourses.length === 0) return [];

  // Sort bigger credits first to reduce branching
  cleanCourses.sort((a, b) => b.credits - a.credits);

  // Candidate gpa points near target first (to find solutions faster)
  const gradePoints = [...GRADE_SCALE]
    .sort((a, b) => Math.abs(a.gpa4 - requiredGpa) - Math.abs(b.gpa4 - requiredGpa))
    // keep only a subset to avoid explosion, still diverse
    .slice(0, 7);

  const plans: GradePlan[] = [];
  const seen = new Set<string>();

  // DFS with pruning
  const maxNodes = 25000;
  let nodes = 0;

  const totalCredits = cleanCourses.reduce((s, c) => s + c.credits, 0);
  const needSum = requiredGpa * totalCredits;

  function dfs(i: number, acc: GradePlanItem[], accSum: number, accCredits: number) {
    if (plans.length >= limit) return;
    if (nodes++ > maxNodes) return;

    if (i === cleanCourses.length) {
      const { avg } = weightedAvg(acc.map((x) => ({ credits: x.credits, gpa4: x.gpa4 })));
      if (avg + 1e-9 >= requiredGpa) {
        const key = acc.map((x) => `${x.courseCode}:${x.letter}`).join("|");
        if (!seen.has(key)) {
          seen.add(key);
          plans.push({
            avgGpa4: round2(avg),
            totalCredits: accCredits,
            items: acc,
          });
        }
      }
      return;
    }

    const course = cleanCourses[i];

    // optimistic upper bound: all remaining = 4.0
    const remainingCredits = cleanCourses.slice(i).reduce((s, c) => s + c.credits, 0);
    const maxPossibleSum = accSum + 4.0 * remainingCredits;
    if (maxPossibleSum + 1e-9 < needSum) return;

    for (const g of gradePoints) {
      const next = acc.concat({
        courseCode: course.courseCode,
        credits: course.credits,
        gpa4: g.gpa4,
        letter: g.letter,
      });

      dfs(i + 1, next, accSum + g.gpa4 * course.credits, accCredits + course.credits);
      if (plans.length >= limit) return;
    }
  }

  dfs(0, [], 0, 0);

  // sort: closer to required (smallest avg above required) first
  plans.sort((a, b) => a.avgGpa4 - b.avgGpa4 || a.items.length - b.items.length);
  return plans.slice(0, limit);
}
