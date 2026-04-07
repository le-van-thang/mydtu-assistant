// apps/web/src/app/api/transcript/upload-vision/route.ts
// BFF proxy — forward ảnh Base64 từ frontend tới backend Vision AI
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const baseUrl = process.env.API_BASE_URL;

  if (!baseUrl) {
    return Response.json({ ok: false, message: "Missing API_BASE_URL" }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value ||
    cookieStore.get("accessToken")?.value ||
    null;

  if (!token) {
    return Response.json(
      { ok: false, message: "Unauthorized: hãy đăng nhập trước." },
      { status: 401 },
    );
  }

  let body: { image?: string; semester?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${baseUrl}/transcript/upload-vision`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ image: body.image, semester: body.semester }),
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
        error: String((error as Error)?.message),
      },
      { status: 502 },
    );
  }
}
