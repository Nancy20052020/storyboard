import { test, expect } from "@playwright/test";

test("Nancy’s carousel rotates and Aster welcomes, drags, and remembers a position", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Hi Nancy/ })).toContainText(
    "your calm spot.",
  );
  await expect(
    page.getByRole("complementary", { name: "Aster welcomes you" }),
  ).toContainText("Hi Nancy");
  await expect(page.locator(".island-sprite")).toHaveCount(3);
  const companion = page.getByRole("button", {
    name: "Aster, your draggable mystical companion",
  });
  const before = (await companion.boundingBox())!;
  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(before.x - 130, before.y + 210, { steps: 8 });
  await page.mouse.up();
  const after = (await companion.boundingBox())!;
  expect(after.x).toBeLessThan(before.x - 70);
  expect(after.y).toBeGreaterThan(before.y + 100);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("starwoven-aster-position-v1") || "{}")
          .y,
    ),
  ).toBeGreaterThan(0.1);
  await page
    .getByRole("button", { name: "Next island preview", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Visit Moonwell", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Preview Everbloom", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Visit Everbloom", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Aster welcomes you" }),
  ).toContainText("Welcome to Everbloom");
  await expect(page.locator(".portal-rail")).toBeVisible();
});

test("a single real sky supports star selection, writing, actual sky settings, and connections", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#sky");
  const sky = page.locator(".real-star-canvas");
  await expect(sky).toBeVisible();
  expect(
    await sky.evaluate(
      (el) => el.getBoundingClientRect().height >= innerHeight,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "My stars & writing", exact: true }),
  ).toHaveCount(0);
  async function find(name: string) {
    await page.getByRole("textbox", { name: "Find a real star" }).fill(name);
    await page
      .locator(".star-results button")
      .filter({ hasText: name })
      .first()
      .click();
  }
  await find("Antares");
  await expect(page.locator(".real-star-editor")).toContainText("HIP 80763");
  await page
    .getByRole("textbox", { name: "Name this thought" })
    .fill("A light to return to");
  await page
    .getByRole("textbox", { name: "Write your thought" })
    .fill("My writing belongs to a real star.");
  await page
    .getByRole("button", { name: "Close star writing", exact: true })
    .click();
  const box = (await sky.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.5);
  await expect(page.locator(".real-star-editor h2")).toHaveText("Antares");
  await expect(
    page.getByRole("textbox", { name: "Write your thought" }),
  ).toHaveValue("My writing belongs to a real star.");
  await page
    .getByRole("button", { name: "Close star writing", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Connect stars", exact: true })
    .click();
  await find("Antares");
  await find("Vega");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("starwoven-real-sky-v1") || "{}")
            .connections?.length,
      ),
    )
    .toBe(1);
  await page
    .getByRole("button", { name: "Connect stars", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Find a constellation", exact: true })
    .selectOption("Sco");
  await page.getByRole("button", { name: "New Delhi", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Sky reference location" })
    .selectOption("Mumbai");
  await page.getByLabel("Sky date and time").fill("2026-11-07T21:00");
  await page
    .getByRole("button", { name: "Close sky settings", exact: true })
    .click();
  await page.reload();
  await find("Antares");
  await expect(
    page.getByRole("textbox", { name: "Write your thought" }),
  ).toHaveValue("My writing belongs to a real star.");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("botanical garden still plants, tunes, plays and restores without export controls", async ({
  page,
}) => {
  await page.goto("/#garden");
  await page.getByRole("button", { name: /Choose flowers/ }).click();
  await page
    .getByRole("button", { name: "Choose Stargazer lily", exact: true })
    .click();
  await page
    .locator(".free-flower-field")
    .click({ position: { x: 700, y: 650 } });
  await page.getByRole("combobox", { name: "Bloom note" }).selectOption("5");
  await page
    .getByRole("textbox", { name: "Garden name" })
    .fill("My moonlit melody");
  await page.getByRole("slider", { name: "Melody tempo" }).fill("100");
  await page
    .getByRole("button", { name: "Garden melody", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mute ambient sound", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause melody", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Garden name" })).toHaveValue(
    "My moonlit melody",
  );
  await expect(
    page.getByRole("button", {
      name: "Stargazer lily planting 5, note C↑",
      exact: true,
    }),
  ).toBeVisible();
  for (const route of ["sky", "forest", "lake", "garden"]) {
    await page.goto("/#" + route);
    await expect(
      page.locator(
        '[aria-label="Your real star sky"], [aria-label="Whisperwood drawing grove"], [aria-label="Moonwell reflection lake"], [aria-label="Everbloom musical garden"]',
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /export|download|keep this moment/i }),
    ).toHaveCount(0);
    await expect(page.locator("a[download],input[type=file]")).toHaveCount(0);
  }
});

test("phone writing attaches earlier thoughts to actual catalog stars in the same sky", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    if (!localStorage.getItem("starwoven-sky-v1"))
      localStorage.setItem(
        "starwoven-sky-v1",
        JSON.stringify({
          name: "Earlier sky",
          stars: [
            {
              id: "phone-memory",
              title: "A memory from before",
              note: "The moon through my window.",
              x: 50,
              y: 50,
              color: "#e9d1a2",
            },
          ],
          edges: [],
        }),
      );
  });
  await page.goto("/#sky");
  await page
    .getByRole("button", { name: "Your saved thoughts", exact: true })
    .click();
  await page.getByRole("button", { name: /A memory from before/ }).click();
  await page
    .getByRole("button", { name: "Choose its real star", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Find a real star" }).fill("Polaris");
  await page
    .locator(".star-results button")
    .filter({ hasText: "Polaris" })
    .first()
    .click();
  await page
    .getByRole("button", {
      name: "Attach this thought to Polaris",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Write your thought" })
    .fill("My phone-sized thought, on a real star.");
  await page
    .getByRole("button", { name: "Close star writing", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("starwoven-real-sky-v1") || "{}")
            .thoughts?.["hip-11767"]?.text,
      ),
    )
    .toBe("My phone-sized thought, on a real star.");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
