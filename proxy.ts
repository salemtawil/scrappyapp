import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/dashboard/:path*", "/competitions/:path*", "/players/:path*", "/clubs/:path*"],
};
