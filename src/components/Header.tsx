import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LoginButton from "./LoginButton";

export default async function Header() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("display_name, avatar_url, role")
        .eq("id", userId)
        .single()
    : { data: null };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4">
      <Link href="/" className="text-lg font-bold text-gray-900">
        Traveler Map
      </Link>

      {userId ? (
        <div className="flex items-center gap-3">
          {profile?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt=""
              className="h-8 w-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="hidden text-sm text-gray-700 sm:inline">
            {profile?.display_name}
            {profile?.role === "admin" && (
              <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                管理員
              </span>
            )}
          </span>
          <form action="/auth/signout" method="post">
            <button className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              登出
            </button>
          </form>
        </div>
      ) : (
        <LoginButton />
      )}
    </header>
  );
}
