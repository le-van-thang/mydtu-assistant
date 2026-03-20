// path: apps/api/src/routes/transcriptDetail.ts
import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";

export const transcriptDetailRouter = Router();

function normalizeSpace(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

transcriptDetailRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const semester = normalizeSpace(req.query.semester || "");
    const courseCode = normalizeSpace(req.query.courseCode || "");
    const classCode = normalizeSpace(req.query.classCode || "");
    const search = normalizeSpace(req.query.search || "");

    const items = await prisma.transcriptComponent.findMany({
      where: {
        userId,
        ...(semester ? { semester } : {}),
        ...(courseCode ? { courseCode } : {}),
        ...(classCode ? { classCode } : {}),
        ...(search
          ? {
              OR: [
                { courseCode: { contains: search, mode: "insensitive" } },
                { classCode: { contains: search, mode: "insensitive" } },
                { courseName: { contains: search, mode: "insensitive" } },
                { componentLabel: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        transcript: {
          select: {
            id: true,
            credits: true,
            score10: true,
            letter: true,
            gpa4: true,
            status: true,
            semester: true,
            courseCode: true,
            classCode: true,
            courseName: true,
            componentsBreakdown: true,
          },
        },
      },
      orderBy: [
        { semester: "desc" },
        { courseCode: "asc" },
        { classCode: "asc" },
        { displayOrder: "asc" },
      ],
    });

    const lastSynced = await prisma.importSession.findFirst({
      where: {
        userId,
        adapterKey: "mydtu_transcript_detail_v1",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
        status: true,
        recordCounts: true,
      },
    });

    return res.json({
      ok: true,
      items,
      meta: {
        lastSyncedAt: lastSynced?.createdAt ?? null,
        lastSyncStatus: lastSynced?.status ?? null,
        lastSyncCounts: lastSynced?.recordCounts ?? null,
      },
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      message: e?.message ?? "Load transcript detail failed",
    });
  }
});