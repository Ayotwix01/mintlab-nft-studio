import type { Metadata } from "next";
import { Instrument_Serif, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const displayFont = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MINTLAB — Art, found on-chain",
  description:
    "Discover independent digital art, meet creators, and mint artwork on Ethereum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
