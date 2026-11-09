import "server-only";
import type { Metadata } from "next";
import { siteUrl, noIndex } from "@/lib/config";
import { getPublished } from "./public";
import type { PageKey, PortfolioContent } from "./schema";
export const pagePaths = { home: "/", about: "/about", projects: "/projects" };
export async function pageMetadata(page: PageKey): Promise<Metadata> {
  const { document: c } = await getPublished();
  const url = new URL(pagePaths[page], siteUrl()).href;
  const seo = c.seo[page];
  return {
    ...seo,
    alternates: { canonical: url },
    robots: noIndex()
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      ...seo,
      url,
      type: "website",
      siteName: c.brand.name,
      images: [
        {
          url: new URL("/opengraph-image", siteUrl()).href,
          width: 1200,
          height: 630,
          alt: c.brand.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      ...seo,
      images: [new URL("/opengraph-image", siteUrl()).href],
    },
  };
}
export function structuredData(c: PortfolioContent, page: PageKey) {
  const base = siteUrl();
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${base}/#person`,
        name: c.profile.name,
        jobTitle: c.profile.role,
        url: base,
        sameAs: c.brand.social.map((s) => s.href),
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: c.brand.name,
        publisher: { "@id": `${base}/#person` },
      },
      ...(page === "about"
        ? [
            {
              "@type": "ProfilePage",
              "@id": `${base}/about`,
              url: `${base}/about`,
              mainEntity: { "@id": `${base}/#person` },
            },
          ]
        : []),
    ],
  }).replace(/</g, "\\u003c");
}
