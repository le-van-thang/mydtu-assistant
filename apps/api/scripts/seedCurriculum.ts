import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu Lộ trình đào tạo (Curriculum)...");

  // 1. Tạo Ngành học
  const major = await (prisma as any).major.upsert({
    where: { code: "SE_CMU" },
    update: {},
    create: {
      code: "SE_CMU",
      name: "Kỹ nghệ phần mềm (CMU)",
    },
  });
  console.log(`✅ Đã nạp ngành học: ${major.name}`);

  // 2. Danh sách 16 môn học và các môn tiên quyết dạng metadata
  // Tạm mặc định credits = 3, difficultyScore ngẫu nhiên
  const coursesData = [
    { code: "CS111", name: "Lập trình C", reqs: [] },
    { code: "CS161", name: "Nhập môn Kỹ thuật phần mềm", reqs: [] },
    { code: "IS201", name: "Hệ thống thông tin cơ bản", reqs: [] },
    { code: "CS211", name: "Lập trình C++", reqs: ["CS111"] },
    { code: "CS251", name: "Cấu trúc dữ liệu và giải thuật", reqs: ["CS111", "CS161"] },
    { code: "CS252", name: "Phân tích và thiết kế thuật toán", reqs: ["CS251"] },
    { code: "CS262", name: "Công nghệ Web", reqs: ["CS251"] },
    { code: "CS201", name: "Toán rời rạc", reqs: ["CS111"] },
    { code: "CS311", name: "Kiến trúc máy tính", reqs: ["CS211"] },
    { code: "IS351", name: "Cơ sở dữ liệu", reqs: ["CS262"] },
    { code: "CS301", name: "Hệ điều hành", reqs: ["CS201"] },
    { code: "CS314", name: "Đồ họa máy tính", reqs: ["CS211", "CS262"] },
    { code: "SE301", name: "Quy trình phát triển phần mềm", reqs: ["IS351"] },
    { code: "SE311", name: "Kiểm thử phần mềm", reqs: ["IS351"] },
    { code: "SE312", name: "Đảm bảo chất lượng phần mềm", reqs: ["SE301"] },
    { code: "SE313", name: "Kiến trúc phần mềm", reqs: ["SE301"] },
  ];

  // 3. Upsert toàn bộ môn học trước để lấy ID (chưa map tiên quyết)
  const courseIdMap: Record<string, string> = {};

  for (const c of coursesData) {
    const course = await (prisma as any).courseInfo.upsert({
      where: { courseCode: c.code },
      update: {
        name: c.name,
      },
      create: {
        courseCode: c.code,
        name: c.name,
        credits: 3, // Mặc định 3 TC
        difficultyScore: Number((3 + Math.random() * 2).toFixed(1)), // Fake độ khó 3.0 -> 5.0
        isKillerCourse: Math.random() > 0.8, // 20% khả năng là môn sát thủ
      },
    });
    courseIdMap[c.code] = course.id;
  }
  console.log(`✅ Đã nạp ${Object.keys(courseIdMap).length} môn học.`);

  // 4. Map quan hệ tiên quyết
  let prereqCount = 0;
  for (const c of coursesData) {
    if (!c.reqs || c.reqs.length === 0) continue;

    const currentCourseId = courseIdMap[c.code];

    for (const reqCode of c.reqs) {
      const parentCourseId = courseIdMap[reqCode];
      
      // Upsert quan hệ Many-to-Many
      await (prisma as any).coursePrerequisite.upsert({
        where: {
          courseId_prerequisiteCourseId: {
            courseId: currentCourseId,
            prerequisiteCourseId: parentCourseId,
          },
        },
        update: {},
        create: {
          courseId: currentCourseId,
          prerequisiteCourseId: parentCourseId,
        },
      });
      prereqCount++;
    }
  }

  console.log(`✅ Đã thiết lập thành công ${prereqCount} quan hệ môn học tiên quyết.`);
  console.log("🎉 Hoàn tất quá trình seed Curriculum!");
}

main()
  .catch((e) => {
    console.error("Lỗi khi seed Curriculum:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
