"use client";

import { useMemo, useState } from "react";
import type { SpotMarker } from "@/lib/types";
import { useI18n } from "@/i18n/client";

// Searches spots already on the site (not Google).
export default function SpotSearch({
  spots,
  onSelect,
}: {
  spots: SpotMarker[];
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () => (q ? spots.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 8) : []),
    [q, spots],
  );

  return (
    <div className="relative min-w-0 flex-1">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={t.map.search}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow focus:border-gray-500 focus:outline-none"
      />
      {open && q && (
        <ul className="absolute inset-x-0 top-full mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">{t.map.noResults}</li>
          ) : (
            results.map((s) => (
              <li key={s.id}>
                <button
                  // mousedown fires before the input's blur closes the list
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(s.id);
                    setQuery("");
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {s.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
