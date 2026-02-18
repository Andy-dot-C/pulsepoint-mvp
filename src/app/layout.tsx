import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

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
      <body>
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
