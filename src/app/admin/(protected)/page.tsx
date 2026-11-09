import { redirect } from "next/navigation";
import { getDraft } from "@/lib/content/private";
import { requireAdmin } from "@/lib/supabase/admin";
import Editor from "@/components/admin/Editor";
import { PRIVATE_BUCKET } from "@/lib/config";
export default async function AdminPage() {
  let auth;
  try {
    auth = await requireAdmin();
  } catch {
    redirect("/admin/login?error=access");
  }
  const draft = await getDraft();
  const { data, error } = await auth.client
    .from("portfolio_media")
    .select("id,path,width,height,state")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Media library unavailable.");
  const library = await Promise.all(
    (data ?? []).map(async (asset) => {
      if (asset.state !== "ready") return asset;
      const { data: signed } = await auth.client.storage
        .from(PRIVATE_BUCKET)
        .createSignedUrl(asset.path, 300);
      return { ...asset, previewUrl: signed?.signedUrl };
    }),
  );
  return <Editor initial={draft} library={library} />;
}
