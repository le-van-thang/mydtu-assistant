// file: apps/api/src/adapters/index.ts

import { dtuV1Adapter } from "./dtu.v1";
import { hcmutV1Adapter } from "./hcmut.v1";

export const adapters = {
  dtu: dtuV1Adapter,
  hcmut: hcmutV1Adapter,
};

export type AdapterKey = keyof typeof adapters;
