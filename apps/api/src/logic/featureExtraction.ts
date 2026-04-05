// path: apps/api/src/logic/featureExtraction.ts
//
// Feature Extraction Pipeline — ML Grade Prediction
// ─────────────────────────────────────────────────
// Mỗi hàm trong file này tương ứng với 1 bước trong pipeline chuẩn bị dữ liệu:
//
//   1. extractRawData()       — Query CSDL, song song hoá tối đa
//   2. computeFeatures()      — Tính toán các features từ raw data (pure, testable)
//   3. validateFeatures()     — Kiểm tra dữ liệu sạch, flag warning nếu thiếu
//   4. extractFeatures()      — Entry point: gọi 1–3 và trả về kết quả cuối cùng
//
// Không import bất cứ thứ gì từ tầng HTTP (express, ctx) để logic có thể
// được test độc lập và tái sử dụng từ cron job / script Python gọi qua subprocess.

import { prisma } from "../db";
import { calcWeightedGpa, round2, toGpa4 } from "./academic";

// ══════════════════════════════════════════════════════════════════
// TYPES — Public API
// ══════════════════════════════════════════════════════════════════

/**
 * Đầu vào: định danh sinh viên cần tính features.
 * Dùng userId (PK trong bảng User) làm khoá chính vì studentId trên bảng điểm
 * có thể thay đổi hoặc không nhất quán (ví dụ: có/không có tiền tố "0").
 */
export interface FeatureExtractionInput {
  /** Primary key trong bảng User — bắt buộc */
  userId: string;
  /**
   * Học kỳ hiện tại cần dự đoán (ví dụ: "HK1_2024-2025").
   * Nếu không truyền, hàm tự suy ra từ bản ghi Timetable gần nhất.
   */
  currentSemester?: string;
  /**
   * Số học kỳ gần nhất dùng để tính GPA trung bình lịch sử.
   * Mặc định là 2 (theo yêu cầu bài toán).
   */
  recentSemesterCount?: number;
}

// ─────────────────────────────────────────────────────────────────
// Feature vector cuối cùng trả về cho model AI
// ─────────────────────────────────────────────────────────────────

/** Một môn đang học trong học kỳ hiện tại (feature-level) */
export interface CurrentCourseFeature {
  courseCode: string;
  courseName: string | null;
  /** Số tín chỉ của môn */
  credits: number;
  /** Điểm giữa kỳ (thang 10), null nếu chưa có */
  midTermScore: number | null;
  /** Điểm chuyên cần / quá trình (thang 10), null nếu chưa có */
  attendanceScore: number | null;
}

/**
 * Object Feature sạch, sẵn sàng đưa vào model ML.
 * Tất cả numeric field đều đã qua clamp + round2().
 * Null = feature đó không có dữ liệu (model cần xử lý missing value).
 */
export interface StudentFeatureVector {
  // ── Định danh ──────────────────────────────────────────────────
  userId: string;
  studentId: string | null; // Mã SV từ ExamRecord (có thể null nếu chưa sync)
  currentSemester: string;

  // ── Features học kỳ hiện tại ───────────────────────────────────
  /** Tổng số tín chỉ đang đăng ký học kỳ này */
  currentSemesterCredits: number;
  /** Số môn đang học học kỳ này */
  currentSemesterCourseLoad: number;
  /** Danh sách chi tiết từng môn (để dự đoán per-course) */
  currentCourses: CurrentCourseFeature[];

  // ── Features lịch sử ───────────────────────────────────────────
  /**
   * GPA trung bình có trọng số tín chỉ của N học kỳ gần nhất (hệ 4).
   * null nếu không đủ dữ liệu lịch sử.
   */
  recentGpaAvg: number | null;
  /**
   * GPA từng học kỳ gần nhất (index 0 = gần nhất).
   * Dùng để vẽ trend chart và làm time-series feature.
   */
  recentSemesterGpas: Array<{
    semester: string;
    gpa4: number;
    credits: number;
  }>;
  /**
   * GPA tích lũy toàn bộ lịch sử (kể cả các môn retake, theo công thức DTU).
   * null nếu chưa có bất kỳ bản ghi Transcript nào.
   */
  cumulativeGPA: number | null;
  /** Tổng tín chỉ đã tích lũy thành công (passed + retaken) */
  totalCreditEarned: number;

  // ── Rủi ro học tập ────────────────────────────────────────────
  /** Tổng số môn đã rớt (F/failed) trong lịch sử */
  totalFailedCourses: number;
  /** Tổng số môn đã phải học lại (retaken) */
  totalRetakenCourses: number;
  /** Số môn rớt trong học kỳ gần nhất (leading indicator rủi ro) */
  failedInLastSemester: number;

