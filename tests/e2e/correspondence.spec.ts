import { expect, test } from "@playwright/test";

test("letter fields have ink focus indicators without rectangular borders", async ({
  page,
}) => {
  await page.goto("/#contact");
  for (const label of ["Your name", "Email address", "Your letter"]) {
    const field = page.getByRole("textbox", { name: label });
    await field.focus();
    await expect(field).toBeFocused();
    await expect(field).toHaveCSS("outline-style", "none");
    await expect(field).toHaveCSS("border-width", "0px");
    const line = await field.evaluate(
      (el) => getComputedStyle(el.closest("label")!, "::after").height,
    );
    expect(line).toBe("2px");
  }
  await page.getByRole("textbox", { name: "Your name" }).fill("A reader");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("textbox", { name: "Email address" }),
  ).toBeFocused();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".spell-mote")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveCSS(
    "outline-style",
    "none",
  );
});

test("magic particles are bounded, settle, and clear for reduced motion", async ({
  page,
}) => {
  await page.goto("/#contact");
  const name = page.getByRole("textbox", { name: "Your name" });
  await name.focus();
  await expect
    .poll(() => page.locator(".spell-mote").count())
    .toBeGreaterThan(0);
  await expect(page.locator(".spell-mote")).toHaveCount(0);
  const button = page.getByRole("button", { name: "Send letter" });
  for (let i = 0; i < 8; i++)
    await button.dispatchEvent("pointerdown", {
      clientX: 140,
      clientY: 400,
      pointerType: "mouse",
    });
  expect(await page.locator(".spell-mote").count()).toBeLessThanOrEqual(24);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".spell-mote")).toHaveCount(0);
  await name.focus();
  await button.dispatchEvent("pointerdown", { clientX: 140, clientY: 400 });
  await expect(page.locator(".spell-mote")).toHaveCount(0);
});

test("dispatch animation waits for success and preserves the contact payload", async ({
  page,
}) => {
  let finish: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  let payload: Record<string, string> | undefined;
  await page.route("**/api/contact", async (route) => {
    payload = route.request().postDataJSON();
    await pending;
    await route.fulfill({ status: 200, json: { ok: true } });
  });
  await page.goto("/#contact");
  await page.getByRole("textbox", { name: "Your name" }).fill("A reader");
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("reader@example.com");
  await page
    .getByRole("textbox", { name: "Your letter" })
    .fill("A magical portfolio test letter.");
  try {
    await page.getByRole("button", { name: "Send letter" }).click();
    await expect(page.locator("#contact form")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(
      page.getByRole("button", { name: "Dispatching" }),
    ).toBeDisabled();
    await expect(page.locator(".letter-delivered")).toHaveCount(0);
  } finally {
    finish();
  }
  await expect(page.locator(".letter-delivered")).toBeVisible();
  expect(payload).toMatchObject({
    name: "A reader",
    email: "reader@example.com",
    message: "A magical portfolio test letter.",
    website: "",
  });
  await page.getByRole("button", { name: "Write another letter" }).click();
  await expect(page.getByRole("textbox", { name: "Your name" })).toHaveValue(
    "",
  );
});

test("failed dispatch retains the letter and does not show a success seal", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 500, json: { error: "Please try again." } }),
  );
  await page.goto("/#contact");
  await page.getByRole("textbox", { name: "Your name" }).fill("A reader");
  await page
    .getByRole("textbox", { name: "Email address" })
    .fill("reader@example.com");
  await page
    .getByRole("textbox", { name: "Your letter" })
    .fill("Keep this letter when sending fails.");
  await page.getByRole("button", { name: "Send letter" }).click();
  await expect(page.locator("#contact").getByRole("alert")).toHaveText(
    "Please try again.",
  );
  await expect(page.locator(".letter-seal")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Your letter" })).toHaveValue(
    "Keep this letter when sending fails.",
  );
  await expect(page.getByRole("button", { name: "Send letter" })).toBeEnabled();
});
