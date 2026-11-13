import { expect, test, type Page } from "@playwright/test";

const nav = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name, exact: true });
const scene = (page: Page) => page.locator("#paper-scene");
async function settled(page: Page) {
  await expect(scene(page)).not.toHaveAttribute("data-motion", /.+/);
  await expect(page.locator(".paper-canvas canvas")).toHaveCount(0);
}
async function skip(page: Page) {
  await expect(page.getByRole("button", { name: "Skip intro" })).toBeVisible();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await settled(page);
}
async function observeTurns(page: Page) {
  await page.addInitScript(() => {
    const state = window as unknown as {
      turns: { direction: string; duration: number }[];
    };
    state.turns = [];
    document.addEventListener("animationend", (event) => {
      if (event.animationName.startsWith("newspaper-turn"))
        state.turns.push({
          direction: event.animationName,
          duration: event.elapsedTime,
        });
    });
  });
}

test("intro finishes once per session and releases the renderer", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(scene(page)).toHaveAttribute("data-motion", "opening");
  await expect(scene(page)).toHaveAttribute("data-renderer", /css|webgl/);
  await expect(scene(page)).toHaveAttribute("data-stage", "flat", {
    timeout: 4000,
  });
  await settled(page);
  expect(
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length,
    ),
  ).toBe(0);
  await page.reload();
  await expect(scene(page)).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(errors).toEqual([]);
});

test("skip, rapid navigation and history preserve direction and timing", async ({
  page,
  isMobile,
}) => {
  await observeTurns(page);
  await page.goto("/");
  await skip(page);
  await nav(page, "About").click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(scene(page)).toHaveAttribute("data-motion", "forward");
  await nav(page, "All Projects").click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(scene(page)).toHaveAttribute("data-motion", "backward");
  await settled(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await expect(scene(page)).toHaveAttribute("data-motion", "forward");
  await settled(page);
  await page.goForward();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(scene(page)).toHaveAttribute("data-motion", "backward");
  await settled(page);
  const turns = await page.evaluate(
    () =>
      (
        window as unknown as {
          turns: { direction: string; duration: number }[];
        }
      ).turns,
  );
  expect(turns.length).toBeGreaterThanOrEqual(3);
  expect(turns.every((t) => t.duration === (isMobile ? 0.65 : 0.9))).toBe(true);
  await expect(scene(page)).toHaveCount(1);
  await page.reload();
  await expect(scene(page)).toBeHidden();
  await nav(page, "Home").click();
  await expect(scene(page)).toHaveAttribute("data-motion", "backward");
  await settled(page);
});

for (const pathname of ["/about", "/projects"]) {
  test(`direct entry ${pathname} uses the current edition and Escape skips`, async ({
    page,
  }) => {
    await page.goto(pathname);
    await expect(scene(page)).toHaveAttribute("data-motion", "opening");
    const title = await page.getByRole("heading", { level: 1 }).textContent();
    await expect(
      page.locator(".paper-fallback .paper-print-headline"),
    ).toHaveText(title!);
    await page.keyboard.press("Escape");
    await settled(page);
  });
}

test("scroll interrupts the intro; reading uses bounded motion and stays idle", async ({
  page,
}) => {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-motion", "opening");
  await page.evaluate(() => window.scrollBy(0, 350));
  await settled(page);
  await page.locator("#tools").scrollIntoViewIfNeeded();
  await expect(page.locator("#tools")).toBeInViewport();
  await page.waitForTimeout(850);
  const result = await page.evaluate(() => ({
    animations: document
      .getAnimations()
      .filter((a) => a.playState === "running").length,
    drift: Array.from(
      document.querySelectorAll<HTMLElement>(".editorial-picture"),
    ).map((el) =>
      Math.abs(parseFloat(el.style.getPropertyValue("--photo-drift")) || 0),
    ),
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  expect(result.animations).toBe(0);
  expect(result.drift.every((value) => value <= 12)).toBe(true);
  expect(result.overflow).toBe(false);
});

test("blocked storage still limits intro to the persistent layout", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("Storage disabled");
    };
    Storage.prototype.setItem = () => {
      throw new Error("Storage disabled");
    };
  });
  await page.goto("/");
  await skip(page);
  await nav(page, "About").click();
  await expect(scene(page)).toHaveAttribute("data-motion", "forward");
  await settled(page);
  await nav(page, "Home").click();
  await expect(scene(page)).toHaveAttribute("data-motion", "backward");
  await settled(page);
});

test("unavailable WebGL completes the CSS fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).startsWith("webgl")) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-renderer", "css");
  await expect(page.locator(".paper-fallback")).toBeVisible();
  await settled(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("slow renderer stays on fallback and cannot mount late", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (args[0] === "webgl2") {
        const until = performance.now() + 450;
        while (performance.now() < until) {
          /* Simulate a slow graphics driver. */
        }
      }
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-renderer", "css");
  await settled(page);
  await expect(page.locator(".paper-canvas canvas")).toHaveCount(0);
});

test("resize, visibility and live reduced-motion changes release the scene", async ({
  page,
}) => {
  await page.goto("/");
  await expect(scene(page)).toHaveAttribute("data-motion", "opening");
  await page.setViewportSize({ width: 800, height: 500 });
  await settled(page);
  await nav(page, "About").click();
  await expect(scene(page)).toHaveAttribute("data-motion", "forward");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await settled(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await nav(page, "Home").click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await settled(page);
  await expect(scene(page)).toBeHidden();
});

test("reduced motion and hash links provide immediate access", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await settled(page);
  await expect(scene(page)).toBeHidden();
  await nav(page, "About").click();
  await settled(page);
  await page.locator('a[href="/#contact"]').click();
  await expect(page).toHaveURL(/\/#contact$/);
  await expect(page.locator("#contact")).toBeInViewport();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.reload();
  await settled(page);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("keyboard focus dismisses intro without losing the skip link", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await settled(page);
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("failed hydration cannot leave a blocking intro", async ({ page }) => {
  await page.route("**/*.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(scene(page)).toBeHidden({ timeout: 6000 });
  await nav(page, "About").click();
  await expect(page).toHaveURL(/\/about$/);
});

test("HTML remains navigable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL!);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(scene(page)).toBeHidden();
  await nav(page, "All Projects").click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});

test("context loss releases a running 3D renderer", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(scene(page)).toHaveAttribute("data-renderer", /css|webgl/);
  // Low-powered CI agents may intentionally hit the 400 ms fallback deadline.
  await expect
    .poll(
      async () =>
        page.locator(".paper-canvas canvas").count() ||
        (await scene(page).getAttribute("data-stage")) === "flat",
    )
    .toBeTruthy();
  const canvas = page.locator(".paper-canvas canvas");
  if (await canvas.count()) {
    await canvas.evaluate((el) =>
      el.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  }
  await settled(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("normal hash navigation skips the turn and preserves the target", async ({
  page,
}) => {
  await page.goto("/about");
  await skip(page);
  await page.locator('a[href="/#contact"]').click();
  await expect(page).toHaveURL(/\/#contact$/);
  await settled(page);
  await expect(page.locator("#contact")).toBeInViewport();
});

test("slow navigation releases its cover while the destination loads", async ({
  page,
}) => {
  let allowRoute: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    allowRoute = resolve;
  });
  await page.route("**/about?*", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/");
    await skip(page);
    await nav(page, "About").click();
    await expect(scene(page)).toHaveAttribute("data-motion", "cover");
    await settled(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  } finally {
    allowRoute();
  }
  await expect(page).toHaveURL(/\/about$/);
  await settled(page);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
