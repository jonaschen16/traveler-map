import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import MapShell from "@/components/map/MapShell";

// The map lives in this layout so it stays mounted while
// navigating between "/" and "/spots/[id]".
export default async function MapLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const [{ data: spots }, profile] = await Promise.all([
    supabase.from("spots").select("id, name, lat, lng"),
    getCurrentProfile(),
  ]);

  return (
    <MapShell spots={spots ?? []} canCreate={!!profile && !profile.is_banned}>
      {children}
    </MapShell>
  );
}
