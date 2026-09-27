"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import type { ActionResult } from "./contents";

const FACEBOOK_PROFILE = /^https:\/\/([a-z]+\.)?facebook\.com\/\S+$/i;

export async function updateFacebookProfileUrl(rawUrl: string): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([createClient(), getDictionary()]);
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { ok: false, error: t.common.pleaseLogin };

  const url = rawUrl.trim();
  if (url && (!FACEBOOK_PROFILE.test(url) || url.length > 300)) {
    return { ok: false, error: t.profile.facebookUrlInvalid };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ facebook_profile_url: url || null })
    .eq("id", userId);
  if (error) return { ok: false, error: fmt(t.common.saveFailed, { message: error.message }) };

  refresh();
  return { ok: true };
}

export async function deleteMyAccount(): Promise<ActionResult> {
  const [supabase, t] = await Promise.all([createClient(), getDictionary()]);
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, error: fmt(t.common.deleteFailed, { message: error.message }) };

  // The auth user is gone; clear the now-invalid session cookies.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
