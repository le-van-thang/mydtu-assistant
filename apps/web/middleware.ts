// apps/web/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIX = [
  "/dashboard",
  "/planner",
  "/study",
  "/timetable",
  "/transcript",
  "/warnings",
  "/reminders",
  "/settings",
  "/admin",
  "/cognitive",
  "/sandbox",
  "/pathways",
];

function decodeEdgeToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIX.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("token")?.value || req.cookies.get("accessToken")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const payload = decodeEdgeToken(token);
  if (!payload || !payload.id || !payload.role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.set("token", "", { path: "/", maxAge: 0 });
    res.cookies.set("accessToken", "", { path: "/", maxAge: 0 });
    return res;
  }

  // Admin routing check
  const role = String(payload.role).toUpperCase();
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const url = req.nextUrl.clone();
    // Non-admins trying to access /admin -> redirect to user dashboard
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};