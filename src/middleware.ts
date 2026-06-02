import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const rol = (req.auth?.user as any)?.rol;

  if (pathname.startsWith("/login")) {
    if (isLoggedIn) {
      if (rol === "conductor") return NextResponse.redirect(new URL("/conductor", req.url));
      return NextResponse.redirect(new URL("/tauler", req.url));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/conductor") && rol !== "conductor" && rol !== "superadmin") {
    return NextResponse.redirect(new URL("/tauler", req.url));
  }

  if (pathname.startsWith("/tauler") && rol === "conductor") {
    return NextResponse.redirect(new URL("/conductor", req.url));
  }

  if (pathname.startsWith("/admin") && rol !== "superadmin") {
    return NextResponse.redirect(new URL("/tauler", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json|sw.js).*)"],
};
