"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fmt } from "@/i18n/config";
import { useI18n } from "@/i18n/client";

export default function LoginButton() {
  const { t } = useI18n();
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
      alert(fmt(t.header.loginFailed, { message: error.message }));
    }
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      className="rounded-md bg-[#1877F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#166FE5] disabled:opacity-60"
    >
      {loading ? t.header.loggingIn : t.header.login}
    </button>
  );
}
