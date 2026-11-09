import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { siteUrl } from "@/lib/config";
const newsreader = localFont({
  src: [
    {
      path: "./fonts/newsreader-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/newsreader-latin-800-normal.woff2",
      weight: "700 900",
      style: "normal",
    },
  ],
  variable: "--font-newsreader",
  adjustFontFallback: "Times New Roman",
  display: "swap",
});
const newsreaderDisplay = localFont({
  src: "./fonts/newsreader-latin-800-italic.woff2",
  variable: "--font-newsreader-display",
  weight: "800",
  style: "italic",
  preload: false,
  adjustFontFallback: "Times New Roman",
  display: "swap",
});
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});
const workSans = localFont({
  src: "./fonts/work-sans-latin-400-normal.woff2",
  variable: "--font-work-sans",
  preload: false,
  weight: "400",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Kevin Chiputra",
  description: "The personal portfolio of Kevin Chiputra.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${newsreaderDisplay.variable} ${publicSans.variable} ${workSans.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
