import { Router } from "express";
import { prisma } from "../db";

export const healthRouter = Router();

/** GET /health */
healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/** GET /health/db/ping */
healthRouter.get("/db/ping", async (_req, res, next) => {
  try {
    const now = await prisma.$queryRaw`SELECT now()`;
    res.json({ ok: true, now });
  } catch (e) {
    next(e);
  }
});
