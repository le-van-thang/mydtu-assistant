import { NextResponse } from "next/server";
import {
  normalizeEmail,
  isValidEmailFormat,
  isAllowedEmailDomain,
} from "@/lib/auth/emailRules";

// TODO: đổi sang DB thật của bạn
async function emailExistsInDB(email: string): Promise<boolean> {
  // Ví dụ nếu bạn có prisma:
  // const user = await prisma.user.findUnique({ where: { email } });
  // return !!user;

  return false; // mặc định demo
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body?.email || "");

  if (!email) {
    return NextResponse.json(
      { ok: true, available: false, reason: "invalid_email" },
      { status: 200 }
    );
  }

  if (!isValidEmailFormat(email)) {
    return NextResponse.json(
      { ok: true, available: false, reason: "invalid_email" },
      { status: 200 }
    );
  }

  if (!isAllowedEmailDomain(email)) {
    return NextResponse.json(
      { ok: true, available: false, reason: "domain_not_allowed" },
      { status: 200 }
    );
  }

  const exists = await emailExistsInDB(email);
  if (exists) {
    return NextResponse.json(
      { ok: true, available: false, reason: "exists" },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, available: true }, { status: 200 });
}