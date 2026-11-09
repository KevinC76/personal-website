import type { MetadataRoute } from "next";
import { siteUrl, noIndex } from "@/lib/config";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: noIndex()
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/", disallow: ["/admin", "/auth", "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
