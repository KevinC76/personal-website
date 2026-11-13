import { chromium, devices } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

// Run against an already-running production build, with no concurrent tests.
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const output = process.argv[2] ?? "artifacts/magic-paper/measurement.json";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
});
const results = [];
for (const mobile of [false, true]) {
  for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext(
      mobile ? devices["Pixel 7"] : { viewport: { width: 1440, height: 1000 } },
    );
    await context.addInitScript(() => {
      window.measure = { lcp: 0, cls: 0, longTasks: 0 };
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => (window.measure.lcp = e.startTime)),
      ).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => {
          if (!e.hadRecentInput) window.measure.cls += e.value;
        }),
      ).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) =>
        l
          .getEntries()
          .forEach(
            (e) => (window.measure.longTasks += Math.max(0, e.duration - 50)),
          ),
      ).observe({ type: "longtask", buffered: true });
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: mobile ? 4 : 1 });
    for (const visit of ["first", "return"]) {
      if (visit === "first") await page.goto(origin);
      else await page.reload();
      await page.waitForTimeout(4600);
      const before = await cdp.send("Performance.getMetrics");
      await page.waitForTimeout(500);
      const after = await cdp.send("Performance.getMetrics");
      const task = (m) =>
        m.metrics.find((x) => x.name === "TaskDuration").value;
      const values = await page.evaluate(() => ({
        ...window.measure,
        animations: document
          .getAnimations()
          .filter((a) => a.playState === "running").length,
        jsBytes: performance
          .getEntriesByType("resource")
          .filter((e) => e.initiatorType === "script")
          .reduce((a, e) => a + e.encodedBodySize, 0),
      }));
      results.push({
        device: mobile ? "mobile-4x" : "desktop",
        run,
        visit,
        ...values,
        idleTaskMs: (task(after) - task(before)) * 1000,
      });
    }
    await context.close();
  }
}
await browser.close();
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
