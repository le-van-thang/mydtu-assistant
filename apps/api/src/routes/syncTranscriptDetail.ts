// path: apps/api/src/routes/syncTranscriptDetail.ts
import { ImportStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";
import { sha256Json } from "../utils/hash";

export const syncTranscriptDetailRouter = Router();

const DetailRowSchema = z.object({
  semester: z.string().min(1),
  academicYear: z.string().nullable().optional(),
  term: z.string().nullable().optional(),

  classCode: z.string().min(1),
  courseCode: z.string().min(1),
  courseName: z.string().min(1),

  method: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  detailUrl: z.string().nullable().optional(),

  componentKey: z.string().nullable().optional(),
  componentLabel: z.string().min(1),

  score1: z.number().nullable().optional(),
  score2: z.number().nullable().optional(),
  scaleScore: z.number().nullable().optional(),
  weightPercent: z.number().nullable().optional(),
  contributionMax: z.number().nullable().optional(),
  contributionScore: z.number().nullable().optional(),

  displayOrder: z.number().int().nonnegative().optional(),
  rawText: z.string().nullable().optional(),
});

const SyncTranscriptDetailSchema = z.object({
  adapterKey: z.string().min(1),
  adapterVersion: z.string().min(1),
  sourcePage: z.string().min(1),
  scrapedAt: z.string().optional(),
  items: z.array(DetailRowSchema).min(1),
  meta: z
    .object({
      totalItems: z.number().optional(),
      totalClasses: z.number().optional(),
      totalSemesters: z.number().optional(),
    })
    .optional(),
});

function normalizeSpace(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeLoose(value: unknown) {
  return normalizeSpace(value).toLowerCase();
}

function numberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

syncTranscriptDetailRouter.post("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const parsed = SyncTranscriptDetailSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      message: "Invalid transcript detail payload",
      issues: parsed.error.issues,
    });
  }

  const payload = parsed.data;

  const cleanedItems = payload.items.map((item, index) => ({
    semester: normalizeSpace(item.semester),
    academicYear: normalizeSpace(item.academicYear) || null,
    term: normalizeSpace(item.term) || null,

    classCode: normalizeSpace(item.classCode),
    courseCode: normalizeSpace(item.courseCode),
    courseName: normalizeSpace(item.courseName),

    method: normalizeSpace(item.method) || null,
    level: normalizeSpace(item.level) || null,
    detailUrl: normalizeSpace(item.detailUrl) || null,

    componentKey: normalizeSpace(item.componentKey) || null,
    componentLabel: normalizeSpace(item.componentLabel),

    score1: numberOrNull(item.score1),
    score2: numberOrNull(item.score2),
    scaleScore: numberOrNull(item.scaleScore),
    weightPercent: numberOrNull(item.weightPercent),
    contributionMax: numberOrNull(item.contributionMax),
    contributionScore: numberOrNull(item.contributionScore),

    displayOrder:
      typeof item.displayOrder === "number" ? item.displayOrder : index,
    rawText: normalizeSpace(item.rawText) || null,
  }));

  const payloadHash = sha256Json({
    adapterKey: payload.adapterKey,
    adapterVersion: payload.adapterVersion,
    sourcePage: payload.sourcePage,
    items: cleanedItems.map((item) => ({
      semester: item.semester,
      classCode: item.classCode,
      courseCode: item.courseCode,
      componentLabel: item.componentLabel,
      displayOrder: item.displayOrder,
      score1: item.score1,
      score2: item.score2,
      scaleScore: item.scaleScore,
      weightPercent: item.weightPercent,
      contributionMax: item.contributionMax,
      contributionScore: item.contributionScore,
    })),
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existed = await tx.importSession.findUnique({
        where: {
          uq_importsession_idempotent: {
            userId,
            adapterKey: payload.adapterKey,
            adapterVersion: payload.adapterVersion,
            payloadHash,
          },
        },
      });

      const importSession = existed
        ? existed
        : await tx.importSession.create({
            data: {
              userId,
              adapterKey: payload.adapterKey,
              adapterVersion: payload.adapterVersion,
              sourcePage: payload.sourcePage,
              status: ImportStatus.SUCCESS,
              payloadHash,
              startedAt: new Date(),
            },
          });

      await tx.transcriptComponent.deleteMany({
        where: {
          userId,
          adapterKey: payload.adapterKey,
        },
      });

      const transcriptKeys = Array.from(
        new Set(
          cleanedItems.map((item) =>
            [
              normalizeLoose(item.semester),
              normalizeLoose(item.courseCode),
              normalizeLoose(item.classCode),
            ].join("||"),
          ),
        ),
      );

      const transcriptCandidates = await tx.transcript.findMany({
        where: { userId },
        select: {
          id: true,
          semester: true,
          courseCode: true,
          classCode: true,
        },
      });

      const transcriptMap = new Map<string, string>();
      for (const transcript of transcriptCandidates) {
        const key = [
          normalizeLoose(transcript.semester),
          normalizeLoose(transcript.courseCode),
          normalizeLoose(transcript.classCode),
        ].join("||");
        if (transcriptKeys.includes(key)) {
          transcriptMap.set(key, transcript.id);
        }
      }

      let inserted = 0;

      for (const item of cleanedItems) {
        const transcriptKey = [
          normalizeLoose(item.semester),
          normalizeLoose(item.courseCode),
          normalizeLoose(item.classCode),
        ].join("||");

        const transcriptId = transcriptMap.get(transcriptKey);
        if (!transcriptId) {
          continue;
        }

        await tx.transcriptComponent.create({
          data: {
            userId,
            importId: importSession.id,
            transcriptId,

            semester: item.semester,
            courseCode: item.courseCode,
            classCode: item.classCode,
            courseName: item.courseName,

            componentKey: item.componentKey,
            componentLabel: item.componentLabel,

            score1: item.score1,
            score2: item.score2,
            scaleScore: item.scaleScore,
            weightPercent: item.weightPercent,
            contributionScore: item.contributionScore,
            contributionMax: item.contributionMax,
            displayOrder: item.displayOrder,
            rawText: item.rawText,

            adapterKey: payload.adapterKey,
            adapterVersion: payload.adapterVersion,
            sourcePage: payload.sourcePage,
            lastSyncedAt: new Date(),
          },
        });

        inserted++;
      }

      await tx.importSession.update({
        where: { id: importSession.id },
        data: {
          sourcePage: payload.sourcePage,
          status: ImportStatus.SUCCESS,
          finishedAt: new Date(),
          recordCounts: {
            inserted,
            updated: 0,
            skipped: cleanedItems.length - inserted,
            total: cleanedItems.length,
            totalClasses: payload.meta?.totalClasses ?? null,
            totalSemesters: payload.meta?.totalSemesters ?? null,
            mode: "replace_all_transcript_components",
            reusedImportSession: !!existed,
          },
        },
      });

      return {
        alreadyImported: false,
        importId: importSession.id,
        counts: {
          inserted,
          updated: 0,
          skipped: cleanedItems.length - inserted,
        },
      };
    });

    return res.json({
      ok: true,
      ...result,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      message: "Transcript detail sync failed",
      error: e?.message ?? String(e),
    });
  }
});