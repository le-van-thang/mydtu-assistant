// path: apps/web/src/app/api/settings/route.ts
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeSettingsPrefs } from "@/lib/settings/prefs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const FullSettingsPayloadSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["vi", "en"]),
  density: z.enum(["comfortable", "compact"]),
  notifications: z.object({
    emailAlerts: z.boolean(),
    webPush: z.boolean(),
    timetableReminders: z.boolean(),
    deadlineReminders: z.boolean(),
    gradeAlerts: z.boolean(),
    weeklySummary: z.boolean(),
  }),
  privacy: z.object({
    rememberDevice: z.boolean(),
    analyticsOptIn: z.boolean(),
  }),
  data: z.object({
    onboardingDismissed: z.boolean(),
    lastManualSyncAt: z.string().nullable(),
    lastExportAt: z.string().nullable(),
  }),
  avatarDataUrl: z.string().max(2_000_000).nullable().optional(),
});

const PartialSettingsPayloadSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  language: z.enum(["vi", "en"]).optional(),
  density: z.enum(["comfortable", "compact"]).optional(),
  notifications: z
    .object({
      emailAlerts: z.boolean().optional(),
      webPush: z.boolean().optional(),
      timetableReminders: z.boolean().optional(),
      deadlineReminders: z.boolean().optional(),
      gradeAlerts: z.boolean().optional(),
      weeklySummary: z.boolean().optional(),
    })
    .optional(),
  privacy: z
    .object({
      rememberDevice: z.boolean().optional(),
      analyticsOptIn: z.boolean().optional(),
    })
    .optional(),
  data: z
    .object({
      onboardingDismissed: z.boolean().optional(),
      lastManualSyncAt: z.string().nullable().optional(),
      lastExportAt: z.string().nullable().optional(),
    })
    .optional(),
  avatarDataUrl: z.string().max(2_000_000).nullable().optional(),
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

async function getUserWithSettings(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      settings: {
        select: {
          theme: true,
          language: true,
          density: true,
          emailAlerts: true,
          webPush: true,
          timetableReminders: true,
          deadlineReminders: true,
          gradeAlerts: true,
          weeklySummary: true,
          rememberDevice: true,
          analyticsOptIn: true,
          onboardingDismissed: true,
          lastManualSyncAt: true,
          lastExportAt: true,
          avatarDataUrl: true,
        },
      },
    },
  });
}

function shapeResponse(user: Awaited<ReturnType<typeof getUserWithSettings>>) {
  if (!user) return null;

  const settings = normalizeSettingsPrefs({
    theme: user.settings?.theme,
    language: user.settings?.language,
    density: user.settings?.density,
    notifications: {
      emailAlerts: user.settings?.emailAlerts,
      webPush: user.settings?.webPush,
      timetableReminders: user.settings?.timetableReminders,
      deadlineReminders: user.settings?.deadlineReminders,
      gradeAlerts: user.settings?.gradeAlerts,
      weeklySummary: user.settings?.weeklySummary,
    },
    privacy: {
      rememberDevice: user.settings?.rememberDevice,
      analyticsOptIn: user.settings?.analyticsOptIn,
    },
    data: {
      onboardingDismissed: user.settings?.onboardingDismissed,
      lastManualSyncAt: user.settings?.lastManualSyncAt?.toISOString() ?? null,
      lastExportAt: user.settings?.lastExportAt?.toISOString() ?? null,
    },
  });

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarDataUrl: user.settings?.avatarDataUrl ?? null,
    },
    settings,
  };
}

export async function GET() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await getUserWithSettings(userId);
  if (!user) {
    return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(shapeResponse(user));
}

