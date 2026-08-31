import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zcashorg",
  description: "Shielded ZEC orgs — governance for families, businesses, and communities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="logo">
            Zcashorg
          </a>
          <nav>
            <a href="/create">Create fund</a>
          </nav>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
