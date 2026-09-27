import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { Spot } from "@/lib/types";
import Panel from "@/components/map/Panel";
import SpotActions from "@/components/map/SpotActions";
import AddContentForm from "@/components/content/AddContentForm";
import ContentItem, { type ContentWithCreator } from "@/components/content/ContentItem";
import Link from "next/link";
import { fmt, formatDate } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SpotWithCreator = Spot & {
  creator: { display_name: string; avatar_url: string | null } | null;
};

const getSpot = cache(async (id: string): Promise<SpotWithCreator | null> => {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("spots")
    .select("*, creator:profiles!spots_created_by_fkey(display_name, avatar_url)")
    .eq("id", id)
    .maybeSingle();
  return data;
});

async function getContents(spotId: string): Promise<ContentWithCreator[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("spot_contents")
    .select("*, creator:profiles!spot_contents_created_by_fkey(display_name, avatar_url)")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function generateMetadata({ params }: PageProps<"/spots/[id]">): Promise<Metadata> {
  const spot = await getSpot((await params).id);
  if (!spot) return { title: `${(await getDictionary()).spot.notFound} | Traveler Map` };
  return {
    title: `${spot.name} | Traveler Map`,
    description: spot.description ?? spot.address ?? undefined,
  };
}

export default async function SpotPage({ params }: PageProps<"/spots/[id]">) {
  const { id } = await params;
  const [spot, profile, contents, t, locale] = await Promise.all([
    getSpot(id),
    getCurrentProfile(),
    UUID.test(id) ? getContents(id) : Promise.resolve([]),
    getDictionary(),
    getLocale(),
  ]);

  if (!spot) {
    return (
      <Panel title={t.spot.notFound} closeHref="/">
        <p className="text-sm text-gray-600">{t.spot.notFoundText}</p>
      </Panel>
    );
  }

  const isMember = !!profile && !profile.is_banned;
  const isAdmin = isMember && profile.role === "admin";
  const canEdit = isMember && (profile.id === spot.created_by || isAdmin);

  // Split the template around {name} so the name can be a link.
  const [createdByBefore, createdByAfter = ""] = t.spot.createdBy.split("{name}");

  const mapsUrl = new URL("https://www.google.com/maps/search/");
  mapsUrl.searchParams.set("api", "1");
  mapsUrl.searchParams.set("query", `${spot.lat},${spot.lng}`);
  if (spot.google_place_id) mapsUrl.searchParams.set("query_place_id", spot.google_place_id);

  return (
    <Panel title={spot.name} closeHref="/">
      {spot.address && <p className="text-sm text-gray-600">{spot.address}</p>}
      <a
        href={mapsUrl.toString()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-block text-sm text-blue-600 hover:underline"
      >
        {t.spot.openInGoogleMaps}
      </a>

      {spot.description && (
        <p className="mt-4 whitespace-pre-line text-gray-800">{spot.description}</p>
      )}

      <p className="mt-4 text-xs text-gray-500">
        {createdByBefore}
        <Link href={`/users/${spot.created_by}`} className="font-medium hover:underline">
          {spot.creator?.display_name || t.common.anonymous}
        </Link>
        {fmt(createdByAfter, { date: formatDate(spot.created_at, locale) })}
      </p>

      {canEdit && (
        <SpotActions id={spot.id} name={spot.name} description={spot.description} />
      )}

      <section className="mt-6 border-t border-gray-100 pt-4">
        <h3 className="font-bold text-gray-900">
          {fmt(t.spot.contentsTitle, { count: contents.length })}
        </h3>
        <div className="mt-3">
          {isMember ? (
            <AddContentForm spotId={spot.id} />
          ) : (
            <p className="text-sm text-gray-500">{t.spot.loginToShare}</p>
          )}
        </div>
        {contents.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">{t.spot.noContents}</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {contents.map((c) => (
              <li key={c.id}>
                <ContentItem
                  content={c}
                  canManage={isMember && (profile.id === c.created_by || isAdmin)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Panel>
  );
}
