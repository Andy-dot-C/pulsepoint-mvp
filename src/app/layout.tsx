import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();
const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});
const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: "PulsePoint MVP",
  description: "Opinion polling platform MVP",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "PulsePoint MVP",
    description: "Opinion polling platform MVP",
    url: siteUrl,
    siteName: "PulsePoint",
    type: "website",
    images: ["/opengraph-image"]
  },
  twitter: {
    card: "summary_large_image",
    title: "PulsePoint MVP",
    description: "Opinion polling platform MVP",
    images: ["/opengraph-image"]
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
        <footer className="site-footer">
          <a href="/legal/terms">Terms</a>
          <a href="/legal/privacy">Privacy</a>
          <a href="/legal/guidelines">Guidelines</a>
        </footer>
      </body>
    </html>
  );
}
