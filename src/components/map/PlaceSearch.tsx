"use client";

import { useEffect, useRef, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import type { SpotDraft } from "@/lib/types";
import { centerBesidePanel } from "@/lib/map";

// Google Places autocomplete, used when creating a spot.
export default function PlaceSearch({ onPick }: { onPick: (draft: SpotDraft) => void }) {
  const map = useMap();
  const places = useMapsLibrary("places");
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  // One token per search session (typing ... picking) keeps billing per session.
  const token = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  useEffect(() => {
    if (!places || !input.trim()) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      token.current ??= new places.AutocompleteSessionToken();
      try {
        const { suggestions } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            sessionToken: token.current,
            language: "zh-TW",
            region: "tw",
            locationBias: map?.getBounds() ?? undefined,
          });
        if (!cancelled) setSuggestions(suggestions);
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input, places, map]);

  async function pick(prediction: google.maps.places.PlacePrediction) {
    const place = prediction.toPlace();
    await place.fetchFields({ fields: ["displayName", "formattedAddress", "location"] });
    token.current = null;
    setInput("");
    setSuggestions([]);

    const location = place.location;
    if (!location) return;
    const latLng = { lat: location.lat(), lng: location.lng() };
    onPick({
      ...latLng,
      name: place.displayName ?? "",
      address: place.formattedAddress ?? null,
      placeId: place.id,
    });
    if (map) {
      map.setZoom(16);
      centerBesidePanel(map, latLng);
    }
  }

  return (
    <div className="relative">
      <input
        type="search"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          if (!e.target.value.trim()) setSuggestions([]);
        }}
        placeholder="搜尋 Google 地點，例如：九份老街"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
      />
      {suggestions.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, i) => {
            const p = s.placePrediction;
            if (!p) return null;
            return (
              <li key={p.placeId ?? i}>
                <button
                  onClick={() => pick(p)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                >
                  <div className="text-sm text-gray-900">{p.mainText?.toString()}</div>
                  <div className="text-xs text-gray-500">{p.secondaryText?.toString()}</div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
