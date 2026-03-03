// apps/web/src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import {
  normalizeEmail,
  isValidEmailFormat,
  isAllowedEmailDomain,
} from "@/lib/auth/emailRules";

async function emailExistsInDB(email: string): Promise<boolean> {
  return false; // TODO: thay DB thật
}

async function createUserInDB(input: {
  name: string;
  email: string;
  passwordHash: string;
  schoolType: string;
  birthDate: string;
  placeOfBirth?: string;
}) {
  return true; // TODO: thay DB thật
}

async function fakeHash(pw: string) {
  return `hash:${pw}`; // TODO: dùng bcrypt/argon2
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const name = String(body?.name || "").trim();
  const email = normalizeEmail(body?.email || "");
  const password = String(body?.password || "");
  const schoolType = String(body?.schoolType || "").trim();
  const birthDate = String(body?.birthDate || "").trim();
  const placeOfBirth = String(body?.placeOfBirth || "").trim();

  if (!name) return NextResponse.json({ message: "Name is required" }, { status: 400 });

  if (!email || !isValidEmailFormat(email)) {
    return NextResponse.json({ message: "Invalid email" }, { status: 400 });
  }

  if (!isAllowedEmailDomain(email)) {
    return NextResponse.json({ message: "Email domain not allowed" }, { status: 400 });
  }

  if (!birthDate) {
    return NextResponse.json({ message: "Birth date is required" }, { status: 400 });
  }

  if (!schoolType) {
    return NextResponse.json({ message: "School type is required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const exists = await emailExistsInDB(email);
  if (exists) {
    return NextResponse.json({ message: "Email already exists" }, { status: 409 });
  }

  const passwordHash = await fakeHash(password);

  await createUserInDB({
    name,
    email,
    passwordHash,
    schoolType,
    birthDate,
    placeOfBirth: placeOfBirth || undefined,
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}