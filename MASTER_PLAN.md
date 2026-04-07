# 🚀 OMNISCHOLAR AI - MASTER PLAN (PROJECT MANAGEMENT DOC)

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
OmniScholar AI là nền tảng EdTech All-in-One. Hệ thống ứng dụng AI Đa phương thức (Multimodal AI), Agentic Workflow và Fine-tuning để cá nhân hóa lộ trình học tập, phân tích bảng điểm bằng Computer Vision, và hỗ trợ học tập vi mô (Micro-learning).

## 2. GIÁ TRỊ NGHIÊN CỨU KHOA HỌC (AI INNOVATION)
Hệ thống KHÔNG CHỈ là một wrapper gọi API Gemini. Sự khác biệt cốt lõi:
- **Computer Vision OCR:** Không cào DOM bằng Extension. AI tự đọc ảnh PDF/JPG bảng điểm của mọi trường Đại học.
- **Agentic RAG:** Chatbot không trả lời chung chung. AI tự gọi Tools chọc vào Database lấy GPA, Kỹ năng của User để tư vấn.
- **Robust NLU & Voice:** AI hiểu tiếng lóng, từ viết tắt (ko, j, dc...) dựa trên ngữ cảnh sư phạm và có thể giao tiếp bằng giọng nói (Speech-to-Text/Text-to-Speech).
- **Fine-Tuning Pipeline:** Hệ thống có module trích xuất dữ liệu (Export) ra file JSONL để huấn luyện (Fine-tune) các mô hình mã nguồn mở bằng tri thức bản địa.

## 3. PHÂN QUYỀN HỆ THỐNG (RBAC - ROLE BASED ACCESS CONTROL)
Hệ thống chia làm 2 Role tách biệt hoàn toàn về UI và API:

### 🎭 ROLE: USER (SINH VIÊN)
- **UI Route:** `apps/web/src/app/(app)/...`
- **Dashboard:** Xem Radar Kỹ năng, Upload bảng điểm (OCR).
- **Pathways:** Nhập JD Tuyển dụng -> AI chỉ ra lỗ hổng kỹ năng -> Sinh lộ trình học.
- **Cognitive Studio:** Upload slide PDF -> AI băm thành Flashcard -> AI tạo bài thi Mock Exam.
- **Omni-Chat:** Chatbot nổi ở mọi trang (Hỗ trợ text, ảnh bài tập, voice).

### 👑 ROLE: ADMIN (QUẢN TRỊ VIÊN)
- **UI Route:** `apps/web/src/app/(admin)/...`
- **Admin Dashboard:** Thống kê tổng số User, số lượng API LLM đã gọi, biểu đồ tăng trưởng.
- **University Management:** Quản lý danh sách các trường Đại học trên hệ thống.
- **AI Training Sandbox:** Nơi Admin duyệt các câu hỏi hay của sinh viên, xuất thành file `.jsonl` để đem đi Fine-tune AI.

## 4. TECH STACK & DESIGN SYSTEM
- Next.js 14 App Router, TailwindCSS, Radix UI (Glassmorphism, Dark/Light mode).
- Prisma (PostgreSQL), Vercel AI SDK (Gemini 2.5 Flash).