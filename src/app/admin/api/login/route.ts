import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || password === expected) {
    const res = NextResponse.json({ ok: true });
    if (expected) {
      res.cookies.set("admin_auth", expected, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }
    return res;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
