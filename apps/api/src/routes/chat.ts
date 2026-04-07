// apps/api/src/routes/chat.ts
import { Router } from "express";
import { generateText, tool } from "ai";
import { generateTextWithRotation } from "../utils/geminiClient";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";
import { extractFeatures } from "../logic/featureExtraction";
import { predict } from "../logic/gradePredictor";
import type { RiskLevel } from "../logic/gradePredictor";

export const chatRouter = Router();

// ─────────────────────────────────────────────
// Tool 4: Dự báo điểm môn học bằng Linear Regression
// ─────────────────────────────────────────────
interface PredictedCourseResult {
  courseCode: string;
  courseName: string | null;
  credits: number;
  predictedScore: number;
  confidenceLow: number;
  confidenceHigh: number;
  passProbability: number;
  riskLevel: RiskLevel;
}

async function predictCourseScore(
  studentId: string,
  courseCode?: string,
): Promise<PredictedCourseResult[]> {
  const features = await extractFeatures({ userId: studentId });
  const prediction = predict(features);

  // Nếu truyền courseCode cụ thể → lọc 1 môn; nếu không → trả toàn bộ
  const courses = courseCode
    ? prediction.perCourse.filter(
        (c) => c.courseCode.toLowerCase() === courseCode.toLowerCase()
      )
    : prediction.perCourse;

  return courses.map((c) => ({
    courseCode: c.courseCode,
    courseName: c.courseName,
    credits: c.credits,
    predictedScore: c.predictedScore,
    confidenceLow: c.confidenceLow,
    confidenceHigh: c.confidenceHigh,
    passProbability: c.passProbability,
    riskLevel: c.riskLevel,
  }));
}