  // ── Data quality ──────────────────────────────────────────────
  /** Các cảnh báo về thiếu / bất thường dữ liệu */
  warnings: string[];
  /** true nếu tất cả features cốt lõi đều có giá trị (không null) */
  isComplete: boolean;
}

// ──────────────────────────────────────────────────────────────────
// Raw data intermediary (internal, không expose ra ngoài)
// ──────────────────────────────────────────────────────────────────

interface RawData {
  studentId: string | null;
  resolvedSemester: string;
  /** Tất cả bản ghi Transcript đã hoàn thành (có finalScore) */
  historicalTranscripts: Array<{
    courseCode: string;
    classCode: string;
    semester: string;
    credits: number;
    score10: number | null;
    gpa4: number | null;
    letter: string | null;
    status: string;
    finalScore: number | null;
  }>;
  /**
   * Bản ghi timetable học kỳ hiện tại (dùng để biết courseCode, credits đang học).
   * Join với ML_GradeDataset nếu có để lấy midTerm/attendance score.
   */
  currentSemesterItems: Array<{
    courseCode: string;
    courseName: string | null;
    credits: number;
    midTermScore: number | null;
    attendanceScore: number | null;
  }>;
}

// ══════════════════════════════════════════════════════════════════
// STEP 1: Query CSDL — song song hoá tối đa bằng Promise.all
// ══════════════════════════════════════════════════════════════════

async function extractRawData(
  input: Required<FeatureExtractionInput>,
): Promise<RawData> {
  const { userId, currentSemester, recentSemesterCount: _ } = input;

  // Chạy 3 query độc lập đồng thời để giảm latency
  const [studentIdRecord, historicalTranscripts, currentCourseRows] =
    await Promise.all([
      // ── Query 1: Lấy studentId từ ExamRecord (mã SV in trên giấy thi) ──
      prisma.examRecord.findFirst({
        where: { userId, studentId: { not: null } },
        select: { studentId: true },
        orderBy: { createdAt: "desc" },
      }),

      // ── Query 2: Toàn bộ transcript đã hoàn thành ─────────────────────
      // Chỉ lấy đúng 5 cột cần thiết → nhẹ hơn nhiều so với SELECT *
      prisma.transcript.findMany({
        where: {
          userId,
          // Loại môn đang học (in_progress) và unknown
          status: {
            notIn: ["in_progress", "unknown"],
          },
        },
        select: {
          courseCode: true,
          classCode: true,
          semester: true,
          credits: true,
          score10: true,
          gpa4: true,
          letter: true,
          status: true,
          componentsBreakdown: true,
        },
        orderBy: [
          { semester: "desc" }, // dùng sort để xác định học kỳ gần nhất
          { courseCode: "asc" },
        ],
      }),

      // ── Query 3: Môn đang học kỳ hiện tại ────────────────────────────
      // Join ML_GradeDataset để lấy midTerm/attendance nếu đã được populate.
      // Nếu bảng ML_GradeDataset chưa có dữ liệu → LEFT JOIN trả null → ok.
      prisma.timetable.findMany({
        where: {
          userId,
          semester: currentSemester,
        },
        select: {
          courseCode: true,
          courseName: true,
        },
        distinct: ["courseCode"], // mỗi môn chỉ lấy 1 lần (không nhân với số buổi)
        orderBy: { courseCode: "asc" },
      }),
    ]);

  // Lấy ML_GradeDataset cho học kỳ hiện tại (separate query vì cần join logic)
  const mlDatasetRows = await prisma.mL_GradeDataset.findMany({
    where: {
      userId,
      semester: currentSemester,
      finalScore: null, // chỉ lấy môn chưa có điểm cuối = đang học
    },
    select: {
      courseCode: true,
      courseName: true,
      credits: true,
      midTermScore: true,
      attendanceScore: true,
    },
  });

  // Build lookup map courseCode → ML dataset row để merge nhanh O(n)
  const mlMap = new Map(mlDatasetRows.map((r) => [r.courseCode, r]));

  // Build lookup map courseCode → credits từ TranscriptComponent / ClassSection
  // Ưu tiên dùng credits từ ML dataset nếu có, fallback sang transcript lịch sử
  const historicalCreditsMap = new Map(
    historicalTranscripts.map((t) => [t.courseCode, t.credits]),
  );

  // Merge timetable (courseCode + courseName) với ML dataset (scores + credits)
  const currentSemesterItems = currentCourseRows.map((t) => {
    const ml = mlMap.get(t.courseCode);
    return {
      courseCode: t.courseCode,
      courseName: t.courseName ?? ml?.courseName ?? null,
      // credits: ưu tiên từ ML dataset, fallback sang lịch sử
      credits: ml?.credits ?? historicalCreditsMap.get(t.courseCode) ?? 0,
      midTermScore: ml?.midTermScore ?? null,
      attendanceScore: ml?.attendanceScore ?? null,
    };
  });

  // Lấy finalScore từ componentsBreakdown (JSON) nếu có
  // DTU thường lưu điểm cuối kỳ trong thành phần "Thi kết thúc học phần"
  const enrichedHistorical = historicalTranscripts.map((t) => {
    let finalScore: number | null = null;

    if (t.componentsBreakdown && typeof t.componentsBreakdown === "object") {
      const bd = t.componentsBreakdown as Record<string, unknown>;
      // Tìm component có label chứa "kết thúc" hoặc "cuối kỳ"
      for (const [label, val] of Object.entries(bd)) {
        const lc = String(label).toLowerCase();
        if (lc.includes("k\u1ebft th\u00fac") || lc.includes("cu\u1ed1i k\u1ef3")) {
          const n = Number(val);
          if (Number.isFinite(n)) {
            finalScore = n;
            break;
          }
        }
      }
    }

    return {
      courseCode: t.courseCode,
      classCode: t.classCode,
      semester: t.semester,
      credits: t.credits,
      score10: t.score10,
      gpa4: t.gpa4,
      letter: t.letter,
      status: t.status,
      finalScore,
    };
  });

  return {
    studentId: studentIdRecord?.studentId ?? null,
    resolvedSemester: currentSemester,
    historicalTranscripts: enrichedHistorical,
    currentSemesterItems,
  };
}

