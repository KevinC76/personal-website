import "server-only";
import { cache } from "react";
import { defaultContent } from "./defaults";
import { portfolioSchema, type Snapshot } from "./schema";
import { isSupabaseConfigured, supabaseConfig } from "@/lib/config";
export const CONTENT_TAG = "portfolio-content";
export const getPublished = cache(async (): Promise<Snapshot> => {
  if (!isSupabaseConfigured()) {
    if (
      process.env.PORTFOLIO_DEMO === "true" ||
      process.env.NODE_ENV === "development"
    )
      return {
        document: defaultContent,
        revision: 1,
        updated_at: "2026-11-09T00:00:00.000Z",
      };
    throw new Error(
      "Configure Supabase and seed content before deploying. For a local demo only, set PORTFOLIO_DEMO=true.",
    );
  }
  const { url, key } = supabaseConfig();
  const response = await fetch(
    `${url}/rest/v1/portfolio_snapshots?slot=eq.published&select=document,revision,updated_at`,
    {
      headers: { apikey: key },
      next: { revalidate: 3600, tags: [CONTENT_TAG] },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok)
    throw new Error("The published edition could not be loaded.");
  const rows = await response.json();
  if (!rows[0]) throw new Error("The first edition has not been published.");
  return { ...rows[0], document: portfolioSchema.parse(rows[0].document) };
});
