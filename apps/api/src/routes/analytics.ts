// file: apps/api/src/routes/analytics.ts

import { buildGradeDistributionOptions, normalizeGpa4, round2 } from "@mydtu/shared";
import { CourseStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

export const analyticsRouter = Router();

async function getUserByEmail(userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

// chỉ tính GPA cho các môn đã “chốt điểm”
function isCountedForGpa(status: CourseStatus) {
  return (
    status === CourseStatus.passed ||
    status === CourseStatus.failed ||
    status === CourseStatus.retaken ||
    status === CourseStatus.absent_final ||
    status === CourseStatus.banned_final
  );
}

function calcWeightedGpa(items: Array<{ credits: number; gpa4: number }>) {
  let sum = 0;
  let credits = 0;

  for (const it of items) {
    const c = Number(it.credits);
    if (!Number.isFinite(c) || c <= 0) continue;

    const g = Number(it.gpa4);
    if (!Number.isFinite(g)) continue;

    sum += g * c;
    credits += c;
  }

  const gpa4 = credits > 0 ? sum / credits : null;
  return { gpa4, credits, sum };
}

function requiredAverageForTarget(params: {
  currentCredits: number;
  currentWeightedSum: number;
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

  let feasibility: "reachable" | "need_perfect" | "impossible" | "already_reached";
  if (requiredAvg > 4) feasibility = "impossible";
  else if (requiredAvg === 4) feasibility = "need_perfect";
  else if (requiredAvg < 0) feasibility = "already_reached";
  else feasibility = "reachable";

  return { requiredAvg, feasibility };
}

// ==========================
// GET /analytics/gpa
// ==========================
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
      where: { userId: user.id, ...(q.semester ? { semester: q.semester } : {}) },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    const used: any[] = [];
    const skipped: any[] = [];

    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const okCredits = Number.isFinite(credits) && credits > 0;

      // nếu môn chưa chốt điểm thì skip
      if (!isCountedForGpa(t.status)) {
        skipped.push({
          courseCode: t.courseCode,
          courseName: t.courseName,
          credits,
          score10: t.score10,
          letter: t.letter ?? null,
          gpa4Stored: t.gpa4,
          status: t.status,
          semester: t.semester,
          reason: "status_not_counted",
        });
        continue;
      }

      const g = normalizeGpa4({
        gpa4: (t.gpa4 as any) ?? null,
        score10: (t.score10 as any) ?? null,
        letter: (t.letter as any) ?? null,
        status: (t.status as any) ?? null,
        finalScore: (t as any).finalScore ?? null, // nếu DB chưa có field này thì normalize sẽ ignore
      });

      // ✅ narrowing để TS hiểu chắc chắn number
      if (okCredits && typeof g.gpa4 === "number" && Number.isFinite(g.gpa4)) {
        used.push({
          courseCode: t.courseCode,
          courseName: t.courseName,
          credits,
          score10: t.score10,
          letter: t.letter ?? null,
          gpa4Stored: t.gpa4,
          status: t.status,
          semester: t.semester,
          usedGpa4: g.gpa4,
          reason: g.reason ?? null,
        });
      } else {
        skipped.push({
          courseCode: t.courseCode,
          courseName: t.courseName,
          credits,
          score10: t.score10,
          letter: t.letter ?? null,
          gpa4Stored: t.gpa4,
          status: t.status,
          semester: t.semester,
          reason: !okCredits ? "invalid_credits" : "missing_gpa",
        });
      }
    }

    const overall = calcWeightedGpa(used.map((x) => ({ credits: x.credits, gpa4: x.usedGpa4 })));

    res.json({
      ok: true,
      scope: q.semester ? { semester: q.semester } : { all: true },
      gpa4: overall.gpa4 === null ? null : round2(overall.gpa4),
      credits: overall.credits,
      usedCount: used.length,
      skippedCount: skipped.length,
      used,
      skipped,
    });
  } catch (e) {
    next(e);
  }
});

