// path: apps/web/src/lib/transcript/api.ts
export type TranscriptDetailComponent = {
  title: string;
  score1: number | null;
  score2: number | null;
  scale: number | null;
  percent: number | null;
  percentMax: number | null;
};

export type TranscriptItem = {
  id: string;
  semester: string;
  courseCode: string;
  classCode: string;
  courseName: string;
  credits: number;
  score10: number | null;
  letter: string | null;
  gpa4: number | null;
  status: string | null;
  componentsBreakdown?: {
    rawRow?: string;
    classCode?: string | null;
    method?: string | null;
    type?: string | null;
    unitType?: string | null;
    cumulative?: number | null;
    detailUrl?: string | null;
    detailSummary?: {
      totalPercent?: number | null;
      totalScore10?: number | null;
    } | null;
    detailItems?: TranscriptDetailComponent[] | null;
  } | null;
};

export type TranscriptApiResponse = {
  ok: boolean;
  items?: TranscriptItem[];
  meta?: {
    lastSyncedAt?: string | null;
    lastSyncStatus?: string | null;
    lastSyncCounts?: unknown;
  };
  message?: string;
};

export async function fetchTranscript(semester?: string) {
  const qs = new URLSearchParams();
  if (semester) qs.set("semester", semester);

  const res = await fetch(`/api/transcript${qs.toString() ? `?${qs}` : ""}`, {
    cache: "no-store",
  });

  const json = (await res.json()) as TranscriptApiResponse;

  if (!res.ok || !json.ok) {
    throw new Error(json.message || "Load transcript failed");
  }

  return json;
}