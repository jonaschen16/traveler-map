"use client";

import { useState, useTransition } from "react";
import { addContent } from "@/app/actions/contents";
import { useI18n } from "@/i18n/client";

export default function AddContentForm({ spotId }: { spotId: string }) {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addContent(spotId, url, note);
      if (result.ok) {
        setUrl("");
        setNote("");
      } else {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg bg-gray-50 p-3">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={t.content.urlPlaceholder}
        required
        maxLength={2048}
        className={inputClass}
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t.content.notePlaceholder}
        maxLength={500}
        rows={2}
        className={inputClass}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={pending || !url.trim()}
        className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {pending ? t.content.submitting : t.content.submit}
      </button>
    </form>
  );
}
