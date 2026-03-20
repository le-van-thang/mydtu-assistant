// path: apps/api/prisma/seed.ts

import {
  CourseStatus,
  ImportStatus,
  Prisma,
  PrismaClient,
  SectionType,
} from "@prisma/client";

const prisma = new PrismaClient();

const SEED_PASSWORD_HASH =
  "$2b$10$8m7VY6m2G2H5f9fG1mS1KOPx5mDqRj0m2QW5f3QG4Oe2s7Y7wM8dK";

const SEED_BIRTHDATE = new Date("2000-01-01T00:00:00.000Z");

async function main() {
  console.log("🌱 Seeding database...");

  // 1) User: idempotent
  const user = await prisma.user.upsert({
    where: { email: "student@test.edu.vn" },
    update: {
      name: "Test Student",
    },
    create: {
      email: "student@test.edu.vn",
      name: "Test Student",
      password: SEED_PASSWORD_HASH,
      birthDate: SEED_BIRTHDATE,
      placeOfBirth: "Da Nang",
    },
  });

  // 2) ImportSession: idempotent theo uq_importsession_idempotent
  const importSession = await prisma.importSession.upsert({
    where: {
      uq_importsession_idempotent: {
        userId: user.id,
        adapterKey: "duytan",
        adapterVersion: "dtu.v1",
        payloadHash: "seed-payload-hash",
      },
    },
    update: {
      status: ImportStatus.SUCCESS,
      sourcePage: "mydtu/transcript",
      recordCounts: {
        transcripts: 2,
        transcriptComponents: 4,
        sections: 1,
      },
      finishedAt: new Date(),
    },
    create: {
      userId: user.id,
      adapterKey: "duytan",
      adapterVersion: "dtu.v1",
      sourcePage: "mydtu/transcript",
      status: ImportStatus.SUCCESS,
      payloadHash: "seed-payload-hash",
      recordCounts: {
        transcripts: 2,
        transcriptComponents: 4,
        sections: 1,
      },
      finishedAt: new Date(),
    },
  });

  // 3) Transcript rows: idempotent theo uq_transcript_natural(userId, courseCode, classCode, semester)
  const transcripts = [
    {
      courseCode: "INT101",
      classCode: "INT101-01",
      courseName: "Introduction to IT",
      credits: 3,
      score10: 8.2,
      letter: "A-",
      gpa4: 3.65,
      semester: "2023-2024 HK1",
      status: CourseStatus.passed,
      componentsBreakdown: {
        classCode: "INT101-01",
        method: "LEC",
        unitType: "Đại Học, Cao đẳng",
        cumulative: 8.2,
        detailSummary: {
          totalPercent: 100,
          totalScore10: 8.2,
        },
        detailItems: [
          {
            displayOrder: 0,
            componentKey: "midterm",
            componentLabel: "Midterm",
            score1: 8.0,
            score2: null,
            scaleScore: 10,
            weightPercent: 40,
            contributionScore: 3.2,
            contributionMax: 4,
            rawText: "Midterm | 8.0 | 40%",
          },
          {
            displayOrder: 1,
            componentKey: "final",
            componentLabel: "Final",
            score1: 8.33,
            score2: null,
            scaleScore: 10,
            weightPercent: 60,
            contributionScore: 5.0,
            contributionMax: 6,
            rawText: "Final | 8.33 | 60%",
          },
        ],
      },
    },
    {
      courseCode: "HIS101",
      classCode: "HIS101-02",
      courseName: "History",
      credits: 2,
      score10: 3.5,
      letter: "F",
      gpa4: 0.0,
      semester: "2023-2024 HK2",
      status: CourseStatus.failed,
      componentsBreakdown: {
        classCode: "HIS101-02",
        method: "LEC",
        unitType: "Đại Học, Cao đẳng",
        cumulative: 3.5,
        detailSummary: {
          totalPercent: 100,
          totalScore10: 3.5,
        },
        detailItems: [
          {
            displayOrder: 0,
            componentKey: "attendance",
            componentLabel: "Attendance",
            score1: 7.0,
            score2: null,
            scaleScore: 10,
            weightPercent: 20,
            contributionScore: 1.4,
            contributionMax: 2,
            rawText: "Attendance | 7.0 | 20%",
          },
          {
            displayOrder: 1,
            componentKey: "final",
            componentLabel: "Final",
            score1: 1.75,
            score2: null,
            scaleScore: 10,
            weightPercent: 80,
            contributionScore: 1.4,
            contributionMax: 8,
            rawText: "Final | 1.75 | 80%",
          },
        ],
      },
    },
  ] as const;

  for (const t of transcripts) {
    const transcript = await prisma.transcript.upsert({
      where: {
        uq_transcript_natural: {
          userId: user.id,
          courseCode: t.courseCode,
          classCode: t.classCode,
          semester: t.semester,
        },
      },
      update: {
        importId: importSession.id,
        courseName: t.courseName,
        credits: t.credits,
        score10: t.score10,
        letter: t.letter,
        gpa4: t.gpa4,
        status: t.status,
        componentsBreakdown: t.componentsBreakdown as Prisma.InputJsonValue,
        adapterKey: "duytan",
        adapterVersion: "dtu.v1",
        sourcePage: "mydtu/transcript",
        lastSyncedAt: new Date(),
      },
      create: {
        userId: user.id,
        importId: importSession.id,
        adapterKey: "duytan",
        adapterVersion: "dtu.v1",
        sourcePage: "mydtu/transcript",
        courseCode: t.courseCode,
        classCode: t.classCode,
        courseName: t.courseName,
        credits: t.credits,
        score10: t.score10,
        letter: t.letter,
        gpa4: t.gpa4,
        semester: t.semester,
        status: t.status,
        componentsBreakdown: t.componentsBreakdown as Prisma.InputJsonValue,
      },
    });

    const detailItems = t.componentsBreakdown.detailItems ?? [];

    await prisma.transcriptComponent.deleteMany({
      where: {
        transcriptId: transcript.id,
      },
    });

    if (detailItems.length > 0) {
      await prisma.transcriptComponent.createMany({
        data: detailItems.map((item, index) => ({
          userId: user.id,
          importId: importSession.id,
          transcriptId: transcript.id,
          semester: t.semester,
          courseCode: t.courseCode,
          classCode: t.classCode,
          courseName: t.courseName,
          componentKey: item.componentKey ?? null,
          componentLabel: item.componentLabel,
          score1: item.score1 ?? null,
          score2: item.score2 ?? null,
          scaleScore: item.scaleScore ?? null,
          weightPercent: item.weightPercent ?? null,
          contributionScore: item.contributionScore ?? null,
          contributionMax: item.contributionMax ?? null,
          displayOrder:
            typeof item.displayOrder === "number" ? item.displayOrder : index,
          rawText: item.rawText ?? null,
          adapterKey: "duytan",
          adapterVersion: "dtu.v1",
          sourcePage: "mydtu/transcript/detail",
          lastSyncedAt: new Date(),
        })),
      });
    }
  }

  // 4) ClassSection: idempotent theo uq_section_natural(userId, semester, classCode)
  await prisma.classSection.upsert({
    where: {
      uq_section_natural: {
        userId: user.id,
        semester: "2023-2024 HK2",
        classCode: "CS102-01",
      },
    },
    update: {
      courseCode: "CS102",
      credits: 4,
      type: SectionType.LEC,
      capacityStatus: "available",
      note: null,
      scheduleSlots: Prisma.JsonNull,
      weeksIncluded: null,
      weeksCanceled: null,
      importId: importSession.id,
      adapterKey: "duytan",
      adapterVersion: "dtu.v1",
      sourcePage: "mydtu/registration",
      lastSyncedAt: new Date(),
    },
    create: {
      userId: user.id,
      importId: importSession.id,
      semester: "2023-2024 HK2",
      classCode: "CS102-01",
      courseCode: "CS102",
      credits: 4,
      type: SectionType.LEC,
      capacityStatus: "available",
      note: null,
      scheduleSlots: Prisma.JsonNull,
      weeksIncluded: null,
      weeksCanceled: null,
      adapterKey: "duytan",
      adapterVersion: "dtu.v1",
      sourcePage: "mydtu/registration",
    },
  });

  console.log("✅ Seed completed");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });