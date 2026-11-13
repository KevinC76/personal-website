import { chromium, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
// Sample RAF cadence during visible intro/page turns on a quiet production server.
// CPU throttling is an approximation, not a measurement on a physical phone.
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const output =
  process.argv[2] ?? "artifacts/magic-paper/frame-measurement.json";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
  });
  const results = [];
  for (const mobile of [false, true])
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext(
        mobile
          ? devices["Pixel 7"]
          : { viewport: { width: 1440, height: 1000 } },
      );
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", {
        rate: mobile ? 4 : 1,
      });
      await page.addInitScript(() => {
        window.framesMeasured = { intro: [], turn: [], renderers: [] };
        let previous = 0,
          stage = "";
        const tick = (now) => {
          const p = document.querySelector("#paper-scene");
          const next =
            p?.dataset.motion === "opening"
              ? "intro"
              : p?.dataset.motion === "forward"
                ? "turn"
                : "";
          if (next && next === stage && previous)
            window.framesMeasured[next].push(now - previous);
          if (
            next === "intro" &&
            p.dataset.renderer &&
            !window.framesMeasured.renderers.includes(p.dataset.renderer)
          )
            window.framesMeasured.renderers.push(p.dataset.renderer);
          stage = next;
          previous = now;
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.goto(origin);
      await page.waitForFunction(() => {
        const scene = document.querySelector("#paper-scene");
        return scene && !scene.dataset.motion;
      });
      await page
        .getByRole("navigation", { name: "Main navigation", exact: true })
        .getByRole("link", { name: "All Projects", exact: true })
        .click();
      await page.waitForTimeout(1200);
      const raw = await page.evaluate(() => window.framesMeasured);
      const summary = {
        device: mobile ? "mobile-4x" : "desktop",
        run,
        renderers: raw.renderers,
      };
      for (const key of ["intro", "turn"]) {
        const a = raw[key].sort((a, b) => a - b);
        summary[key] = {
          samples: a.length,
          p95Ms: a[Math.floor(a.length * 0.95)] ?? null,
          over34ms: a.filter((t) => t > 34).length,
        };
      }
      results.push(summary);
      await context.close();
    }
  await browser.close();
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
})();
