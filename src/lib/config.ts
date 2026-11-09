export const OWNER_EMAIL = "chiputrakevin@gmail.com";
export const PUBLIC_BUCKET = "portfolio-public";
export const PRIVATE_BUCKET = "portfolio-drafts";
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase is not configured. Follow the setup instructions in README.md.",
    );
  return { url, key };
}
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function siteUrl() {
  const value =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");
  return new URL(value).origin;
}
export function noIndex() {
  return (
    process.env.VERCEL_ENV === "preview" ||
    (!process.env.SITE_URL && !process.env.VERCEL_PROJECT_PRODUCTION_URL)
  );
}
