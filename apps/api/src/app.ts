// path: apps/api/src/app.ts
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { requestLogger } from "./middlewares/requestLogger";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(requestLogger);

  app.get("/", (_req, res) => {
    res.json({ service: "MYDTU Assistant API", status: "running" });
  });

  app.use("/", apiRouter);

  app.use((err: any, _req: any, res: any, _next: any) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: "VALIDATION_ERROR", details: err.errors });
    }
    if (err?.code === "P2002") {
      return res.status(409).json({
        error: "DUPLICATE",
        message: "Unique constraint failed",
        meta: err?.meta,
      });
    }
    const status = Number(err?.status ?? 500);
    console.error(err);
    res.status(status).json({ error: "INTERNAL_ERROR", message: err?.message ?? "Error" });
  });

  return app;
}