// ─────────────────────────────────────────────────────────
// Lấy toàn bộ context học tập và nhét vào System Prompt
// Không dùng tool() để tránh incompatibility với ai@6.x
// ─────────────────────────────────────────────────────────
async function buildSystemPrompt(studentId: string): Promise<string> {
  // Lấy tên sinh viên
  const user = await prisma.user.findUnique({
    where: { id: studentId },
    select: { name: true, email: true },
  });
  const studentName =
    user?.name || user?.email?.split("@")[0] || "Sinh viên";

  // Lấy toàn bộ transcript
  const transcripts = await prisma.transcript.findMany({
    where: { userId: studentId },
    select: {
      courseCode: true,
      courseName: true,
      score10: true,
      credits: true,
      semester: true,
    },
    orderBy: { semester: "asc" },
  });

  type TranscriptType = typeof transcripts[0];

  const passed = transcripts.filter((t: TranscriptType) => (t.score10 ?? 0) >= 4.0);
  const failed = transcripts.filter(
    (t: TranscriptType) => t.score10 !== null && (t.score10 ?? 0) < 4.0
  );

  const totalWeighted = passed.reduce(
    (s: number, t: TranscriptType) => s + (t.score10 ?? 0) * (t.credits ?? 0),
    0
  );
  const totalCredits = passed.reduce((s: number, t: TranscriptType) => s + (t.credits ?? 0), 0);
  const gpa =
    totalCredits > 0
      ? Math.round((totalWeighted / totalCredits) * 100) / 100
      : 0;

  // Dự báo điểm các môn đang học kỳ này bằng Linear Regression
  let predictionSection = "Chưa có dữ liệu để dự báo (chưa đồng bộ thời khoá biểu).";
  try {
    const predictions = await predictCourseScore(studentId);
    if (predictions.length > 0) {
      const riskemoji: Record<RiskLevel, string> = {
        Low: "🟢",
        Medium: "🟡",
        High: "🔴",
      };
      predictionSection = predictions
        .map(
          (p) =>
            `${p.courseCode} - ${p.courseName ?? ""}: Dự báo ${p.predictedScore}/10 ` +
            `(${p.confidenceLow}–${p.confidenceHigh}), ` +
            `xác suất qua: ${Math.round(p.passProbability * 100)}%, ` +
            `rủi ro: ${riskemoji[p.riskLevel]} ${p.riskLevel}`
        )
        .join("\n");
    }
  } catch {
    // Feature extraction thất bại (chưa đủ dữ liệu), bỏ qua
  }
  let recommendedStr = "Chưa có dữ liệu khung chương trình.";
  try {
    const passedCodes = new Set(passed.map((t: TranscriptType) => t.courseCode));
    const allCourses = await (prisma as any).courseInfo.findMany({
      include: { prerequisites: { include: { prerequisiteCourse: true } } },
      orderBy: { difficultyScore: "asc" },
    });
    const recs: string[] = [];
    for (const c of allCourses) {
      if (passedCodes.has(c.courseCode)) continue;
      const ok = c.prerequisites.every((pr: any) =>
        passedCodes.has(pr.prerequisiteCourse.courseCode)
      );
      if (ok) {
        recs.push(`${c.courseCode} - ${c.name} (${c.credits} TC, độ khó: ${c.difficultyScore})`);
        if (recs.length >= 5) break;
      }
    }
    recommendedStr =
      recs.length > 0 ? recs.join("\n") : "Đã hoàn thành toàn bộ chương trình.";
  } catch {
    // CourseInfo chưa có dữ liệu, bỏ qua
  }

  // Tóm tắt điểm
  const transcriptLines = transcripts
    .slice(-40)
    .map(
      (t: TranscriptType) =>
        `${t.courseCode} - ${t.courseName}: ${t.score10 !== null ? t.score10 + "/10" : "chưa có điểm"} (${t.credits ?? 0} TC, ${t.semester})`
    )
    .join("\n");

  const failedLines =
    failed.length > 0
      ? failed
          .map((t: TranscriptType) => `${t.courseCode} - ${t.courseName}: ${t.score10}/10`)
          .join("\n")
      : "Không có môn rớt";

  const firstName = studentName.split(" ").pop() ?? studentName;

  return [
    `Bạn là OmniScholar AI. Bạn hiểu tiếng lóng Việt Nam, từ viết tắt (ko, j, dc, r, hs, sv...).`,
    `Bạn tự động suy luận ý người dùng mà không bắt bẻ chính tả. Luôn xưng 'mình'-'bạn'.`,
    `MỤC TIÊU CỐT LÕI: Nếu sinh viên hỏi môn học, LUÔN dùng Tool query DB thay vì nói chung chung.`,
    ``,
    `CHUYÊN MÔN:`,
    `- Nếu người dùng hỏi điểm/lộ trình -> BẮT BUỘC dùng Tools (nếu có) hoặc dựa vào dữ liệu bên dưới.`,
    `- Nếu gửi ảnh bảng điểm -> Giải thích điểm số đó một cách thấu đáo.`,
    `- Nếu nhờ giải bài tập -> Trình bày từng bước logic, rõ ràng bằng Markdown.`,
    `- Nếu hỏi chuyện phiếm (thời tiết, game) -> Khéo léo lái về chủ đề học tập hoặc động viên bạn học tập.`,
    ``,
    `# DỮ LIỆU HỌC TẬP THỰC CỦA SINH VIÊN (NỘI BỘ)`,
    `Tên sinh viên: ${studentName}`,
    `GPA tích lũy: **${gpa}/10** | Tín chỉ đã qua: **${totalCredits} TC** | Tổng môn: **${transcripts.length} môn**`,
    ``,
    `[DỰ BÁO ĐIỂM KỲ NÀY — Linear Regression]`,
    predictionSection,
    ``,
    `[BẢNG ĐIỂM — 40 môn gần nhất]`,
    transcriptLines || "Chưa có dữ liệu điểm.",
    ``,
    `[MÔN CHƯA QUA (< 4.0)]`,
    failedLines,
    ``,
    `[GỢI Ý MÔN KỲ TỚI]`,
    recommendedStr,
  ].join("\n");
}

