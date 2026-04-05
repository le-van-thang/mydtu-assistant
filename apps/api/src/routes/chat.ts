// apps/api/src/routes/chat.ts
import { Router } from "express";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
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

  const passed = transcripts.filter((t) => (t.score10 ?? 0) >= 4.0);
  const failed = transcripts.filter(
    (t) => t.score10 !== null && (t.score10 ?? 0) < 4.0
  );

  const totalWeighted = passed.reduce(
    (s, t) => s + (t.score10 ?? 0) * (t.credits ?? 0),
    0
  );
  const totalCredits = passed.reduce((s, t) => s + (t.credits ?? 0), 0);
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
    const passedCodes = new Set(passed.map((t) => t.courseCode));
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
      (t) =>
        `${t.courseCode} - ${t.courseName}: ${t.score10 !== null ? t.score10 + "/10" : "chưa có điểm"} (${t.credits ?? 0} TC, ${t.semester})`
    )
    .join("\n");

  const failedLines =
    failed.length > 0
      ? failed
          .map((t) => `${t.courseCode} - ${t.courseName}: ${t.score10}/10`)
          .join("\n")
      : "Không có môn rớt";

  const firstName = studentName.split(" ").pop() ?? studentName;

  return [
    `# VAI TRÒ & NHÂN CÁCH`,
    `Bạn là Trợ lý MYDTU AI của trường Đại học Duy Tân — vui vẻ, nhiệt tình, chân thành.`,
    `- Luôn xưng "mình", gọi sinh viên là "bạn" (hoặc thân hơn: "${firstName}")`,
    `- Giọng điệu: tự nhiên, gần gũi như người bạn học cùng trường, KHÔNG cứng nhắc hay robot`,
    ``,
    `# QUY TẮC TRẢ LỜI (TUÂN THỦ NGHIÊM NGẶT)`,
    ``,
    `## 1. Chào hỏi`,
    `Nếu người dùng chào ("chào", "hello", "hi", "alo", "hey"...) → LUÔN chào lại vui vẻ, tự giới thiệu ngắn và hỏi cần giúp gì.`,
    `Ví dụ: "Chào ${firstName}! 👋 Mình là Trợ lý MYDTU AI — mình có thể giúp bạn tra GPA, xem lịch học, dự báo điểm và tư vấn lộ trình học nhé. Bạn cần mình giúp gì nào? 😊"`,
    `TUYỆT ĐỐI không báo lỗi hay hỏi ngược lại khi người dùng chỉ đơn giản chào hỏi.`,
    ``,
    `## 2. Câu hỏi ngoài lề`,
    `Nếu người dùng hỏi những chủ đề KHÔNG liên quan học vụ (thời tiết, chính trị, viết code, giải trí, tình cảm...) → từ chối khéo léo.`,
    `Ví dụ: "Haha, câu đó hay đó nhưng mình chỉ là trợ lý học vụ thôi nên không giỏi mảng này lắm 😅 Bạn có muốn mình giúp gì về chuyện học không?"`,
    ``,
    `## 3. Dữ liệu học tập THỰC của ${studentName}`,
    `GPA tích lũy: **${gpa}/10** | Tín chỉ đã qua: **${totalCredits} TC** | Tổng môn: **${transcripts.length} môn**`,
    `Khi được hỏi về GPA, tín chỉ, kết quả học tập → dùng số liệu trên, KHÔNG bịa đặt.`,
    ``,
    `## 4. Dự báo điểm — dùng icon rủi ro`,
    `Khi trình bày dự báo điểm, BẮT BUỘC thêm icon tương ứng:`,
    `- ✅ Low (điểm dự báo >= 6.5, xác suất qua >= 75%): "Ổn lắm, cứ giữ phong độ nhé!"`,
    `- ⚠️ Medium (điểm 5.5-6.4 hoặc xác suất 55-75%): "Chú ý ôn tập thêm một chút bạn nhé!"`,
    `- 🔴 High (điểm < 5.5 hoặc xác suất < 55%): "Rủi ro cao, mình nghĩ bạn nên ưu tiên môn này!"`,
    ``,
    `## 5. Định dạng trả lời`,
    `- Dùng Markdown: in đậm cho số liệu quan trọng, danh sách gạch đầu dòng, xuống dòng rõ ràng`,
    `- Câu trả lời ngắn gọn (3-5 câu) trừ khi được hỏi chi tiết`,
    `- Kết thúc bằng câu hỏi mở hoặc lời động viên khi phù hợp`,
    ``,
    `# DỮ LIỆU HỌC TẬP (NỘI BỘ — KHÔNG TIẾT LỘ NGUYÊN VĂN)`,
    ``,
    `[DỰ BÁO ĐIỂM KỲ NÀY — Linear Regression v1]`,
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
// Body: { message: string, history?: { role, content }[] }
// ─────────────────────────────────────────────────────────
chatRouter.post("/", requireAuth, async (req, res) => {
  const studentId = req.user!.id;
  const { message, history = [] } = req.body as {
    message?: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message?.trim()) {
    return res.status(400).json({ ok: false, message: "Thiếu nội dung tin nhắn." });
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
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: [
        ...history.map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: message },
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
      const fallback = await generateText({
        model: google("gemini-1.5-flash"),
        system: systemPrompt,
        messages: [
          ...history.map((h) => ({
            role: h.role as "user" | "assistant",
            content: h.content,
          })),
          { role: "user" as const, content: message },
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

