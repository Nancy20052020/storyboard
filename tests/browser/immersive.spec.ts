import { test, expect } from "@playwright/test";

test("legacy lanterns and a full collection stay above the composer on desktop and mobile", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("starwoven-moonwell-v1"))
      localStorage.setItem(
        "starwoven-moonwell-v1",
        JSON.stringify(
          Array.from({ length: 100 }, (_, i) => ({
            id: `old-${i}`,
            text: `Memory ${i}`,
            x: 50,
            y: 78,
            date: "2026-11-06T10:00:00.000Z",
          })),
        ),
      );
  });
  await page.goto("/#lake");
  await expect(page.locator(".floating-lantern")).toHaveCount(24);
  async function clearOfComposer() {
    const composer = (await page.locator(".lantern-compose").boundingBox())!;
    const lanterns = await page.locator(".floating-lantern").all();
    for (const lantern of lanterns) {
      const r = (await lantern.boundingBox())!;
      expect(r.y + r.height).toBeLessThan(composer.y);
    }
  }
  await clearOfComposer();
  await page
    .getByRole("button", { name: "Read lantern: Memory 0", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Your floating thought" }),
  ).toContainText("Memory 0");
  await page.keyboard.press("Escape");
  for (let i = 0; i < 4; i++)
    await page
      .getByRole("button", { name: "Next lanterns", exact: true })
      .click();
  await expect(
    page.getByRole("button", { name: "Read lantern: Memory 99", exact: true }),
  ).toBeVisible();
  await clearOfComposer();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".floating-lantern")).toHaveCount(12);
  await clearOfComposer();
  await page
    .getByRole("button", { name: "Read lantern: Memory 0", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Memory 0");
  await page.keyboard.press("Escape");
  for (let i = 0; i < 8; i++)
    await page
      .getByRole("button", { name: "Next lanterns", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Read lantern: Memory 99", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Memory 99");
});

test("older eight-patch gardens migrate and new botanical plantings persist", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("starwoven-everbloom-v1"))
      localStorage.setItem(
        "starwoven-everbloom-v1",
        JSON.stringify({
          name: "My old garden",
          tempo: 95,
          blooms: [
            { kind: "moonbell", note: 2 },
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          ],
        }),
      );
  });
  await page.goto("/#garden");
  await expect(
    page.getByRole("textbox", { name: "Garden name", exact: true }),
  ).toHaveValue("My old garden");
  await expect(
    page.getByRole("button", {
      name: "Bluebell planting 1, note E",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Choose flowers/ }).click();
  await expect(page.locator(".seed-list button")).toHaveCount(9);
  await page.getByRole("button", { name: "Choose Peony", exact: true }).click();
  await page
    .locator(".free-flower-field")
    .click({ position: { x: 700, y: 650 } });
  await expect(
    page.getByRole("button", { name: "Peony planting 2, note D", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close flower details", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("starwoven-everbloom-v1") || "{}")
            .plants?.length,
      ),
    )
    .toBe(2);
  const json = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("starwoven-everbloom-v1") || "{}"),
  );
  expect(json.plants[0]).toMatchObject({ kind: "moonbell", note: 2, y: 72 });
  expect(json.plants[1]).toMatchObject({ kind: "peony" });
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Garden name", exact: true }),
  ).toHaveValue("My old garden");
  await expect(
    page.getByRole("button", { name: "Peony planting 2, note D", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
