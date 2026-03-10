// apps/api/src/middlewares/auth.ts
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = { sub?: string; userId?: string; id?: string; email?: string; name?: string };

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

function getSecret() {
  return process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Authorization Bearer token" });
  }

  const token = header.slice("Bearer ".length).trim();
  const secret = getSecret();
  if (!secret) return res.status(500).json({ message: "JWT secret is not set" });

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    const userId = decoded.sub || decoded.userId || decoded.id;
    if (!userId) return res.status(401).json({ message: "Invalid token payload (missing user id)" });

    req.user = { id: userId };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}