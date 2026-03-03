// apps/web/src/lib/api/authClient.ts

type CheckEmailResponse =
  | { ok: true; available: true }
  | {
      ok: true;
      available: false;
      reason: "exists" | "domain_not_allowed" | "invalid_email";
    }
  | { ok: false; message: string };

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  schoolType: "university" | "college" | "highschool" | "other";
  birthDate: string; // yyyy-mm-dd
  placeOfBirth?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type MeResponse =
  | { user: { id: string; email: string; name: string | null; role: string } }
  | { user: null };

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    throw new Error((data as any)?.message || (data as any)?.error || "Request failed");
  }
  return (data ?? {}) as T;
}

export async function apiCheckEmail(email: string) {
  return postJSON<CheckEmailResponse>("/api/auth/check-email", { email });
}

export async function apiRegister(payload: RegisterPayload) {
  return postJSON<{ ok: true }>("/api/auth/register", payload);
}

export async function apiLogin(payload: LoginPayload) {
  return postJSON<{ ok: true }>("/api/auth/login", payload);
}

// ✅ thêm apiMe
export async function apiMe(): Promise<MeResponse> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) return { user: null };

  const data = await safeJson(res);
  if (data && typeof data === "object" && "user" in data) return data as MeResponse;
  return { user: null };
}

// ✅ thêm apiLogout
export async function apiLogout(): Promise<{ ok: boolean }> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  return { ok: res.ok };
}