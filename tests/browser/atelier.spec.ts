import { test, expect } from "@playwright/test";

test("garden plants at click coordinates, resizes and drags flowers, and keeps instruments clear of navigation", async ({
  page,
}) => {
  await page.goto("/#garden");
  const field = page.locator(".free-flower-field");
  await expect(field).toBeVisible();
  await page
    .getByRole("button", { name: "Choose flowers", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose English rose", exact: true })
    .click();
  await field.click({ position: { x: 700, y: 650 } });
  const plant = page.getByRole("button", { name: /English rose planting 5/ });
  await expect(plant).toBeVisible();
  await page
    .getByRole("slider", { name: "Selected flower size", exact: true })
    .fill("1.5");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("starwoven-everbloom-v1")!).plants[4]
            .size,
      ),
    )
    .toBe(1.5);
  await page
    .getByRole("button", { name: "Close flower details", exact: true })
    .click();
  const r = (await plant.boundingBox())!;
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width / 2 - 100, r.y + r.height / 2 + 30, {
    steps: 8,
  });
  await page.mouse.up();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("starwoven-everbloom-v1")!).plants[4]
            .x,
      ),
    )
    .toBeLessThan(60);
  for (const viewport of [
    { width: 1848, height: 1019 },
    { width: 390, height: 844 },
    { width: 740, height: 430 },
  ]) {
    await page.setViewportSize(viewport);
    const tools = (await page.locator(".garden-player").boundingBox())!,
      nav = (await page.locator(".portal-rail").boundingBox())!;
    expect(tools.y + tools.height).toBeLessThan(nav.y - 8);
    expect(tools.y).toBeGreaterThan(0);
  }
});

test("letters keep stationery, draggable keepsakes, and sealed writing in the personal postbox", async ({
  page,
}) => {
  await page.goto("/#letters");
  await page
    .getByRole("textbox", { name: "Letter recipient", exact: true })
    .fill("Tomorrow’s Nancy");
  await page
    .getByRole("textbox", { name: "Write your letter", exact: true })
    .fill("A little kindness for a quieter tomorrow.");
  await page
    .getByRole("combobox", { name: "Letter paper", exact: true })
    .selectOption("rose");
  await page.getByRole("button", { name: "Keepsakes", exact: true }).click();
  await page.getByRole("button", { name: "Add Wax seal", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Move seal keepsake" }),
  ).toBeVisible();
  await page
    .getByRole("slider", { name: "Keepsake size", exact: true })
    .fill("1.3");
  await page.getByRole("button", { name: "Fold & post", exact: true }).click();
  await expect(page.locator(".sealed-letter-overlay")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /Your postbox/ }).click();
  await page
    .getByRole("complementary", { name: "Your personal postbox" })
    .getByRole("button", { name: /^To Tomorrow’s Nancy/ })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Write your letter", exact: true }),
  ).toHaveValue("A little kindness for a quieter tomorrow.");
  await expect(page.locator(".letter-paper")).toHaveClass(/paper-rose/);
  await expect(
    page.getByRole("button", { name: "Move seal keepsake" }),
  ).toBeVisible();
});

test("ethereal photo booth captures three local moments and releases the camera after attaching", async ({
  page,
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const c = document.createElement("canvas");
      c.width = 600;
      c.height = 450;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#bbaacc";
      ctx.fillRect(0, 0, 600, 450);
      const stream = c.captureStream(10);
      (window as any).boothTracks = stream.getTracks();
      return stream;
    };
  });
  await page.goto("/#letters");
  await page.getByRole("button", { name: "Photo booth", exact: true }).click();
  await page.getByRole("button", { name: "Aurora mist", exact: true }).click();
  await page.getByRole("button", { name: "Open camera", exact: true }).click();
  for (let i = 1; i <= 3; i++)
    await page
      .getByRole("button", { name: `Capture moment ${i} / 3`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Attach to my letter", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Ethereal photo booth" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("img", {
      name: "Your ethereal photo keepsake",
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as any).boothTracks.every(
        (t: MediaStreamTrack) => t.readyState === "ended",
      ),
    ),
  ).toBe(true);
});

