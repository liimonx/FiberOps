import { NextResponse } from "next/server";

export const TOKEN_COOKIE = "fiberops-auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

function buildSetCookie(token: string): string {
  const parts = [
    `${TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    `Max-Age=${MAX_AGE_SECONDS}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (cookieSecure()) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function buildClearCookie(): string {
  const parts = [
    `${TOKEN_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (cookieSecure()) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * Establishes an HttpOnly session cookie for middleware route protection.
 * The bearer token remains in memory for Authorization headers; it is not
 * written to localStorage.
 */
export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildSetCookie(token));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildClearCookie());
  return response;
}
