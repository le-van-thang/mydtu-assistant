import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AdvancedFeatureRow {
  studentId: string;
  courseCode: string;
  semester: string;
  cumulativeGPA_BeforeCourse: number | null;
  prerequisiteScore: number | null;
  totalCredits_ThatSemester: number;
  hasFailedBefore: boolean;
  targetLabel_FinalScore: number | null;
}

export async function extractStudentFeatures(studentId: string): Promise<AdvancedFeatureRow[]> {
  // 1. Lấy toàn bộ bảng điểm của sinh viên này
  const transcripts = await prisma.transcript.findMany({
    where: { userId: studentId },
    orderBy: { semester: "asc" }, // Giả định chuỗi semester sortable (vd: "2023_1" < "2023_2")
  });

  if (!transcripts || transcripts.length === 0) {
    return [];
  }

  // Lấy danh sách học kỳ duy nhất đã sắp xếp
  const semesters = Array.from(new Set(transcripts.map((t) => t.semester))).sort();

  const results: AdvancedFeatureRow[] = [];

  // 2. Fetch trước toàn bộ CourseInfo kèm mối quan hệ tiên quyết để lookup nhanh
  const courseInfos = await (prisma as any).courseInfo.findMany({
    include: {
      prerequisites: {
        include: {
          prerequisiteCourse: true,
        },
      },
    },
  });

  // Map: courseCode -> mảng prerequisite courseCodes
  const prereqMap: Record<string, string[]> = {};
  for (const cInfo of courseInfos) {
    prereqMap[cInfo.courseCode] = cInfo.prerequisites.map(
      (p: any) => p.prerequisiteCourse.courseCode
    );
  }

  // 3. Tính toán cho từng MÔN HỌC (Transcript record)
  for (const record of transcripts) {
    if (record.score10 === null || record.score10 === undefined) {
      // Bỏ qua các môn chưa có điểm
      continue;
    }

    const currentSemesterIndex = semesters.indexOf(record.semester);
    
    // Các học kỳ TRƯỚC học kỳ của môn này
    const pastSemesters = semesters.slice(0, currentSemesterIndex);
    
    // Lọc các bản ghi trước học kỳ hiện tại
    const pastRecords = transcripts.filter((t) => pastSemesters.includes(t.semester));

    // A. cumulativeGPA_BeforeCourse
    let cumulativeGPA_BeforeCourse = null;
    const pastRecordsWithScore = pastRecords.filter((t) => t.score10 !== null);
    if (pastRecordsWithScore.length > 0) {
      // GPA có thể chuân xác thì tính bằng (tổng tín chỉ * điểm) / tổng tín chỉ
      let totalWeightedScore = 0;
      let totalPastCredits = 0;
      for (const t of pastRecordsWithScore) {
        totalWeightedScore += t.score10! * t.credits;
        totalPastCredits += t.credits;
      }
      cumulativeGPA_BeforeCourse = totalPastCredits > 0 ? totalWeightedScore / totalPastCredits : null;
      if (cumulativeGPA_BeforeCourse !== null) {
        cumulativeGPA_BeforeCourse = Math.round(cumulativeGPA_BeforeCourse * 100) / 100;
      }
    }

    // B. prerequisiteScore
    let prerequisiteScore = null;
    const reqCodes = prereqMap[record.courseCode];
    if (reqCodes && reqCodes.length > 0) {
      const pastPrereqRecords = pastRecords.filter(
        (t) => reqCodes.includes(t.courseCode) && t.score10 !== null
      );
      if (pastPrereqRecords.length > 0) {
        const sum = pastPrereqRecords.reduce((acc, t) => acc + t.score10!, 0);
        prerequisiteScore = sum / pastPrereqRecords.length;
        prerequisiteScore = Math.round(prerequisiteScore * 100) / 100;
      }
    }

    // C. totalCredits_ThatSemester
    const semesterRecords = transcripts.filter((t) => t.semester === record.semester);
    const totalCredits_ThatSemester = semesterRecords.reduce((sum, t) => sum + t.credits, 0);

    // D. hasFailedBefore
    // Định nghĩa rớt môn là điểm tổng < 5.0 (hoặc điểm F/D nếu theo hệ 4 điểm, tạm dùng hệ 10)
    const hasFailedBefore = pastRecordsWithScore.some((t) => t.score10! < 5.0);

    results.push({
      studentId: record.userId,
      courseCode: record.courseCode,
      semester: record.semester,
      cumulativeGPA_BeforeCourse,
      prerequisiteScore,
      totalCredits_ThatSemester,
      hasFailedBefore,
      targetLabel_FinalScore: record.score10,
    });
  }

  return results;
}
