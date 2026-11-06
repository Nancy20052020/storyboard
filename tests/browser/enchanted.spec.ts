import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("home previews one large island at a time and removes the bunny", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Visit Whisperwood", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".island-sprite")).toHaveCount(1);
  await expect(page.locator(".pip-companion")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Preview Everbloom", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Visit Everbloom", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Previous island preview", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Visit Moonwell", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Next island preview", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Visit Everbloom", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Everbloom musical garden" }),
  ).toBeVisible();
});

test("universe has all zodiac constellations, selectable shapes, and zoom controls", async ({
  page,
}) => {
  await page.goto("/#sky");
  await expect(
    page.getByRole("region", { name: "Constellation universe" }),
  ).toBeVisible();
  await expect(page.locator(".atlas-constellation")).toHaveCount(16);
  expect(
    await page
      .locator(".universe-map")
      .evaluate((el) => el.getBoundingClientRect().height >= innerHeight),
  ).toBe(true);
  await expect(page.locator(".constellation-detail")).toContainText("Antares");
  await page
    .locator(".constellation-list button")
    .filter({ hasText: "Scorpius" })
    .click();
  await expect(page.locator(".constellation-detail")).toContainText(
    "ALSO CALLED SCORPIO",
  );
  expect(await page.locator(".universe-map").getAttribute("viewBox")).not.toBe(
    "0 -5 2000 1250",
  );
  await page
    .getByRole("button", { name: "Show the whole sky", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Explore Orion", exact: true })
    .click();
  await expect(page.locator(".constellation-detail h3")).toHaveText("Orion");
  const before = await page.locator(".universe-map").getAttribute("viewBox");
  await page
    .getByRole("button", { name: "Zoom into the universe", exact: true })
    .click();
  expect(await page.locator(".universe-map").getAttribute("viewBox")).not.toBe(
    before,
  );
  await page.getByRole("button", { name: "Lines", exact: true }).click();
  await expect(page.locator(".atlas-constellation polyline")).toHaveCount(0);
  await page.getByRole("button", { name: "Lines", exact: true }).click();
  expect(
    await page.locator(".atlas-constellation polyline").count(),
  ).toBeGreaterThan(16);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("combobox", { name: "Choose a constellation", exact: true })
    .selectOption("taurus");
  await expect(page.locator(".constellation-detail h3")).toHaveText("Taurus");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("musical garden plants, tunes, plays, exports and restores", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#garden");
  await page.getByRole("button", { name: /Plant flowers/ }).click();
  await page
    .getByRole("button", {
      name: "Choose Stargazer lily",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Plant in patch 1", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Bloom 1: starlily, note C",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Bloom note", exact: true })
    .selectOption("5");
  await page
    .getByRole("textbox", { name: "Garden name", exact: true })
    .fill("My moonlit melody");
  await page
    .getByRole("slider", { name: "Melody tempo", exact: true })
    .fill("100");
  await page
    .getByRole("button", { name: "Listen to your garden", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mute ambient sound", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pause melody", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause melody", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export musical garden", exact: true })
    .click();
  const downloaded = await dl;
  const value = JSON.parse(await readFile((await downloaded.path())!, "utf8"));
  expect(value.name).toBe("My moonlit melody");
  expect(value.blooms[0]).toEqual({ kind: "starlily", note: 5 });
  expect(value.tempo).toBe(100);
  expect(value.blooms).toHaveLength(24);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Garden name", exact: true }),
  ).toHaveValue("My moonlit melody");
  await page
    .getByRole("button", { name: "Bloom 1: starlily, note C↑", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove selected flower", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Plant in patch 1", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
