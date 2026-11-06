import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("four illustrated islands and Pip’s interactions work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Visit Everbloom", exact: true }),
  ).toBeVisible();
  expect(await page.locator(".island-sprite").count()).toBe(4);
  const art = await page.request.get("/art/mystical-islands.webp");
  expect(art.ok()).toBe(true);
  expect(art.headers()["content-type"]).toContain("image/webp");
  await page
    .getByRole("button", { name: "Talk to Pip the moon bunny" })
    .click();
  await expect(
    page.getByRole("region", { name: "Pip’s little corner" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Head pat", exact: true }).click();
  await expect(
    page.getByText("Oh! A little head pat. I’m keeping that feeling forever."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Give a treat", exact: true }).click();
  await expect(page.getByText(/A moon carrot/)).toBeVisible();
  await page
    .getByRole("button", { name: "Close Pip’s corner", exact: true })
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
  await page
    .getByRole("button", {
      name: "Star lily A soft, rose-colored song",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Plant in patch 2", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Bloom 2: starlily, note D",
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
    .getByRole("button", { name: "Play your garden", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Mute ambient sound", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pause your garden", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pause your garden", exact: true })
    .click();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export musical garden", exact: true })
    .click();
  const downloaded = await dl;
  const value = JSON.parse(await readFile((await downloaded.path())!, "utf8"));
  expect(value.name).toBe("My moonlit melody");
  expect(value.blooms[1]).toEqual({ kind: "starlily", note: 5 });
  expect(value.tempo).toBe(100);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Garden name", exact: true }),
  ).toHaveValue("My moonlit melody");
  await page
    .getByRole("button", { name: "Bloom 2: starlily, note C↑", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove selected flower", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Plant in patch 2", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
