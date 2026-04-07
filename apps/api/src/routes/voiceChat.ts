// apps/api/src/routes/voiceChat.ts
import { Router } from "express";
import { generateText } from "ai";
import { generateTextWithRotation } from "../utils/geminiClient";
import { requireAuth } from "../middlewares/auth";

export const voiceChatRouter = Router();

type ConversationMode = "vi-friend" | "en-tutor" | "math-tutor" | "free";

function buildVoiceSystemPrompt(mode: ConversationMode, userName: string): string {
  const name = userName || "bạn";

  switch (mode) {
    case "vi-friend":
      return `Bạn là "Hana" — người bạn thân, sinh viên đại học Việt Nam, thông minh và vui tính.
LUẬT TUYỆT ĐỐI:
- Trả lời bằng TIẾNG VIỆT, ngắn gọn 1-2 câu như tin nhắn bạn bè thật
- Xưng "mình" gọi "${name}" thân mật
- Đôi khi thêm emoji nhỏ để bày cảm xúc 😄
- KHÔNG dùng Markdown, KHÔNG dùng gạch đầu dòng — chỉ nói tự nhiên
- Nếu ${name} hỏi câu khó: trả lời thật thà, ngắn gọn, rồi hỏi lại điều gì đó để giữ cuộc trò chuyện
- Hãy hỏi lại câu để giữ cuộc trò chuyện sôi nổi
- Bạn có thể nói về học tập, cuộc sống sinh viên, tâm sự, hoặc bất kỳ điều gì`;

    case "en-tutor":
      return `You are "Lily" — a friendly English teacher having a real conversation with ${name}.
STRICT RULES:
- ALWAYS respond in English, max 2 sentences, natural spoken English
- If ${name} makes a grammar/vocabulary mistake: gently correct once and move on naturally (don't repeat the correction)
- Never use bullet points or markdown — speak like a real person
- Keep the conversation flowing by asking follow-up questions
- Be encouraging and warm, like a friend who happens to be good at English
- Express personality: be curious, funny, genuine
- If ${name} writes in Vietnamese: reply in English but show you understood`;

    case "math-tutor":
      return `Bạn là "Minh" — gia sư Toán thân thiện, dạy kèm riêng cho ${name}.
LUẬT TUYỆT ĐỐI:
- Dùng TIẾNG VIỆT, giải thích ngắn gọn như đang nói chuyện, không phải viết bài
- Khi có bài toán: hỏi "${name} muốn mình giải thẳng hay gợi ý từng bước?"
- Giải từng bước nhỏ, dừng lại hỏi "Hiểu bước này chưa bạn?" để đảm bảo
- KHÔNG dùng Markdown — chỉ nói số học tự nhiên như "a bình phương cộng b bình phương"
- Nếu không có bài toán: hỏi về môn học, điểm số hoặc chia sẻ mẹo học tốt
- Đôi khi khen ngợi để động viên`;

    case "free":
    default:
      return `Bạn là "OmniScholar AI" — trợ lý thông minh, đa năng, trò chuyện như người thật với ${name}.
LUẬT TUYỆT ĐỐI:
- Trả lời bằng ngôn ngữ ${name} dùng (tiếng Việt → trả lời tiếng Việt, English → reply in English)
- Tối đa 2-3 câu ngắn, giọng điệu TỰ NHIÊN — không robot, không formal
- KHÔNG dùng Markdown hay gạch đầu dòng
- Giải đáp MỌI câu hỏi: học tập, lập trình, toán, tiếng Anh, cuộc sống...
- Hỏi lại để giữ cuộc trò chuyện sôi nổi
- Thể hiện cá tính: tò mò, tinh tế, đôi khi hài hước nhẹ`;
  }
}

voiceChatRouter.post("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const {
    message,
    mode = "free",
    history = [],
    userName = "bạn",
  } = req.body as {
    message?: string;
    mode?: ConversationMode;
    history?: { role: "user" | "assistant"; content: string }[];
    userName?: string;
  };

  if (!message?.trim()) {
    return res.status(400).json({ ok: false, message: "Thiếu nội dung tin nhắn." });
  }

  const systemPrompt = buildVoiceSystemPrompt(mode, userName);

  try {
    const result = await generateTextWithRotation({
      model: "gemini-2.5-flash",
      system: systemPrompt,
      messages: [
        ...history.slice(-10).map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
        { role: "user" as const, content: message },
      ],
    });

    return res.json({
      ok: true,
      reply: result.text,
      mode,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const statusCode = (err as any)?.status || (err as any)?.statusCode || 0;
    console.error("[voice-chat] Gemini error:", statusCode, msg);

    // Phân biệt các loại lỗi
    if (statusCode === 429 || msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate limit")) {
      return res.status(429).json({ ok: false, message: "⚠️ Hết giới hạn API hôm nay. Hãy thử lại vào 5-6 giờ sáng" });
    }
    if (statusCode === 400 || msg.includes("400")) {
      return res.status(500).json({ ok: false, message: `[debug] Model lỗi: ${msg.slice(0, 200)}` });
    }
    return res.status(500).json({ ok: false, message: `[debug] ${msg.slice(0, 200)}` });
  }
});
