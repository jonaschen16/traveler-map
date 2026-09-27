import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { fmt, formatDate } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/server";
import PageContainer from "@/components/PageContainer";
import { DeleteButton, UserButtons } from "@/components/admin/AdminButtons";

export const metadata: Metadata = { title: "Admin | Traveler Map" };

const LIMIT = 100;
const TABS = ["users", "spots", "contents"] as const;
type Tab = (typeof TABS)[number];

type Creator = { display_name: string } | null;

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const [me, t, locale] = await Promise.all([getCurrentProfile(), getDictionary(), getLocale()]);
  if (!me || me.role !== "admin" || me.is_banned) {
    return (
      <PageContainer>
        <p className="text-gray-600">{t.admin.notAllowed}</p>
      </PageContainer>
    );
  }

  const params = await searchParams;
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "users";
  const rawQuery = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  // Strip characters that have meaning in PostgREST filters / LIKE patterns.
  const q = rawQuery.replace(/[%_,()*\\]/g, " ").trim();

  const tabLabels: Record<Tab, string> = {
    users: t.admin.tabUsers,
    spots: t.admin.tabSpots,
    contents: t.admin.tabContents,
  };

  return (
    <PageContainer wide>
      <h1 className="text-2xl font-bold text-gray-900">{t.admin.title}</h1>

      <nav className="mt-4 flex gap-1 border-b border-gray-200">
        {TABS.map((key) => (
          <Link
            key={key}
            href={`/admin?tab=${key}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${
              key === tab
                ? "border-gray-900 font-medium text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tabLabels[key]}
          </Link>
        ))}
      </nav>

      <form className="mt-4 flex gap-2">
        <input type="hidden" name="tab" value={tab} />
        <input
          name="q"
          defaultValue={rawQuery}
          placeholder={t.admin.searchPlaceholder}
          className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
          {t.admin.search}
        </button>
      </form>

      <div className="mt-4">
        {tab === "users" && <UsersTable q={q} meId={me.id} />}
        {tab === "spots" && <SpotsTable q={q} />}
        {tab === "contents" && <ContentsTable q={q} />}
      </div>
    </PageContainer>
  );

  async function UsersTable({ q, meId }: { q: string; meId: string }) {
    const supabase = await createClient();
    let query = supabase
      .from("profiles")
      .select("id, display_name, avatar_url, role, is_banned, created_at")
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    if (q) query = query.ilike("display_name", `%${q}%`);
    const { data: users } = await query;

    return (
      <Table
        count={users?.length ?? 0}
        head={[t.admin.colName, t.admin.colRole, t.admin.colStatus, t.admin.colDate, t.admin.colActions]}
        rows={(users ?? []).map((u) => [
          <Link key="n" href={`/users/${u.id}`} className="font-medium hover:underline">
            {u.display_name || t.common.anonymous}
            {u.id === meId && t.admin.you}
          </Link>,
          u.role === "admin" ? t.admin.roleAdmin : t.admin.roleMember,
          u.is_banned ? <span className="text-red-600">{t.admin.banned}</span> : t.admin.active,
          formatDate(u.created_at, locale),
          u.id === meId ? null : (
            <UserButtons id={u.id} name={u.display_name} role={u.role} banned={u.is_banned} />
          ),
        ])}
      />
    );
  }

  async function SpotsTable({ q }: { q: string }) {
    const supabase = await createClient();
    let query = supabase
      .from("spots")
      .select("id, name, address, created_at, creator:profiles!spots_created_by_fkey(display_name)")
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    if (q) query = query.ilike("name", `%${q}%`);
    const { data: spots } = await query;

    return (
      <Table
        count={spots?.length ?? 0}
        head={[t.admin.colName, t.admin.colCreator, t.admin.colDate, t.admin.colActions]}
        rows={(spots ?? []).map((s) => [
          <div key="n">
            <Link href={`/spots/${s.id}`} className="font-medium hover:underline">
              {s.name}
            </Link>
            {s.address && <div className="text-xs text-gray-500">{s.address}</div>}
          </div>,
          (s.creator as unknown as Creator)?.display_name ?? "",
          formatDate(s.created_at, locale),
          <DeleteButton
            key="d"
            table="spots"
            id={s.id}
            confirmText={fmt(t.admin.confirmDeleteSpot, { name: s.name })}
          />,
        ])}
      />
    );
  }

  async function ContentsTable({ q }: { q: string }) {
    const supabase = await createClient();
    let query = supabase
      .from("spot_contents")
      .select(
        "id, type, url, note, preview_title, created_at, spot:spots(id, name), creator:profiles!spot_contents_created_by_fkey(display_name)",
      )
      .order("created_at", { ascending: false })
      .limit(LIMIT);
    if (q) query = query.or(`url.ilike.%${q}%,note.ilike.%${q}%,preview_title.ilike.%${q}%`);
    const { data: contents } = await query;

    return (
      <Table
        count={contents?.length ?? 0}
        head={[t.admin.colUrl, t.admin.colSpot, t.admin.colCreator, t.admin.colDate, t.admin.colActions]}
        rows={(contents ?? []).map((c) => {
          const spot = c.spot as unknown as { id: string; name: string } | null;
          return [
            <div key="u" className="max-w-xs">
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="block truncate hover:underline"
              >
                {c.preview_title || c.url}
              </a>
              {c.note && <div className="truncate text-xs text-gray-500">{c.note}</div>}
            </div>,
            spot ? (
              <Link key="s" href={`/spots/${spot.id}`} className="hover:underline">
                {spot.name}
              </Link>
            ) : null,
            (c.creator as unknown as Creator)?.display_name ?? "",
            formatDate(c.created_at, locale),
            <DeleteButton
              key="d"
              table="spot_contents"
              id={c.id}
              confirmText={t.admin.confirmDeleteContent}
            />,
          ];
        })}
      />
    );
  }

  function Table({ head, rows, count }: { head: string[]; rows: ReactNode[][]; count: number }) {
    if (rows.length === 0) return <p className="text-sm text-gray-500">{t.admin.noResults}</p>;
    return (
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 text-xs text-gray-500">
              <tr>
                {head.map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((cells, i) => (
                <tr key={i} className="align-top">
                  {cells.map((cell, j) => (
                    <td key={j} className="px-2 py-2.5">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {count >= LIMIT && (
          <p className="mt-2 text-xs text-gray-500">{fmt(t.admin.showingFirst, { count: LIMIT })}</p>
        )}
      </>
    );
  }
}
