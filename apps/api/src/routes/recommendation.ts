import { Router } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middlewares/auth";

export const recommendationRouter = Router();

/**
 * @route   GET /api/recommendation/courses
 * @desc    Tự động gợi ý 5 môn học tiếp theo
 * @access  Private (JWT)
 */
recommendationRouter.get("/courses", requireAuth, async (req, res) => {
  try {
    const studentId = req.user!.id;

    // 1. Lấy danh sách toàn bộ mã môn học mà sinh viên đã HỌC QUA (điểm >= 4.0)
    const transcripts = await prisma.transcript.findMany({
      where: {
        userId: studentId,
        score10: {
          gte: 4.0, // Điểm qua môn tối thiểu
        },
      },
      select: {
        courseCode: true,
      },
    });

    // Gom vào tập Set để tra cứu nhanh O(1)
    const passedCourseCodes = new Set(transcripts.map((t) => t.courseCode));

    // 2. Query toàn bộ môn học trong CourseInfo kèm theo CoursePrerequisite
    const allCourses = await (prisma as any).courseInfo.findMany({
      include: {
        prerequisites: {
          include: {
            prerequisiteCourse: true,
          },
        },
      },
      orderBy: {
        difficultyScore: "asc", // Ưu tiên các môn từ dễ đến khó lúc query
      },
    });

    // 3. && 4. Lọc danh sách
    const recommendedCourses = [];

    for (const course of allCourses) {
      // 3. Lọc ra những môn sinh viên CHƯA HỌC hoặc ĐÃ RỚT
      // (Nghĩa là courseCode không nằm trong danh sách đã pass)
      if (passedCourseCodes.has(course.courseCode)) {
        continue; // Đã qua môn này rồi, bỏ qua
      }

      // 4. Lọc ra những môn mà sinh viên ĐÃ THỎA MÃN điều kiện tiên quyết
      // Tất cả prerequisiteCourseId (mã môn tiên quyết) đều phải nằm trong passedCourseCodes
      let hasAllPrerequisites = true;

      for (const pr of course.prerequisites) {
        const requiredCode = pr.prerequisiteCourse.courseCode;
        if (!passedCourseCodes.has(requiredCode)) {
          hasAllPrerequisites = false;
          break; // Chỉ cần thiếu 1 môn học phần tiên quyết là không đạt điều kiện
        }
      }

      if (hasAllPrerequisites) {
        recommendedCourses.push({
          id: course.id,
          courseCode: course.courseCode,
          name: course.name,
          credits: course.credits,
          difficultyScore: course.difficultyScore,
          isKillerCourse: course.isKillerCourse,
        });

        // 5. Trả về tối đa 5 môn học
        if (recommendedCourses.length >= 5) {
          break;
        }
      }
    }

    return res.json({
      ok: true,
      data: recommendedCourses,
      metadata: {
        passedSubjectCount: passedCourseCodes.size,
      },
    });

  } catch (error: any) {
    console.error("[recommendation] error:", error);
    return res.status(500).json({
      ok: false,
      message: "Lỗi trong quá trình tính toán lộ trình gợi ý.",
    });
  }
});
