// file: apps/api/src/routes/analytics.ts

import { buildGradeDistributionOptions, normalizeGpa4, round2 } from "@mydtu/shared";
import { CourseStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";
import { extractStudentFeatures } from "../logic/advancedFeatureExtraction";

export const analyticsRouter = Router();

// ──────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ──────────────────────────────────────────────────────────────────

async function getUserByEmail(userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

/** chỉ tính GPA cho các môn đã "chốt điểm" */
function isCountedForGpa(status: CourseStatus) {
  return (
    status === CourseStatus.passed ||
    status === CourseStatus.failed ||
    status === CourseStatus.retaken ||
    status === CourseStatus.absent_final ||
    status === CourseStatus.banned_final
  );
}

function calcWeightedGpaLocal(items: Array<{ credits: number; gpa4: number }>) {
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

// ══════════════════════════════════════════════════════════════════
// EXISTING ROUTES
// ══════════════════════════════════════════════════════════════════

// ==========================
// GET /analytics/gpa
// ==========================
analyticsRouter.get("/gpa", async (req, res, next) => {
  try {
    const q = z
      .object({ userEmail: z.string().email(), semester: z.string().optional() })
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

      if (!isCountedForGpa(t.status)) {
        skipped.push({ courseCode: t.courseCode, courseName: t.courseName, credits, score10: t.score10, letter: t.letter ?? null, gpa4Stored: t.gpa4, status: t.status, semester: t.semester, reason: "status_not_counted" });
        continue;
      }

      const g = normalizeGpa4({ gpa4: (t.gpa4 as any) ?? null, score10: (t.score10 as any) ?? null, letter: (t.letter as any) ?? null, status: (t.status as any) ?? null, finalScore: (t as any).finalScore ?? null });

      if (okCredits && typeof g.gpa4 === "number" && Number.isFinite(g.gpa4)) {
        used.push({ courseCode: t.courseCode, courseName: t.courseName, credits, score10: t.score10, letter: t.letter ?? null, gpa4Stored: t.gpa4, status: t.status, semester: t.semester, usedGpa4: g.gpa4, reason: g.reason ?? null });
      } else {
        skipped.push({ courseCode: t.courseCode, courseName: t.courseName, credits, score10: t.score10, letter: t.letter ?? null, gpa4Stored: t.gpa4, status: t.status, semester: t.semester, reason: !okCredits ? "invalid_credits" : "missing_gpa" });
      }
    }

    const overall = calcWeightedGpaLocal(used.map((x) => ({ credits: x.credits, gpa4: x.usedGpa4 })));
    res.json({ ok: true, scope: q.semester ? { semester: q.semester } : { all: true }, gpa4: overall.gpa4 === null ? null : round2(overall.gpa4), credits: overall.credits, usedCount: used.length, skippedCount: skipped.length, used, skipped });
  } catch (e) { next(e); }
});

// ==========================
// GET /analytics/gpa/summary
// ==========================
analyticsRouter.get("/gpa/summary", async (req, res, next) => {
  try {
    const q = z.object({ userEmail: z.string().email() }).parse(req.query);
    const user = await getUserByEmail(q.userEmail);
    const transcripts = await prisma.transcript.findMany({ where: { userId: user.id }, orderBy: [{ semester: "asc" }, { courseCode: "asc" }] });

    const bySemester = new Map<string, Array<{ credits: number; gpa4: number }>>();
    const skipped: any[] = [];

    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const okCredits = Number.isFinite(credits) && credits > 0;

      if (!isCountedForGpa(t.status)) { skipped.push({ semester: t.semester, courseCode: t.courseCode, courseName: t.courseName, credits, score10: t.score10, letter: t.letter ?? null, gpa4Stored: t.gpa4, status: t.status, reason: "status_not_counted" }); continue; }

      const g = normalizeGpa4({ gpa4: (t.gpa4 as any) ?? null, score10: (t.score10 as any) ?? null, letter: (t.letter as any) ?? null, status: (t.status as any) ?? null, finalScore: (t as any).finalScore ?? null });

      if (!(okCredits && typeof g.gpa4 === "number" && Number.isFinite(g.gpa4))) { skipped.push({ semester: t.semester, courseCode: t.courseCode, courseName: t.courseName, credits, score10: t.score10, letter: t.letter ?? null, gpa4Stored: t.gpa4, status: t.status, reason: !okCredits ? "invalid_credits" : "missing_gpa" }); continue; }

      if (!bySemester.has(t.semester)) bySemester.set(t.semester, []);
      bySemester.get(t.semester)!.push({ credits, gpa4: g.gpa4 });
    }

    const semesters = Array.from(bySemester.keys()).sort();
    const perSemester = semesters.map((sem) => { const items = bySemester.get(sem)!; const r = calcWeightedGpaLocal(items); return { semester: sem, gpa4: r.gpa4 === null ? null : round2(r.gpa4), credits: r.credits, courses: items.length }; });

    let cumItems: Array<{ credits: number; gpa4: number }> = [];
    const cumulative = semesters.map((sem) => { cumItems = cumItems.concat(bySemester.get(sem)!); const r = calcWeightedGpaLocal(cumItems); return { semester: sem, gpa4: r.gpa4 === null ? null : round2(r.gpa4), credits: r.credits }; });

    const overall = calcWeightedGpaLocal(cumItems);
    res.json({ ok: true, userEmail: q.userEmail, overall: { gpa4: overall.gpa4 === null ? null : round2(overall.gpa4), credits: overall.credits }, perSemester, cumulative, skippedCount: skipped.length, skipped });
  } catch (e) { next(e); }
});

// ==========================
// GET /analytics/goal
// ==========================
analyticsRouter.get("/goal", async (req, res, next) => {
  try {
    const q = z.object({ userEmail: z.string().email(), targetGpa4: z.coerce.number().min(0).max(4), remainingCredits: z.coerce.number().int().positive() }).parse(req.query);
    const user = await getUserByEmail(q.userEmail);
    const transcripts = await prisma.transcript.findMany({ where: { userId: user.id }, orderBy: [{ semester: "asc" }, { courseCode: "asc" }] });

    const used: Array<{ credits: number; gpa4: number }> = [];
    for (const t of transcripts) {
      const credits = Number(t.credits ?? 0);
      const okCredits = Number.isFinite(credits) && credits > 0;
      if (!isCountedForGpa(t.status)) continue;
      const g = normalizeGpa4({ gpa4: (t.gpa4 as any) ?? null, score10: (t.score10 as any) ?? null, letter: (t.letter as any) ?? null, status: (t.status as any) ?? null, finalScore: (t as any).finalScore ?? null });
      if (okCredits && typeof g.gpa4 === "number" && Number.isFinite(g.gpa4)) used.push({ credits, gpa4: g.gpa4 });
    }

    const current = calcWeightedGpaLocal(used);
    const { requiredAvg, feasibility } = requiredAverageForTarget({ currentCredits: current.credits, currentWeightedSum: current.sum, remainingCredits: q.remainingCredits, targetGpa4: q.targetGpa4 });
    const notes = feasibility === "impossible" ? "Target quá cao so với số tín chỉ còn lại (cần GPA > 4.0)." : feasibility === "need_perfect" ? "Có thể đạt nhưng phải đạt GPA 4.0 cho toàn bộ tín chỉ còn lại." : feasibility === "already_reached" ? "Target thấp hơn GPA hiện tại (bạn đã đạt)." : "OK";

    res.json({ ok: true, userEmail: q.userEmail, current: { gpa4: current.gpa4 === null ? null : round2(current.gpa4), credits: current.credits }, target: { gpa4: q.targetGpa4, remainingCredits: q.remainingCredits }, requiredAverageGpa4ForRemaining: requiredAvg, feasibility, notes });
  } catch (e) { next(e); }
});

// ==========================
// POST /analytics/goal/grade-options
// ==========================
analyticsRouter.post("/goal/grade-options", async (req, res, next) => {
  try {
    const body = z.object({ requiredGpa: z.number().min(0).max(4), courses: z.array(z.object({ courseCode: z.string(), credits: z.number().int().positive() })) }).parse(req.body);
    const plans = buildGradeDistributionOptions({ requiredGpa: body.requiredGpa, courses: body.courses });
    res.json({ ok: true, requiredGpa: body.requiredGpa, plans });
  } catch (e) { next(e); }
});

// ══════════════════════════════════════════════════════════════════
// ML GRADE PREDICTION ENDPOINTS (ThS/Linear Regression)
// ══════════════════════════════════════════════════════════════════

function calculatePredictedScore(feature: any) {
  // Base Score ($W_0$) = 1.5
  const W0 = 1.5;
  // Trọng số GPA ($W_1$) = 0.5 * cumulativeGPA_BeforeCourse
  const W1 = 0.5 * (feature.cumulativeGPA_BeforeCourse ?? 0);
  // Trọng số Môn tiên quyết ($W_2$) = 0.4 * prerequisiteScore 
  // (Nếu môn không có tiên quyết, lấy giá trị mặc định là cumulativeGPA_BeforeCourse)
  const pScore = feature.prerequisiteScore !== null ? feature.prerequisiteScore : (feature.cumulativeGPA_BeforeCourse ?? 0);
  const W2 = 0.4 * pScore;
  // Phạt quá tải tín chỉ ($W_3$) = Trừ đi (0.05 * totalCredits_ThatSemester)
  const W3 = 0.05 * (feature.totalCredits_ThatSemester ?? 0);
  // Phạt rớt môn ($W_4$) = Nếu hasFailedBefore là true, trừ đi 0.8 điểm.
  const W4 = feature.hasFailedBefore ? 0.8 : 0;

  // Công thức tổng: Score = W0 + W1 + W2 - W3 - W4
  let score = W0 + W1 + W2 - W3 - W4;
  
  // (Nếu Score > 10 thì gán bằng 10, nếu < 0 thì gán bằng 0)
  if (score > 10) score = 10;
  if (score < 0) score = 0;

  return Math.round(score * 100) / 100;
}

function calculateRiskLevel(score: number) {
  if (score < 4.0) return "High";
  if (score <= 6.9) return "Medium";
  return "Low";
}

/**
 * @route   GET /api/analytics/ml/predict/me
 * @desc    Tự lấy features từ DB và trả về dự đoán cho môn học
 * @access  Private (JWT)
 */
analyticsRouter.get("/ml/predict/me", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  try {
    // 1. Lấy tất cả các vector feature của sinh viên
    const allFeatures = await extractStudentFeatures(userId);

    if (allFeatures.length === 0) {
      return res.status(422).json({
        ok: false,
        message: "Không có dữ liệu học tập liên quan.",
      });
    }

    // Ở đây, ta sẽ trả về dự đoán cho danh sách môn học mới nhất (kỳ cuối cùng)
    const latestSemester = allFeatures[allFeatures.length - 1].semester;
    const currentFeatures = allFeatures.filter((f) => f.semester === latestSemester);

    let totalPredicted = 0;
    const perCourse = currentFeatures.map((f) => {
      const predictedScore = calculatePredictedScore(f);
      totalPredicted += predictedScore;
      return {
        courseCode: f.courseCode,
        predictedScore,
        riskLevel: calculateRiskLevel(predictedScore),
        features: f,
      };
    });

    const averagePredictedFinalScore = currentFeatures.length > 0 
      ? Math.round((totalPredicted / currentFeatures.length) * 100) / 100
      : 0;

    const baseFeature = currentFeatures[0];

    return res.json({
      ok: true,
      message: "Dự báo thành công dựa trên mô hình Hồi quy tuyến tính",
      featureSummary: {
        currentSemester: latestSemester,
        courseCount: currentFeatures.length,
        totalCredits: baseFeature?.totalCredits_ThatSemester || 0,
        cumulativeGPA: baseFeature?.cumulativeGPA_BeforeCourse || 0,
        recentGpaAvg: baseFeature?.cumulativeGPA_BeforeCourse || 0,
        totalFailedCourses: baseFeature?.hasFailedBefore ? 1 : 0,
        isComplete: true,
      },
      data: {
        predictedFinalScore: averagePredictedFinalScore,
        riskLevel: calculateRiskLevel(averagePredictedFinalScore),
        passProbability: averagePredictedFinalScore >= 5.0 ? 0.85 : 0.3,
        perCourse,
      },
    });
  } catch (err: any) {
    console.error("[analytics/ml/predict/me] error:", err);
    return res.status(500).json({
      ok: false,
      message: "Lỗi khi trích xuất dữ liệu hoặc tính toán dự đoán.",
      error: process.env.NODE_ENV !== "production" ? (err?.message ?? String(err)) : undefined,
    });
  }
});

