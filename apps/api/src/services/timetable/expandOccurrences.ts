// path: apps/api/src/services/timetable/expandOccurrences.ts

export type ParsedWeekLabel = {
  weekLabel: string;
  weekStartDate: Date;
  weekEndDate: Date;
};

function toUtcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function stripTime(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}

/**
 * Parse được cả:
 * - "Tuần 30: 02/03/2026 - 08/03/2026"
 * - "02/03/2026 - 08/03/2026"
 */
export function parseWeekLabel(input: string): ParsedWeekLabel | null {
  const text = String(input || "").trim();
  if (!text) return null;

  const match = text.match(
    /(\d{2})\/(\d{2})\/(\d{4})\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/
  );

  if (!match) return null;

  const startDay = Number(match[1]);
  const startMonth = Number(match[2]);
  const startYear = Number(match[3]);

  const endDay = Number(match[4]);
  const endMonth = Number(match[5]);
  const endYear = Number(match[6]);

  const weekStartDate = stripTime(toUtcDate(startYear, startMonth, startDay));
  const weekEndDate = stripTime(toUtcDate(endYear, endMonth, endDay));

  return {
    weekLabel: text,
    weekStartDate,
    weekEndDate,
  };
}

/**
 * dayOfWeek:
 * 1 = Thứ 2
 * 2 = Thứ 3
 * ...
 * 6 = Thứ 7
 * 7 = Chủ nhật
 */
export function buildOccurrenceDate(
  weekStartDate: Date,
  dayOfWeek: number
): Date {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    throw new Error(`dayOfWeek không hợp lệ: ${dayOfWeek}`);
  }

  const base = stripTime(weekStartDate);
  const occurrence = new Date(base);
  occurrence.setUTCDate(base.getUTCDate() + (dayOfWeek - 1));
  return stripTime(occurrence);
}