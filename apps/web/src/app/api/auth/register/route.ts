// apps/web/src/app/api/auth/register/route.ts
import { isAllowedEmailDomain, normalizeEmail } from "@/lib/auth/emailRules";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  schoolType: z.enum(["university", "college", "highschool", "other"]),
  birthDate: z.string().min(1), // yyyy-mm-dd
  placeOfBirth: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const data = schema.parse(body);

  const email = normalizeEmail(data.email);

  if (!isAllowedEmailDomain(email)) {
    return NextResponse.json({ message: "Email domain not allowed" }, { status: 400 });
  }

  const existed = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existed) {
    return NextResponse.json({ message: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      password: passwordHash,
      schoolType: data.schoolType,
      birthDate: new Date(data.birthDate),
      placeOfBirth: data.placeOfBirth?.trim() || null,
      role: "user",
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}