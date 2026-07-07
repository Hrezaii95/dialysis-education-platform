import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

// Decision D3 (2026-07-07): system font stack only — no next/font, no CDN, no
// bundled woff2 on this surface. Font-family stacks live in globals.css
// (--font-geist-sans / --font-instrument / --font-fa custom properties),
// which keeps the same CSS variable names as slots for a future brand woff2.

export const metadata: Metadata = {
  title: "Raouf Simulation Hub | Tier-1 HDF Academy",
  description:
    "Fresenius-grade HDF clinical simulator — manipulate circuits, master the 5008, respond to alarms, earn credentials.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/app-icon-navy.svg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
