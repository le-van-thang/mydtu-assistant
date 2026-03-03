// apps/web/middleware.ts
import { verifyToken } from "@/lib/auth";
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
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIX.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    verifyToken(token);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.set("token", "", { path: "/", maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};