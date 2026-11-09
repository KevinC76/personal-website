import { NextRequest, NextResponse } from "next/server";
import { serverSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  let target = "/admin/login?error=callback";
  if (code) {
    const client = await serverSupabase();
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        await requireAdmin();
        target = "/admin";
      } catch {
        await client.auth.signOut();
        target = "/admin/login?error=access";
      }
    }
  }
  const response = NextResponse.redirect(new URL(target, request.url));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
