import { test } from "node:test";
import assert from "node:assert/strict";
import {
  wrapDegrees,
  siderealDegrees,
  projectStar,
  precessJ2000,
  horizontalPosition,
  galacticToEquatorial,
} from "../lib/astronomy.mjs";
const epoch = new Date("2000-01-01T12:00:00Z");
test("sidereal reference at J2000 matches Greenwich angle", () => {
  assert.ok(Math.abs(siderealDegrees(epoch, 0) - 280.46061837) < 1e-6);
  assert.equal(wrapDegrees(-10), 350);
});
test("precession preserves the J2000 epoch and remains finite near the pole", () => {
  const p = precessJ2000(101.2872, -16.7161, epoch);
  assert.ok(Math.abs(p.ra - 101.2872) < 1e-8);
  assert.ok(Math.abs(p.dec + 16.7161) < 1e-8);
  assert.ok(
    Number.isFinite(precessJ2000(37.95, 89.26, new Date("2030-01-01")).ra),
  );
});
test("a centered star projects at the center and the opposite star is hidden", () => {
  const p = projectStar(101, -16, 101, -16);
  assert.ok(Math.abs(p.x) < 1e-10 && Math.abs(p.y) < 1e-10 && p.z > 0.999);
  assert.ok(projectStar(281, 16, 101, -16).z < -0.999);
});
test("zenith and north-pole altitude match observer geometry", () => {
  const lst = siderealDegrees(epoch, 0);
  assert.ok(
    Math.abs(horizontalPosition(lst, 28, 28, 0, epoch).altitude - 90) < 1e-6,
  );
  assert.ok(
    Math.abs(horizontalPosition(0, 90, 28, 0, epoch).altitude - 28) < 1e-6,
  );
});
test("galactic center projects near Sagittarius at RA 266.4 and declination -28.9", () => {
  const g = galacticToEquatorial(0);
  assert.ok(Math.abs(g.ra - 266.405) < 0.01);
  assert.ok(Math.abs(g.dec + 28.936) < 0.01);
});

test("bundled measured catalog keeps valid unique Hipparcos IDs and all 88 constellations", async () => {
  const { readFile } = await import("node:fs/promises");
  const data = JSON.parse(
    await readFile(
      new URL("../data/sky-catalog.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(data.stars.length, 5044);
  assert.equal(new Set(data.stars.map((s) => s[0])).size, 5044);
  assert.equal(data.constellations.length, 88);
  assert.equal(new Set(data.constellations.map((c) => c.id)).size, 88);
  assert.ok(
    data.stars.every(
      (s) =>
        s[1] >= 0 &&
        s[1] < 360 &&
        s[2] >= -90 &&
        s[2] <= 90 &&
        Number.isFinite(s[3]),
    ),
  );
  const antares = data.stars.find((s) => s[0] === 80763);
  assert.equal(antares[5], "Antares");
  assert.ok(Math.abs(antares[1] - 247.3519) < 1e-4);
  assert.equal(data.constellations.find((c) => c.id === "Ser").lines.length, 2);
});
