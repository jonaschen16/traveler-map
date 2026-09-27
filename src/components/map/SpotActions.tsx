"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Edit / delete controls, shown only to the spot's creator and admins.
// The database (RLS) enforces the same rule.
export default function SpotActions({
  id,
  name: initialName,
  description: initialDescription,
}: {
  id: string;
  name: string;
  description: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient()
      .from("spots")
      .update({ name: name.trim(), description: description.trim() || null })
      .eq("id", id);
    setBusy(false);
    if (error) {
      setError(`儲存失敗：${error.message}`);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`確定要刪除「${initialName}」？景點下的所有內容也會一起刪除。`)) return;
    setBusy(true);
    const { error } = await createClient().from("spots").delete().eq("id", id);
    if (error) {
      setBusy(false);
      setError(`刪除失敗：${error.message}`);
      return;
    }
    router.push("/");
    router.refresh();
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

  if (editing) {
    return (
      <form onSubmit={save} className="mt-4 space-y-3 rounded-lg border border-gray-200 p-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">名稱 *</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">簡介</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={4}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            儲存
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex gap-3 text-sm">
        <button onClick={() => setEditing(true)} className="text-gray-600 hover:underline">
          編輯
        </button>
        <button onClick={remove} disabled={busy} className="text-red-600 hover:underline">
          刪除
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
