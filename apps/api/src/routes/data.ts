import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";

export const dataRouter = Router();

// Query chung: filter theo userEmail hoặc userId
const QuerySchema = z.object({
  userEmail: z.string().email().optional(),
  userId: z.string().optional(),
  semester: z.string().optional(),
  courseCode: z.string().optional(),
});

async function resolveUserId(q: z.infer<typeof QuerySchema>) {
  if (q.userId) return q.userId;
  if (q.userEmail) {
    const u = await prisma.user.findUnique({ where: { email: q.userEmail } });
    return u?.id ?? null;
  }
  return null;
}

/** GET /data/transcripts?userEmail=...&semester=... */
dataRouter.get("/transcripts", async (req, res, next) => {
  try {
    const q = QuerySchema.parse(req.query);
    const userId = await resolveUserId(q);

    const rows = await prisma.transcript.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(q.semester ? { semester: q.semester } : {}),
        ...(q.courseCode ? { courseCode: q.courseCode } : {}),
      },
      orderBy: [{ semester: "desc" }, { courseCode: "asc" }],
    });

    res.json(rows);
  } catch (e) {
    next(e);
  }
});

/** GET /data/timetables?userEmail=...&semester=... */
dataRouter.get("/timetables", async (req, res, next) => {
  try {
    const q = QuerySchema.parse(req.query);
    const userId = await resolveUserId(q);

    const rows = await prisma.timetable.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(q.semester ? { semester: q.semester } : {}),
        ...(q.courseCode ? { courseCode: q.courseCode } : {}),
      },
      orderBy: [{ semester: "desc" }, { dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    res.json(rows);
  } catch (e) {
    next(e);
  }
});
