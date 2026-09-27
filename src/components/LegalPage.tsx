import Link from "next/link";
import type { ReactNode } from "react";
import { fmt } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import PageContainer from "./PageContainer";

export default async function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const t = await getDictionary();
  const email = process.env.CONTACT_EMAIL;

  return (
    <PageContainer>
      <article className="leading-relaxed text-gray-800">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.legal.updated}</p>
        <div className="mt-6 space-y-6">{children}</div>
        {email && (
          <p className="mt-8 text-sm">
            {fmt(t.legal.contact, { email: "" })}
            <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
              {email}
            </a>
          </p>
        )}
      </article>
      <footer className="mt-12 flex gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500">
        <Link href="/" className="hover:underline">
          Traveler Map
        </Link>
        <Link href="/privacy" className="hover:underline">
          {t.legal.privacy}
        </Link>
        <Link href="/data-deletion" className="hover:underline">
          {t.legal.dataDeletion}
        </Link>
      </footer>
    </PageContainer>
  );
}
