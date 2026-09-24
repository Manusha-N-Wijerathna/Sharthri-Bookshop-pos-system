import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const pathname = nextUrl.pathname;

  // Public routes — always accessible
  const publicRoutes = ["/login", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    // If logged in and trying to access /login, redirect to home
    if (isLoggedIn && pathname === "/login") {
      const redirectTo = session.user.role === "admin" ? "/admin" : "/sell";
      return NextResponse.redirect(new URL(redirectTo, nextUrl));
    }
    return NextResponse.next();
  }

  // Everything below requires authentication
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && session.user.role !== "admin") {
    return NextResponse.redirect(new URL("/sell", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static files and images
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
