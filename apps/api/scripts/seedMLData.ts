import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting to seed fake ML Grade Dataset...");

  // Tạo hoặc lấy một user để làm khóa ngoại
  const user = await prisma.user.upsert({
    where: { email: "fake_student@mydtu.edu.vn" },
    update: {},
    create: {
      email: "fake_student@mydtu.edu.vn",
      name: "Fake Student for ML",
      password: "123", // required field bypass
      birthDate: new Date("2000-01-01"),
    },
  });

  const courses = ["CSE101", "ENG202", "MTH104", "PHY105", "CS302", "BA101"];
  const semesters = ["HK1_2023-2024", "HK2_2023-2024", "HK1_2024-2025"];

  const fakeData = [];

  let counter = 0;
  for (let i = 0; i < semesters.length; i++) {
    for (let j = 0; j < courses.length; j++) {
      if (counter >= 15) break; // Chỉ cần 15 dòng là đủ test
      counter++;

      // Random features
      const midTermScore = 4 + Math.random() * 6; // 4.0 - 10.0
      const attendanceScore = 6 + Math.random() * 4; // 6.0 - 10.0
      const cumulativeGPA = 1.5 + Math.random() * 2.5; // 1.5 - 4.0
      const semesterCourseLoad = Math.floor(3 + Math.random() * 5); // 3 - 7
      
      let finalScore = (midTermScore * 0.4) + (attendanceScore * 0.1) + (cumulativeGPA * 1.2) + (Math.random() * 2 - 1);
      finalScore = Math.max(0, Math.min(10, finalScore)); // clamp 0-10

      fakeData.push({
        userId: user.id,
        studentId: "21001234",
        courseCode: courses[j],
        semester: semesters[i],
        classCode: `CS-${counter}`,
        credits: Math.floor(2 + Math.random() * 3), // 2-4
        midTermScore: Number(midTermScore.toFixed(2)),
        attendanceScore: Number(attendanceScore.toFixed(2)),
        cumulativeGPA: Number(cumulativeGPA.toFixed(2)),
        semesterCourseLoad: semesterCourseLoad,
        finalScore: Number(finalScore.toFixed(2)),
        rowStatus: "validated", // String literal cho model enum
        sectionType: "LEC",
        courseStatus: finalScore >= 5 ? "passed" : "failed"
      });
    }
  }

  // Insert records
  await (prisma as any).mL_GradeDataset.createMany({
    data: fakeData,
  });

  console.log(`✅ Đã cấy (seed) thành công ${fakeData.length} dữ liệu giả vào Database!`);
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
