"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  Pin,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import type { SpotDraft, SpotMarker } from "@/lib/types";
import { centerBesidePanel } from "@/lib/map";
import SpotMarkers from "./SpotMarkers";
import SpotSearch from "./SpotSearch";
import AddSpotPanel from "./AddSpotPanel";

const TAIWAN = { lat: 23.7, lng: 120.96 };

type Props = {
  spots: SpotMarker[];
  canCreate: boolean;
  children: ReactNode;
};

export default function MapShell(props: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-8 text-gray-600">
        尚未設定 Google Maps API 金鑰（NEXT_PUBLIC_GOOGLE_MAPS_API_KEY）
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} language="zh-TW" region="TW">
      <MapView {...props} />
    </APIProvider>
  );
}

function MapView({ spots, canCreate, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = pathname.match(/^\/spots\/([^/]+)/)?.[1] ?? null;

  const map = useMap();
  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");

  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<SpotDraft | null>(null);

  // Center the map on the selected spot, once per selection. The spot may
  // arrive after the URL changes (right after creating it), so keep retrying
  // until it shows up in `spots`.
  const pannedTo = useRef<string | null>(null);
  useEffect(() => {
    if (!map || !selectedId || pannedTo.current === selectedId) return;
    const spot = spots.find((s) => s.id === selectedId);
    if (!spot) return;
    pannedTo.current = selectedId;
    if ((map.getZoom() ?? 0) < 13) map.setZoom(15);
    centerBesidePanel(map, { lat: spot.lat, lng: spot.lng });
  }, [map, selectedId, spots]);
  useEffect(() => {
    if (!selectedId) pannedTo.current = null;
  }, [selectedId]);

  const handleMapClick = useCallback(
    async (e: MapMouseEvent) => {
      const { latLng, placeId } = e.detail;
      if (!adding || !latLng) return;

      // Clicked a Google POI: use its name and address.
      if (placeId && places) {
        e.stop(); // suppress Google's default info window
        try {
          const place = new places.Place({ id: placeId });
          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location"],
          });
          setDraft({
            lat: place.location?.lat() ?? latLng.lat,
            lng: place.location?.lng() ?? latLng.lng,
            name: place.displayName ?? "",
            address: place.formattedAddress ?? null,
            placeId,
          });
          return;
        } catch {
          // Fall through to a plain location.
        }
      }

      setDraft({ ...latLng, name: "", address: null, placeId: null });
      if (!geocoding) return;
      try {
        const { results } = await new geocoding.Geocoder().geocode({ location: latLng });
        const address = results[0]?.formatted_address ?? null;
        // Ignore the result if the user already clicked somewhere else.
        setDraft((d) =>
          d && d.lat === latLng.lat && d.lng === latLng.lng ? { ...d, address } : d,
        );
      } catch {
        // Address is optional.
      }
    },
    [adding, places, geocoding],
  );

  function startAdding() {
    setAdding(true);
    if (selectedId) router.push("/");
  }

  function stopAdding() {
    setAdding(false);
    setDraft(null);
  }

  function handleCreated(id: string) {
    stopAdding();
    router.push(`/spots/${id}`);
    router.refresh();
  }

  return (
    <div className="absolute inset-0">
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
        defaultCenter={TAIWAN}
        defaultZoom={7}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        draggableCursor={adding ? "crosshair" : undefined}
        onClick={handleMapClick}
        className="h-full w-full"
      >
        <SpotMarkers
          spots={spots}
          selectedId={selectedId}
          onSelect={(id) => {
            if (!adding) router.push(`/spots/${id}`);
          }}
        />
        {draft && (
          <AdvancedMarker position={draft} zIndex={1000}>
            <Pin background="#16a34a" borderColor="#15803d" glyphColor="#ffffff" scale={1.2} />
          </AdvancedMarker>
        )}
      </Map>

      <div className="absolute top-3 right-3 left-3 z-10 flex gap-2 sm:left-auto sm:w-[26rem]">
        <SpotSearch spots={spots} onSelect={(id) => router.push(`/spots/${id}`)} />
        {canCreate && !adding && (
          <button
            onClick={startAdding}
            className="shrink-0 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow hover:bg-gray-700"
          >
            ＋ 新增景點
          </button>
        )}
      </div>

      {adding ? (
        <AddSpotPanel
          draft={draft}
          onDraft={setDraft}
          onClose={stopAdding}
          onCreated={handleCreated}
        />
      ) : (
        children
      )}
    </div>
  );
}
