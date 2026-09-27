"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { classifyUrl } from "@/lib/url";
import { fetchLinkPreview, resolveFacebookUrl, type LinkPreview } from "@/lib/preview";
import { fmt } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

const NOTE_MAX = 500;

// Permission checks live in the database (RLS); these actions run as the
// signed-in user, so a visitor or someone else's content is rejected there.

export async function addContent(
  spotId: string,
  rawUrl: string,
  rawNote: string,
): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([createClient(), getDictionary()]);
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return { ok: false, error: t.common.pleaseLogin };

  const parsed = classifyUrl(rawUrl);
  if (!parsed) return { ok: false, error: t.content.invalidUrl };
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
  if (error) return { ok: false, error: fmt(t.common.addFailed, { message: error.message }) };

  refresh();
  return { ok: true };
}

export async function updateContentNote(id: string, rawNote: string): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([createClient(), getDictionary()]);
  const { data, error } = await supabase
    .from("spot_contents")
    .update({ note: rawNote.trim().slice(0, NOTE_MAX) || null })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: fmt(t.common.saveFailed, { message: error.message }) };
  if (!data?.length) return { ok: false, error: t.common.noPermission };

  refresh();
  return { ok: true };
}

export async function deleteContent(id: string): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([createClient(), getDictionary()]);
  const { data, error } = await supabase
    .from("spot_contents")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: fmt(t.common.deleteFailed, { message: error.message }) };
  if (!data?.length) return { ok: false, error: t.common.noPermission };

  refresh();
  return { ok: true };
}
