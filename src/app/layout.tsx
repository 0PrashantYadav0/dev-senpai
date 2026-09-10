import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import profile from "@/data/profile.json";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono, Young_Serif } from "next/font/google";
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
        )}
      >
        <Providers>
          <Header />
          <main className="relative mx-auto w-full max-w-site grow px-5 sm:px-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
