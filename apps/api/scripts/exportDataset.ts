import { createObjectCsvWriter } from "csv-writer";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching dataset records from ML_GradeDataset...");
  
  // Lấy dữ liệu với trạng thái 'validated' (tuỳ chọn thêm nếu cần, ở đây lấy hết theo ý user)
  const records = await prisma.mL_GradeDataset.findMany({
    select: {
      studentId: true,
      courseCode: true,
      credits: true,
      midTermScore: true,
      attendanceScore: true,
      cumulativeGPA: true,
      semesterCourseLoad: true,
      finalScore: true,
    },
  });

  if (records.length === 0) {
    console.log("No dataset records found in the database. Nothing to export.");
    return;
  }

  const outPath = path.join(process.cwd(), "student_features_dataset.csv");
  
  const csvWriter = createObjectCsvWriter({
    path: outPath,
    header: [
      { id: "studentId", title: "studentId" },
      { id: "courseCode", title: "courseCode" },
      { id: "credits", title: "credits" },
      { id: "midTermScore", title: "midTermScore" },
      { id: "attendanceScore", title: "attendanceScore" },
      { id: "cumulativeGPA", title: "cumulativeGPA" },
      { id: "semesterCourseLoad", title: "semesterCourseLoad" },
      { id: "finalScore", title: "finalScore" },
    ],
  });

  // Map lại dữ liệu phòng trường hợp null (có thể quy về chuỗi rỗng)
  const formattedRecords = records.map((r) => ({
    studentId: r.studentId,
    courseCode: r.courseCode,
    credits: r.credits ?? "",
    midTermScore: r.midTermScore ?? "",
    attendanceScore: r.attendanceScore ?? "",
    cumulativeGPA: r.cumulativeGPA ?? "",
    semesterCourseLoad: r.semesterCourseLoad ?? "",
    finalScore: r.finalScore ?? "",
  }));

  console.log(`Writing ${formattedRecords.length} records to ${outPath}...`);
  await csvWriter.writeRecords(formattedRecords);
  
  console.log(`✅ Xuất thành công ${formattedRecords.length} dòng dữ liệu ra file student_features_dataset.csv!`);
}

main()
  .catch((e) => {
    console.error("Lỗi trong quá trình export:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
