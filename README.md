# 🎓 OmniScholar AI

OmniScholar AI là nền tảng **EdTech Đa trường** phục vụ việc tối ưu hóa lộ trình học tập, phân tích kỹ năng và hỗ trợ học thuật thông minh dựa trên AI.

---

## ✨ Tầm nhìn dự án

- **Đa trường (Multi-school)**: Không còn giới hạn ở một trường đại học duy nhất.
- **Vision AI First**: Sử dụng Gemini Vision để nhập bảng điểm và tài liệu từ hình ảnh/PDF thay vì phụ thuộc vào browser extensions.
- **Hệ sinh thái học thuật thông minh**:
  - **Pathways**: La bàn định hướng nghề nghiệp và kỹ năng.
  - **Cognitive Studio**: Phòng rèn luyện tư duy và ôn tập (Flashcards, Spaced Repetition).
  - **Data Sandbox**: Cho phép sinh viên nghiên cứu và dự báo học vụ dựa trên dữ liệu thật.

---

## 🧱 Kiến trúc tổng quan

┌──────────────────────────┐
│ Web Dashboard (Next.js)  │
│ apps/web                 │
└─────────┬────────────────┘
          │ Rest API / Vision
          ▼
┌──────────────────────────┐
│ API Server (Express)     │
│ apps/api                 │
│                          │
│ - Gemini Vision AI OCR   │
│ - Business Logic         │
│ - Prisma ORM             │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ PostgreSQL Database      │
│                          │
│ Tables:                  │
│ - User (universityName)  │
│ - CareerPathway          │
│ - StudyMaterial          │
│ - Flashcard              │
│ - Transcript/Timetable   │
└──────────────────────────┘

---

## 🚀 Chạy dự án (Local)

1. **Cài đặt**:
   ```bash
   pnpm install
   ```

2. **Dữ liệu**:
   ```bash
   # Sync Database
   pnpm --filter api exec prisma db push
   
   # Prep Data Dataset
   pnpm --filter api run prep-llm-data
   ```

3. **Chạy**:
   ```bash
   # Chạy cả backend và frontend
   pnpm dev
   ```

---

## 👤 Tác giả
Lê Văn Thắng
*Dự án đang trong giai đoạn chuyển đổi (Pivot) sang OmniScholar AI.*
