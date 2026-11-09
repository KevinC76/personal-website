import { test, expect } from "@playwright/test";
import fs from "node:fs";

test("direct private Server Actions reject anonymous calls", async ({
  request,
}) => {
  test.skip(
    Boolean(process.env.TEST_BASE_URL),
    "Action IDs belong to the local build.",
  );
  const manifest = JSON.parse(
    fs.readFileSync(".next/server/server-reference-manifest.json", "utf8"),
  );
  const args: Record<string, unknown[]> = {
    saveDraft: [{}, 1],
    publishDraft: [1],
    finishUpload: ["00000000-0000-4000-8000-000000000009", "Private image"],
    deleteMedia: ["00000000-0000-4000-8000-000000000009"],
  };
  for (const [name, input] of Object.entries(args)) {
    const action = Object.entries(manifest.node).find(
      ([, value]) => (value as { exportedName: string }).exportedName === name,
    );
    expect(action, name).toBeDefined();
    const response = await request.post("/admin", {
      headers: {
        "Next-Action": action![0],
        "Content-Type": "text/plain;charset=UTF-8",
        Origin: "http://localhost:3000",
      },
      data: JSON.stringify(input),
    });
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.text()).toContain('"ok":false');
  }
});
