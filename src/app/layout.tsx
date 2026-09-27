import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/Header";
import { I18nProvider } from "@/i18n/client";
import { getDictionary, getLocale } from "@/i18n/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: "Traveler Map",
    description: t.meta.description,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex h-full flex-col">
        <I18nProvider locale={locale}>
          <Header />
          <main className="relative min-h-0 flex-1">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
