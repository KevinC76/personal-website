import sharp from "sharp";
export async function normalizeImage(bytes: Buffer) {
  if (bytes.length > 5 * 1024 * 1024)
    throw new Error("Images must be at most 5 MB.");
  const pipeline = sharp(bytes, { limitInputPixels: 32000000 });
  const metadata = await pipeline.metadata();
  if (
    !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
    (metadata.pages ?? 1) > 1
  )
    throw new Error("Only still JPEG, PNG, and WebP images are supported.");
  const result = await pipeline
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  if (result.info.height > 10000 || result.data.length > 5 * 1024 * 1024)
    throw new Error(
      "This image is too large. Please crop it before uploading.",
    );
  return result;
}
