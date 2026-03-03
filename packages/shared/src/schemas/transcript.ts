// file: packages/shared/src/schemas/transcript.ts
import { z } from "zod";

/**
 * Thành phần điểm
 */
export const ScoreComponentSchema = z.object({
  score: z.number().min(0).max(10),
  weight: z.number().min(0).max(100),
});

/**
 * Transcript chuẩn dùng chung
 * Lưu ý: DTU scale không có D+
 */
export const TranscriptSchema = z.object({
  courseCode: z.string().min(1),
  courseName: z.string().min(1),
  credits: z.number().int().positive(),

  semester: z.string().min(1),

  score10: z.number().min(0).max(10).nullable(),
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
    .nullable(),
  gpa4: z.number().min(0).max(4).nullable(),

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
    .nullable(),

  // Cho phép 2 dạng:
  // 1) record { key: {score, weight} }
  // 2) hoặc payload legacy (nếu bạn muốn nới rộng thì đổi thành z.any())
  componentsBreakdown: z
    .record(z.string(), ScoreComponentSchema)
    .optional()
    .nullable(),
});

export type Transcript = z.infer<typeof TranscriptSchema>;
