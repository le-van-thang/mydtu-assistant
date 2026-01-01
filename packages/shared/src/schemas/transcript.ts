import { z } from "zod";

/**
 * Thành phần điểm (Score Component)
 */
export const ScoreComponentSchema = z.object({
  score: z.number().min(0).max(10),
  weight: z.number().min(0).max(100)
});

/**
 * Bảng điểm (Transcript)
 */
export const TranscriptSchema = z.object({
  courseCode: z.string(),
  courseName: z.string(),
  credits: z.number().int().positive(),

  score10: z.number().min(0).max(10).nullable(),
 letter: z
  .enum(["A+","A","A-","B+","B","B-","C+","C","C-","D+","D","F","P","I","X","R"])
  .nullable(),
  gpa4: z.number().min(0).max(4).nullable(),

  semester: z.string(),
 status: z.enum([
  "passed",
  "failed",
  "retaken",
  "in_progress",
  "unknown",
  "absent_final",
  "banned_final",
]),

 componentsBreakdown: z
  .record(z.string(), ScoreComponentSchema)
  .optional()

});

export type Transcript = z.infer<typeof TranscriptSchema>;
