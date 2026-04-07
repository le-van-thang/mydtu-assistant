// apps/api/src/routes/transcriptUpload.ts
// Vision AI OCR — cho phép sinh viên chụp ảnh bảng điểm để nhập điểm tự động
import { Router } from "express";
import { generateText } from "ai";
import { generateTextWithRotation } from "../utils/geminiClient";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";

export const transcriptUploadRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/transcript/upload-vision
// Body: { image: string }  — Data URL (data:image/jpeg;base64,...)
// ─────────────────────────────────────────────────────────────────────────────
transcriptUploadRouter.post("/upload-vision", requireAuth, async (req, res) => {
  const studentId = req.user!.id;
  const { image, semester } = req.body as {
    image?: string;
    semester?: string; // Học kỳ sinh viên khai báo, mặc định "UNKNOWN"
  };

  if (!image) {
    return res.status(400).json({
      ok: false,
      message: "Thiếu trường 'image' (Base64 Data URL).",
    });
  }

  // Validate: phải là Data URL hợp lệ
  if (!image.startsWith("data:image/")) {
    return res.status(400).json({
      ok: false,
      message: "Trường 'image' phải là Data URL hợp lệ (data:image/...).",
    });
  }

  const targetSemester = semester?.trim() || "UNKNOWN";

  // ── Bước 1: Gọi Gemini Vision để OCR bảng điểm ───────────────────────────
  let rawText: string;
  try {
    const result = await generateTextWithRotation({
      model: "gemini-2.5-flash",
      system: "Trích xuất ảnh bảng điểm đại học này thành Array JSON: [{ courseCode, courseName, credits, score10 }]. Chỉ trả về JSON.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Hãy đọc bảng điểm trong ảnh này và trả về JSON Array theo đúng định dạng yêu cầu.",
            },
            {
              type: "image",
              image,
            },
          ],
        },
      ],
    });

    rawText = result.text.trim();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[transcriptUpload] Gemini Vision error:", msg);
    return res.status(500).json({
      ok: false,
      message: `Lỗi khi gọi Vision AI: ${msg}`,
    });
  }

  // ── Bước 2: Parse JSON ────────────────────────────────────────────────────
  type ExtractedRow = {
    courseCode: string;
    courseName: string;
    credits: number;
    score10: number | null;
  };

  let rows: ExtractedRow[];
  try {
    // Bóc ```json ... ``` nếu model vẫn trả về dù đã dặn không
    const clean = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) {
      throw new Error("Kết quả AI không phải JSON Array.");
    }

    rows = parsed.filter(
      (r: any) =>
        typeof r.courseCode === "string" &&
        r.courseCode.length > 0 &&
        typeof r.courseName === "string" &&
        typeof r.credits === "number" &&
        r.credits > 0,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[transcriptUpload] JSON parse error:", msg);
    console.error("[transcriptUpload] Raw AI response:", rawText);
    return res.status(422).json({
      ok: false,
      message: `Không thể đọc bảng điểm từ ảnh. Hãy chụp rõ hơn và thử lại. (${msg})`,
      rawResponse: rawText, // Gửi về để debug phía client
    });
  }

  if (rows.length === 0) {
    return res.json({
      ok: true,
      count: 0,
      message: "Không tìm thấy dòng điểm hợp lệ nào trong ảnh.",
    });
  }

  // ── Bước 3: Upsert vào bảng Transcript ───────────────────────────────────
  let upsertCount = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      await prisma.transcript.upsert({
        where: {
          uq_transcript_natural: {
            userId: studentId,
            courseCode: row.courseCode.trim(),
            classCode: "",       // Không có classCode khi import từ ảnh
            semester: targetSemester,
          },
        },
        update: {
          courseName: row.courseName.trim(),
          credits: row.credits,
          score10: row.score10,
          // Cập nhật letter grade tự động nếu có score10
          letter: row.score10 !== null ? scoreToLetter(row.score10) : undefined,
          gpa4: row.score10 !== null ? scoreToGpa4(row.score10) : undefined,
          lastSyncedAt: new Date(),
        },
        create: {
          userId: studentId,
          courseCode: row.courseCode.trim(),
          classCode: "",
          courseName: row.courseName.trim(),
          credits: row.credits,
          semester: targetSemester,
          score10: row.score10,
          letter: row.score10 !== null ? scoreToLetter(row.score10) : null,
          gpa4: row.score10 !== null ? scoreToGpa4(row.score10) : null,
          status: "unknown",
          adapterKey: "vision_ai",
          adapterVersion: "1.0",
          sourcePage: "vision_upload",
          lastSyncedAt: new Date(),
        },
      });
      upsertCount++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[transcriptUpload] Upsert failed for ${row.courseCode}:`, msg);
      errors.push(`${row.courseCode}: ${msg}`);
    }
  }

  return res.json({
    ok: true,
    count: upsertCount,
    total: rows.length,
    errors: errors.length > 0 ? errors : undefined,
    message: `Nhập thành công ${upsertCount}/${rows.length} môn học từ ảnh bảng điểm.`,
  });
});

// ── Helpers chuyển đổi điểm ──────────────────────────────────────────────────

function scoreToLetter(score10: number): string {
  if (score10 >= 9.0) return "A+";
  if (score10 >= 8.5) return "A";
  if (score10 >= 8.0) return "B+";
  if (score10 >= 7.0) return "B";
  if (score10 >= 6.5) return "C+";
  if (score10 >= 5.5) return "C";
  if (score10 >= 5.0) return "D+";
  if (score10 >= 4.0) return "D";
  return "F";
}

function scoreToGpa4(score10: number): number {
  if (score10 >= 9.0) return 4.0;
  if (score10 >= 8.5) return 4.0;
  if (score10 >= 8.0) return 3.5;
  if (score10 >= 7.0) return 3.0;
  if (score10 >= 6.5) return 2.5;
  if (score10 >= 5.5) return 2.0;
  if (score10 >= 5.0) return 1.5;
  if (score10 >= 4.0) return 1.0;
  return 0.0;
}
