import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import profile from "@/data/profile.json";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  variable: "--font-sans",
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
          bricolage.variable,
        )}
      >
        <Providers>
          <Header />
          <main className="relative mx-auto w-full max-w-site grow px-5 sm:px-8">
            <div aria-hidden className="site-atmosphere" />
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
