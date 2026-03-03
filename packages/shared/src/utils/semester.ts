// file: packages/shared/src/utils/semester.ts

/**
 * Chuẩn hoá key học kỳ để đồng bộ giữa các nguồn:
 * - "2023-2024 HK1" -> "2023_2024_1"
 * - "HK2 2022-2023" -> "2022_2023_2"
 * - "2024 HK1" -> "2024_2024_1"
 * - fallback: slug nhẹ (ổn định để lưu DB / unique key)
 */
export function normalizeSemesterKey(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "UNKNOWN";

  const up = s.toUpperCase();

  // năm học dạng 2023-2024 hoặc 2023/2024
  const mYear = up.match(/(20\d{2})\s*[-/]\s*(20\d{2})/);
  const y1 = mYear?.[1];
  const y2 = mYear?.[2];

  // HK1 HK2 HK3, hoặc "HỌC KỲ 1", "SEMESTER 1"
  const mTerm = up.match(/HK\s*([123])|HỌC\s*K[ỲY]\s*([123])|SEMESTER\s*([123])/);
  const term = (mTerm?.[1] ?? mTerm?.[2] ?? mTerm?.[3]) as string | undefined;

  if (y1 && y2 && term) return `${y1}_${y2}_${term}`;

  // dạng "2024 HK1" (chỉ có 1 năm)
  const mOneYear = up.match(/(20\d{2}).*HK\s*([123])/);
  if (mOneYear) return `${mOneYear[1]}_${mOneYear[1]}_${mOneYear[2]}`;

  // fallback: slug ổn định
  return up
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "")
    .slice(0, 40);
}