// ══════════════════════════════════════════════════════════════════
// STEP 2: Tính features — pure functions, không có side effects, dễ test
// ══════════════════════════════════════════════════════════════════

/**
 * Tính GPA hệ 4 của từng học kỳ, sắp xếp giảm dần theo học kỳ.
 * Sử dụng hàm toGpa4() từ academic.ts để đồng nhất logic chuyển đổi.
 */
function computeSemesterGpas(
  transcripts: RawData["historicalTranscripts"],
): Array<{ semester: string; gpa4: number; credits: number }> {
  // Nhóm theo semester
  const semMap = new Map<
    string,
    Array<{ credits: number; gpa4: number }>
  >();

  for (const t of transcripts) {
    // Bỏ môn dạng Pass/Fail (không tính vào GPA)
    const letter = t.letter?.trim().toUpperCase();
    if (letter === "P" || letter === "I" || letter === "X") continue;

    // Bỏ môn retaken (chỉ tính lần thi sau cùng)
    // Heuristic: nếu status === "retaken" thì đây là lần cũ, bỏ qua
    if (t.status === "retaken") continue;

    const g4 = toGpa4({
      gpa4: t.gpa4,
      score10: t.score10,
      letter: t.letter,
      status: t.status,
      finalScore: t.finalScore,
    });

    if (g4 === null || !Number.isFinite(g4)) continue;
    if (!Number.isFinite(t.credits) || t.credits <= 0) continue;

    const bucket = semMap.get(t.semester) ?? [];
    bucket.push({ credits: t.credits, gpa4: g4 });
    semMap.set(t.semester, bucket);
  }

  // Tính GPA có trọng số tín chỉ cho mỗi học kỳ
  const result: Array<{ semester: string; gpa4: number; credits: number }> = [];

  for (const [semester, items] of semMap.entries()) {
    const { gpa4, credits } = calcWeightedGpa(items);
    if (credits > 0) {
      result.push({ semester, gpa4: round2(gpa4), credits });
    }
  }

  // Sắp xếp giảm dần theo semester string (vd: "HK2_2024-2025" > "HK1_2024-2025")
  result.sort((a, b) => b.semester.localeCompare(a.semester));

  return result;
}

/** Tính GPA tích lũy toàn bộ lịch sử theo công thức DTU (weighted average) */
function computeCumulativeGpa(
  transcripts: RawData["historicalTranscripts"],
): { gpa4: number | null; creditEarned: number } {
  const eligible = transcripts
    .filter((t) => {
      if (t.status === "retaken") return false;
      if (t.status === "in_progress" || t.status === "unknown") return false;
      const letter = t.letter?.trim().toUpperCase();
      if (letter === "P" || letter === "I" || letter === "X") return false;
      return true;
    })
    .map((t) => {
      const g4 = toGpa4({
        gpa4: t.gpa4,
        score10: t.score10,
        letter: t.letter,
        status: t.status,
        finalScore: t.finalScore,
      });
      return { credits: t.credits, gpa4: g4 };
    })
    .filter(
      (x): x is { credits: number; gpa4: number } =>
        x.gpa4 !== null &&
        Number.isFinite(x.gpa4) &&
        Number.isFinite(x.credits) &&
        x.credits > 0,
    );

  if (eligible.length === 0) return { gpa4: null, creditEarned: 0 };

  const { gpa4, credits } = calcWeightedGpa(eligible);
  return { gpa4: round2(gpa4), creditEarned: credits };
}

