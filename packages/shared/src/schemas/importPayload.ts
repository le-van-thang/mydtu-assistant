// file: packages/shared/src/schemas/importPayload.ts
import { z } from "zod";

export const ImportPayloadSchema = z.object({
  user: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),

  meta: z.object({
    adapterKey: z.string().default("duytan"),
    adapterVersion: z.string().default("dtu.v1"),
    sourcePage: z.string().default("extension"),
  }),

  data: z.object({
    transcripts: z
      .array(
        z.object({
          courseCode: z.string(),
          courseName: z.string(),
          credits: z.number().int().positive(),
          semester: z.string(),

          score10: z.number().min(0).max(10).optional().nullable(),
          letter: z
            .enum([
              "A+",
              "A",
              "A-",
              "B+",
              "B",
              "B-",
              "C+",
              "C",
              "C-",
              "D",
              "F",
              "P",
              "I",
              "X",
              "R",
            ])
            .optional()
            .nullable(),
          gpa4: z.number().min(0).max(4).optional().nullable(),

          status: z
            .enum([
              "passed",
              "failed",
              "retaken",
              "in_progress",
              "unknown",
              "absent_final",
              "banned_final",
            ])
            .optional()
            .nullable(),

          componentsBreakdown: z.any().optional().nullable(),
        })
      )
      .default([]),

    timetables: z
      .array(
        z.object({
          semester: z.string(),
          courseCode: z.string(),
          courseName: z.string().optional().nullable(),
          dayOfWeek: z.number().int(),
          startTime: z.string(),
          endTime: z.string().optional().nullable(),
          room: z.string().optional().nullable(),
          campus: z.string().optional().nullable(),
          weeksIncluded: z.string().optional().nullable(),
          weeksCanceled: z.string().optional().nullable(),
        })
      )
      .default([]),

    sections: z
      .array(
        z.object({
          semester: z.string(),
          classCode: z.string(),
          courseCode: z.string(),
          credits: z.number().int().positive(),
          type: z.enum(["LEC", "LAB", "OTHER"]).optional().nullable(),
          capacityStatus: z.string(),
          note: z.string().optional().nullable(),
          scheduleSlots: z.any().optional().nullable(),
          weeksIncluded: z.string().optional().nullable(),
          weeksCanceled: z.string().optional().nullable(),
        })
      )
      .default([]),

    evaluations: z
      .array(
        z.object({
          semester: z.string(),
          lecturer: z.string(),
          courseCode: z.string(),
          courseName: z.string().optional().nullable(),
          answers: z.any(),
        })
      )
      .default([]),
  }),
});

export type ImportPayload = z.infer<typeof ImportPayloadSchema>;
