"use client";

import { useState, useTransition } from "react";
import { deleteContent, updateContentNote } from "@/app/actions/contents";

// Edit-note / delete controls, shown to the content's creator and admins.
export default function ContentActions({ id, note }: { id: string; note: string | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onOk?.();
      else setError(result.error ?? "發生錯誤");
    });
  }

  if (editing) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="補充說明"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 text-sm">
          <button
            onClick={() => run(() => updateContentNote(id, draft), () => setEditing(false))}
            disabled={pending}
            className="font-medium text-gray-900 hover:underline"
          >
            儲存
          </button>
          <button onClick={() => setEditing(false)} className="text-gray-500 hover:underline">
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex gap-3 text-xs">
        <button onClick={() => setEditing(true)} className="text-gray-500 hover:underline">
          編輯說明
        </button>
        <button
          onClick={() => {
            if (confirm("確定要刪除這則分享？")) run(() => deleteContent(id));
          }}
          disabled={pending}
          className="text-red-600 hover:underline"
        >
          刪除
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
