import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { Profile } from "@/lib/types";
import { fmt, formatDate } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import PageContainer from "@/components/PageContainer";
import ProfileSettings, { DeleteAccount } from "@/components/profile/ProfileSettings";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getProfile = cache(async (id: string) => {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, facebook_profile_url, role, is_banned, created_at")
    .eq("id", id)
    .maybeSingle();
  return data as (Profile & { created_at: string }) | null;
});

export async function generateMetadata({ params }: PageProps<"/users/[id]">): Promise<Metadata> {
  const profile = await getProfile((await params).id);
  return { title: `${profile?.display_name || "User"} | Traveler Map` };
}

export default async function UserPage({ params }: PageProps<"/users/[id]">) {
  const { id } = await params;
  const [profile, me, t, locale] = await Promise.all([
    getProfile(id),
    getCurrentProfile(),
    getDictionary(),
    getLocale(),
  ]);

  if (!profile) {
    return (
      <PageContainer>
        <p className="text-gray-600">{t.profile.notFound}</p>
      </PageContainer>
    );
  }

  const supabase = await createClient();
  const [{ data: spots }, { data: contents }] = await Promise.all([
    supabase
      .from("spots")
      .select("id, name, address, created_at")
      .eq("created_by", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("spot_contents")
      .select("id, type, url, note, preview_title, created_at, spot:spots(id, name)")
      .eq("created_by", id)
      .order("created_at", { ascending: false }),
  ]);
  const isMe = me?.id === profile.id;

  return (
    <PageContainer>
      <div className="flex items-center gap-4">
        {profile.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-16 w-16 rounded-full"
            referrerPolicy="no-referrer"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.display_name || t.common.anonymous}
          </h1>
          <p className="text-sm text-gray-500">
            {fmt(t.profile.joined, { date: formatDate(profile.created_at, locale) })}
          </p>
          {profile.facebook_profile_url && (
            <a
              href={profile.facebook_profile_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-sm text-blue-600 hover:underline"
            >
              {t.profile.facebookProfile}
            </a>
          )}
        </div>
      </div>

      {profile.is_banned && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t.profile.banned}
        </p>
      )}

      {isMe && <ProfileSettings facebookProfileUrl={profile.facebook_profile_url} />}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">
          {fmt(t.profile.spots, { count: spots?.length ?? 0 })}
        </h2>
        {spots?.length ? (
          <ul className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
            {spots.map((s) => (
              <li key={s.id} className="py-3">
                <Link href={`/spots/${s.id}`} className="font-medium text-gray-900 hover:underline">
                  {s.name}
                </Link>
                {s.address && <p className="text-sm text-gray-500">{s.address}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{t.profile.noSpots}</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-gray-900">
          {fmt(t.profile.contents, { count: contents?.length ?? 0 })}
        </h2>
        {contents?.length ? (
          <ul className="mt-3 divide-y divide-gray-100 border-y border-gray-100">
            {contents.map((c) => {
              const spot = c.spot as unknown as { id: string; name: string } | null;
              return (
                <li key={c.id} className="py-3">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow ugc"
                    className="block truncate font-medium text-gray-900 hover:underline"
                  >
                    {c.type === "facebook" ? "Facebook" : c.preview_title || c.url}
                  </a>
                  {c.note && <p className="text-sm text-gray-700">{c.note}</p>}
                  <p className="text-xs text-gray-500">
                    {spot && (
                      <Link href={`/spots/${spot.id}`} className="hover:underline">
                        {fmt(t.profile.sharedAt, { spot: spot.name })}
                      </Link>
                    )}
                    {" · "}
                    {formatDate(c.created_at, locale)}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{t.profile.noContents}</p>
        )}
      </section>

      {isMe && <DeleteAccount />}

      <footer className="mt-12 flex gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <Link href="/privacy" className="hover:underline">
          {t.legal.privacy}
        </Link>
        <Link href="/data-deletion" className="hover:underline">
          {t.legal.dataDeletion}
        </Link>
      </footer>
    </PageContainer>
  );
}
