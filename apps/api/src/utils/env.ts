// path: apps/api/src/utils/env.ts
import "dotenv/config";

export const env = {
  PORT: process.env.PORT ?? "4000",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "dev_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "dev_secret",
};