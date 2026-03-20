// path: apps/web/src/app/api/sync/transcript-detail/route.ts

import { cookies } from "next/headers";

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return Response.json(
      { ok: false, message: "Missing API_BASE_URL" },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return Response.json(
      { ok: false, message: "Unauthorized: missing token cookie" },
      { status: 401 },
    );
  }

  const body = await req.text();

  try {
    const upstream = await fetch(`${baseUrl}/sync/transcript-detail`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body,
      cache: "no-store",
    });

    const text = await upstream.text();

    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: "Cannot reach API backend",
        error: String((error as Error)?.message || error),
      },
      { status: 502 },
    );
  }
}