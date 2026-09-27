"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { fmt } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import type { ActionResult } from "./contents";

// RLS and the profile guard trigger enforce admin-only access in the
// database; this check just gives a clear error message early.
async function adminContext() {
  const [me, t] = await Promise.all([getCurrentProfile(), getDictionary()]);
  const isAdmin = !!me && me.role === "admin" && !me.is_banned;
  return { me, t, isAdmin, supabase: await createClient() };
}

async function updateProfile(
  userId: string,
  patch: { is_banned?: boolean; role?: "member" | "admin" },
): Promise<ActionResult> {
  const { me, t, isAdmin, supabase } = await adminContext();
  if (!isAdmin || me?.id === userId) return { ok: false, error: t.common.noPermission };

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("id");
  if (error) return { ok: false, error: fmt(t.common.saveFailed, { message: error.message }) };
  if (!data?.length) return { ok: false, error: t.common.noPermission };

  refresh();
  return { ok: true };
}

export async function setUserBanned(userId: string, banned: boolean) {
  return updateProfile(userId, { is_banned: banned });
}

export async function setUserRole(userId: string, role: "member" | "admin") {
  if (role !== "member" && role !== "admin") return { ok: false, error: "invalid role" } as const;
  return updateProfile(userId, { role });
}

export async function adminDelete(table: "spots" | "spot_contents", id: string): Promise<ActionResult> {
  const { t, isAdmin, supabase } = await adminContext();
  if (!isAdmin || (table !== "spots" && table !== "spot_contents")) {
    return { ok: false, error: t.common.noPermission };
  }

  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) return { ok: false, error: fmt(t.common.deleteFailed, { message: error.message }) };
  if (!data?.length) return { ok: false, error: t.common.noPermission };

  refresh();
  return { ok: true };
}
