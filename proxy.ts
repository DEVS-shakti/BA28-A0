import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login/auth";
    return NextResponse.rewrite(url);
  }
  if (request.nextUrl.pathname === "/join") {
    const url = request.nextUrl.clone();
    url.pathname = "/join/secure";
    return NextResponse.rewrite(url);
  }
  if (request.nextUrl.pathname === "/pending") {
    const url = request.nextUrl.clone();
    url.pathname = "/pending/status";
    return NextResponse.rewrite(url);
  }

  if (process.env.CLASSRANK_MODE === "demo" && process.env.CLASSRANK_DEMO_ENABLED === "true") {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/join", "/pending", "/student/:path*", "/admin/:path*"],
};
