// path: apps/api/src/routes/syncTranscriptDetail.ts
import { ImportStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";
import { sha256Json } from "../utils/hash";
import * as fs from "fs";

export const syncTranscriptDetailRouter = Router();

const DetailRowSchema = z.object({
  semester: z.string().min(1),
  academicYear: z.string().nullable().optional(),
  term: z.string().nullable().optional(),

  classCode: z.string().nullable().optional(),
  courseCode: z.string().nullable().optional(),
  courseName: z.string().nullable().optional(),

  method: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  detailUrl: z.string().nullable().optional(),

  componentKey: z.string().nullable().optional(),
  componentLabel: z.string().nullable().optional(),

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
  items: z.array(DetailRowSchema),
  meta: z
    .object({
      totalItems: z.number().optional(),
      totalClasses: z.number().optional(),
      totalSemesters: z.number().optional(),
      requestedSemesters: z.array(z.string()).optional(),
      scannedSemesters: z.array(z.string()).optional(),
      skippedSemesters: z.array(z.string()).optional(),
      totalDetailFailures: z.number().optional(),
      semesterSummaries: z
        .array(
          z.object({
            semester: z.string(),
            status: z.string(),
            totalItems: z.number().optional(),
            totalClasses: z.number().optional(),
            classesWithDetailLink: z.number().optional(),
            detailFailures: z.number().optional(),
            message: z.string().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

function normalizeSpace(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeLower(value: unknown): string {
  return normalizeSpace(value).toLowerCase();
}

function stripAlphanumOnly(value: string): string {
  return value.replace(/[^a-z0-9]/g, "");
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Normalize semester string into a canonical fingerprint for comparison.
 * 
 * MYDTU uses many formats for the same semester:
 *   - "Năm Học 2025-2026 - Học Kỳ I"   (transcript page)
 *   - "Năm Học 2025-2026 - Học Kỳ II"  (transcript page)
 *   - "Năm Học 2024-2025 - Học Kỳ Hè"  (summer semester)
 *   - "2025-2026 - Học Kỳ I"            (detail page)
 * 
 * Fingerprint: {term}_{startYear}_{endYear}
 *   term: "1" = Kỳ I, "2" = Kỳ II, "3" = Hè/Summer
 */
function getSemesterFingerprint(sem: string): string {
  const s = normalizeLower(sem);

  const yearMatch = s.match(/(\d{4})\s*-\s*(\d{4})/);
  const year = yearMatch ? `${yearMatch[1]}_${yearMatch[2]}` : "";

  let term = "";

  // Summer/Hè — check FIRST before Kỳ II (since "Kỳ Hè" doesn't contain "II")
  if (
    s.includes("hè") || s.includes("he ") || s.match(/\bhe\b/) ||
    s.includes("kỳ hè") || s.includes("ky he") ||
    s.match(/h[oọ]c\s*k[yỳ]\s*(iii|3\b)/) ||
    s.match(/k[yỳ]\s*ph[uụ]/) || s.match(/hoc\s*ky\s*3\b/)
  ) {
    term = "3";
  } else if (
    s.match(/h[oọ]c\s*k[yỳ]\s*(ii\b|2\b)/) ||
    s.includes("ky 2") || s.includes("kỳ 2") ||
    s.match(/\bkii\b/) || s.match(/k[yỳ]\s+ii\b/)
  ) {
    term = "2";
  } else if (
    s.match(/h[oọ]c\s*k[yỳ]\s*(i\b|1\b)/) ||
    s.includes("ky 1") || s.includes("kỳ 1") ||
    s.match(/\bki\b/) || s.match(/k[yỳ]\s+i\b/)
  ) {
    term = "1";
  }

  if (year && term) return `${term}_${year}`;
  return s; // fallback: raw normalized string
}

/**
 * Build canonical classCode key for matching.
 * MYDTU classCode format: "CMU-CS 445 PIS" or "DTF-CS 231 BIS"
 * Strip all non-alphanumeric → "cmucs445pis" for reliable comparison.
 */
function classCodeKey(classCode: string): string {
  return stripAlphanumOnly(normalizeLower(classCode));
}

/**
 * Extract what looks like a course code prefix from classCode.
 * e.g. "CMU-CS 445 PIS" → "CMU-CS" / "cmucs"
 */
function courseCodeKey(code: string): string {
  return stripAlphanumOnly(normalizeLower(code));
}

/**
 * Match a scraped item to an existing Transcript record.
 * 
 * Strategy (highest confidence first):
 *  1. Exact: same semFingerprint + same stripped classCode
 *  2. SemYear + courseCode prefix match + partial classCode
 *  3. Return null (will create a shell transcript)
 */
function findBestMatch(
  item: { semester: string; classCode: string; courseCode: string; courseName: string },
  candidates: Array<{ id: string; semester: string; classCode: string; courseCode: string; courseName: string }>,
): { id: string; quality: number } | null {
  const itemSemFp = getSemesterFingerprint(item.semester);
  const itemClassKey = classCodeKey(item.classCode);
  const itemCourseKey = courseCodeKey(item.courseCode);
  const itemCourseNameNorm = normalizeLower(item.courseName);

  let best: { id: string; quality: number } | null = null;

  for (const t of candidates) {
    const tSemFp = getSemesterFingerprint(t.semester);
    if (tSemFp !== itemSemFp) continue;

    const tClassKey = classCodeKey(t.classCode);
    const tCourseKey = courseCodeKey(t.courseCode);
    const tCourseNameNorm = normalizeLower(t.courseName);

    // Level 4: Exact classCode match (stripped)
    if (itemClassKey && tClassKey && itemClassKey === tClassKey) {
      return { id: t.id, quality: 4 };
    }

    // Level 3: courseCode exact + classCode contains courseCode pattern
    if (
      itemCourseKey && tCourseKey &&
      itemCourseKey === tCourseKey &&
      (itemClassKey.includes(tClassKey) || tClassKey.includes(itemClassKey))
    ) {
      if (!best || best.quality < 3) best = { id: t.id, quality: 3 };
    }

    // Level 2: courseName exact match (same semester, different classCodes possible)
    if (
      itemCourseNameNorm && tCourseNameNorm &&
      itemCourseNameNorm === tCourseNameNorm &&
      (!best || best.quality < 2)
    ) {
      best = { id: t.id, quality: 2 };
    }

    // Level 1: courseCode prefix is contained in classCode (e.g. item.courseCode="CMU-CS" in t.classCode="CMU-CS 445 PIS")
    if (
      itemCourseKey && tClassKey &&
      tClassKey.includes(itemCourseKey) &&
      (!best || best.quality < 1)
    ) {
      best = { id: t.id, quality: 1 };
    }
  }

  return best;
}

syncTranscriptDetailRouter.post("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const parsed = SyncTranscriptDetailSchema.safeParse(req.body);

  if (!parsed.success) {
    const issuesJson = JSON.stringify(parsed.error.issues, null, 2);
    try {
      fs.writeFileSync("sync-payload-error.log", issuesJson);
    } catch {}
    return res.status(400).json({
      ok: false,
      message: "Invalid transcript detail payload",
      issues: parsed.error.issues,
    });
  }

  const payload = parsed.data;

  const cleanedItems = payload.items.map((item, index) => {
    const rawClassCode = normalizeSpace(item.classCode);
    const rawCourseCode = normalizeSpace(item.courseCode);
    return {
      semester: normalizeSpace(item.semester),
      academicYear: normalizeSpace(item.academicYear) || null,
      term: normalizeSpace(item.term) || null,

      classCode: rawClassCode || rawCourseCode || "UNKNOWN",
      courseCode: rawCourseCode || rawClassCode || "UNKNOWN",
      courseName: normalizeSpace(item.courseName) || "UNKNOWN",

      method: normalizeSpace(item.method) || null,
      level: normalizeSpace(item.level) || null,
      detailUrl: normalizeSpace(item.detailUrl) || null,

      componentKey: normalizeSpace(item.componentKey) || null,
      componentLabel: normalizeSpace(item.componentLabel) || "N/A",

      score1: numberOrNull(item.score1),
      score2: numberOrNull(item.score2),
      scaleScore: numberOrNull(item.scaleScore),
      weightPercent: numberOrNull(item.weightPercent),
      contributionMax: numberOrNull(item.contributionMax),
      contributionScore: numberOrNull(item.contributionScore),

      displayOrder: typeof item.displayOrder === "number" ? item.displayOrder : index,
      rawText: normalizeSpace(item.rawText) || null,
    };
  });

  const targetSemesters = Array.from(
    new Set(
      (
        payload.meta?.requestedSemesters?.length
          ? payload.meta.requestedSemesters
          : cleanedItems.map((item) => item.semester)
      )
        .map((value) => normalizeSpace(value))
        .filter(Boolean),
    ),
  );

  const payloadHash = sha256Json({
    adapterKey: payload.adapterKey,
    adapterVersion: payload.adapterVersion,
    sourcePage: payload.sourcePage,
    targetSemesters,
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
      // ── 1. Idempotency check ──────────────────────────────────────────────
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

      // ── 2. Delete old components for target semesters ────────────────────
      if (targetSemesters.length > 0) {
        await tx.transcriptComponent.deleteMany({
          where: {
            userId,
            adapterKey: payload.adapterKey,
            semester: { in: targetSemesters },
          },
        });
      }

      // ── 3. Fetch existing transcript records ─────────────────────────────
      const dbTranscripts = await tx.transcript.findMany({
        where: { userId },
        select: {
          id: true,
          semester: true,
          courseCode: true,
          classCode: true,
          courseName: true,
        },
      });

      // Mutable copy so we can push new shells into it during the loop
      const transcriptCandidates = [...dbTranscripts];

      // ── 4. Process each item ─────────────────────────────────────────────
      let inserted = 0;
      let skipped = 0;
      let matchedStrict = 0;
      let matchedFuzzy = 0;
      let autoCreated = 0;

      for (const item of cleanedItems) {
        // ── 4a. Find matching transcript ────────────────────────────────────
        const matchResult = findBestMatch(item, transcriptCandidates);
        let transcriptId: string | null = matchResult?.id ?? null;

        if (matchResult) {
          if (matchResult.quality === 4) matchedStrict++;
          else matchedFuzzy++;
        }

        // ── 4b. Auto-create shell transcript if no match ────────────────────
        // Use upsert to be idempotent — unique key: (userId, courseCode, classCode, semester)
        if (!transcriptId) {
          const shell = await tx.transcript.upsert({
            where: {
              uq_transcript_natural: {
                userId,
                courseCode: item.courseCode,
                classCode: item.classCode,
                semester: item.semester,
              },
            },
            create: {
              userId,
              importId: importSession.id,
              courseCode: item.courseCode,
              classCode: item.classCode,
              courseName: item.courseName,
              credits: 0,
              semester: item.semester,
              status: "in_progress",
              adapterKey: payload.adapterKey,
              adapterVersion: payload.adapterVersion,
              sourcePage: payload.sourcePage,
            },
            update: {}, // never overwrite real transcript data
          });

          transcriptId = shell.id;
          autoCreated++;

          // Add to in-memory list so subsequent components for same class re-use it
          transcriptCandidates.push({
            id: shell.id,
            semester: shell.semester,
            courseCode: shell.courseCode,
            classCode: shell.classCode,
            courseName: shell.courseName,
          });
        }

        // ── 4c. Upsert component (safe against duplicate runs) ──────────────
        // Unique key: (transcriptId, componentLabel, displayOrder)
        await tx.transcriptComponent.upsert({
          where: {
            uq_transcript_component_row: {
              transcriptId,
              componentLabel: item.componentLabel,
              displayOrder: item.displayOrder,
            },
          },
          create: {
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
          update: {
            // Update scores & metadata if item already exists
            importId: importSession.id,
            score1: item.score1,
            score2: item.score2,
            scaleScore: item.scaleScore,
            weightPercent: item.weightPercent,
            contributionScore: item.contributionScore,
            contributionMax: item.contributionMax,
            rawText: item.rawText,
            adapterVersion: payload.adapterVersion,
            lastSyncedAt: new Date(),
          },
        });

        inserted++;
      }

      // ── 5. Finalize import session ───────────────────────────────────────
      await tx.importSession.update({
        where: { id: importSession.id },
        data: {
          sourcePage: payload.sourcePage,
          status: ImportStatus.SUCCESS,
          finishedAt: new Date(),
          recordCounts: {
            inserted,
            updated: 0,
            skipped,
            total: cleanedItems.length,
            autoCreated,
            totalClasses: payload.meta?.totalClasses ?? null,
            totalSemesters: payload.meta?.totalSemesters ?? null,
            targetSemesters: targetSemesters.length,
            requestedSemesters: payload.meta?.requestedSemesters ?? [],
            scannedSemesters: payload.meta?.scannedSemesters ?? [],
            skippedSemesters: payload.meta?.skippedSemesters ?? [],
            totalDetailFailures: payload.meta?.totalDetailFailures ?? 0,
            semesterSummaries: payload.meta?.semesterSummaries ?? [],
            matchedStrict,
            matchedFuzzy,
            mode: "upsert_by_semester",
            reusedImportSession: !!existed,
          },
        },
      });

      return {
        alreadyImported: !!existed,
        importId: importSession.id,
        counts: {
          inserted,
          updated: 0,
          skipped,
          autoCreated,
          targetSemesters: targetSemesters.length,
        },
      };
    }, {
      // Give the long full-sync enough time to commit
      timeout: 120_000,
    });

    return res.json({ ok: true, ...result });
  } catch (e: any) {
    try {
      fs.writeFileSync("sync-error.log", e?.stack || e?.message || String(e));
    } catch {}
    return res.status(500).json({
      ok: false,
      message: "Transcript detail sync failed",
      error: e?.message ?? String(e),
    });
  }
});
