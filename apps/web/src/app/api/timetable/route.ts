// path: apps/web/src/app/api/timetable/route.ts
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return new Response("Missing API_BASE_URL", { status: 500 });
  }

  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return new Response("Unauthorized: missing token cookie", { status: 401 });
  }

  const url = new URL(req.url);
  const qs = url.searchParams.toString();
  const upstreamUrl = `${baseUrl}/sync/timetable${qs ? `?${qs}` : ""}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
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
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Cannot reach API backend",
        error: String((error as Error)?.message || error),
        target: upstreamUrl,
      }),
      {
        status: 502,
        headers: {
          "content-type": "application/json",
        },
      }
    );
  }
}