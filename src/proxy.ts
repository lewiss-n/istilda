import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast first gate for the admin area: no session cookie, no entry.
 * The cookie's signature is verified again on every admin page, action and API route (lib/auth.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const hasSession = Boolean(request.cookies.get("ist_admin")?.value);
  if (hasSession) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
