import type { Metadata } from "next";
import { Nunito_Sans as FontSans } from "next/font/google";
import { Delius_Unicase as FontSecondary } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { InstantSearchProvider } from "@/components/providers/InstantSearchProvider";
import { DoctorsProvider } from "@/components/providers/DoctorsProvider";
import { fetchAllDoctors } from "@/lib/fetchDoctors";
import Script from "next/script";

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

const fontSecondary = FontSecondary({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-secondary",
});

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";
const siteURL = process.env.NEXT_PUBLIC_SITE_URL!;

export const metadata: Metadata = {
  metadataBase: new URL(siteURL),
  title: {
    template: "%s | Schema UI Starter",
    default: "Sanity Next.js Website | Schema UI Starter",
  },
  openGraph: {
    images: [
      {
        url: `${siteURL}/images/og-image.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: isProduction ? "index, follow" : "noindex, nofollow",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allDoctors = await fetchAllDoctors(); // ✅ Fetch once here

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />

<Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />

      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overscroll-none",
          fontSans.variable,
          fontSecondary.variable
        )}
      >
        <InstantSearchProvider>
          <DoctorsProvider allDoctors={allDoctors}>
            {children}
          </DoctorsProvider>
        </InstantSearchProvider>
      </body>
    </html>
  );
}