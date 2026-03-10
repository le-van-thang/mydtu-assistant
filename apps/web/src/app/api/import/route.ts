  // path: apps/web/src/app/api/import/route.ts
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return new Response("Missing API_BASE_URL", { status: 500 });
  }

  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return new Response("Unauthorized: missing token cookie", { status: 401 });
  }

  const body = await req.json();

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/sync/timetable`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Cannot reach API backend",
        error: error?.message ?? String(error),
        target: `${baseUrl}/sync/timetable`,
      }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      }
    );
  }

  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}