export async function PUT(req: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const raw = await req.json();
    const data = FullSettingsPayloadSchema.parse(raw);

    await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: data.theme,
        language: data.language,
        density: data.density,
        emailAlerts: data.notifications.emailAlerts,
        webPush: data.notifications.webPush,
        timetableReminders: data.notifications.timetableReminders,
        deadlineReminders: data.notifications.deadlineReminders,
        gradeAlerts: data.notifications.gradeAlerts,
        weeklySummary: data.notifications.weeklySummary,
        rememberDevice: data.privacy.rememberDevice,
        analyticsOptIn: data.privacy.analyticsOptIn,
        onboardingDismissed: data.data.onboardingDismissed,
        lastManualSyncAt: toDateOrNull(data.data.lastManualSyncAt),
        lastExportAt: toDateOrNull(data.data.lastExportAt),
        avatarDataUrl: data.avatarDataUrl ?? null,
      },
      update: {
        theme: data.theme,
        language: data.language,
        density: data.density,
        emailAlerts: data.notifications.emailAlerts,
        webPush: data.notifications.webPush,
        timetableReminders: data.notifications.timetableReminders,
        deadlineReminders: data.notifications.deadlineReminders,
        gradeAlerts: data.notifications.gradeAlerts,
        weeklySummary: data.notifications.weeklySummary,
        rememberDevice: data.privacy.rememberDevice,
        analyticsOptIn: data.privacy.analyticsOptIn,
        onboardingDismissed: data.data.onboardingDismissed,
        lastManualSyncAt: toDateOrNull(data.data.lastManualSyncAt),
        lastExportAt: toDateOrNull(data.data.lastExportAt),
        avatarDataUrl: data.avatarDataUrl ?? null,
      },
    });

    const user = await getUserWithSettings(userId);
    if (!user) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(shapeResponse(user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.flatten() },
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

export async function PATCH(req: Request) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const raw = await req.json();
    const patch = PartialSettingsPayloadSchema.parse(raw);

    const currentUser = await getUserWithSettings(userId);
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    const current = {
      theme: currentUser.settings?.theme ?? "system",
      language: currentUser.settings?.language ?? "vi",
      density: currentUser.settings?.density ?? "comfortable",
      emailAlerts: currentUser.settings?.emailAlerts ?? true,
      webPush: currentUser.settings?.webPush ?? false,
      timetableReminders: currentUser.settings?.timetableReminders ?? true,
      deadlineReminders: currentUser.settings?.deadlineReminders ?? true,
      gradeAlerts: currentUser.settings?.gradeAlerts ?? true,
      weeklySummary: currentUser.settings?.weeklySummary ?? false,
      rememberDevice: currentUser.settings?.rememberDevice ?? true,
      analyticsOptIn: currentUser.settings?.analyticsOptIn ?? false,
      onboardingDismissed: currentUser.settings?.onboardingDismissed ?? false,
      lastManualSyncAt: currentUser.settings?.lastManualSyncAt ?? null,
      lastExportAt: currentUser.settings?.lastExportAt ?? null,
      avatarDataUrl: currentUser.settings?.avatarDataUrl ?? null,
    };

    await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        theme: patch.theme ?? current.theme,
        language: patch.language ?? current.language,
        density: patch.density ?? current.density,
        emailAlerts: patch.notifications?.emailAlerts ?? current.emailAlerts,
        webPush: patch.notifications?.webPush ?? current.webPush,
        timetableReminders:
          patch.notifications?.timetableReminders ?? current.timetableReminders,
        deadlineReminders:
          patch.notifications?.deadlineReminders ?? current.deadlineReminders,
        gradeAlerts: patch.notifications?.gradeAlerts ?? current.gradeAlerts,
        weeklySummary: patch.notifications?.weeklySummary ?? current.weeklySummary,
        rememberDevice: patch.privacy?.rememberDevice ?? current.rememberDevice,
        analyticsOptIn: patch.privacy?.analyticsOptIn ?? current.analyticsOptIn,
        onboardingDismissed:
          patch.data?.onboardingDismissed ?? current.onboardingDismissed,
        lastManualSyncAt:
          patch.data?.lastManualSyncAt !== undefined
            ? toDateOrNull(patch.data.lastManualSyncAt)
            : current.lastManualSyncAt,
        lastExportAt:
          patch.data?.lastExportAt !== undefined
            ? toDateOrNull(patch.data.lastExportAt)
            : current.lastExportAt,
        avatarDataUrl:
          patch.avatarDataUrl !== undefined ? patch.avatarDataUrl : current.avatarDataUrl,
      },
      update: {
        theme: patch.theme ?? current.theme,
        language: patch.language ?? current.language,
        density: patch.density ?? current.density,
        emailAlerts: patch.notifications?.emailAlerts ?? current.emailAlerts,
        webPush: patch.notifications?.webPush ?? current.webPush,
        timetableReminders:
          patch.notifications?.timetableReminders ?? current.timetableReminders,
        deadlineReminders:
          patch.notifications?.deadlineReminders ?? current.deadlineReminders,
        gradeAlerts: patch.notifications?.gradeAlerts ?? current.gradeAlerts,
        weeklySummary: patch.notifications?.weeklySummary ?? current.weeklySummary,
        rememberDevice: patch.privacy?.rememberDevice ?? current.rememberDevice,
        analyticsOptIn: patch.privacy?.analyticsOptIn ?? current.analyticsOptIn,
        onboardingDismissed:
          patch.data?.onboardingDismissed ?? current.onboardingDismissed,
        lastManualSyncAt:
          patch.data?.lastManualSyncAt !== undefined
            ? toDateOrNull(patch.data.lastManualSyncAt)
            : current.lastManualSyncAt,
        lastExportAt:
          patch.data?.lastExportAt !== undefined
            ? toDateOrNull(patch.data.lastExportAt)
            : current.lastExportAt,
        avatarDataUrl:
          patch.avatarDataUrl !== undefined ? patch.avatarDataUrl : current.avatarDataUrl,
      },
    });

    const user = await getUserWithSettings(userId);
    if (!user) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json(shapeResponse(user));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", details: error.flatten() },
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