// ─────────────────────────────────────────────────────────
// POST /api/chat
// Body: { message: string, image?: string, history?: { role, content }[] }
// ─────────────────────────────────────────────────────────
chatRouter.post("/", requireAuth, async (req, res) => {
  const studentId = req.user!.id;
  const { message, image, history = [] } = req.body as {
    message?: string;
    image?: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message?.trim() && !image) {
    return res.status(400).json({ ok: false, message: "Thiếu nội dung tin nhắn hoặc ảnh." });
  }

  // ── Bước 1: Xây dựng context ─────────────────────────────────
  let systemPrompt: string;
  try {
    systemPrompt = await buildSystemPrompt(studentId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chat] buildSystemPrompt error:", msg);
    return res.status(500).json({
      ok: false,
      message: `Lỗi khi tải dữ liệu sinh viên: ${msg}`,
    });
  }

  // ── Bước 2: Gọi Gemini ───────────────────────────────────────
  try {
    const userContent: any[] = [];
    if (message?.trim()) {
      userContent.push({ type: "text", text: message });
    } else {
      userContent.push({ type: "text", text: "Vui lòng xem ảnh và giải thích giúp mình." });
    }
    
    if (image) {
      // image được mong đợi là một Data URL: "data:image/jpeg;base64,..."
      userContent.push({ type: "image", image });
    }

    const result = await generateTextWithRotation({
      model: "gemini-2.5-flash",
      system: systemPrompt,
      // @ts-ignore
      maxSteps: 3, // Allow tool calling loop
      tools: {
        generateQuiz: tool({
          description: "Sinh ra câu hỏi trắc nghiệm (quiz) từ nội dung bài học hoặc chủ đề người dùng yêu cầu.",
          parameters: z.object({
            topic: z.string().describe("Chủ đề của bài tập (ví dụ: Giải tích 1, Lập trình C)."),
            numberOfQuestions: z.number().optional().describe("Số lượng câu hỏi cần tạo, mặc định là 3.")
          }),
          // @ts-ignore
          execute: async ({ topic, numberOfQuestions = 3 }) => {
            // Mock response: Tool này hiện tại chỉ gửi tín hiệu cho AI tự sinh text
            return {
              success: true,
              instruction: `Đã xác nhận yêu cầu tạo ${numberOfQuestions} câu hỏi trắc nghiệm về chủ đề "${topic}". AI hãy tự sinh ra câu hỏi ngay trong tin nhắn trả lời bằng Markdown (Câu hỏi in đậm, đáp án gạch đầu dòng, kết thúc có ghi đáp án đúng).`
            };
          }
        })
      },
      messages: [
        ...history.map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: userContent },
      ],
    });

    return res.json({
      ok: true,
      reply: result.text,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[chat] Gemini API error:", msg);

    // Thử fallback với model ổn định hơn nếu model preview lỗi
    try {
      console.warn("[chat] Falling back to gemini-1.5-flash...");
      const userContentFallback: any[] = [];
      if (message?.trim()) userContentFallback.push({ type: "text", text: message });
      if (image) userContentFallback.push({ type: "image", image });

      const fallback = await generateTextWithRotation({
        model: "gemini-1.5-flash",
        system: systemPrompt,
        messages: [
          ...history.map((h) => ({
            role: h.role as "user" | "assistant",
            content: h.content,
          })),
          { role: "user" as const, content: userContentFallback },
        ],
      });
      return res.json({ ok: true, reply: fallback.text });
    } catch (fallbackErr: unknown) {
      const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error("[chat] Fallback also failed:", fallbackMsg);
      return res.status(500).json({
        ok: false,
        message: "Lỗi khi gọi AI. Vui lòng thử lại sau.",
        // Luôn trả về lỗi chi tiết để debug (che đi sau khi ổn định)
        debug: { primaryError: msg, fallbackError: fallbackMsg },
      });
    }
  }
});

