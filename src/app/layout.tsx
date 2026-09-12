import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Quote from "@/components/layout/Quote";
import Rule from "@/components/layout/Rule";
import WorkbenchGrid from "@/components/layout/WorkbenchGrid";
import Providers from "@/components/Providers";
import profile from "@/data/profile.json";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, Silkscreen, Young_Serif } from "next/font/google";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const youngSerif = Young_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/* Pixel face, used only by the clock on the banner. */
const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  title: {
    default: "Prashant Yadav",
    template: "%s | Prashant Yadav",
  },
  description: profile.headline,
  openGraph: {
    title: "Prashant Yadav",
    description: profile.headline,
    url: profile.site,
    siteName: "Prashant Yadav",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "flex min-h-screen flex-col font-sans antialiased",
          instrument.variable,
          youngSerif.variable,
          jetbrains.variable,
          silkscreen.variable,
        )}
      >
        <Providers>
          <WorkbenchGrid />
          <div className="column relative z-10 mx-auto flex w-full max-w-site grow flex-col">
            <Header />
            <main className="relative grow px-[var(--gutter)]">{children}</main>
            <div className="px-[var(--gutter)]">
              <Rule />
              <Quote />
            </div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
