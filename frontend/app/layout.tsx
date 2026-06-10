import "./globals.css";
import type { Metadata } from "next";
import { Almarai, Tajawal, Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});
const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ميزان MIZAN — نوزِن مياه الأردن من الفضاء",
  description:
    "Inspection-prioritization decision support for Jordan's groundwater — from space. GRACE-FO + Sentinel-2 + AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${almarai.variable} ${tajawal.variable}`}>
      <body>
        <I18nProvider>
          <Nav />
          <main className="mx-auto max-w-[1400px] px-4 py-5 md:py-7">{children}</main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
