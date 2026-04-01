import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "admin_auth";

export function middleware(req: NextRequest) {
  // Allow the login page itself
  if (req.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Allow login POST
  if (req.nextUrl.pathname === "/admin/api/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_PASSWORD;

  // If no password is configured, admin is open (dev mode)
  if (!expected) return NextResponse.next();

  if (token !== expected) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
