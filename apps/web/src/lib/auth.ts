// apps/web/src/lib/auth.ts
import jwt, { type JwtPayload as JwtLibPayload, type Secret } from "jsonwebtoken";

export type JwtPayload = {
  id: string;
  role: "user" | "admin";
};

function getJwtSecret(): Secret {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("Missing env JWT_SECRET (check apps/web/.env.local)");
  }
  return s;
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret());

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const obj = decoded as JwtLibPayload & Partial<JwtPayload>;

  if (!obj.id || !obj.role) {
    throw new Error("Invalid token payload shape");
  }

  return {
    id: String(obj.id),
    role: obj.role === "admin" ? "admin" : "user",
  };
}