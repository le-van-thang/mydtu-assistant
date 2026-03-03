// file: apps/api/src/adapters/hcmut.v1.ts

import type { AdapterInput, SchoolAdapter } from "@mydtu/shared";

/**
 * Stub adapter cho HCMUT (chưa transform gì)
 * Khi extension/web gửi payload theo ImportPayload.data thì chỉ cần trả đúng shape.
 */
export const hcmutV1Adapter: SchoolAdapter = {
  meta: {
    adapterKey: "hcmut",
    adapterVersion: "hcmut.v1",
    sourcePage: "extension",
  },

  parse(input: AdapterInput) {
    const fallback = { transcripts: [], timetables: [], sections: [], evaluations: [] };

    if (!input || typeof input !== "object") return fallback;

    const raw = (input as any).raw ?? null;
    if (!raw || typeof raw !== "object") return fallback;

    return {
      transcripts: Array.isArray((raw as any).transcripts) ? (raw as any).transcripts : [],
      timetables: Array.isArray((raw as any).timetables) ? (raw as any).timetables : [],
      sections: Array.isArray((raw as any).sections) ? (raw as any).sections : [],
      evaluations: Array.isArray((raw as any).evaluations) ? (raw as any).evaluations : [],
    };
  },
};
