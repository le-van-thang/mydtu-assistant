// apps/api/src/middlewares/requestLogger.ts
import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";

function getRequestId(req: Request): string {
  const fromHeader = req.header("x-request-id");
  if (fromHeader && fromHeader.trim()) return fromHeader.trim();
  return crypto.randomUUID();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = getRequestId(req);
  (req as any).requestId = requestId;

  res.setHeader("x-request-id", requestId);

  const start = Date.now();
  const method = req.method;
  const url = req.originalUrl;

  res.on("finish", () => {
    const ms = Date.now() - start;
    const status = res.statusCode;

    // log gọn, không dump body để tránh lộ data
    console.log(
      JSON.stringify({
        requestId,
        method,
        url,
        status,
        ms,
      })
    );
  });

  next();
}
