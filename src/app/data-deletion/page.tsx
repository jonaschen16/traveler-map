import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: `${(await getDictionary()).legal.dataDeletion} | Traveler Map` };
}

export default async function DataDeletionPage() {
  const t = await getDictionary();
  return (
    <LegalPage title={t.legal.dataDeletion}>
      <p>{t.legal.deletionIntro}</p>
      <ol className="list-decimal space-y-1 pl-6">
        {t.legal.deletionSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <p>{t.legal.deletionResult}</p>
      <p>{t.legal.deletionFacebook}</p>
    </LegalPage>
  );
}
