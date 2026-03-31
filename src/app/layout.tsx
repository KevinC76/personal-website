import type { Metadata } from "next";
import { Newsreader, Public_Sans, Work_Sans } from "next/font/google";
import "./globals.css";
import AnimatedLayout from "@/components/AnimatedLayout";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  weight: ["400", "700", "800"],
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["300", "400", "700"],
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kevin Chiputra",
  description:
    "A personal portfolio in newspaper editorial style — design and development at the intersection of aesthetic rigor and technical precision.",
  keywords: ["portfolio", "web developer", "designer", "Next.js", "React"],
  openGraph: {
    title: "Kevin Chiputra",
    description: "A modern chronicle of design and development.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${newsreader.variable} ${publicSans.variable} ${workSans.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning on body prevents false-positive warnings
          from browser extensions that inject attributes (e.g. password managers) */}
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AnimatedLayout>{children}</AnimatedLayout>
      </body>
    </html>
  );
}
