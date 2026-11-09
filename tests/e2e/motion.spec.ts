import { expect, test, type Page } from "@playwright/test";

type MotionEvent = { motion: string; name: string };
type MotionWindow = Window & {
  paperEvents: MotionEvent[];
  paperCompletions: number[];
};

async function observeMotion(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as MotionWindow).paperEvents = [];
    (window as unknown as MotionWindow).paperCompletions = [];
    document.addEventListener("animationend", (event) => {
      if (event.animationName.startsWith("newspaper-"))
        (window as unknown as MotionWindow).paperCompletions.push(
          event.elapsedTime,
        );
    });
    document.addEventListener("animationstart", (event) => {
      if (
        event.target instanceof HTMLElement &&
        event.animationName.startsWith("newspaper-")
      ) {
        (window as unknown as MotionWindow).paperEvents.push({
          motion:
            event.target.closest<HTMLElement>(".paper-scene")?.dataset.motion ??
            "",
          name: event.animationName,
        });
      }
    });
  });
}
const events = (page: Page) =>
  page.evaluate(() => (window as unknown as MotionWindow).paperEvents);
const nav = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name, exact: true });

test("newspaper opens once, turns on navigation/history, then releases its layers", async ({
  page,
  isMobile,
}) => {
  await observeMotion(page);
  await page.goto("/");
  await expect
    .poll(async () => (await events(page)).some((e) => e.motion === "opening"))
    .toBe(true);
  await expect(page.locator(".paper-scene")).not.toHaveAttribute(
    "data-motion",
    /.+/,
  );
  expect(
    await page
      .locator(".paper-scene")
      .evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe("none");

  await nav(page, "About").click();
  await expect(page).toHaveURL(/\/about$/);
  await expect
    .poll(async () => (await events(page)).some((e) => e.motion === "forward"))
    .toBe(true);
  await nav(page, "All Projects").click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect
    .poll(
      async () =>
        (await events(page)).filter((e) => e.motion === "backward").length,
    )
    .toBe(1);

  await page.goBack();
  await expect(page).toHaveURL(/\/about$/);
  await expect
    .poll(
      async () =>
        (await events(page)).filter((e) => e.motion === "forward").length,
    )
    .toBe(2);
  await page.goForward();
  await expect(page).toHaveURL(/\/projects$/);
  await expect
    .poll(
      async () =>
        (await events(page)).filter((e) => e.motion === "backward").length,
    )
    .toBe(2);
  await expect(page.locator(".paper-scene")).not.toHaveAttribute(
    "data-motion",
    /.+/,
  );
  expect(
    await page
      .locator(".paper-scene")
      .evaluate((el) => el.getAnimations({ subtree: true }).length),
  ).toBe(0);
  // The browser must complete the full turn, rather than a cleanup timer
  // or a shorter lighting animation removing the paper early.
  expect(
    await page.evaluate(() =>
      (window as unknown as MotionWindow).paperCompletions.at(-1),
    ),
  ).toBe(3);
  const recorded = await events(page);
  expect(recorded.filter((e) => e.motion === "opening")).toHaveLength(2);
  expect(
    recorded.every((e) =>
      isMobile ? e.name.includes("flat") : !e.name.includes("flat"),
    ),
  ).toBe(true);

  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "The Projects.",
  );
  // A new document keeps the session flag; its next navigation must still turn.
  await expect(page.locator(".paper-scene")).toHaveCount(1);
  await nav(page, "Home").click();
  await expect.poll(async () => (await events(page)).length).toBeGreaterThan(0);
  expect((await events(page)).some((e) => e.motion === "opening")).toBe(false);
  if (isMobile) {
    await page.setViewportSize({ width: 1100, height: 500 });
    const count = (await events(page)).length;
    await nav(page, "About").click();
    await expect
      .poll(async () => (await events(page)).length)
      .toBeGreaterThan(count);
    expect((await events(page)).at(-1)?.name).toContain("flat");
  }
});

test("reduced motion skips the opening and all page turns", async ({
  page,
}) => {
  await observeMotion(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await nav(page, "About").click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator(".paper-scene")).toBeHidden();
  await expect(page.locator(".paper-scene")).not.toHaveAttribute(
    "data-motion",
    /.+/,
  );
  expect(await events(page)).toEqual([]);
});
