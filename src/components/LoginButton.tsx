"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "email",
      },
    });
    if (error) {
      setLoading(false);
      alert(`登入失敗：${error.message}`);
    }
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="rounded-md bg-[#1877F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#166FE5] disabled:opacity-60"
    >
      {loading ? "登入中…" : "用 Facebook 登入"}
    </button>
  );
}
