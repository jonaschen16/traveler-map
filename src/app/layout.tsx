import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Traveler Map",
  description: "在地圖上探索旅遊景點與旅人分享的內容",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
