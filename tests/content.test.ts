import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { defaultContent } from "../src/lib/content/defaults";
import {
  portfolioSchema,
  safeUrl,
  referencedMedia,
} from "../src/lib/content/schema";
import { contactSchema, escapeHtml } from "../src/lib/contact";
import { normalizeImage } from "../src/lib/media";
test("seed validates and empty projects are supported", () => {
  assert.equal(portfolioSchema.safeParse(defaultContent).success, true);
  assert.equal(
    portfolioSchema.safeParse({
      ...defaultContent,
      projects: [],
      featuredProjectId: "",
    }).success,
    true,
  );
});
test("rejects duplicate IDs, dangling assets and missing featured projects", () => {
  const bad = [
    {
      ...defaultContent,
      projects: [...defaultContent.projects, ...defaultContent.projects],
    },
    { ...defaultContent, media: [] },
    { ...defaultContent, featuredProjectId: "missing" },
  ];
  for (const document of bad)
    assert.equal(portfolioSchema.safeParse(document).success, false);
});
test("only referenced media is published", () => {
  assert.equal(
    referencedMedia({ ...defaultContent, projects: [], featuredProjectId: "" })
      .length,
    1,
  );
});
test("links reject script URLs and protocol-relative redirects", () => {
  for (const value of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.example",
    "/\\evil.example",
    "http://example.com",
  ])
    assert.equal(safeUrl.safeParse(value).success, false);
  for (const value of ["https://example.com/cv.pdf", "/#contact", "/about"])
    assert.equal(safeUrl.safeParse(value).success, true);
});
test("rejects arbitrary image paths", () => {
  const document = structuredClone(defaultContent);
  document.media[0].path = "https://example.com/image.png";
  assert.equal(portfolioSchema.safeParse(document).success, false);
});
test("contact validates input and escapes HTML", () => {
  assert.equal(
    contactSchema.safeParse({ name: "Test", email: "invalid", message: "x" })
      .success,
    false,
  );
  assert.equal(
    escapeHtml("<script>\"x\" & 'y'</script>"),
    "&lt;script&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/script&gt;",
  );
});
test("images become WebP, shrink to 1600px and discard metadata", async () => {
  const input = await sharp({
    create: { width: 2400, height: 1200, channels: 3, background: "#fcf9f2" },
  })
    .jpeg()
    .toBuffer();
  const result = await normalizeImage(input);
  assert.equal(result.info.width, 1600);
  assert.equal(result.info.height, 800);
  assert.equal(result.info.format, "webp");
  const metadata = await sharp(result.data).metadata();
  assert.equal(metadata.exif, undefined);
});
test("small images are not enlarged and SVG / corrupt / oversized data is rejected", async () => {
  const input = await sharp({
    create: { width: 50, height: 30, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  assert.equal((await normalizeImage(input)).info.width, 50);
  await assert.rejects(() =>
    normalizeImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"></svg>',
      ),
    ),
  );
  await assert.rejects(() => normalizeImage(Buffer.from("not an image")));
  await assert.rejects(() => normalizeImage(Buffer.alloc(5 * 1024 * 1024 + 1)));
});
