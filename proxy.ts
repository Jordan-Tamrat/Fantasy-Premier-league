import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Next.js's "proxy" convention (formerly middleware.ts) always runs on the
// Node.js runtime, which is required here since lib/auth.ts's Credentials
// provider needs Prisma/bcryptjs.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password/",
  "/invite/",
  "/api/auth",
  "/api/cron",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublic) return NextResponse.next();

  const isLoggedIn = !!req.auth?.user;
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdmin = req.auth?.user?.role === "ADMIN";
  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});
