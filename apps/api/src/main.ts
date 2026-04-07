// file: apps/api/src/main.ts

import "dotenv/config";
import { createApp } from "./app";
import { prisma } from "./db";

// ── One-time startup fix: chuẩn hóa role enum trong DB ──────────────
// Lý do: PostgreSQL phân biệt hoa/thường trong enum.
// Nếu DB cũ lưu 'user' thay vì 'USER' thì Prisma sẽ crash khi đọc.
async function fixDbRoles() {
  try {
    const fixed = await prisma.$executeRawUnsafe(
      `UPDATE "User" SET role = 'USER'::"Role" WHERE role::text NOT IN ('USER', 'ADMIN')`
    );
    if (fixed > 0) {
      console.log(`✅ [startup] Fixed ${fixed} user role(s): 'user' → 'USER'`);
    }
  } catch (e: any) {
    // Không crash server nếu lỗi — chỉ log cảnh báo
    console.warn("⚠️  [startup] Role fix skipped:", e?.message);
  }
}

async function start() {
  await fixDbRoles();

  const app = createApp();
  const PORT = Number(process.env.PORT ?? 4000);
  app.listen(PORT, () => {
    console.log(`🚀 MYDTU API running at http://localhost:${PORT}`);
  });
}

start();

export { };
