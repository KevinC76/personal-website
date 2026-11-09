import "server-only";
import { requireAdmin } from "@/lib/supabase/admin";
import { portfolioSchema, type Snapshot } from "./schema";
export async function getDraft(): Promise<Snapshot> {
  const { client } = await requireAdmin();
  const { data, error } = await client
    .from("portfolio_snapshots")
    .select("document,revision,updated_at")
    .eq("slot", "draft")
    .single();
  if (error || !data)
    throw new Error(
      "Draft unavailable. Check the database setup and try again.",
    );
  return { ...data, document: portfolioSchema.parse(data.document) };
}
