// path: apps/api/src/routes/exams.ts

import { ExamPlanType, Prisma } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../db";

export const examsRouter = Router();

function toIsoDateOnly(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

examsRouter.get("/", async (req, res) => {
  const userId = String(req.query.userId || "");
  const planTypeParam = String(req.query.planType || "");
  const courseCode = String(req.query.courseCode || "");
  const studentId = String(req.query.studentId || "");

  if (!userId) {
    return res.status(400).json({
      ok: false,
      error: "Missing query param userId",
    });
  }

  const planType =
    planTypeParam === "tentative"
      ? ExamPlanType.tentative
      : planTypeParam === "official"
      ? ExamPlanType.official
      : undefined;

  const where: Prisma.ExamRecordWhereInput = {
    userId,
    isSuperseded: false,
    ...(planType ? { planType } : {}),
    ...(courseCode
      ? {
          courseCode: {
            contains: courseCode,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {}),
    ...(studentId
      ? {
          studentId: {
            contains: studentId,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {}),
  };

  const items = await prisma.examRecord.findMany({
    where,
    orderBy: [{ examDate: "asc" }, { startTime: "asc" }, { courseCode: "asc" }],
    take: 5000,
  });

  return res.json({
    ok: true,
    items: items.map((item) => ({
      ...item,
      publishedAtDate: toIsoDateOnly(item.publishedAtDate),
      examDate: toIsoDateOnly(item.examDate),
      birthDate: toIsoDateOnly(item.birthDate),
    })),
  });
});