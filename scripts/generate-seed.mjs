import fs from "node:fs";
const seed = JSON.parse(
  fs.readFileSync(
    new URL("../src/lib/content/seed.json", import.meta.url),
    "utf8",
  ),
);
const json = JSON.stringify(seed);
if (json.includes("$portfolio$"))
  throw new Error("Seed contains reserved SQL delimiter");
fs.writeFileSync(
  new URL("../supabase/seed.sql", import.meta.url),
  `-- Seed only missing slots; never overwrite edited content.\ninsert into public.portfolio_snapshots(slot,document)\nselect slot, $portfolio$${json}$portfolio$::jsonb\nfrom (values ('draft'),('published')) as slots(slot)\non conflict(slot) do nothing;\n`,
);
