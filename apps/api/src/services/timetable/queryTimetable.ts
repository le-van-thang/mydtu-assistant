// path: apps/api/src/services/timetable/queryTimetable.ts

import { z } from "zod";

export const TimetableQuerySchema = z.object({
  mode: z.enum(["all", "day", "week", "month"]).optional(),
  date: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

function toUtcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

function parseIsoDateOnly(input?: string | null): Date | null {
  if (!input) return null;
  const m = String(input).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  return toUtcDate(year, month, day);
}

function startOfUtcDay(date: Date) {
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

function endOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

function addUtcDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function startOfUtcWeekMonday(date: Date) {
  const day = date.getUTCDay(); // 0=CN, 1=T2, ...
  const diff = day === 0 ? -6 : 1 - day;
  return startOfUtcDay(addUtcDays(date, diff));
}

function endOfUtcWeekSunday(date: Date) {
  const start = startOfUtcWeekMonday(date);
  return endOfUtcDay(addUtcDays(start, 6));
}

function startOfUtcMonth(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0)
  );
}

function endOfUtcMonth(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
}

export type TimetableDateRange =
  | {
      mode: "all";
      from: null;
      to: null;
    }
  | {
      mode: "day" | "week" | "month" | "range";
      from: Date;
      to: Date;
    };

export function resolveTimetableDateRange(input: unknown): TimetableDateRange {
  const parsed = TimetableQuerySchema.parse(input);
  const mode = parsed.mode ?? "all";

  if (parsed.from && parsed.to) {
    const from = parseIsoDateOnly(parsed.from);
    const to = parseIsoDateOnly(parsed.to);

    if (!from || !to) {
      throw new Error("from/to phải có format YYYY-MM-DD");
    }

    return {
      mode: "range",
      from: startOfUtcDay(from),
      to: endOfUtcDay(to),
    };
  }

  if (mode === "all") {
    return {
      mode: "all",
      from: null,
      to: null,
    };
  }

  const baseDate = parseIsoDateOnly(parsed.date) ?? startOfUtcDay(new Date());

  if (mode === "day") {
    return {
      mode,
      from: startOfUtcDay(baseDate),
      to: endOfUtcDay(baseDate),
    };
  }

  if (mode === "week") {
    return {
      mode,
      from: startOfUtcWeekMonday(baseDate),
      to: endOfUtcWeekSunday(baseDate),
    };
  }

  return {
    mode: "month",
    from: startOfUtcMonth(baseDate),
    to: endOfUtcMonth(baseDate),
  };
}