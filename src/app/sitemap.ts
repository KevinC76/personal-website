import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { siteUrl } from "@/lib/config";
import { getPublished } from "@/lib/content/public";
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Keep this metadata endpoint in the runtime; content still uses the tagged data cache.
  await connection();
  const { updated_at } = await getPublished();
  return ["/", "/about", "/projects"].map((path) => ({
    url: new URL(path, siteUrl()).href,
    lastModified: new Date(updated_at),
  }));
}
