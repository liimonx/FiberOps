import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/register", "/invite"];
const TOKEN_COOKIE = "fiberops-auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const useMsw = process.env.NEXT_PUBLIC_USE_MSW !== "false";

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Always require a session cookie for settings (admin UI), even in MSW mode.
  const requiresAuth =
    !useMsw || pathname.startsWith("/settings");

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|mockServiceWorker.js|api/).*)"],
};
