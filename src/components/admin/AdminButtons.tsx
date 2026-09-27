"use client";

import { useState, useTransition } from "react";
import { adminDelete, setUserBanned, setUserRole } from "@/app/actions/admin";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

function useAction() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? t.common.error);
    });
  }
  return { t, error, pending, run };
}

const buttonClass =
  "rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50";

export function UserButtons({
  id,
  name,
  role,
  banned,
}: {
  id: string;
  name: string;
  role: "member" | "admin";
  banned: boolean;
}) {
  const { t, error, pending, run } = useAction();

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {banned ? (
          <button className={buttonClass} disabled={pending} onClick={() => run(() => setUserBanned(id, false))}>
            {t.admin.unban}
          </button>
        ) : (
          <button
            className={`${buttonClass} text-red-700`}
            disabled={pending}
            onClick={() => run(() => setUserBanned(id, true), fmt(t.admin.confirmBan, { name }))}
          >
            {t.admin.ban}
          </button>
        )}
        <button
          className={buttonClass}
          disabled={pending}
          onClick={() => run(() => setUserRole(id, role === "admin" ? "member" : "admin"))}
        >
          {role === "admin" ? t.admin.removeAdmin : t.admin.makeAdmin}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function DeleteButton({
  table,
  id,
  confirmText,
}: {
  table: "spots" | "spot_contents";
  id: string;
  confirmText: string;
}) {
  const { t, error, pending, run } = useAction();

  return (
    <div>
      <button
        className={`${buttonClass} text-red-700`}
        disabled={pending}
        onClick={() => run(() => adminDelete(table, id), confirmText)}
      >
        {t.common.delete}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
