"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { classifyUrl } from "@/lib/url";
import { fetchLinkPreview, resolveFacebookUrl, type LinkPreview } from "@/lib/preview";

export type ActionResult = { ok: true } | { ok: false; error: string };

const NOTE_MAX = 500;

// Permission checks live in the database (RLS); these actions run as the
// signed-in user, so a visitor or someone else's content is rejected there.

export async function addContent(
  spotId: string,
  rawUrl: string,
  rawNote: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return { ok: false, error: "請先登入" };

  const parsed = classifyUrl(rawUrl);
  if (!parsed) return { ok: false, error: "網址格式不正確，請貼上 http:// 或 https:// 開頭的完整網址" };
  const note = rawNote.trim().slice(0, NOTE_MAX) || null;

  let row: { type: "facebook" | "link"; url: string } & Partial<LinkPreview>;
  if (parsed.type === "facebook") {
    row = { type: "facebook", url: await resolveFacebookUrl(parsed.url) };
  } else {
    // A missing preview is fine: the card falls back to showing the URL.
    const preview = await fetchLinkPreview(parsed.url).catch(() => null);
    row = { type: "link", url: parsed.url.href, ...preview };
  }

  const { error } = await supabase
    .from("spot_contents")
    .insert({ spot_id: spotId, note, ...row });
  if (error) return { ok: false, error: `新增失敗：${error.message}` };

  refresh();
  return { ok: true };
}

export async function updateContentNote(id: string, rawNote: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spot_contents")
    .update({ note: rawNote.trim().slice(0, NOTE_MAX) || null })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: `儲存失敗：${error.message}` };
  if (!data?.length) return { ok: false, error: "沒有權限修改這則內容" };

  refresh();
  return { ok: true };
}

export async function deleteContent(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spot_contents")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: `刪除失敗：${error.message}` };
  if (!data?.length) return { ok: false, error: "沒有權限刪除這則內容" };

  refresh();
  return { ok: true };
}
