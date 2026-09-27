import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    // A failed session refresh must not take the whole site down.
    console.error("proxy: session refresh failed", error);
    const response = NextResponse.next({ request });
    // TEMP: expose the error for diagnosing the production 500s.
    response.headers.set("x-proxy-error", String(error).slice(0, 300).replace(/[^\x20-\x7e]/g, "?"));
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
