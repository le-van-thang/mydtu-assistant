// apps/web/src/app/api/auth/check-email/route.ts
import {
  isAllowedEmailDomain,
  isValidEmailFormat,
  normalizeEmail,
} from "@/lib/auth/emailRules";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(body?.email || "");

  if (!email || !isValidEmailFormat(email)) {
    return NextResponse.json(
      { ok: true, available: false, reason: "invalid_email" as const },
      { status: 200 }
    );
  }

  if (!isAllowedEmailDomain(email)) {
    return NextResponse.json(
      { ok: true, available: false, reason: "domain_not_allowed" as const },
      { status: 200 }
    );
  }

  const existed = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existed) {
    return NextResponse.json(
      { ok: true, available: false, reason: "exists" as const },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, available: true }, { status: 200 });
}