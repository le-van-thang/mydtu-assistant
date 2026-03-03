  import { CourseStatus, ImportStatus, Prisma, PrismaClient, SectionType } from "@prisma/client";

  const prisma = new PrismaClient();

  async function main() {
    console.log("🌱 Seeding database...");

    // 1) User: idempotent
    const user = await prisma.user.upsert({
      where: { email: "student@test.edu.vn" },
      update: { name: "Test Student" },
      create: { email: "student@test.edu.vn", name: "Test Student" },
    });

    // 2) ImportSession: MUST upsert vì schema có @@unique(userId, adapterKey, adapterVersion, payloadHash)
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
        recordCounts: { transcript: 2, timetable: 0 },
        finishedAt: new Date(),
      },
      create: {
        userId: user.id,
        adapterKey: "duytan",
        adapterVersion: "dtu.v1",
        sourcePage: "mydtu/transcript",
        status: ImportStatus.SUCCESS,
        payloadHash: "seed-payload-hash",
        recordCounts: { transcript: 2, timetable: 0 },
      },
    });

    // 3) Transcripts: idempotent theo uq_transcript_natural(userId, courseCode, semester)
    const transcripts = [
      {
        courseCode: "INT101",
        courseName: "Introduction to IT",
        credits: 3,
        score10: 8.2,
        letter: "A-",
        gpa4: 3.65,
        semester: "2023-2024 HK1",
        status: CourseStatus.passed,
      },
      {
        courseCode: "HIS101",
        courseName: "History",
        credits: 2,
        score10: 3.5,
        letter: "F",
        gpa4: 0.0,
        semester: "2023-2024 HK2",
        status: CourseStatus.failed,
      },
    ] as const;

    for (const t of transcripts) {
      await prisma.transcript.upsert({
        where: {
          uq_transcript_natural: {
            userId: user.id,
            courseCode: t.courseCode,
            semester: t.semester,
          },
        },
        update: {
          courseName: t.courseName,
          credits: t.credits,
          score10: t.score10,
          letter: t.letter,
          gpa4: t.gpa4,
          status: t.status,
          importId: importSession.id,
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
          courseName: t.courseName,
          credits: t.credits,
          score10: t.score10,
          letter: t.letter,
          gpa4: t.gpa4,
          semester: t.semester,
          status: t.status,
        },
      });
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
