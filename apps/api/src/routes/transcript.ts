// path: apps/api/src/routes/transcript.ts
import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";

export const transcriptRouter = Router();

transcriptRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const semester = String(req.query.semester || "").trim();

    const items = await prisma.transcript.findMany({
      where: {
        userId,
        ...(semester ? { semester } : {}),
      },
      orderBy: [
        { semester: "asc" },
        { courseCode: "asc" },
        { classCode: "asc" },
        { createdAt: "asc" },
      ],
    });

    const lastSynced = await prisma.importSession.findFirst({
      where: {
        userId,
        adapterKey: "mydtu_transcript_v1",
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
      message: e?.message ?? "Load transcript failed",
    });
  }
});