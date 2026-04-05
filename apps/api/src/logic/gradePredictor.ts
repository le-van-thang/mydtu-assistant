// path: apps/api/src/logic/gradePredictor.ts
//
// Grade Prediction Engine — Linear Regression Model (v1)
// ────────────────────────────────────────────────────────
// Thiết kế theo nguyên tắc Strategy Pattern:
//   - Interface PredictionModel định nghĩa contract
//   - LinearRegressionModel là implementation đầu tiên (simulatable, replaceable)
//   - Hàm predict() là entry point duy nhất cho tầng route
//
// Khi có model thực (Python µ-service, ONNX runtime, v.v.) chỉ cần
// implement lại PredictionModel và swap vào factory createDefaultModel().

import type { StudentFeatureVector } from "./featureExtraction";
import { round2 } from "./academic";

// ══════════════════════════════════════════════════════════════════
// TYPES — Public contract
// ══════════════════════════════════════════════════════════════════

export type RiskLevel = "Low" | "Medium" | "High";

export interface GradePrediction {
  /** Điểm cuối kỳ dự kiến, thang 10, đã clamp về [0, 10] */
  predictedFinalScore: number;
  /** Khoảng tin cậy 95% dưới */
  confidenceLow: number;
  /** Khoảng tin cậy 95% trên */
  confidenceHigh: number;
  /** Xác suất đỗ môn (score >= 5.0) */
  passProbability: number;
  /** Mức rủi ro tổng hợp */
  riskLevel: RiskLevel;
  /** Giải thích ngắn gọn → dùng cho UX hiển thị cho sinh viên */
  explanation: string;
  /** Các môn dự đoán từng course (index theo currentCourses) */
  perCourse: CourseGradePrediction[];
  /** Meta thông tin về model đã dùng */
  modelMeta: ModelMeta;
}

export interface CourseGradePrediction {
  courseCode: string;
  courseName: string | null;
  credits: number;
  predictedScore: number;
  confidenceLow: number;
  confidenceHigh: number;
  passProbability: number;
  riskLevel: RiskLevel;
}

export interface ModelMeta {
  modelName: string;
  version: string;
  algorithm: string;
  /** true = đang dùng model giả lập (chưa train thực) */
  isSimulated: boolean;
}

// ══════════════════════════════════════════════════════════════════
// MODEL COEFFICIENTS — Linear Regression v1
// ──────────────────────────────────────────
// Công thức: score = β0 + β1*midTerm + β2*attendance + β3*cumGPA
//                       + β4*failedPenalty + β5*courseLoad
//
// Hệ số này là kết quả của quá trình "thủ công calibrate" (simulated).
// Khi có dataset thực, thay bằng kết quả của scikit-learn / OLS.
// ══════════════════════════════════════════════════════════════════

interface ModelCoefficients {
  intercept: number;
  midTermScore: number;       // Trọng số điểm giữa kỳ (ảnh hưởng lớn nhất ~55%)
  attendanceScore: number;    // Trọng số chuyên cần (~15%)
  cumulativeGPA: number;      // GPA tích lũy — hệ 4 → quy về thang 10 trước khi nhân (~20%)
  recentGpaBonus: number;     // Bonus/penalty trend 2 kỳ gần nhất vs cumulative (~5%)
  failedPenalty: number;      // Penalty mỗi môn đã rớt trong quá khứ (~3%)
  highloadPenalty: number;    // Penalty khi học > 7 môn cùng lúc (~2%)
  creditWeight: number;       // Môn nhiều TC hơn thường khó hơn — nhẹ
}

const DEFAULT_COEFFICIENTS: ModelCoefficients = {
  intercept: 1.80,
  midTermScore: 0.55,
  attendanceScore: 0.15,
  cumulativeGPA: 0.55,      // nhân với (cumGPA/4)*10 để chuẩn hoá về thang 10
  recentGpaBonus: 0.30,
  failedPenalty: -0.25,
  highloadPenalty: -0.18,
  creditWeight: -0.04,
};

// Sai số chuẩn của model (dùng để tạo confidence interval)
// σ ≈ 1.2 là giá trị thực nghiệm phổ biến cho mô hình điểm sinh viên
const MODEL_SIGMA = 1.2;
// Z-score cho 95% CI (hai phía)
const Z_95 = 1.96;

