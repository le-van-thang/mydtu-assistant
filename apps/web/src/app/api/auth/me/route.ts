// path: apps/web/src/app/api/auth/me/route.ts
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        schoolType: true,
        birthDate: true,
        placeOfBirth: true,
        createdAt: true,
        updatedAt: true,
        settings: {
          select: {
            avatarDataUrl: true,
            theme: true,
            language: true,
            density: true,
            lastManualSyncAt: true,
            lastExportAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolType: user.schoolType,
          birthDate: user.birthDate?.toISOString() ?? null,
          placeOfBirth: user.placeOfBirth,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          avatarDataUrl: user.settings?.avatarDataUrl ?? null,
          settings: {
            theme: user.settings?.theme ?? "system",
            language: user.settings?.language ?? "vi",
            density: user.settings?.density ?? "comfortable",
            lastManualSyncAt:
              user.settings?.lastManualSyncAt?.toISOString() ?? null,
            lastExportAt: user.settings?.lastExportAt?.toISOString() ?? null,
          },
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}