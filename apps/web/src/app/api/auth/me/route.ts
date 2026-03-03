// apps/web/src/app/api/auth/me/route.ts

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const token = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("token="))
    ?.split("=")[1];

  if (!token) return NextResponse.json({ user: null }, { status: 200 });

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json({ user: user ?? null }, { status: 200 });
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}