// ══════════════════════════════════════════════════════════════════
// CORE COMPUTATION — Pure functions
// ══════════════════════════════════════════════════════════════════

/** Clamp về [0, 10] và round 2 chữ số */
function clamp10(x: number): number {
  return round2(Math.min(10, Math.max(0, x)));
}

/**
 * Logistic function → chuyển điểm dự đoán thành xác suất đỗ.
 * Điểm 5.0 → passProbability ≈ 0.50 (điểm cắt đỗ)
 * Điểm 7.0 → passProbability ≈ 0.88
 * Điểm 3.0 → passProbability ≈ 0.12
 */
function scoreToPassProbability(score: number): number {
  // Dịch 5.0 → 0, scale để sigmoid có độ dốc hợp lý
  const logit = (score - 5.0) * 1.2;
  const prob = 1 / (1 + Math.exp(-logit));
  return round2(prob);
}

/**
 * Tính điểm dự đoán cho 1 môn học.
 * Fallback từng feature nếu null:
 *   - midTermScore null  → dùng recentGpa * 0.9 làm proxy
 *   - attendanceScore null → dùng midTerm * 0.8 làm proxy
 */
function predictSingleCourse(
  courseCredits: number,
  midTermScore: number | null,
  attendanceScore: number | null,
  cumulativeGPA: number | null,
  recentGpaAvg: number | null,
  totalFailedCourses: number,
  semesterCourseLoad: number,
  coefs: ModelCoefficients,
): number {
  // ── Chuẩn hoá features về thang 10 ─────────────────────────
  const cumGpa10 = cumulativeGPA !== null ? (cumulativeGPA / 4) * 10 : null;
  const recentGpa10 = recentGpaAvg !== null ? (recentGpaAvg / 4) * 10 : null;

  // Fallback midTerm → dùng GPA 2 kỳ gần × 0.9 (proxy thô)
  const effectiveMidTerm =
    midTermScore ??
    (recentGpa10 !== null ? recentGpa10 * 0.9 : cumGpa10 !== null ? cumGpa10 * 0.85 : 5.0);

  // Fallback attendance → dùng midTerm × 0.8 (tương quan thực nghiệm)
  const effectiveAttendance = attendanceScore ?? effectiveMidTerm * 0.8;

  // Fallback cumulativeGPA → dùng 2.0/4 = 5.0 thang 10 (GPA trung bình)
  const effectiveCumGpa10 = cumGpa10 ?? 5.0;

  // ── Tính bonus trend (recentGpa vs cumGpa) ───────────────────
  // Nếu recentGpa > cumGpa → sinh viên đang tiến bộ → bonus dương
  const recentTrend =
    recentGpa10 !== null ? (recentGpa10 - effectiveCumGpa10) : 0;

  // ── Tính penalty học nhiều môn ───────────────────────────────
  const loadPenalty = semesterCourseLoad > 7 ? semesterCourseLoad - 7 : 0;

  // ── Linear combination ────────────────────────────────────────
  const rawScore =
    coefs.intercept +
    coefs.midTermScore * effectiveMidTerm +
    coefs.attendanceScore * effectiveAttendance +
    coefs.cumulativeGPA * effectiveCumGpa10 +
    coefs.recentGpaBonus * recentTrend +
    coefs.failedPenalty * totalFailedCourses +
    coefs.highloadPenalty * loadPenalty +
    coefs.creditWeight * courseCredits;

  return rawScore;
}

/** Xác định risk level từ điểm dự đoán và pass probability */
function classifyRisk(score: number, passProbability: number): RiskLevel {
  // High risk: điểm < 5.5 HOẶC xác suất đỗ < 55%
  if (score < 5.5 || passProbability < 0.55) return "High";
  // Medium risk: 5.5 ≤ điểm < 6.5 HOẶC xác suất đỗ < 75%
  if (score < 6.5 || passProbability < 0.75) return "Medium";
  return "Low";
}

