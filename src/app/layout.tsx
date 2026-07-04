import type { Metadata } from "next";
import { Inter, Instrument_Serif, Vazirmatn } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const vazir = Vazirmatn({
  variable: "--font-fa",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Raouf Clinical Simulator | Tier-1 HDF Academy",
  description:
    "Fresenius-grade HDF clinical simulator — manipulate circuits, master the 5008, respond to alarms, earn credentials.",
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
      <body
        className={`${inter.variable} ${instrument.variable} ${vazir.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
