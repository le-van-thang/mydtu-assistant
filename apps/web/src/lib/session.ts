import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  role: "user" | "admin";
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  try {
    const decoded = verifyToken(token);
    return {
      id: decoded.id,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}