/** Tạo câu giải thích ngắn gọn, thân thiện với sinh viên */
function buildExplanation(
  overallScore: number,
  riskLevel: RiskLevel,
  features: StudentFeatureVector,
): string {
  const parts: string[] = [];

  if (riskLevel === "High") {
    parts.push(`Nguy cơ cao. Điểm dự đoán tổng ${overallScore}/10.`);
    if (features.totalFailedCourses > 0) {
      parts.push(`Bạn đã rớt ${features.totalFailedCourses} môn trong quá khứ — cần cải thiện phương pháp học.`);
    }
    if (features.recentGpaAvg !== null && features.recentGpaAvg < 2.0) {
      parts.push(`GPA 2 kỳ gần nhất chỉ đạt ${features.recentGpaAvg}/4 — dưới mức an toàn.`);
    }
  } else if (riskLevel === "Medium") {
    parts.push(`Rủi ro trung bình. Điểm dự đoán tổng ${overallScore}/10.`);
    parts.push("Tập trung ôn tập và đảm bảo chuyên cần để cải thiện kết quả.");
  } else {
    parts.push(`Tốt! Điểm dự đoán tổng ${overallScore}/10.`);
    parts.push("Tiếp tục duy trì phong độ học tập hiện tại.");
  }

  if (features.currentSemesterCourseLoad > 7) {
    parts.push(`Học kỳ này bạn đang học ${features.currentSemesterCourseLoad} môn — khá nặng, quản lý thời gian cẩn thận.`);
  }

  return parts.join(" ");
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════

/**
 * Chạy mô hình dự đoán điểm cuối kỳ cho một sinh viên.
 *
 * @param features - Feature vector từ extractFeatures()
 * @param coefs    - Hệ số model (override mặc định nếu có model đã train)
 * @returns GradePrediction object sạch, sẵn sàng trả về API
 */
export function predict(
  features: StudentFeatureVector,
  coefs: ModelCoefficients = DEFAULT_COEFFICIENTS,
): GradePrediction {
  const { currentCourses, cumulativeGPA, recentGpaAvg, totalFailedCourses, currentSemesterCourseLoad } = features;

  // ── Dự đoán từng môn ────────────────────────────────────────
  const perCourse: CourseGradePrediction[] = currentCourses.map((course) => {
    const rawScore = predictSingleCourse(
      course.credits,
      course.midTermScore,
      course.attendanceScore,
      cumulativeGPA,
      recentGpaAvg,
      totalFailedCourses,
      currentSemesterCourseLoad,
      coefs,
    );

    const score = clamp10(rawScore);
    const low = clamp10(score - Z_95 * MODEL_SIGMA);
    const high = clamp10(score + Z_95 * MODEL_SIGMA);
    const passProbability = scoreToPassProbability(score);
    const riskLevel = classifyRisk(score, passProbability);

    return {
      courseCode: course.courseCode,
      courseName: course.courseName,
      credits: course.credits,
      predictedScore: score,
      confidenceLow: low,
      confidenceHigh: high,
      passProbability,
      riskLevel,
    };
  });

  // ── Tính điểm tổng (trung bình có trọng số tín chỉ) ─────────
  let weightedSum = 0;
  let totalCredits = 0;

  for (const c of perCourse) {
    if (c.credits > 0) {
      weightedSum += c.predictedScore * c.credits;
      totalCredits += c.credits;
    }
  }

  // Fallback nếu không có credits (credits = 0 ở tất cả môn)
  const overallScore =
    totalCredits > 0
      ? clamp10(weightedSum / totalCredits)
      : perCourse.length > 0
        ? clamp10(perCourse.reduce((s, c) => s + c.predictedScore, 0) / perCourse.length)
        : 5.0; // absolute fallback

  const overallLow = clamp10(overallScore - Z_95 * MODEL_SIGMA);
  const overallHigh = clamp10(overallScore + Z_95 * MODEL_SIGMA);
  const overallPassProbability = scoreToPassProbability(overallScore);
  const overallRisk = classifyRisk(overallScore, overallPassProbability);

  return {
    predictedFinalScore: overallScore,
    confidenceLow: overallLow,
    confidenceHigh: overallHigh,
    passProbability: overallPassProbability,
    riskLevel: overallRisk,
    explanation: buildExplanation(overallScore, overallRisk, features),
    perCourse,
    modelMeta: {
      modelName: "grade_predictor",
      version: "1.0.0-simulated",
      algorithm: "multi_linear_regression",
      isSimulated: true,
    },
  };
}

// Re-export các types cần thiết để route sử dụng
export type { ModelCoefficients };
