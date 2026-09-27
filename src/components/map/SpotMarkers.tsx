"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { SpotMarker } from "@/lib/types";

type MarkerEl = google.maps.marker.AdvancedMarkerElement;

export default function SpotMarkers({
  spots,
  selectedId,
  onSelect,
}: {
  spots: SpotMarker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const [markers, setMarkers] = useState<Record<string, MarkerEl>>({});

  const clusterer = useMemo(() => (map ? new MarkerClusterer({ map }) : null), [map]);

  useEffect(() => {
    if (!clusterer) return;
    clusterer.clearMarkers();
    clusterer.addMarkers(Object.values(markers));
  }, [clusterer, markers]);

  useEffect(() => () => clusterer?.setMap(null), [clusterer]);

  const setMarkerRef = useCallback((marker: MarkerEl | null, id: string) => {
    setMarkers((prev) => {
      if ((marker && prev[id] === marker) || (!marker && !prev[id])) return prev;
      if (marker) return { ...prev, [id]: marker };
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  return spots.map((spot) => (
    <SpotPin
      key={spot.id}
      spot={spot}
      selected={spot.id === selectedId}
      onSelect={onSelect}
      setMarkerRef={setMarkerRef}
    />
  ));
}

function SpotPin({
  spot,
  selected,
  onSelect,
  setMarkerRef,
}: {
  spot: SpotMarker;
  selected: boolean;
  onSelect: (id: string) => void;
  setMarkerRef: (marker: MarkerEl | null, id: string) => void;
}) {
  const ref = useCallback(
    (marker: MarkerEl | null) => setMarkerRef(marker, spot.id),
    [setMarkerRef, spot.id],
  );

  return (
    <AdvancedMarker
      ref={ref}
      position={{ lat: spot.lat, lng: spot.lng }}
      title={spot.name}
      zIndex={selected ? 999 : undefined}
      onClick={() => onSelect(spot.id)}
    >
      {selected ? (
        <Pin background="#dc2626" borderColor="#991b1b" glyphColor="#ffffff" scale={1.3} />
      ) : (
        <Pin background="#ea580c" borderColor="#c2410c" glyphColor="#ffffff" />
      )}
    </AdvancedMarker>
  );
}