// ══════════════════════════════════════════════════════════════════
// STEP 3: Validate và gắn cờ data quality warnings
// ══════════════════════════════════════════════════════════════════

function validateAndBuildVector(
  userId: string,
  raw: RawData,
  semesterGpas: ReturnType<typeof computeSemesterGpas>,
  cumulative: ReturnType<typeof computeCumulativeGpa>,
  recentSemesterCount: number,
): StudentFeatureVector {
  const warnings: string[] = [];

  // ── GPA N kỳ gần nhất ─────────────────────────────────────────
  const recentSlice = semesterGpas.slice(0, recentSemesterCount);
  let recentGpaAvg: number | null = null;

  if (recentSlice.length === 0) {
    warnings.push(
      `Không có dữ liệu GPA học kỳ gần nhất (yêu cầu ${recentSemesterCount} kỳ).`,
    );
  } else {
    if (recentSlice.length < recentSemesterCount) {
      warnings.push(
        `Chỉ có ${recentSlice.length}/${recentSemesterCount} học kỳ lịch sử để tính GPA gần nhất.`,
      );
    }
    // Tính weighted average của N kỳ gần nhất
    const { gpa4 } = calcWeightedGpa(
      recentSlice.map((s) => ({ credits: s.credits, gpa4: s.gpa4 })),
    );
    recentGpaAvg = round2(gpa4);
  }

  // ── Môn học kỳ hiện tại ───────────────────────────────────────
  const currentCourses: CurrentCourseFeature[] = raw.currentSemesterItems.map(
    (c) => {
      if (c.credits === 0) {
        warnings.push(
          `Môn ${c.courseCode}: không xác định được số tín chỉ (credits = 0). Cần populate ML_GradeDataset.`,
        );
      }
      if (c.midTermScore === null) {
        warnings.push(
          `Môn ${c.courseCode}: chưa có điểm giữa kỳ (midTermScore = null).`,
        );
      }
      return {
        courseCode: c.courseCode,
        courseName: c.courseName,
        credits: c.credits,
        midTermScore:
          c.midTermScore !== null ? clampScore(c.midTermScore) : null,
        attendanceScore:
          c.attendanceScore !== null ? clampScore(c.attendanceScore) : null,
      };
    },
  );

  const currentSemesterCredits = currentCourses.reduce(
    (sum, c) => sum + c.credits,
    0,
  );

  if (currentCourses.length === 0) {
    warnings.push(
      `Không tìm thấy môn học nào trong học kỳ ${raw.resolvedSemester}. ` +
        `Hãy đảm bảo đã đồng bộ thời khoá biểu.`,
    );
  }

  // ── Thống kê rủi ro ───────────────────────────────────────────
  const allFailed = raw.historicalTranscripts.filter(
    (t) => t.status === "failed" || t.status === "absent_final" || t.status === "banned_final",
  );

  const retaken = raw.historicalTranscripts.filter(
    (t) => t.status === "retaken",
  );

  // Học kỳ gần nhất trong lịch sử = index 0 sau khi sort desc
  const lastSemester = semesterGpas[0]?.semester ?? null;
  const failedInLastSemester = lastSemester
    ? raw.historicalTranscripts.filter(
        (t) =>
          t.semester === lastSemester &&
          (t.status === "failed" ||
            t.status === "absent_final" ||
            t.status === "banned_final"),
      ).length
    : 0;

  if (failedInLastSemester > 0) {
    warnings.push(
      `Có ${failedInLastSemester} môn rớt trong học kỳ gần nhất (${lastSemester}). Rủi ro cao.`,
    );
  }

  // ── Kiểm tra completeness ─────────────────────────────────────
  const isComplete =
    currentCourses.length > 0 &&
    currentSemesterCredits > 0 &&
    recentGpaAvg !== null &&
    cumulative.gpa4 !== null;

  return {
    userId,
    studentId: raw.studentId,
    currentSemester: raw.resolvedSemester,

    currentSemesterCredits,
    currentSemesterCourseLoad: currentCourses.length,
    currentCourses,

    recentGpaAvg,
    recentSemesterGpas: recentSlice,
    cumulativeGPA: cumulative.gpa4,
    totalCreditEarned: cumulative.creditEarned,

    totalFailedCourses: allFailed.length,
    totalRetakenCourses: retaken.length,
    failedInLastSemester,

    warnings,
    isComplete,
  };
}

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════

