# 🎓 MYDTU Assistant

MYDTU Assistant là một hệ thống **backend + shared logic** phục vụ việc
thu thập, chuẩn hóa và phân tích dữ liệu học vụ sinh viên Đại học Duy Tân
(từ extension / client bên ngoài), hướng tới các tính năng AI & học vụ thông minh.

---

## ✨ Mục tiêu dự án

- Tự động **import bảng điểm, thời khóa biểu, lớp học**
- Chuẩn hóa dữ liệu theo **schema thống nhất**
- Tính toán học vụ:
  - GPA 4.0
  - Trạng thái học phần (passed, failed, absent, banned…)
- Làm nền tảng cho:
  - Planner học tập
  - Cảnh báo học vụ
  - Dự đoán GPA
  - AI Assistant (sau này)

---

## 🧱 Kiến trúc tổng quan

```text
┌────────────────────┐
│ Browser Extension  │
│ (MyDTU Scraper)    │
└─────────┬──────────┘
          │ JSON Payload
          ▼
┌──────────────────────────┐
│ API Server (Express)     │
│ apps/api                 │
│                          │
│ - Zod validate payload   │
│ - Normalize data         │
│ - Business logic         │
│ - Prisma ORM             │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ PostgreSQL Database      │
│                          │
│ Tables:                  │
│ - User                   │
│ - ImportSession          │
│ - Transcript             │
│ - Timetable              │
│ - ClassSection           │
│ - EvaluationDraft        │
└──────────────────────────┘

┌──────────────────────────┐
│ Shared Logic Package     │
│ packages/shared          │
│                          │
│ - GPA rules              │
│ - Course status rules    │
│ - Zod schemas            │
│ - Academic utilities     │
└──────────────────────────┘
📁 Cấu trúc thư mục
mydtu-assistant/
├── apps/
│   └── api/
│       ├── prisma/
│       │   ├── migrations/
│       │   └── schema.prisma
│       ├── src/
│       │   ├── routes/
│       │   ├── middlewares/
│       │   └── utils/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── academic.ts
│       │   ├── logic/
│       │   └── schemas/
│       └── package.json
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
🧠 Luồng xử lý dữ liệu (Import Flow)
Extension gửi payload JSON lên API /import

API:

Validate bằng Zod

Chuẩn hóa dữ liệu (status, GPA, điểm)

Tạo ImportSession (idempotent theo payload hash)

Upsert:

Transcript

Timetable

ClassSection

Trả về thống kê import

📊 Trạng thái học phần (CourseStatus)
passed
failed
retaken
in_progress
unknown
absent_final
banned_final
Logic fallback:

Không có status → tính theo score10

< 4.0 → failed

>= 4.0 → passed

🛠 Công nghệ sử dụng
Node.js + TypeScript

Express

Prisma ORM

PostgreSQL

pnpm workspace

Zod (validation)

🚀 Chạy project (local)

pnpm install
cd apps/api
npx prisma migrate dev
pnpm dev
API chạy tại:

arduino
Sao chép mã
http://localhost:4000
Prisma Studio:

npx prisma studio
🔒 Lưu ý bảo mật
Không lưu dữ liệu đăng nhập MyDTU

Không crawl trực tiếp từ server

Chỉ nhận dữ liệu do client chủ động gửi

📌 Định hướng tiếp theo
GPA Planner & Goal Seeking

AI phân tích học vụ

Recommendation học phần

Frontend Dashboard (React)

Authentication riêng (không liên quan MyDTU)
👤 Tác giả
Lê Văn Thắng
Project học thuật / nghiên cứu