// ==========================
// GET /analytics/gpa/summary
// ==========================
analyticsRouter.get("/gpa/summary", async (req, res, next) => {
  try {
    const q = z.object({ userEmail: z.string().email() }).parse(req.query);

    const user = await getUserByEmail(q.userEmail);

    const transcripts = await prisma.transcript.findMany({
      where: { userId: user.id },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    const bySemester = new Map<string, Array<{ credits: number; gpa4: number }>>();
    const skipped: any[] = [];

    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const okCredits = Number.isFinite(credits) && credits > 0;

      if (!isCountedForGpa(t.status)) {
        skipped.push({
          semester: t.semester,
          courseCode: t.courseCode,
          courseName: t.courseName,
          credits,
          score10: t.score10,
          letter: t.letter ?? null,
          gpa4Stored: t.gpa4,
          status: t.status,
          reason: "status_not_counted",
        });
        continue;
      }

      const g = normalizeGpa4({
        gpa4: (t.gpa4 as any) ?? null,
        score10: (t.score10 as any) ?? null,
        letter: (t.letter as any) ?? null,
        status: (t.status as any) ?? null,
        finalScore: (t as any).finalScore ?? null,
      });

      if (!(okCredits && typeof g.gpa4 === "number" && Number.isFinite(g.gpa4))) {
        skipped.push({
          semester: t.semester,
          courseCode: t.courseCode,
          courseName: t.courseName,
          credits,
          score10: t.score10,
          letter: t.letter ?? null,
          gpa4Stored: t.gpa4,
          status: t.status,
          reason: !okCredits ? "invalid_credits" : "missing_gpa",
        });
        continue;
      }

      if (!bySemester.has(t.semester)) bySemester.set(t.semester, []);
      bySemester.get(t.semester)!.push({ credits, gpa4: g.gpa4 });
    }

    const semesters = Array.from(bySemester.keys()).sort();

    const perSemester = semesters.map((sem) => {
      const items = bySemester.get(sem)!;
      const r = calcWeightedGpa(items);
      return { semester: sem, gpa4: r.gpa4 === null ? null : round2(r.gpa4), credits: r.credits, courses: items.length };
    });

    let cumItems: Array<{ credits: number; gpa4: number }> = [];
    const cumulative = semesters.map((sem) => {
      cumItems = cumItems.concat(bySemester.get(sem)!);
      const r = calcWeightedGpa(cumItems);
      return { semester: sem, gpa4: r.gpa4 === null ? null : round2(r.gpa4), credits: r.credits };
    });

    const overall = calcWeightedGpa(cumItems);

    res.json({
      ok: true,
      userEmail: q.userEmail,
      overall: { gpa4: overall.gpa4 === null ? null : round2(overall.gpa4), credits: overall.credits },
      perSemester,
      cumulative,
      skippedCount: skipped.length,
      skipped,
    });
  } catch (e) {
    next(e);
  }
});

// ==========================
// GET /analytics/goal
// ==========================
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
      const okCredits = Number.isFinite(credits) && credits > 0;

      if (!isCountedForGpa(t.status)) continue;

      const g = normalizeGpa4({
        gpa4: (t.gpa4 as any) ?? null,
        score10: (t.score10 as any) ?? null,
        letter: (t.letter as any) ?? null,
        status: (t.status as any) ?? null,
        finalScore: (t as any).finalScore ?? null,
      });

      if (okCredits && typeof g.gpa4 === "number" && Number.isFinite(g.gpa4)) {
        used.push({ credits, gpa4: g.gpa4 });
      }
    }

    const current = calcWeightedGpa(used);

    const { requiredAvg, feasibility } = requiredAverageForTarget({
      currentCredits: current.credits,
      currentWeightedSum: current.sum,
      remainingCredits: q.remainingCredits,
      targetGpa4: q.targetGpa4,
    });

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
      current: { gpa4: current.gpa4 === null ? null : round2(current.gpa4), credits: current.credits },
      target: { gpa4: q.targetGpa4, remainingCredits: q.remainingCredits },
      requiredAverageGpa4ForRemaining: requiredAvg,
      feasibility,
      notes,
    });
  } catch (e) {
    next(e);
  }
});

// ==========================
// POST /analytics/goal/grade-options
// ==========================
analyticsRouter.post("/goal/grade-options", async (req, res, next) => {
  try {
    const body = z
      .object({
        requiredGpa: z.number().min(0).max(4),
        courses: z.array(
          z.object({
            courseCode: z.string(),
            credits: z.number().int().positive(),
          })
        ),
      })
      .parse(req.body);

    const plans = buildGradeDistributionOptions({
      requiredGpa: body.requiredGpa,
      courses: body.courses,
    });

    res.json({ ok: true, requiredGpa: body.requiredGpa, plans });
  } catch (e) {
    next(e);
  }
});
