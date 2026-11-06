import { test, expect } from "@playwright/test";

test("letter writing styles persist and deletion never resurrects a sealed letter", async ({
  page,
}) => {
  await page.goto("/#letters");
  await expect(page.locator(".scene-postbox")).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Enter the garden photo booth",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Letter recipient", { exact: true })
    .fill("The garden keeper");
  await page
    .getByLabel("Write your letter", { exact: true })
    .fill("A letter in a hand of my own.");
  for (const style of ["handwritten", "script", "typewriter", "classic"]) {
    await page
      .getByLabel("Letter writing style", { exact: true })
      .selectOption(style);
    await expect(page.locator(".letter-paper")).toHaveClass(
      new RegExp("writing-" + style),
    );
  }
  await page
    .getByLabel("Letter writing style", { exact: true })
    .selectOption("script");
  await page.getByRole("button", { name: "Fold & post", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /Your postbox/ }).click();
  const box = page.getByRole("complementary", {
    name: "Your personal postbox",
  });
  await box.getByRole("button", { name: /To The garden keeper/ }).click();
  await expect(
    page.getByLabel("Letter writing style", { exact: true }),
  ).toHaveValue("script");
  await page
    .getByRole("button", { name: "Delete current letter", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Keep my letter", exact: true })
    .click();
  await expect(
    page.getByLabel("Write your letter", { exact: true }),
  ).toHaveValue("A letter in a hand of my own.");
  await page.getByRole("button", { name: /Your postbox/ }).click();
  await box
    .getByRole("button", {
      name: "Delete letter to The garden keeper",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Delete letter permanently", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: /Your postbox/ }).click();
  await expect(box).not.toContainText("The garden keeper");
  await page
    .getByRole("button", { name: "Close postbox", exact: true })
    .click();
  await page
    .getByLabel("Letter recipient", { exact: true })
    .fill("Unkept draft");
  await page
    .getByLabel("Write your letter", { exact: true })
    .fill("A draft deleted before its debounce finishes.");
  await page
    .getByRole("button", { name: "Delete current letter", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete letter permanently", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: /Your postbox/ }).click();
  await expect(box).not.toContainText("Unkept draft");
});

test("photo templates and movable stickers are composed into the actual attached image", async ({
  page,
}) => {
  await page.goto("/#letters");
  await page
    .getByRole("button", { name: "Enter the garden photo booth", exact: true })
    .click();
  expect(
    await page
      .locator(".photo-booth-backdrop")
      .evaluate((el) => el.parentElement === document.body),
  ).toBe(true);
  const photoData = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 150;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#bbadaa";
    ctx.fillRect(0, 0, 200, 150);
    return c.toDataURL("image/png").split(",")[1];
  });
  const buffer = Buffer.from(photoData, "base64");
  await page
    .getByLabel("Choose photos for your letter", { exact: true })
    .setInputFiles({ name: "little-light.png", mimeType: "image/png", buffer });
  await expect(
    page.getByRole("button", { name: "Remove photo 1", exact: true }),
  ).toBeVisible();
  for (const name of [
    "Instant memories",
    "Herbarium",
    "Celestial postcard",
    "Moonlit strip",
  ]) {
    await page.getByRole("button", { name: new RegExp(name) }).click();
    await expect(page.locator(".keepsake-composition")).toBeVisible();
  }
  await page.getByRole("button", { name: /Herbarium/ }).click();
  await page
    .getByLabel("Photo keepsake caption", { exact: true })
    .fill("A quieter kind of magic");
  await page
    .getByRole("button", { name: "Add Crescent moon sticker", exact: true })
    .click();
  const moon = page.getByRole("button", {
    name: "Move Crescent moon sticker",
    exact: true,
  });
  await moon.focus();
  const before = await moon.getAttribute("transform");
  await page.keyboard.press("ArrowLeft");
  await expect(moon).not.toHaveAttribute("transform", before!);
  await page.getByLabel("Photo sticker size", { exact: true }).fill("14");
  await page
    .getByRole("button", { name: "Attach to my letter", exact: true })
    .click();
  const photo = page.getByRole("img", {
    name: "Your ethereal photo keepsake",
    exact: true,
  });
  await expect(photo).toBeVisible();
  expect(
    await photo.evaluate((img: HTMLImageElement) => ({
      width: img.naturalWidth,
      height: img.naturalHeight,
    })),
  ).toEqual({ width: 1000, height: 1000 });
  await page.reload();
  await expect(photo).toBeVisible();
});

test("the room map supports direct seat selection and a persistent melting-ice desk ritual", async ({
  page,
}) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#study");
  await expect(page.locator(".study-seat-card")).toHaveCount(0);
  await expect(page.locator(".study-room-map")).toBeVisible();
  await expect(page.locator(".study-map-spot")).toHaveCount(4);
  await page
    .getByRole("button", { name: "Library side →", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose Beside the hearth", exact: true })
    .click();
  await expect(page.locator(".stillroom-scene")).toHaveClass(
    /seat-library-hearth/,
  );
  for (const style of ["rose", "moon", "beeswax", "ice"]) {
    await page
      .getByLabel("Desk timer style", { exact: true })
      .selectOption(style);
    await expect(page.locator(".study-candle")).toHaveClass(
      new RegExp("candle-" + style),
    );
  }
  await page
    .getByLabel("Candle duration in minutes", { exact: true })
    .fill("1");
  await page
    .getByRole("button", { name: "Begin melting", exact: true })
    .click();
  const before = await page.locator(".ice-crystal").getAttribute("style");
  await page.clock.fastForward(30000);
  await expect(page.locator(".ice-crystal")).not.toHaveAttribute(
    "style",
    before!,
  );
  await page
    .getByRole("button", { name: "Pause ice timer", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByLabel("Desk timer style", { exact: true }),
  ).toHaveValue("ice");
  await expect(
    page.getByRole("button", { name: "Continue melting", exact: true }),
  ).toBeVisible();
  const surface = (await page.locator(".study-tabletop").boundingBox())!,
    contact = (await page.locator(".ritual-contact-shadow").boundingBox())!;
  expect(contact.y).toBeGreaterThan(surface.y);
  expect(contact.y + contact.height).toBeLessThan(surface.y + surface.height);
});

test("room sound and individual flower notes turn off the main ambience", async ({
  page,
}) => {
  await page.goto("/#study");
  await page
    .getByRole("button", { name: "Choose The rain window", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enable ambient sound", exact: true })
    .click();
  await page.getByRole("button", { name: "Room sound", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable ambient sound", exact: true }),
  ).toBeVisible();
  await page.goto("/#garden");
  await page
    .getByRole("button", { name: "Enable ambient sound", exact: true })
    .click();
  await page.locator(".free-plant").first().click();
  await expect(
    page.getByRole("button", { name: "Enable ambient sound", exact: true }),
  ).toBeVisible();
});
