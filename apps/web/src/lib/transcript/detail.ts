// path: apps/web/src/lib/transcript/detail.ts
export type TranscriptDetailItem = {
  id: string;
  semester: string;
  courseCode: string;
  classCode: string;
  courseName: string | null;

  componentKey: string | null;
  componentLabel: string;

  score1: number | null;
  score2: number | null;
  scaleScore: number | null;
  weightPercent: number | null;
  contributionScore: number | null;
  contributionMax: number | null;
  displayOrder: number;
  rawText: string | null;

  transcript?: {
    id: string;
    credits: number;
    score10: number | null;
    letter: string | null;
    gpa4: number | null;
    status: string | null;
    semester: string;
    courseCode: string;
    classCode: string;
    courseName: string;
    componentsBreakdown?: Record<string, unknown> | null;
  } | null;
};

export type TranscriptDetailApiResponse = {
  ok: boolean;
  items?: TranscriptDetailItem[];
  meta?: {
    lastSyncedAt?: string | null;
    lastSyncStatus?: string | null;
    lastSyncCounts?: unknown;
  };
  message?: string;
};

export async function fetchTranscriptDetail(params?: {
  semester?: string;
  courseCode?: string;
  classCode?: string;
  search?: string;
}) {
  const qs = new URLSearchParams();

  if (params?.semester) qs.set("semester", params.semester);
  if (params?.courseCode) qs.set("courseCode", params.courseCode);
  if (params?.classCode) qs.set("classCode", params.classCode);
  if (params?.search) qs.set("search", params.search);

  const res = await fetch(
    `/api/transcript/detail${qs.toString() ? `?${qs}` : ""}`,
    { cache: "no-store" },
  );

  const json = (await res.json()) as TranscriptDetailApiResponse;

  if (!res.ok || !json.ok) {
    throw new Error(json.message || "Load transcript detail failed");
  }

  return json;
}