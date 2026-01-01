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
          credits: z.number().int(),
          semester: z.string(),
          score10: z.number().optional().nullable(),
          letter: z.string().optional().nullable(),
          gpa4: z.number().optional().nullable(),
          status: z
            .enum(["passed", "failed", "retaken", "in_progress", "unknown"])
            .optional(),
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
          endTime: z.string(),
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
          credits: z.number().int(),
          type: z.enum(["LEC", "LAB", "OTHER"]).optional(),
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
