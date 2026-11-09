import { test, expect } from "@playwright/test";
test("public pages, metadata, keyboard and history", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Kevin Chiputra.",
  );
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  expect(new URL(canonical!).pathname).toBe("/");
  expect(new URL(canonical!).origin).toBe(
    new URL(process.env.TEST_BASE_URL ?? "http://localhost:3000").origin,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /opengraph-image/,
  );
  const data = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(data!)["@graph"][0]["@type"]).toBe("Person");
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "About", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about$/);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "All Projects" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Projects.",
  );
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/projects$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("CMS routes remain locked for anonymous visitors", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  if (process.env.TEST_CONNECTED === "true")
    await expect(
      page.getByRole("button", { name: /Continue with Google/i }),
    ).toBeVisible();
  else await expect(page.getByText("Cloud setup required")).toBeVisible();
  const response = await request.get("/admin/preview");
  expect(response.url()).toContain("/admin/login");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["x-robots-tag"]).toContain("noindex");
});
test("reduced motion, image fallback and no public auth requests", async ({
  page,
}) => {
  const authRequests: string[] = [];
  page.on("request", (request) => {
    if (/supabase.*\/auth|\/auth\/v1/.test(request.url()))
      authRequests.push(request.url());
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/_next/image?**", (route) => route.abort());
  await page.goto("/");
  await expect(
    page.getByRole("img", { name: "Kevin Chiputra", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".paper-enter")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  expect(authRequests).toEqual([]);
});
test("robots sitemap and contact validation", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/about");
  expect(await sitemap.text()).not.toContain("/admin");
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /admin",
  );
  const invalid = await request.post("/api/contact", {
    data: { name: "Test", email: "invalid", message: "x" },
  });
  expect(invalid.status()).toBe(400);
  const trapped = await request.post("/api/contact", {
    data: {
      name: "Test",
      email: "test@example.com",
      message: "This is a trapped test message.",
      website: "spam",
    },
  });
  expect(trapped.status()).toBe(200);
  const crossOrigin = await request.post("/api/contact", {
    headers: { origin: "https://evil.example" },
    data: {},
  });
  expect(crossOrigin.status()).toBe(403);
});
