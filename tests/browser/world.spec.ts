import { test, expect } from "@playwright/test";

test("islands are keyboard accessible and the original sky survives navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      "starwoven-sky-v1",
      JSON.stringify({
        name: "A sky from before the islands",
        stars: [
          {
            id: "old",
            x: 50,
            y: 40,
            title: "An old memory",
            note: "Keep this safe.",
            color: "#e9d1a2",
          },
        ],
        edges: [],
      }),
    ),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Preview Starlit Observatory", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("button", { name: "Visit Starlit Observatory", exact: true })
    .click();
  await page
    .getByRole("button", { name: "My stars & writing", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Name your sky" }),
  ).toHaveValue("A sky from before the islands");
  await page
    .getByRole("button", { name: "Open star: An old memory", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Write your thought" }),
  ).toHaveValue("Keep this safe.");
  await page
    .getByRole("textbox", { name: "Write your thought" })
    .fill("Still mine.");
  await page.getByRole("button", { name: "Moonwell", exact: true }).click();
  await page
    .getByRole("button", { name: "Starlit Observatory", exact: true })
    .click();
  await page
    .getByRole("button", { name: "My stars & writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open star: An old memory", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Write your thought" }),
  ).toHaveValue("Still mine.");
  await expect(page.locator("video")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("draws, exports a PNG, flushes on leaving, and undoes a saved stroke", async ({
  page,
}) => {
  await page.goto("/#forest");
  const board = page.locator(".drawing-board");
  await expect(board).toBeVisible();
  const box = (await board.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await page.mouse.down();
  for (let i = 1; i <= 15; i++)
    await page.mouse.move(
      box.x + box.width * (0.2 + i * 0.025),
      box.y + box.height * (0.3 + Math.sin(i) * 0.1),
    );
  await page.mouse.up();
  await expect(board.locator("polyline")).toHaveCount(1);
  // Navigate immediately, before the storage debounce; the final stroke must survive.
  await page.getByRole("button", { name: "Moonwell", exact: true }).click();
  await page.getByRole("button", { name: "Whisperwood", exact: true }).click();
  await expect(board.locator("polyline")).toHaveCount(1);
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Keep this moment", exact: true })
    .click();
  expect((await downloaded).suggestedFilename()).toBe(
    "whisperwood-drawing.png",
  );
  await page.getByRole("button", { name: "Undo last stroke" }).click();
  await expect(board.locator("polyline")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("lantern writing, breathing, export and removal work", async ({
  page,
}) => {
  // Exercise the far edge of the placement range: lanterns must stay clear of the composer.
  await page.addInitScript(() => {
    Math.random = () => 0.999;
  });
  await page.goto("/#lake");
  await page
    .getByRole("textbox", {
      name: "A wish, a worry, or something worth remembering.",
    })
    .fill("A tiny wish for tomorrow.");
  await page
    .getByRole("button", { name: "Set your thought afloat", exact: true })
    .click();
  await expect(page.locator(".floating-lantern")).toHaveCount(1);
  await page.reload();
  await page.locator(".floating-lantern").click();
  await expect(
    page.getByRole("dialog", { name: "Your floating thought" }),
  ).toContainText("A tiny wish for tomorrow.");
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Start breathing exercise", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause breathing exercise", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pause breathing exercise", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export 1 lantern", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe(
    "my-moonwell-lanterns.json",
  );
  await page.locator(".floating-lantern").click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Let it go", exact: true }).click();
  await expect(page.locator(".floating-lantern")).toHaveCount(0);
});

test("camera denial gives a useful fallback without breaking drawing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        throw new DOMException("Permission denied", "NotAllowedError");
      },
    });
  });
  await page.goto("/#forest");
  await page
    .getByRole("button", { name: "Enable hand drawing", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Camera permission was declined",
  );
  await expect(
    page.getByRole("button", { name: "Enable hand drawing", exact: true }),
  ).toBeEnabled();
  const board = page.locator(".drawing-board");
  const box = (await board.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.6);
  await expect(board.locator("circle[filter]")).toHaveCount(1);
});

test("pinch landmarks draw a stroke and camera tracks stop on exit", async ({
  page,
}) => {
  // A deterministic fake camera/landmark source tests the UI gesture pipeline.
  // Real model/wasm initialization is validated separately with a simulated camera.
  await page.addInitScript(() => {
    const target = window as unknown as { testStream: MediaStream };
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      value: async () => {
        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 480;
        canvas.getContext("2d")!.fillRect(0, 0, 640, 480);
        target.testStream = canvas.captureStream(10);
        return target.testStream;
      },
    });
  });
  await page.route("**/hand-tracking/hands.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.Hands=class {setOptions(){} onResults(cb){window.emitHand=cb;} async initialize(){} async send(){} async close(){window.trackerClosed=true;}};`,
    }),
  );
  await page.goto("/#forest");
  await page
    .getByRole("button", { name: "Enable hand drawing", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Turn camera off", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    const target = window as unknown as { emitHand: (r: unknown) => void };
    const h = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    h[0] = { x: 0.5, y: 0.8, z: 0 };
    h[9] = { x: 0.5, y: 0.5, z: 0 };
    h[8] = { x: 0.3, y: 0.3, z: 0 };
    h[4] = { x: 0.31, y: 0.3, z: 0 };
    target.emitHand({ multiHandLandmarks: [h] });
    h[8] = { x: 0.4, y: 0.35, z: 0 };
    h[4] = { x: 0.41, y: 0.35, z: 0 };
    target.emitHand({ multiHandLandmarks: [h] });
    h[4] = { x: 0.7, y: 0.35, z: 0 };
    target.emitHand({ multiHandLandmarks: [h] });
  });
  await expect(page.locator(".drawing-board polyline")).toHaveCount(1);
  await page.getByRole("button", { name: "Island map", exact: true }).click();
  expect(
    await page.evaluate(() =>
      (window as unknown as { testStream: MediaStream }).testStream
        .getTracks()
        .every((t) => t.readyState === "ended"),
    ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => (window as unknown as { trackerClosed: boolean }).trackerClosed,
    ),
  ).toBe(true);
});
