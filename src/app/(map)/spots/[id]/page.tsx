import type { Metadata } from "next";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { Spot } from "@/lib/types";
import Panel from "@/components/map/Panel";
import SpotActions from "@/components/map/SpotActions";

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

export async function generateMetadata({ params }: PageProps<"/spots/[id]">): Promise<Metadata> {
  const spot = await getSpot((await params).id);
  if (!spot) return { title: "找不到景點 | Traveler Map" };
  return {
    title: `${spot.name} | Traveler Map`,
    description: spot.description ?? spot.address ?? undefined,
  };
}

export default async function SpotPage({ params }: PageProps<"/spots/[id]">) {
  const { id } = await params;
  const [spot, profile] = await Promise.all([getSpot(id), getCurrentProfile()]);

  if (!spot) {
    return (
      <Panel title="找不到景點" closeHref="/">
        <p className="text-sm text-gray-600">這個景點不存在或已被刪除。</p>
      </Panel>
    );
  }

  const canEdit =
    !!profile && !profile.is_banned && (profile.id === spot.created_by || profile.role === "admin");

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
        在 Google 地圖開啟 ↗
      </a>

      {spot.description && (
        <p className="mt-4 whitespace-pre-line text-gray-800">{spot.description}</p>
      )}

      <p className="mt-4 text-xs text-gray-500">
        由 {spot.creator?.display_name || "匿名"} 建立 ·{" "}
        {new Date(spot.created_at).toLocaleDateString("zh-TW")}
      </p>

      {canEdit && (
        <SpotActions id={spot.id} name={spot.name} description={spot.description} />
      )}

      <section className="mt-6 border-t border-gray-100 pt-4">
        <h3 className="font-bold text-gray-900">旅人分享</h3>
        <p className="mt-2 text-sm text-gray-500">內容功能將在第 3 階段加入。</p>
      </section>
    </Panel>
  );
}
