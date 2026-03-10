import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const DeleteAccountSchema = z.object({
  confirmText: z.string(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
});

const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  birthDate: z.string().nullable().optional(),
  placeOfBirth: z.string().max(120).nullable().optional(),
  schoolType: z.enum(["university", "college", "highschool", "other"]).optional(),
  avatarDataUrl: z.string().max(2_000_000).nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

async function getCurrentUserId() {
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    return payload.id;
  } catch {
    return null;
  }
}

function toDateOrNull(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

async function getProfileUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
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
        },
      },
      password: true,
    },
  });
}

function shapeUser(user: Awaited<ReturnType<typeof getProfileUser>>) {
  if (!user) return null;

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolType: user.schoolType,
      birthDate: user.birthDate?.toISOString() ?? null,
      placeOfBirth: user.placeOfBirth,
      createdAt: user.createdAt?.toISOString() ?? null,
      updatedAt: user.updatedAt?.toISOString() ?? null,
      avatarDataUrl: user.settings?.avatarDataUrl ?? null,
    },
  };
}

export async function PUT(req: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const raw = await req.json();
    const data = UpdateAccountSchema.parse(raw);

    const currentUser = await getProfileUser(userId);
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (data.newPassword !== undefined) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { ok: false, message: "Vui lòng nhập mật khẩu hiện tại." },
          { status: 400 }
        );
      }

      const passwordOk = await bcrypt.compare(
        data.currentPassword,
        currentUser.password
      );

      if (!passwordOk) {
        return NextResponse.json(
          { ok: false, message: "Mật khẩu hiện tại không đúng." },
          { status: 400 }
        );
      }

      const nextHashedPassword = await bcrypt.hash(data.newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: {
          password: nextHashedPassword,
        },
      });
    }

    const userData: Record<string, unknown> = {};
    if (data.name !== undefined) userData.name = data.name.trim();
    if (data.placeOfBirth !== undefined) {
      userData.placeOfBirth = data.placeOfBirth?.trim() || null;
    }
    if (data.schoolType !== undefined) userData.schoolType = data.schoolType;
    if (data.birthDate !== undefined) {
      userData.birthDate = toDateOrNull(data.birthDate);
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    if (data.avatarDataUrl !== undefined) {
      await prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          avatarDataUrl: data.avatarDataUrl ?? null,
        },
        update: {
          avatarDataUrl: data.avatarDataUrl ?? null,
        },
      });
    }

    const updated = await getProfileUser(userId);

    return NextResponse.json(shapeUser(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: (error as Error)?.message ?? "Error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const raw = await req.json();
    const data = DeleteAccountSchema.parse(raw);

    if (data.confirmText.trim().toUpperCase() !== "DELETE") {
      return NextResponse.json(
        { ok: false, message: 'Bạn phải nhập đúng "DELETE".' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const passwordOk = await bcrypt.compare(data.password, user.password);
    if (!passwordOk) {
      return NextResponse.json(
        { ok: false, message: "Mật khẩu hiện tại không đúng." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    const res = NextResponse.json({ ok: true }, { status: 200 });

    res.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: (error as Error)?.message ?? "Error",
      },
      { status: 500 }
    );
  }
}