import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { getPublished } from "@/lib/content/public";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { updated_at } = await getPublished();
  return ["/", "/about", "/projects"].map((path) => ({
    url: new URL(path, siteUrl()).href,
    lastModified: new Date(updated_at),
  }));
}
