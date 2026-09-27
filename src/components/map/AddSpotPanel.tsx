"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SpotDraft } from "@/lib/types";
import Panel from "./Panel";
import PlaceSearch from "./PlaceSearch";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

type Props = {
  draft: SpotDraft | null;
  onDraft: (draft: SpotDraft) => void;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export default function AddSpotPanel({ draft, onDraft, onClose, onCreated }: Props) {
  const { t } = useI18n();
  return (
    <Panel title={t.addSpot.title} onClose={onClose}>
      <PlaceSearch onPick={onDraft} />
      <p className="mt-2 text-sm text-gray-500">{t.addSpot.orClickMap}</p>

      {draft && (
        // Remount the form (resetting its fields) whenever the location changes.
        <SpotForm
          key={`${draft.lat},${draft.lng}`}
          draft={draft}
          onClose={onClose}
          onCreated={onCreated}
        />
      )}
    </Panel>
  );
}

function SpotForm({
  draft,
  onClose,
  onCreated,
}: {
  draft: SpotDraft;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(draft.name);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<{ id: string; name: string } | null>(null);

  // Same Google place already on the site? Point the user to it.
  useEffect(() => {
    if (!draft.placeId) return;
    let cancelled = false;
    createClient()
      .from("spots")
      .select("id, name")
      .eq("google_place_id", draft.placeId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setExisting(data);
      });
    return () => {
      cancelled = true;
    };
  }, [draft.placeId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data, error } = await createClient()
      .from("spots")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        lat: draft.lat,
        lng: draft.lng,
        address: draft.address,
        google_place_id: draft.placeId,
      })
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      setError(
        error.code === "23505"
          ? t.addSpot.duplicate
          : fmt(t.common.saveFailed, { message: error.message }),
      );
      return;
    }
    onCreated(data.id);
  }

  if (existing) {
    return (
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {fmt(t.addSpot.existing, { name: existing.name })}
        <Link
          href={`/spots/${existing.id}`}
          onClick={onClose}
          className="mt-2 block font-medium underline"
        >
          {t.addSpot.goToSpot}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">{t.addSpot.name}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          autoFocus
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </label>

      <div>
        <span className="text-sm font-medium text-gray-700">{t.addSpot.address}</span>
        <p className="mt-1 text-sm text-gray-600">{draft.address ?? t.addSpot.none}</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">{t.addSpot.description}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving || !name.trim()}
        className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {saving ? t.common.saving : t.addSpot.create}
      </button>
    </form>
  );
}
