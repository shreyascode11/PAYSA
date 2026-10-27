import type { Metadata, Viewport } from "next";
import { LANG_TAGS } from "@/lib/i18n";
import { getT } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PAYSA", template: "%s · PAYSA" },
  description: "Worker-first platform for fair pay, safe work and an anonymous voice.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d5c4c" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1214" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getT();
  return (
    <html lang={LANG_TAGS[lang]}>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="skip-link">
          {t("common.skip")}
        </a>
        {children}
      </body>
    </html>
  );
}
