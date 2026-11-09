"use server";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { normalizeImage } from "@/lib/media";
import { randomUUID } from "node:crypto";
import { serverSupabase } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/admin";
import {
  portfolioSchema,
  referencedMedia,
  type MediaAsset,
} from "@/lib/content/schema";
import { CONTENT_TAG } from "@/lib/content/public";
import { PRIVATE_BUCKET, PUBLIC_BUCKET, siteUrl } from "@/lib/config";

function message(error: unknown) {
  if (error instanceof z.ZodError)
    return error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join(" → ")}: ${i.message}`)
      .join("; ");
  if (error instanceof Error) return error.message;
  return "The operation failed. Please try again.";
}
export async function login() {
  const client = await serverSupabase();
  const origin =
    process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : siteUrl();
  const { data, error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/admin/login?error=login");
  redirect(data.url);
}
export async function logout() {
  const client = await serverSupabase();
  await client.auth.signOut();
  redirect("/admin/login");
}
export async function saveDraft(input: unknown, revision: number) {
  try {
    const { client } = await requireAdmin();
    const document = portfolioSchema.parse(input);
    z.number().int().positive().parse(revision);
    const { data, error } = await client.rpc("portfolio_save_draft", {
      expected_revision: revision,
      content: document,
    });
    if (error)
      throw new Error(
        error.code === "PT409"
          ? "Draft changed in another tab. Reload before saving."
          : "Unable to save. Verify that all images are available and try again.",
      );
    return { ok: true as const, revision: data as number };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}
export async function publishDraft(revision: number) {
  try {
    const { client } = await requireAdmin();
    z.number().int().positive().parse(revision);
    const { data, error } = await client
      .from("portfolio_snapshots")
      .select("document,revision")
      .eq("slot", "draft")
      .single();
    if (error || !data) throw new Error("Draft unavailable.");
    if (data.revision !== revision)
      throw new Error("Draft changed. Reload and review before publishing.");
    const content = portfolioSchema.parse(data.document);
    for (const asset of referencedMedia(content).filter(
      (m) => !m.path.startsWith("/"),
    )) {
      const { data: file, error: downloadError } = await client.storage
        .from(PRIVATE_BUCKET)
        .download(asset.path);
      if (downloadError || !file)
        throw new Error(
          "An image is unavailable. Your published edition is unchanged.",
        );
      const bytes = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await client.storage
        .from(PUBLIC_BUCKET)
        .upload(asset.path, bytes, {
          contentType: "image/webp",
          cacheControl: "31536000",
          upsert: false,
        });
      if (uploadError) {
        // Re-publishing immutable media is safe only when the existing bytes match.
        const existing = await client.storage
          .from(PUBLIC_BUCKET)
          .download(asset.path);
        if (
          existing.error ||
          !existing.data ||
          !Buffer.from(await existing.data.arrayBuffer()).equals(bytes)
        )
          throw new Error(
            "Could not publish an image. Your published edition is unchanged.",
          );
      }
    }
    const { error: publishError } = await client.rpc("portfolio_publish", {
      expected_revision: revision,
    });
    if (publishError)
      throw new Error(
        publishError.code === "PT409"
          ? "Draft changed during publication. Review the latest draft."
          : "Publishing failed. The previous edition is still active.",
      );
    // Publication has committed. If invalidation fails, report the commit accurately.
    try {
      updateTag(CONTENT_TAG);
      for (const path of [
        "/",
        "/about",
        "/projects",
        "/sitemap.xml",
        "/opengraph-image",
      ])
        revalidatePath(path);
    } catch {
      return {
        ok: true as const,
        warning:
          "Published, but cache refresh failed. The public site will refresh within one hour.",
      };
    }
    return { ok: true as const, warning: "" };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}
export async function finishUpload(uploadId: string, alt: string) {
  try {
    const { client } = await requireAdmin();
    z.string().uuid().parse(uploadId);
    z.string().trim().min(1).max(500).parse(alt);
    const original = `uploads/${uploadId}`;
    const { data: file, error } = await client.storage
      .from(PRIVATE_BUCKET)
      .download(original);
    if (error || !file || file.size > 5 * 1024 * 1024)
      throw new Error("Upload a JPEG, PNG, or WebP image of at most 5 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const { data: optimized, info } = await normalizeImage(bytes);
    const id = randomUUID();
    const path = `${id}.webp`;
    const { error: storageError } = await client.storage
      .from(PRIVATE_BUCKET)
      .upload(path, optimized, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
    if (storageError) throw new Error("Unable to store the optimized image.");
    const { error: registerError } = await client.rpc(
      "portfolio_register_media",
      { asset_id: id, asset_width: info.width, asset_height: info.height },
    );
    if (registerError)
      throw new Error(
        "Unable to register the image. Contact the administrator before retrying.",
      );
    await client.storage.from(PRIVATE_BUCKET).remove([original]);
    const asset: MediaAsset = {
      id,
      path,
      alt: alt.trim(),
      width: info.width,
      height: info.height,
    };
    const { data: signed } = await client.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(path, 300);
    return { ok: true as const, asset, previewUrl: signed?.signedUrl };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}
export async function deleteMedia(id: string) {
  try {
    const { client } = await requireAdmin();
    z.string().uuid().parse(id);
    const { error } = await client.rpc("portfolio_mark_media_deleted", {
      asset_id: id,
    });
    if (error)
      throw new Error(
        "Remove this image from both the draft and published edition before deleting it.",
      );
    for (const bucket of [PRIVATE_BUCKET, PUBLIC_BUCKET]) {
      const result = await client.storage.from(bucket).remove([`${id}.webp`]);
      if (result.error)
        throw new Error(
          "File deletion is incomplete. Retry to finish cleanup.",
        );
    }
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: message(error) };
  }
}
