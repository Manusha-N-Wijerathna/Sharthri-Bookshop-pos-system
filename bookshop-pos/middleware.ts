import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const pathname = nextUrl.pathname;

  // Public routes — always accessible without authentication
  const publicRoutes = [
    "/login",
    "/api/auth",
    "/manifest.json",
    "/sw.js",
    "/favicon.png",
    "/apple-touch-icon.png",
    "/brand-logo.png",
    "/brand-banner.jpg",
    "/icons",
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    // If logged in and trying to access /login, redirect to their role's home view
    if (isLoggedIn && pathname === "/login") {
      const redirectTo = session.user.role === "admin" ? "/admin/products" : "/sell";
      return NextResponse.redirect(new URL(redirectTo, nextUrl));
    }
    return NextResponse.next();
  }

  // Everything below requires authentication
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes (both UI pages and API endpoints)
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    session.user.role !== "admin"
  ) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/sell", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static files, images, and PWA assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|brand-logo.png|brand-banner.jpg|apple-touch-icon.png|icons/|.*\\.png$|.*\\.jpg$).*)",
  ],
};
