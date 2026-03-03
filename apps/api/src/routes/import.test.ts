import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app";
import { prisma } from "../db";

const app = createApp();

function buildPayload(overrides?: Partial<any>) {
  return {
    user: { email: "idempotent_test@example.com", name: "Idem Test" },
    meta: { adapterKey: "duytan", adapterVersion: "dtu.v1", sourcePage: "extension" },
    data: {
      transcripts: [
        {
          courseCode: "TEST101",
          courseName: "Test Course",
          credits: 3,
          semester: "2023-2024 HK1",
          score10: 8.2,
          letter: "A-",
          gpa4: null,
          status: null,
          componentsBreakdown: null,
        },
      ],
      timetables: [],
      sections: [],
      evaluations: [],
    },
    ...overrides,
  };
}

async function cleanupUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  // Xoá theo thứ tự để tránh lỗi FK
  await prisma.evaluationDraft.deleteMany({ where: { userId: user.id } });
  await prisma.classSection.deleteMany({ where: { userId: user.id } });
  await prisma.timetable.deleteMany({ where: { userId: user.id } });
  await prisma.transcript.deleteMany({ where: { userId: user.id } });
  await prisma.importSession.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
}

describe("POST /import idempotent", () => {
  const email = "idempotent_test@example.com";

  beforeEach(async () => {
    await cleanupUserByEmail(email);
  });

  it("first import -> idempotent false, second same payload -> idempotent true", async () => {
    const payload = buildPayload();

    const r1 = await request(app).post("/import").send(payload);
    expect(r1.status).toBe(200);
    expect(r1.body.ok).toBe(true);
    expect(r1.body.idempotent).toBe(false);
    expect(typeof r1.body.payloadHash).toBe("string");

    const r2 = await request(app).post("/import").send(payload);
    expect(r2.status).toBe(200);
    expect(r2.body.ok).toBe(true);
    expect(r2.body.idempotent).toBe(true);

    // cùng hash
    expect(r2.body.payloadHash).toBe(r1.body.payloadHash);

    // importId phải giống (idempotent)
    expect(r2.body.importId).toBe(r1.body.importId);
  });
});
