import fs from "node:fs";
const target = new URL(process.env.TARGET_SITE_URL ?? "");
if (
  target.protocol !== "https:" ||
  target.username ||
  target.password ||
  target.pathname !== "/" ||
  target.search ||
  target.hash
)
  throw new Error("Provide the verified HTTPS production origin only.");
const escape = (s) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
for (const path of ["", "about", "projects"]) {
  const url = new URL(path, target).href;
  fs.mkdirSync(`redirect-out/${path}`, { recursive: true });
  fs.writeFileSync(
    `redirect-out/${path}/index.html`,
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="refresh" content="0;url=${escape(url)}"><link rel="canonical" href="${escape(url)}"><title>Kevin Chiputra — new address</title><h1>The newspaper has moved.</h1><p><a href="${escape(url)}">Continue to Kevin Chiputra’s portfolio</a></p></html>`,
  );
}
fs.copyFileSync("redirect-out/index.html", "redirect-out/404.html");
fs.writeFileSync("redirect-out/.nojekyll", "");
