import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${(await getDictionary()).legal.privacy} | Traveler Map` };
}

export default async function PrivacyPage() {
  const t = await getDictionary();
  return (
    <LegalPage title={t.legal.privacy}>
      {t.legal.privacySections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-lg font-bold text-gray-900">{section.heading}</h2>
          <p className="mt-1">{section.body}</p>
        </section>
      ))}
    </LegalPage>
  );
}
