  // file: apps/api/src/adapters/dtu.v1.ts

  import type { AdapterInput, SchoolAdapter } from "@mydtu/shared";

  /**
   * Stub adapter:
   * Hiện tại extension đang gửi payload đúng ImportPayload (data có transcripts, timetables, sections, evaluations)
   * nên parse chỉ cần trả raw về đúng shape.
   * Sau này nếu raw khác format thì transform tại đây.
   */
  export const dtuV1Adapter: SchoolAdapter = {
    meta: {
      adapterKey: "duytan",
      adapterVersion: "dtu.v1",
      sourcePage: "extension",
    },

    parse(input: AdapterInput) {
      const fallback = { transcripts: [], timetables: [], sections: [], evaluations: [] };

      // raw expected: ImportPayload["data"]
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
