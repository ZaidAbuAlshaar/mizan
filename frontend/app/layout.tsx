import "./globals.css";
import type { Metadata } from "next";
import { Almarai, Tajawal } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import Nav from "@/components/Nav";

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

export const metadata: Metadata = {
  title: "ميزان MIZAN — نوزِن مياه الأردن من الفضاء",
  description:
    "Inspection-prioritization decision support for Jordan's groundwater — from space.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${almarai.variable} ${tajawal.variable}`}>
      <body>
        <I18nProvider>
          <Nav />
          <main className="mx-auto max-w-[1400px] px-4 py-4">{children}</main>
          <footer className="mx-auto max-w-[1400px] px-4 py-6 text-center text-[11px] text-muted">
            ميزان — كل قطرة محسوبة من الفضاء · AstroCode 2026 · التحدي ٦ · Vcoders
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
