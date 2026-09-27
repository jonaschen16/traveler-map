"use client";

import { useState, useTransition } from "react";
import { deleteMyAccount, updateFacebookProfileUrl } from "@/app/actions/profile";
import { useI18n } from "@/i18n/client";

// Shown only on your own profile page.
export default function ProfileSettings({
  facebookProfileUrl,
}: {
  facebookProfileUrl: string | null;
}) {
  const { t } = useI18n();
  const [url, setUrl] = useState(facebookProfileUrl ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await updateFacebookProfileUrl(url);
      setMessage(result.ok ? { ok: true, text: t.profile.saved } : { ok: false, text: result.error });
    });
  }

  return (
    <form onSubmit={save} className="mt-6 rounded-lg border border-gray-200 p-4">
      <label className="block">
        <span className="text-sm font-medium text-gray-700">{t.profile.facebookUrlLabel}</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.facebook.com/…"
          maxLength={300}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </label>
      <p className="mt-1 text-xs text-gray-500">{t.profile.facebookUrlHint}</p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {t.common.save}
        </button>
        {message && (
          <span className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>
            {message.text}
          </span>
        )}
      </div>
  </form>
);
}

export function DeleteAccount() {
const { t } = useI18n();
const [error, setError] = useState<string | null>(null);
const [pending, startTransition] = useTransition();

function remove() {
  if (!confirm(t.profile.confirmDeleteAccount)) return;
  setError(null);
    startTransition(async () => {
      // On success the action redirects home.
      const result = await deleteMyAccount();
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <section className="mt-12 rounded-lg border border-red-200 p-4">
      <h2 className="font-bold text-red-700">{t.profile.dangerZone}</h2>
      <p className="mt-1 text-sm text-gray-600">{t.profile.deleteAccountHint}</p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={remove}
        disabled={pending}
        className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {t.profile.deleteAccount}
      </button>
    </section>
  );
}
