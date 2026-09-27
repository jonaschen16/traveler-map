"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { SpotDraft } from "@/lib/types";
import Panel from "./Panel";
import PlaceSearch from "./PlaceSearch";

type Props = {
  draft: SpotDraft | null;
  onDraft: (draft: SpotDraft) => void;
  onClose: () => void;
  onCreated: (id: string) => void;
};

export default function AddSpotPanel({ draft, onDraft, onClose, onCreated }: Props) {
  return (
    <Panel title="新增景點" onClose={onClose}>
      <PlaceSearch onPick={onDraft} />
      <p className="mt-2 text-sm text-gray-500">或直接在地圖上點選位置</p>

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
      setError(error.code === "23505" ? "這個地點已經有人建立了。" : `儲存失敗：${error.message}`);
      return;
    }
    onCreated(data.id);
  }

  if (existing) {
    return (
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        「{existing.name}」已經有人建立了，可以直接到那裡新增內容。
        <Link
          href={`/spots/${existing.id}`}
          onClick={onClose}
          className="mt-2 block font-medium underline"
        >
          前往這個景點 →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">名稱 *</span>
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
        <span className="text-sm font-medium text-gray-700">地址</span>
        <p className="mt-1 text-sm text-gray-600">{draft.address ?? "（無）"}</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">簡介</span>
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
        {saving ? "儲存中…" : "建立景點"}
      </button>
    </form>
  );
}
