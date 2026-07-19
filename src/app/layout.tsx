import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { i18nConfig } from "@/config/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Qualifyr AI",
    template: "%s · Qualifyr AI",
  },
  description:
    "Le système d’IA qui transforme les demandes libres en dossiers complets, vérifiés et prêts pour une intervention.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={i18nConfig.defaultLocale}
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("qualifyr-theme");if(t==="dark")document.documentElement.dataset.theme="dark";else if(t==="system")document.documentElement.removeAttribute("data-theme");}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
