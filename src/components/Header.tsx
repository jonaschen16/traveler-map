import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { getDictionary } from "@/i18n/server";
import LoginButton from "./LoginButton";
import LanguageSwitch from "./LanguageSwitch";

export default async function Header() {
  const [profile, t] = await Promise.all([getCurrentProfile(), getDictionary()]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-4">
      <Link href="/" className="shrink-0 text-lg font-bold text-gray-900">
        Traveler Map
      </Link>

      <div className="flex min-w-0 items-center gap-3">
        <LanguageSwitch />
        {profile ? (
          <>
            <Link
              href={`/users/${profile.id}`}
              className="flex min-w-0 items-center gap-2"
              title={t.profile.myPage}
            >
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="hidden truncate text-sm text-gray-700 hover:underline sm:inline">
                {profile.display_name}
              </span>
            </Link>
            {profile.role === "admin" && !profile.is_banned && (
              <Link
                href="/admin"
                className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
              >
                {t.header.admin}
              </Link>
            )}
            <form action="/auth/signout" method="post">
              <button className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                {t.header.logout}
              </button>
            </form>
          </>
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  );
}
