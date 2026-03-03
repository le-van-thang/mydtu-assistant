// file: packages/shared/src/adapters/types.ts

import type { ImportPayload } from "../schemas/importPayload";
/** Metadata để định danh adapter */
export type AdapterMeta = {
  adapterKey: string;
  adapterVersion: string;
  sourcePage: string;
};
/** Input chung cho adapter parse */
export type AdapterInput = {
  raw: unknown;
  // optional info nếu sau này muốn enrich
  user?: {
    email?: string;
    name?: string;
  };
  meta?: Partial<AdapterMeta>;
};
/**
 * Adapter trường học
 * - parse raw -> data chuẩn ImportPayload.data
 */
export type SchoolAdapter = {
  meta: AdapterMeta;
  parse: (input: AdapterInput) => ImportPayload["data"];
};
