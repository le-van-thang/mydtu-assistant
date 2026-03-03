// apps/api/src/logic/academic.test.ts
import { describe, expect, it } from "vitest";
import {
  calcWeightedGpa,
  letterToGpa4,
  requiredAverageForTarget,
  score10ToGpa4,
  toGpa4,
} from "./academic";

describe("academic core (DTU rules)", () => {
  it("letterToGpa4 mapping + excludes PF letters", () => {
    expect(letterToGpa4("A+")).toBe(4.0);
    expect(letterToGpa4("A")).toBe(4.0);
    expect(letterToGpa4("A-")).toBe(3.65);
    expect(letterToGpa4("B+")).toBe(3.33);
    expect(letterToGpa4("B")).toBe(3.0);
    expect(letterToGpa4("B-")).toBe(2.65);
    expect(letterToGpa4("C+")).toBe(2.33);
    expect(letterToGpa4("C")).toBe(2.0);
    expect(letterToGpa4("C-")).toBe(1.65);
    expect(letterToGpa4("D")).toBe(1.0);
    expect(letterToGpa4("F")).toBe(0.0);

    // PF / special => not counted GPA
    expect(letterToGpa4("P")).toBeNull();
    expect(letterToGpa4("I")).toBeNull();
    expect(letterToGpa4("X")).toBeNull();
    expect(letterToGpa4("R")).toBeNull();
  });

  it("score10ToGpa4 boundaries (full DTU cutoffs)", () => {
    // A+ vs A
    expect(score10ToGpa4(9.5)).toBe(4.0);
    expect(score10ToGpa4(9.4)).toBe(4.0);

    // A vs A-
    expect(score10ToGpa4(8.5)).toBe(4.0);
    expect(score10ToGpa4(8.4)).toBe(3.65);

    // A- vs B+
    expect(score10ToGpa4(8.0)).toBe(3.65);
    expect(score10ToGpa4(7.9)).toBe(3.33);

    // B+ vs B
    expect(score10ToGpa4(7.5)).toBe(3.33);
    expect(score10ToGpa4(7.4)).toBe(3.0);

    // B vs B-
    expect(score10ToGpa4(7.0)).toBe(3.0);
    expect(score10ToGpa4(6.9)).toBe(2.65);

    // B- vs C+
    expect(score10ToGpa4(6.5)).toBe(2.65);
    expect(score10ToGpa4(6.4)).toBe(2.33);

    // C+ vs C
    expect(score10ToGpa4(6.0)).toBe(2.33);
    expect(score10ToGpa4(5.9)).toBe(2.0);

    // C vs C-
    expect(score10ToGpa4(5.5)).toBe(2.0);
    expect(score10ToGpa4(5.4)).toBe(1.65);

    // C- vs D
    expect(score10ToGpa4(4.5)).toBe(1.65);
    expect(score10ToGpa4(4.4)).toBe(1.0);

    // D vs F
    expect(score10ToGpa4(4.0)).toBe(1.0);
    expect(score10ToGpa4(3.9)).toBe(0.0);
  });

  it("PF course must not affect GPA (exclude by returning null)", () => {
    const gpaP = letterToGpa4("P");
    expect(gpaP).toBeNull();

    // only counted items go into calcWeightedGpa
    const counted = [
      { credits: 3, gpa4: 4.0 },
      // P course must be excluded from list (simulate route behavior)
    ];
    const r = calcWeightedGpa(counted);
    expect(r.credits).toBe(3);
    expect(r.gpa4).toBeCloseTo(4.0, 6);
  });

  it("toGpa4 priority must respect auto-F (autoF > stored > letter > score10)", () => {
    // autoF by status absent_final
    expect(
      toGpa4({ gpa4: 4.0, score10: 9.9, letter: "A+", status: "absent_final" })
    ).toBe(0.0);

    // autoF by score10 < 4.0
    expect(
      toGpa4({ gpa4: 4.0, score10: 3.9, letter: "A+", status: "passed" })
    ).toBe(0.0);

    // autoF by finalScore < 1.0
    expect(
      toGpa4({ gpa4: 4.0, score10: 9.9, letter: "A+", status: "passed", finalScore: 0.9 })
    ).toBe(0.0);

    // if not autoF: stored wins
    expect(toGpa4({ gpa4: 3.33, score10: 9.9, letter: "A+" })).toBe(3.33);

    // if no stored: letter wins
    expect(toGpa4({ gpa4: null, score10: 9.9, letter: "B" })).toBe(3.0);

    // if no stored & no letter: score10 wins
    expect(toGpa4({ gpa4: null, score10: 8.2, letter: null })).toBe(3.65);
  });

  it("calcWeightedGpa", () => {
    const r = calcWeightedGpa([
      { credits: 3, gpa4: 4.0 },
      { credits: 2, gpa4: 3.0 },
    ]);
    // (3*4 + 2*3)/5 = (12+6)/5 = 18/5 = 3.6
    expect(r.credits).toBe(5);
    expect(r.sum).toBe(18);
    expect(r.gpa4).toBeCloseTo(3.6, 6);
  });

  it("requiredAverageForTarget feasibility", () => {
    // current: 3 credits, gpa 3.65 => sum=10.95
    const currentCredits = 3;
    const currentWeightedSum = 3.65 * 3;

    // target 3.2 with remaining 3 credits
    const a = requiredAverageForTarget({
      currentCredits,
      currentWeightedSum,
      remainingCredits: 3,
      targetGpa4: 3.2,
    });
    expect(a.requiredAvg).toBeLessThanOrEqual(4);
    expect(["reachable", "need_perfect", "already_reached"]).toContain(a.feasibility);

    // impossible-ish case
    const b = requiredAverageForTarget({
      currentCredits,
      currentWeightedSum,
      remainingCredits: 1,
      targetGpa4: 4.0,
    });
    expect(["impossible", "need_perfect", "already_reached"]).toContain(b.feasibility);
  });
});
