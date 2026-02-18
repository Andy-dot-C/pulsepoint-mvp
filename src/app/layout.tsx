import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulsePoint MVP",
  description: "Opinion polling platform MVP"
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
