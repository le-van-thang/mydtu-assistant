// apps/web/src/app/api/auth/login/route.ts

import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeEmail } from "@/lib/auth/emailRules";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const data = schema.parse(body);

  const email = normalizeEmail(data.email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, role: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Sai email hoặc mật khẩu" }, { status: 400 });
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Sai email hoặc mật khẩu" }, { status: 400 });
  }

  const token = signToken({ id: user.id, role: user.role });

  const res = NextResponse.json({ message: "Đăng nhập thành công" });
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return res;
}