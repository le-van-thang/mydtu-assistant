// apps/api/src/routes/analytics.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

export const analyticsRouter = Router();

function toGpa4(t: { gpa4: number | null; score10: number | null }): number | null {
  if (typeof t.gpa4 === "number") return t.gpa4;

  if (typeof t.score10 === "number") {
    const x = t.score10;
    if (x >= 8.5) return 4.0;
    if (x >= 8.0) return 3.5;
    if (x >= 7.0) return 3.0;
    if (x >= 6.5) return 2.5;
    if (x >= 5.5) return 2.0;
    if (x >= 5.0) return 1.5;
    if (x >= 4.0) return 1.0;
    return 0.0;
  }

  return null;
}

function round2(n: number) {
  return Number(n.toFixed(2));
}

function calcWeightedGpa(items: Array<{ credits: number; gpa4: number }>) {
  let sum = 0;
  let credits = 0;
  for (const it of items) {
    sum += it.gpa4 * it.credits;
    credits += it.credits;
  }
  const gpa4 = credits > 0 ? sum / credits : 0;
  return { gpa4, credits, sum };
}

async function getUserByEmail(userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

// GET /analytics/gpa?userEmail=...&semester=...
analyticsRouter.get("/gpa", async (req, res, next) => {
  try {
    const q = z
      .object({
        userEmail: z.string().email(),
        semester: z.string().optional(),
      })
      .parse(req.query);

    const user = await getUserByEmail(q.userEmail);

    const transcripts = await prisma.transcript.findMany({
      where: {
        userId: user.id,
        ...(q.semester ? { semester: q.semester } : {}),
      },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    const used: any[] = [];
    const skipped: any[] = [];

    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const gpa4 = toGpa4({ gpa4: t.gpa4 as any, score10: t.score10 as any });

      const isPassed = t.status === "passed";
      const okCredits = credits > 0;
      const okGpa = typeof gpa4 === "number";

      if (isPassed && okCredits && okGpa) {
        used.push({
          courseCode: t.courseCode,
          courseName: t.courseName,
          credits,
          gpa4: t.gpa4,
          score10: t.score10,
          status: t.status,
          semester: t.semester,
          usedGpa4: gpa4,
        });
      } else {
        skipped.push({
          courseCode: t.courseCode,
          courseName: t.courseName,
          credits,
          gpa4: t.gpa4,
          score10: t.score10,
          status: t.status,
          semester: t.semester,
          reason: !isPassed ? "status_not_passed" : !okCredits ? "invalid_credits" : "missing_gpa",
        });
      }
    }

    const { gpa4, credits } = calcWeightedGpa(
      used.map((x) => ({ credits: x.credits, gpa4: x.usedGpa4 }))
    );

    res.json({
      ok: true,
      scope: q.semester ? { semester: q.semester } : { all: true },
      gpa4: round2(gpa4),
      credits,
      usedCount: used.length,
      skippedCount: skipped.length,
      used,
      skipped,
    });
  } catch (e) {
    next(e);
  }
});

// GET /analytics/gpa/summary?userEmail=...
analyticsRouter.get("/gpa/summary", async (req, res, next) => {
  try {
    const q = z.object({ userEmail: z.string().email() }).parse(req.query);

    const user = await getUserByEmail(q.userEmail);

    const transcripts = await prisma.transcript.findMany({
      where: { userId: user.id },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    const bySemester = new Map<
      string,
      Array<{ courseCode: string; courseName: string | null; credits: number; usedGpa4: number }>
    >();

    const skipped: any[] = [];

    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const gpa4 = toGpa4({ gpa4: t.gpa4 as any, score10: t.score10 as any });

      const isPassed = t.status === "passed";
      const okCredits = credits > 0;
      const okGpa = typeof gpa4 === "number";

      if (!(isPassed && okCredits && okGpa)) {
        skipped.push({
          semester: t.semester,
          courseCode: t.courseCode,
          courseName: t.courseName,
          credits,
          gpa4: t.gpa4,
          score10: t.score10,
          status: t.status,
          reason: !isPassed ? "status_not_passed" : !okCredits ? "invalid_credits" : "missing_gpa",
        });
        continue;
      }

      if (!bySemester.has(t.semester)) bySemester.set(t.semester, []);
      bySemester.get(t.semester)!.push({
        courseCode: t.courseCode,
        courseName: t.courseName,
        credits,
        usedGpa4: gpa4!,
      });
    }

    const semesters = Array.from(bySemester.keys()).sort();

    const perSemester = semesters.map((sem) => {
      const items = bySemester.get(sem)!;
      const { gpa4, credits } = calcWeightedGpa(items.map((x) => ({ credits: x.credits, gpa4: x.usedGpa4 })));
      return { semester: sem, gpa4: round2(gpa4), credits, courses: items.length };
    });

    const cumulative: Array<{ semester: string; gpa4: number; credits: number }> = [];
    let cumItems: Array<{ credits: number; gpa4: number }> = [];

    for (const s of perSemester) {
      const items = bySemester.get(s.semester)!;
      cumItems = cumItems.concat(items.map((x) => ({ credits: x.credits, gpa4: x.usedGpa4 })));
      const { gpa4, credits } = calcWeightedGpa(cumItems);
      cumulative.push({ semester: s.semester, gpa4: round2(gpa4), credits });
    }

    const overall = calcWeightedGpa(cumItems);

    res.json({
      ok: true,
      userEmail: q.userEmail,
      overall: { gpa4: round2(overall.gpa4), credits: overall.credits },
      perSemester,
      cumulative,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (e) {
    next(e);
  }
});

// GET /analytics/goal?userEmail=...&targetGpa4=...&remainingCredits=...
analyticsRouter.get("/goal", async (req, res, next) => {
  try {
    const q = z
      .object({
        userEmail: z.string().email(),
        targetGpa4: z.coerce.number().min(0).max(4),
        remainingCredits: z.coerce.number().int().positive(),
      })
      .parse(req.query);

    const user = await getUserByEmail(q.userEmail);

    const transcripts = await prisma.transcript.findMany({
      where: { userId: user.id },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    const used: Array<{ credits: number; gpa4: number }> = [];

    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const gpa4 = toGpa4({ gpa4: t.gpa4 as any, score10: t.score10 as any });
      if (t.status === "passed" && credits > 0 && typeof gpa4 === "number") used.push({ credits, gpa4 });
    }

    const current = calcWeightedGpa(used);
    const rem = q.remainingCredits;
    const target = q.targetGpa4;

    const requiredAvgRaw = (target * (current.credits + rem) - current.sum) / rem;
    const requiredAvg = round2(requiredAvgRaw);

    let feasibility: "reachable" | "need_perfect" | "impossible" | "already_reached";
    if (requiredAvg > 4) feasibility = "impossible";
    else if (requiredAvg === 4) feasibility = "need_perfect";
    else if (requiredAvg < 0) feasibility = "already_reached";
    else feasibility = "reachable";

    const notes =
      feasibility === "impossible"
        ? "Target quá cao so với số tín chỉ còn lại (cần GPA > 4.0)."
        : feasibility === "need_perfect"
        ? "Có thể đạt nhưng phải đạt GPA 4.0 cho toàn bộ tín chỉ còn lại."
        : feasibility === "already_reached"
        ? "Target thấp hơn GPA hiện tại (bạn đã đạt)."
        : "OK";

    res.json({
      ok: true,
      userEmail: q.userEmail,
      current: { gpa4: round2(current.gpa4), credits: current.credits },
      target: { gpa4: target, remainingCredits: rem },
      requiredAverageGpa4ForRemaining: requiredAvg,
      feasibility,
      notes,
    });
  } catch (e) {
    next(e);
  }
});

// GET /analytics/goal/scenarios?userEmail=...&remainingCredits=...&targets=...
analyticsRouter.get("/goal/scenarios", async (req, res, next) => {
  try {
    const q = z
      .object({
        userEmail: z.string().email(),
        remainingCredits: z.coerce.number().int().positive(),
        targets: z.string().optional(),
      })
      .parse(req.query);

    const user = await getUserByEmail(q.userEmail);

    const transcripts = await prisma.transcript.findMany({
      where: { userId: user.id },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    const used: Array<{ credits: number; gpa4: number }> = [];
    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const gpa4 = toGpa4({ gpa4: t.gpa4 as any, score10: t.score10 as any });
      if (t.status === "passed" && credits > 0 && typeof gpa4 === "number") used.push({ credits, gpa4 });
    }

    const current = calcWeightedGpa(used);
    const rem = q.remainingCredits;

    const targets =
      q.targets?.split(",").map((x) => Number(x.trim())).filter((x) => !Number.isNaN(x)) ??
      [2.8, 3.0, 3.2, 3.5, 3.8, 4.0];

    const scenarios = targets.map((targetGpa4) => {
      const requiredAvg = round2((targetGpa4 * (current.credits + rem) - current.sum) / rem);

      let feasibility: "reachable" | "need_perfect" | "impossible" | "already_reached";
      if (requiredAvg > 4) feasibility = "impossible";
      else if (requiredAvg === 4) feasibility = "need_perfect";
      else if (requiredAvg < 0) feasibility = "already_reached";
      else feasibility = "reachable";

      return { targetGpa4, requiredAverageGpa4ForRemaining: requiredAvg, feasibility };
    });

    res.json({
      ok: true,
      userEmail: q.userEmail,
      current: { gpa4: round2(current.gpa4), credits: current.credits },
      remainingCredits: rem,
      scenarios,
    });
  } catch (e) {
    next(e);
  }
});

// GET /analytics/goal/plan?userEmail=...&targetGpa4=...&remainingCredits=...&creditsPerTerm=...
analyticsRouter.get("/goal/plan", async (req, res, next) => {
  try {
    const q = z
      .object({
        userEmail: z.string().email(),
        targetGpa4: z.coerce.number().min(0).max(4),
        remainingCredits: z.coerce.number().int().positive(),
        creditsPerTerm: z.coerce.number().int().positive(),
        maxTermGpa4: z.coerce.number().min(0).max(4).optional(),
      })
      .parse(req.query);

    const user = await getUserByEmail(q.userEmail);

    const transcripts = await prisma.transcript.findMany({
      where: { userId: user.id },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    const used: Array<{ credits: number; gpa4: number }> = [];
    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const gpa4 = toGpa4({ gpa4: t.gpa4 as any, score10: t.score10 as any });
      if (t.status === "passed" && credits > 0 && typeof gpa4 === "number") used.push({ credits, gpa4 });
    }

    const current = calcWeightedGpa(used);
    const rem = q.remainingCredits;
    const target = q.targetGpa4;

    const requiredAvg = round2((target * (current.credits + rem) - current.sum) / rem);
    const maxG = q.maxTermGpa4 ?? 4;

    const terms: Array<{ termIndex: number; credits: number; requiredAvgGpa4: number }> = [];
    let left = rem;
    let idx = 1;

    while (left > 0) {
      const c = Math.min(left, q.creditsPerTerm);
      terms.push({ termIndex: idx++, credits: c, requiredAvgGpa4: requiredAvg });
      left -= c;
    }

    const feasibleWithCap = requiredAvg <= maxG;

    res.json({
      ok: true,
      userEmail: q.userEmail,
      current: { gpa4: round2(current.gpa4), credits: current.credits },
      target: { gpa4: target, remainingCredits: rem },
      requiredAverageGpa4ForRemaining: requiredAvg,
      plan: {
        creditsPerTerm: q.creditsPerTerm,
        terms,
        maxTermGpa4: maxG,
        feasibleWithCap,
        note: feasibleWithCap ? "OK" : `Theo giới hạn maxTermGpa4=${maxG}, kế hoạch không đạt (cần TB mỗi kỳ > ${maxG}).`,
      },
    });
  } catch (e) {
    next(e);
  }
});