/**
 * Clamp điểm về khoảng [0, 10] và round 2 chữ số thập phân.
 * Xử lý trường hợp giáo viên nhập nhầm thang 100 → chia 10.
 */
function clampScore(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  // Heuristic: nếu điểm > 10 thì có thể đang ở thang 100
  const normalized = raw > 10 ? raw / 10 : raw;
  return round2(Math.min(10, Math.max(0, normalized)));
}

/**
 * Tự suy ra học kỳ hiện tại từ bản ghi Timetable mới nhất nếu user không truyền.
 * Trả về chuỗi rỗng nếu không tìm thấy (sẽ tạo warning ở bước validate).
 */
async function resolveCurrentSemester(userId: string): Promise<string> {
  const latest = await prisma.timetable.findFirst({
    where: { userId },
    select: { semester: true },
    orderBy: { occurrenceDate: "desc" },
  });
  return latest?.semester ?? "";
}

// ══════════════════════════════════════════════════════════════════
// STEP 4: Entry Point — Public API
// ══════════════════════════════════════════════════════════════════

/**
 * Trích xuất feature vector cho một sinh viên, sẵn sàng đưa vào model ML.
 *
 * @example
 * ```ts
 * const features = await extractFeatures({ userId: "clxyz..." });
 * if (!features.isComplete) {
 *   console.warn("Missing features:", features.warnings);
 * }
 * // Đưa vào model:
 * const prediction = await gradeModel.predict({
 *   credits:      features.currentSemesterCredits,
 *   recentGpa:    features.recentGpaAvg,
 *   failedCount:  features.totalFailedCourses,
 * });
 * ```
 *
 * @throws {Error} Nếu userId không tồn tại trong CSDL hoặc DB unavailable.
 */
export async function extractFeatures(
  input: FeatureExtractionInput,
): Promise<StudentFeatureVector> {
  const { userId } = input;
  const recentSemesterCount = Math.max(1, input.recentSemesterCount ?? 2);

  // Resolve học kỳ hiện tại (nếu không truyền)
  const currentSemester =
    input.currentSemester?.trim() ||
    (await resolveCurrentSemester(userId));

  // Validate đầu vào cơ bản
  if (!userId?.trim()) {
    throw new Error("[featureExtraction] userId is required.");
  }

  // ── Step 1: Query DB ──────────────────────────────────────────
  const raw = await extractRawData({
    userId,
    currentSemester: currentSemester || "__UNKNOWN__",
    recentSemesterCount,
  });

  // ── Step 2: Compute ───────────────────────────────────────────
  const semesterGpas = computeSemesterGpas(raw.historicalTranscripts);
  const cumulative = computeCumulativeGpa(raw.historicalTranscripts);

  // ── Step 3: Validate & Build ──────────────────────────────────
  return validateAndBuildVector(
    userId,
    raw,
    semesterGpas,
    cumulative,
    recentSemesterCount,
  );
}

// ══════════════════════════════════════════════════════════════════
// BATCH VARIANT — Dùng cho training job, tránh N+1 query
// ══════════════════════════════════════════════════════════════════

/**
 * Trích xuất features cho nhiều sinh viên cùng lúc.
 * Dùng khi chạy training pipeline offline (không phải per-request).
 *
 * @param userIds - Danh sách userId cần extract
 * @param currentSemester - Học kỳ hiện tại (dùng chung cho tất cả)
 */
export async function extractFeaturesBatch(
  userIds: string[],
  currentSemester: string,
): Promise<Map<string, StudentFeatureVector>> {
  if (userIds.length === 0) return new Map();

  // Xử lý song song, nhưng giới hạn concurrency để không overload DB
  const CONCURRENCY = 10;
  const results = new Map<string, StudentFeatureVector>();

  for (let i = 0; i < userIds.length; i += CONCURRENCY) {
    const chunk = userIds.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map((uid) =>
        extractFeatures({ userId: uid, currentSemester }).catch((err) => {
          console.error(`[featureExtraction] Failed for userId=${uid}:`, err);
          return null;
        }),
      ),
    );
    chunk.forEach((uid, idx) => {
      const r = chunkResults[idx];
      if (r) results.set(uid, r);
    });
  }

  return results;
}
