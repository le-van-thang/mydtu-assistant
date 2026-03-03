import { buildGradeDistributionOptions } from "@mydtu/shared";

export function computeGradePlans(input: {
  requiredGpa: number;
  courses: { courseCode: string; credits: number }[];
}) {
  return buildGradeDistributionOptions(input);
}
