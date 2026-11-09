"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { defaultContent } from "@/lib/content/defaults";
import { PRIVATE_BUCKET } from "@/lib/config";
import type { Snapshot, MediaAsset } from "@/lib/content/schema";
import {
  saveDraft,
  publishDraft,
  finishUpload,
  deleteMedia,
  logout,
} from "@/app/admin/actions";
import { browserSupabase } from "@/lib/supabase/browser";

type Value = string | number | boolean | Value[] | { [key: string]: Value };
type Part = string | number;
type LibraryItem = {
  id: string;
  path: string;
  width: number;
  height: number;
  state: string;
  previewUrl?: string;
};
const sections = [
  ["profile", "Profile & home"],
  ["about", "About & experience"],
  ["skills", "Skills & tooling"],
  ["projects", "Projects"],
  ["media", "Media library"],
  ["brand", "Header & footer"],
  ["contact", "Contact"],
  ["labels", "Headings & links"],
  ["seo", "Search & sharing"],
] as const;
const title = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
function at(value: unknown, path: Part[]): unknown {
  return path.reduce<unknown>(
    (v, key) =>
      v && typeof v === "object"
        ? (v as Record<string, unknown>)[key]
        : undefined,
    value,
  );
}
function blank(value: Value, media: MediaAsset[]): Value {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        key === "id" || key === "num"
          ? crypto.randomUUID()
          : key === "image"
            ? (media[0]?.id ?? "")
            : blank(v, media),
      ]),
    );
  return typeof value === "boolean" ? true : typeof value === "number" ? 0 : "";
}
function Fields({
  value,
  path,
  onChange,
  media,
}: {
  value: Value;
  path: Part[];
  onChange: (path: Part[], value: Value) => void;
  media: MediaAsset[];
}) {
  const key = String(path.at(-1));
  const label = title(key);
  const inputId = `field-${path.join("-")}`;
  if (Array.isArray(value))
    return (
      <fieldset className="editor-list">
        <legend>{label}</legend>
        {value.map((item, index) => (
          <div key={index} className="editor-item">
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <span className="eyebrow mr-auto">
                {label} · {index + 1}
              </span>
              <button
                type="button"
                disabled={index === 0}
                aria-label={`Move ${label} ${index + 1} up`}
                onClick={() => {
                  const copy = [...value];
                  [copy[index - 1], copy[index]] = [
                    copy[index],
                    copy[index - 1],
                  ];
                  onChange(path, copy);
                }}
              >
                ↑ Up
              </button>
              <button
                type="button"
                disabled={index === value.length - 1}
                aria-label={`Move ${label} ${index + 1} down`}
                onClick={() => {
                  const copy = [...value];
                  [copy[index], copy[index + 1]] = [
                    copy[index + 1],
                    copy[index],
                  ];
                  onChange(path, copy);
                }}
              >
                ↓ Down
              </button>
              <button
                type="button"
                aria-label={`Remove ${label} ${index + 1}`}
                onClick={() =>
                  onChange(
                    path,
                    value.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </button>
            </div>
            <Fields
              value={item}
              path={[...path, index]}
              onChange={onChange}
              media={media}
            />
          </div>
        ))}
        <button
          type="button"
          className="editor-outline"
          onClick={() => {
            const sample = at(
              defaultContent,
              path.map((p) => (typeof p === "number" ? 0 : p)),
            );
            const first = Array.isArray(sample) ? sample[0] : undefined;
            onChange(path, [
              ...value,
              blank((first ?? value[0] ?? "") as Value, media),
            ]);
          }}
        >
          + Add {label.toLowerCase()}
        </button>
      </fieldset>
    );
  if (value && typeof value === "object")
    return (
      <div className="editor-fields">
        {Object.entries(value)
          .filter(([k]) => k !== "id")
          .map(([k, v]) => (
            <Fields
              key={k}
              value={v}
              path={[...path, k]}
              onChange={onChange}
              media={media}
            />
          ))}
      </div>
    );
  if (typeof value === "boolean")
    return (
      <label className="flex gap-3 items-center">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(path, e.target.checked)}
        />
        {label}
      </label>
    );
  if (key === "image" || key === "photo")
    return (
      <label className="editor-label" htmlFor={inputId}>
        {label}
        <select
          id={inputId}
          value={String(value)}
          onChange={(e) => onChange(path, e.target.value)}
        >
          <option value="">Select an image</option>
          {media.map((m) => (
            <option key={m.id} value={m.id}>
              {m.alt} ({m.id.slice(0, 8)})
            </option>
          ))}
        </select>
      </label>
    );
  const long =
    typeof value === "string" &&
    (value.length > 100 ||
      [
        "intro",
        "body",
        "summary",
        "desc",
        "description",
        "paragraphs",
        "quote",
        "outcome",
        "deskBody",
        "successDetail",
      ].some((k) => path.includes(k)));
  return (
    <label className="editor-label" htmlFor={inputId}>
      {typeof path.at(-1) === "number"
        ? `Item ${Number(path.at(-1)) + 1}`
        : label}
      {long ? (
        <textarea
          id={inputId}
          value={String(value)}
          rows={4}
          onChange={(e) => onChange(path, e.target.value)}
        />
      ) : (
        <input
          id={inputId}
          type={typeof value === "number" ? "number" : "text"}
          value={String(value)}
          onChange={(e) =>
            onChange(
              path,
              typeof value === "number"
                ? Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}
    </label>
  );
}
export default function Editor({
  initial,
  library: initialLibrary,
}: {
  initial: Snapshot;
  library: LibraryItem[];
}) {
  const [content, setContent] = useState(initial.document);
  const [revision, setRevision] = useState(initial.revision);
  const [section, setSection] =
    useState<(typeof sections)[number][0]>("profile");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [library, setLibrary] = useState(initialLibrary);
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  function update(path: Part[], value: Value) {
    setContent((previous) => {
      const next = structuredClone(previous);
      let object = next as unknown as Record<string, unknown>;
      for (const key of path.slice(0, -1))
        object = object[key] as Record<string, unknown>;
      object[path.at(-1)!] = value;
      if (
        next.featuredProjectId &&
        !next.projects.some((p) => p.id === next.featuredProjectId)
      )
        next.featuredProjectId = "";
      return next;
    });
    setDirty(true);
    setReviewed(false);
    setNotice("");
    setError("");
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The request failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    await run(async () => {
      const result = await saveDraft(content, revision);
      if (!result.ok) throw new Error(result.error);
      setRevision(result.revision);
      setDirty(false);
      setReviewed(false);
      setNotice("Draft saved. Open the private preview before publishing.");
    });
  }
  async function publish() {
    if (dirty || !reviewed) return;
    await run(async () => {
      const result = await publishDraft(revision);
      if (!result.ok) throw new Error(result.error);
      setNotice(result.warning || "Published. Your new edition is now live.");
    });
  }
  async function upload(file: File) {
    await run(async () => {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
        throw new Error("Choose a still JPEG, PNG, or WebP image up to 5 MB.");
      const id = crypto.randomUUID();
      const client = browserSupabase();
      const { error } = await client.storage
        .from(PRIVATE_BUCKET)
        .upload(`uploads/${id}`, file, {
          contentType: file.type,
          upsert: false,
        });
      if (error)
        throw new Error("Upload failed. Check your session and try again.");
      const result = await finishUpload(
        id,
        file.name.replace(/\.[^.]+$/, "").slice(0, 500),
      );
      if (!result.ok) {
        await client.storage.from(PRIVATE_BUCKET).remove([`uploads/${id}`]);
        throw new Error(result.error);
      }
      update(["media"], [...content.media, result.asset]);
      setLibrary((items) => [
        { ...result.asset, state: "ready", previewUrl: result.previewUrl },
        ...items,
      ]);
      setNotice(
        "Image optimized. Add descriptive alt text, select it in your content, and save the draft.",
      );
    });
  }
  const selected = sections.find((s) => s[0] === section)!;
  return (
    <div className="editor-shell">
      <header className="border-b-4 border-black pb-5 mb-8">
        <div className="flex justify-between items-start gap-6">
          <div>
            <Link href="/" className="eyebrow nav-link">
              Kevin Chiputra Newspaper
            </Link>
            <h1 className="font-headline text-4xl md:text-6xl italic mt-3">
              The editorial office.
            </h1>
          </div>
          <form action={logout}>
            <button className="editor-outline">Sign out</button>
          </form>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <span className="eyebrow mr-auto">
            Revision {revision} · {dirty ? "Unsaved changes" : "Saved draft"}
          </span>
          <button
            className="editor-outline"
            disabled={busy || !dirty}
            onClick={save}
          >
            {busy ? "Working…" : "Save draft"}
          </button>
          {!dirty && !busy ? (
            <a
              className="editor-outline"
              href="/admin/preview"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setReviewed(true)}
            >
              Preview saved draft ↗
            </a>
          ) : (
            <span className="text-sm text-black/60">Save to preview</span>
          )}
          <button
            className="ink-button"
            disabled={busy || dirty || !reviewed}
            onClick={publish}
          >
            Publish edition →
          </button>
        </div>
        <p className="text-sm mt-4 text-black/70">
          Publish releases the entire saved draft. Unsaved edits never appear on
          the public website.
        </p>
      </header>
      <div aria-live="polite">
        {notice && (
          <p className="border-l-4 border-black bg-white p-4 mb-6">{notice}</p>
        )}
      </div>
      {error && (
        <div
          role="alert"
          className="border-l-4 border-red-800 bg-white p-4 mb-6"
        >
          <p>{error}</p>
          {error.includes("changed") && (
            <button
              className="underline mt-3"
              onClick={() => location.reload()}
            >
              Reload latest draft
            </button>
          )}
        </div>
      )}
      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        <nav
          aria-label="Editor sections"
          className="flex flex-wrap lg:flex-col gap-2 items-start"
        >
          {sections.map(([key, label], i) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              aria-current={section === key ? "page" : undefined}
              className={`editor-tab ${section === key ? "active" : ""}`}
            >
              <span className="opacity-50 mr-3">
                {String(i + 1).padStart(2, "0")}
              </span>
              {label}
            </button>
          ))}
        </nav>
        <section className="min-w-0">
          <p className="eyebrow mb-2">Editing the next edition</p>
          <h2 className="font-headline text-4xl font-bold mb-8">
            {selected[1]}
          </h2>
          <fieldset disabled={busy} className="min-w-0">
            {section === "projects" && (
              <label className="editor-label mb-8">
                Featured project
                <select
                  value={content.featuredProjectId}
                  onChange={(e) =>
                    update(["featuredProjectId"], e.target.value)
                  }
                >
                  <option value="">First project in the list</option>
                  {content.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || "Untitled project"}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {section !== "media" ? (
              <Fields
                value={content[section] as Value}
                path={[section]}
                onChange={update}
                media={content.media}
              />
            ) : (
              <div className="space-y-8">
                <label className="editor-label border-2 border-dashed border-black/30 p-6">
                  Upload an image
                  <span className="text-sm font-normal">
                    JPEG, PNG, WebP · up to 5 MB · optimized to WebP at 1,600 px
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void upload(file);
                    }}
                  />
                </label>
                {content.media.map((asset, i) => {
                  const used =
                    content.profile.photo === asset.id ||
                    content.projects.some((p) => p.image === asset.id);
                  const thumbnail = asset.path.startsWith("/")
                    ? asset.path
                    : library.find((item) => item.id === asset.id)?.previewUrl;
                  return (
                    <div key={asset.id} className="editor-item">
                      {thumbnail && (
                        <Image
                          src={thumbnail}
                          alt={asset.alt}
                          width={160}
                          height={120}
                          unoptimized
                          className="mb-4 w-40 h-30 object-cover"
                        />
                      )}
                      <p className="eyebrow mb-4">
                        {asset.path.startsWith("/")
                          ? "Original portfolio image"
                          : "Uploaded image"}{" "}
                        · {asset.width} × {asset.height}
                      </p>
                      <label className="editor-label">
                        Alt text
                        <input
                          value={asset.alt}
                          onChange={(e) =>
                            update(["media", i, "alt"], e.target.value)
                          }
                        />
                      </label>
                      <button
                        className="editor-outline"
                        disabled={used}
                        onClick={() =>
                          update(
                            ["media"],
                            content.media.filter((_, j) => i !== j),
                          )
                        }
                      >
                        {used ? "Used in this draft" : "Remove from draft"}
                      </button>
                    </div>
                  );
                })}
                <div className="border-t-2 border-black pt-6">
                  <h3 className="font-headline text-2xl mb-3">
                    Stored uploads
                  </h3>
                  <p className="text-sm mb-6">
                    Remove an image from the draft and publish that change
                    before deleting a stored file. The database protects images
                    used by either edition.
                  </p>
                  {library.map((asset) => (
                    <div
                      className="flex flex-wrap gap-3 items-center border-t border-black/20 py-4"
                      key={asset.id}
                    >
                      {asset.previewUrl && (
                        <Image
                          src={asset.previewUrl}
                          alt="Stored portfolio image"
                          width={80}
                          height={60}
                          unoptimized
                          className="w-20 h-15 object-cover"
                        />
                      )}
                      <span className="text-sm mr-auto break-all">
                        {asset.id.slice(0, 8)} · {asset.width} × {asset.height}
                      </span>
                      {asset.state === "ready" &&
                        !content.media.some((m) => m.id === asset.id) && (
                          <button
                            className="editor-outline"
                            onClick={() =>
                              update(
                                ["media"],
                                [
                                  ...content.media,
                                  {
                                    id: asset.id,
                                    path: asset.path,
                                    width: asset.width,
                                    height: asset.height,
                                    alt: "Portfolio image",
                                  },
                                ],
                              )
                            }
                          >
                            Use in draft
                          </button>
                        )}
                      <button
                        className="editor-outline"
                        disabled={content.media.some((m) => m.id === asset.id)}
                        onClick={() => {
                          if (
                            confirm(
                              "Permanently delete this unused stored image?",
                            )
                          )
                            void run(async () => {
                              const result = await deleteMedia(asset.id);
                              if (!result.ok) throw new Error(result.error);
                              setLibrary((items) =>
                                items.filter((m) => m.id !== asset.id),
                              );
                              setNotice("Unused image deleted.");
                            });
                        }}
                      >
                        Delete file
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
        </section>
      </div>
    </div>
  );
}
