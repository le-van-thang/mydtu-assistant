import { cookies } from "next/headers";

function getTokenFromCookieStore(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return (
    cookieStore.get("token")?.value ||
    cookieStore.get("accessToken")?.value ||
    null
  );
}

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    return new Response(
      JSON.stringify({ ok: false, message: "Missing API_BASE_URL" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  const cookieStore = await cookies();
  const token = getTokenFromCookieStore(cookieStore);

  if (!token) {
    return new Response(
      JSON.stringify({ ok: false, message: "Unauthorized: hãy đăng nhập trước." }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, message: "Invalid JSON body" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  try {
    const upstream = await fetch(`${baseUrl}/voice-chat`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await upstream.text();

    // Log lỗi từ backend để dễ debug
    if (!upstream.ok) {
      console.error(`[voice-chat proxy] Backend returned ${upstream.status}:`, text);
    }

    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    const msg = (error as Error)?.message;
    console.error("[voice-chat proxy] Cannot reach backend:", msg);
    return new Response(
      JSON.stringify({ ok: false, message: "Cannot reach API backend", error: msg }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
}
