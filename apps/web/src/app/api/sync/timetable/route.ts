import { cookies } from "next/headers";

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Missing API_BASE_URL",
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Unauthorized: missing token cookie",
      }),
      {
        status: 401,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }

  const body = await req.text();
  const upstreamUrl = `${baseUrl}/sync/timetable`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
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
      },
    );
  }
}