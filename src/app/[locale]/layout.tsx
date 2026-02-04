import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, getMessages } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { AuthProvider } from "@/components/auth-provider";
import { ServiceWorkerKiller } from "@/components/dev/service-worker-killer";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
    title: {
      template: `%s | ${t("appTitle")}`,
      default: t("appTitle"),
    },
    description: t("appDescription"),
    openGraph: {
      title: t("appTitle"),
      description: t("appDescription"),
      url: "https://mcsupport.com", // Replace with actual URL
      siteName: "MC Support System",
      images: [
        {
          url: "/og-image.png", // Ensure this exists or use a placeholder
          width: 800,
          height: 600,
        },
      ],
      locale: locale,
      type: "website",
    },

    icons: {
      icon: [
        { url: "/MCS192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/MCS512x512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/MCS192x192.png",
      apple: [
        { url: "/MCS120x120.png", sizes: "120x120" },
        { url: "/MCS192x192.png", sizes: "192x192" },
        { url: "/Rounded512.png", sizes: "512x512" },
      ],
    },
    manifest: "/manifest.json",
    formatDetection: {
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: t("appTitle"),
    },
  };
}

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextTopLoader color="#f97316" showSpinner={false} />
        {process.env.NODE_ENV === "development" && <ServiceWorkerKiller />}
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
