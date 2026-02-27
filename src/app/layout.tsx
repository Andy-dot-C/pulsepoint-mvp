import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getAuthView } from "@/lib/auth";
import { GlobalSiteHeader } from "@/components/global-site-header";
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
  const authViewPromise = getAuthView();

  return (
    <html lang="en">
      <body>
        <GlobalHeader authViewPromise={authViewPromise} />
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

async function GlobalHeader({
  authViewPromise
}: {
  authViewPromise: ReturnType<typeof getAuthView>;
}) {
  const authView = await authViewPromise;

  return (
    <GlobalSiteHeader
      signedIn={authView.signedIn}
      username={authView.username}
      role={authView.role}
    />
  );
}