test("personal songs remain available between islands and after reload", async ({
  page,
}) => {
  const buffer = Buffer.alloc(44 + 16000);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(16000, 40);
  await page.goto("/");
  await page
    .getByRole("button", { name: "Open personal music shelf", exact: true })
    .click();
  await page
    .getByLabel("Choose personal songs", { exact: true })
    .setInputFiles({
      name: "Moonlit piano.wav",
      mimeType: "audio/wav",
      buffer,
    });
  await expect(page.locator(".record-list")).toContainText("Moonlit piano");
  await page
    .getByRole("button", { name: "Play personal song", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause personal song", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close music shelf", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Preview Postscript", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Visit Postscript", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open personal music shelf", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Pause personal song", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Open personal music shelf", exact: true })
    .click();
  await expect(page.locator(".record-list")).toContainText("Moonlit piano");
});

test("a chosen study seat keeps notes, weather and a wall-clock candle timer", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/#study");
  await page
    .getByRole("button", { name: "Choose The rain window", exact: true })
    .click();
  await expect(page.locator(".stillroom-scene")).toHaveClass(
    /seat-cafe-window/,
  );
  await page.getByRole("button", { name: "Sunlit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Study intention", exact: true })
    .fill("Read a chapter and sketch an idea");
  await page.getByRole("button", { name: "Desk notes", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Study desk notes", exact: true })
    .fill("Remember to keep the interface gentle.");
  await page
    .getByRole("button", { name: "Close desk notes", exact: true })
    .click();
  await page
    .getByRole("spinbutton", {
      name: "Candle duration in minutes",
      exact: true,
    })
    .fill("1");
  await page
    .getByRole("button", { name: "Light a candle", exact: true })
    .click();
  await page.clock.fastForward(10000);
  await page.getByRole("button", { name: "Pause candle", exact: true }).click();
  await expect(
    page.getByRole("status", { name: "Candle timer remaining" }),
  ).toHaveText("00:50");
  await page
    .getByRole("button", { name: "Relight candle", exact: true })
    .click();
  await page.clock.fastForward(51000);
  await expect(
    page.getByRole("button", { name: "Light another candle", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".stillroom-scene")).toHaveClass(/weather-sun/);
  await expect(
    page.getByRole("textbox", { name: "Study intention", exact: true }),
  ).toHaveValue("Read a chapter and sketch an idea");
  await page.getByRole("button", { name: "Desk notes", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Study desk notes", exact: true }),
  ).toHaveValue("Remember to keep the interface gentle.");
});

test("home copy flows without overlap and all six islands fit a phone width", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1848, height: 1019 },
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const intro = (await page.locator(".landing-intro").boundingBox())!,
      story = (await page.locator(".destination-story").boundingBox())!;
    expect(intro.y + intro.height).toBeLessThan(story.y);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  for (const route of ["sky", "forest", "lake", "garden", "letters", "study"]) {
    await page.goto("/#" + route);
    await expect(page.locator(".portal-rail")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("phone candle controls remain clickable beside their decorative glow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#study");
  await page
    .getByRole("button", { name: "Choose The rain window", exact: true })
    .click({ timeout: 3000 });
  const candle = page.getByRole("button", {
    name: "Light a candle",
    exact: true,
  });
  const bounds = (await candle.boundingBox())!,
    rail = (await page.locator(".portal-rail").boundingBox())!,
    tray = (await page.locator(".study-tool-tray").boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThan(rail.y);
  expect(bounds.y + bounds.height).toBeLessThan(tray.y);
  await candle.click();
  await expect(
    page.getByRole("button", { name: "Pause candle", exact: true }),
  ).toBeVisible();
});

test("flower melody mutes ambient drones while its own notes keep playing", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const gains: GainNode[] = [];
    const original = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const node = original.call(this);
      gains.push(node);
      return node;
    };
    (window as any).realmAudioGains = gains;
  });
  await page.goto("/#garden");
  await page
    .getByRole("button", { name: "Enable ambient sound", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mute ambient sound", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).realmAudioGains[0].gain.value),
    )
    .toBeGreaterThan(0.1);
  await page
    .getByRole("button", { name: "Garden melody", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enable ambient sound", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).realmAudioGains[0].gain.value),
    )
    .toBeLessThan(0.001);
  const count = await page.evaluate(
    () => (window as any).realmAudioGains.length,
  );
  await expect
    .poll(() => page.evaluate(() => (window as any).realmAudioGains.length))
    .toBeGreaterThan(count);
  await page.getByRole("button", { name: "Pause melody", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable ambient sound", exact: true }),
  ).toBeVisible();
});
