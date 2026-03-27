import type { ReactNode } from "react";
import { AppHeader } from "@/components/foundation/app-header";
import { siteMetadata } from "@/lib/branding/site-metadata";
import "./globals.css";

export const metadata = siteMetadata;

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <div className="app-root">
          <AppHeader />
          <main className="app-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
