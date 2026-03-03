// file: apps/api/src/routes/data.ts

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

export const dataRouter = Router();

const qUserEmail = z.object({
  userEmail: z.string().email(),
});

const qUserEmailSemester = z.object({
  userEmail: z.string().email(),
  semester: z.string().optional(),
});

async function requireUserIdByEmail(userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    return null;
  }
  return user.id;
}

function notFound(res: any, userEmail: string) {
  return res.status(404).json({ ok: false, error: "User not found", userEmail });
}

// GET /data/transcripts?userEmail=...&semester=...
dataRouter.get("/transcripts", async (req, res, next) => {
  try {
    const q = qUserEmailSemester.parse(req.query);
    const userId = await requireUserIdByEmail(q.userEmail);
    if (!userId) return notFound(res, q.userEmail);

    const items = await prisma.transcript.findMany({
      where: {
        userId,
        ...(q.semester ? { semester: q.semester } : {}),
      },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    res.json({
      ok: true,
      userEmail: q.userEmail,
      scope: q.semester ? { semester: q.semester } : { all: true },
      count: items.length,
      items,
    });
  } catch (e) {
    next(e);
  }
});

// GET /data/timetables?userEmail=...&semester=...
dataRouter.get("/timetables", async (req, res, next) => {
  try {
    const q = qUserEmailSemester.parse(req.query);
    const userId = await requireUserIdByEmail(q.userEmail);
    if (!userId) return notFound(res, q.userEmail);

    const items = await prisma.timetable.findMany({
      where: {
        userId,
        ...(q.semester ? { semester: q.semester } : {}),
      },
      orderBy: [{ semester: "asc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    res.json({
      ok: true,
      userEmail: q.userEmail,
      scope: q.semester ? { semester: q.semester } : { all: true },
      count: items.length,
      items,
    });
  } catch (e) {
    next(e);
  }
});

// GET /data/sections?userEmail=...&semester=...
dataRouter.get("/sections", async (req, res, next) => {
  try {
    const q = qUserEmailSemester.parse(req.query);
    const userId = await requireUserIdByEmail(q.userEmail);
    if (!userId) return notFound(res, q.userEmail);

    const items = await prisma.classSection.findMany({
      where: {
        userId,
        ...(q.semester ? { semester: q.semester } : {}),
      },
      orderBy: [{ semester: "asc" }, { classCode: "asc" }],
    });

    res.json({
      ok: true,
      userEmail: q.userEmail,
      scope: q.semester ? { semester: q.semester } : { all: true },
      count: items.length,
      items,
    });
  } catch (e) {
    next(e);
  }
});

// GET /data/evaluations?userEmail=...&semester=...
dataRouter.get("/evaluations", async (req, res, next) => {
  try {
    const q = qUserEmailSemester.parse(req.query);
    const userId = await requireUserIdByEmail(q.userEmail);
    if (!userId) return notFound(res, q.userEmail);

    const items = await prisma.evaluationDraft.findMany({
      where: {
        userId,
        ...(q.semester ? { semester: q.semester } : {}),
      },
      orderBy: [{ semester: "asc" }, { courseCode: "asc" }],
    });

    res.json({
      ok: true,
      userEmail: q.userEmail,
      scope: q.semester ? { semester: q.semester } : { all: true },
      count: items.length,
      items,
    });
  } catch (e) {
    next(e);
  }
});

// GET /data/import-sessions?userEmail=...
dataRouter.get("/import-sessions", async (req, res, next) => {
  try {
    const q = qUserEmail.parse(req.query);
    const userId = await requireUserIdByEmail(q.userEmail);
    if (!userId) return notFound(res, q.userEmail);

    const items = await prisma.importSession.findMany({
      where: { userId },
      orderBy: [{ startedAt: "desc" }],
    });

    res.json({
      ok: true,
      userEmail: q.userEmail,
      count: items.length,
      items,
    });
  } catch (e) {
    next(e);
  }
});
