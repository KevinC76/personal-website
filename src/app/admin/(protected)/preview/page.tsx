import Link from "next/link";
import { redirect } from "next/navigation";
import { getDraft } from "@/lib/content/private";
import { requireAdmin } from "@/lib/supabase/admin";
import { PRIVATE_BUCKET } from "@/lib/config";
import Portfolio from "@/components/public/Portfolio";
import { MotionProvider } from "@/components/public/Motion";
import { referencedMedia, type PageKey } from "@/lib/content/schema";
export default async function Preview({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  let auth;
  try {
    auth = await requireAdmin();
  } catch {
    redirect("/admin/login?error=access");
  }
  const { page: selected } = await searchParams;
  const page: PageKey =
    selected === "about" || selected === "projects" ? selected : "home";
  const { document, revision } = await getDraft();
  const sources: Record<string, string> = {};
  for (const asset of referencedMedia(document)) {
    if (!asset.path.startsWith("/")) {
      const { data, error } = await auth.client.storage
        .from(PRIVATE_BUCKET)
        .createSignedUrl(asset.path, 300);
      if (error || !data)
        throw new Error(
          "A draft image is unavailable. Return to the editor to replace it.",
        );
      sources[asset.id] = data.signedUrl;
    }
  }
  return (
    <>
      <aside
        className="bg-black text-white p-4 flex flex-wrap gap-6 items-center text-sm"
        aria-label="Preview controls"
      >
        <Link href="/admin" className="underline">
          ← Editor
        </Link>
        <strong>Private draft · revision {revision}</strong>
        {(["home", "about", "projects"] as const).map((p) => (
          <Link
            key={p}
            className="underline"
            aria-current={p === page ? "page" : undefined}
            href={`/admin/preview?page=${p}`}
          >
            {p}
          </Link>
        ))}
        <span>Public links open the published site.</span>
      </aside>
      <MotionProvider>
        <Portfolio content={document} page={page} previewSources={sources} />
      </MotionProvider>
    </>
  );
}
