// apps/web/src/lib/auth/index.ts
import jwt from "jsonwebtoken";

export type TokenPayload = {
  id: string;
  role: "user" | "admin";
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signToken(payload: TokenPayload) {
  const secret = getJwtSecret();
  // token sống 7 ngày
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as TokenPayload;
}