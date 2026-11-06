import { test } from "node:test";
import assert from "node:assert/strict";
import { getHandGesture } from "../lib/hand-gesture.mjs";
function hand(gap = 0.02, scale = 1) {
  const p = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
  p[0] = { x: 0.5, y: 0.8 };
  p[9] = { x: 0.5, y: 0.8 - 0.3 * scale };
  p[8] = { x: 0.3, y: 0.3 };
  p[4] = { x: 0.3 + gap * scale, y: 0.3 };
  return p;
}
test("no missing or invalid landmarks draw a stroke", () => {
  assert.equal(getHandGesture(undefined, false), null);
  assert.equal(getHandGesture([], false), null);
  const h = hand();
  h[8].x = NaN;
  assert.equal(getHandGesture(h, false), null);
});
test("pinch closes and releases relative to palm size", () => {
  assert.equal(getHandGesture(hand(0.05), false).pinched, true);
  assert.equal(getHandGesture(hand(0.2), true).pinched, false);
  assert.equal(getHandGesture(hand(0.05, 0.5), false).pinched, true);
  assert.equal(getHandGesture(hand(0.2, 0.5), true).pinched, false);
});
test("hysteresis keeps an existing pinch steady without starting a new one", () => {
  assert.equal(getHandGesture(hand(0.14), false).pinched, false);
  assert.equal(getHandGesture(hand(0.14), true).pinched, true);
});
test("mirrors camera coordinates and clamps the canvas bounds", () => {
  assert.deepEqual(getHandGesture(hand(), false).point, { x: 700, y: 195 });
  const h = hand();
  h[8] = { x: -0.1, y: 1.1 };
  assert.deepEqual(getHandGesture(h, false).point, { x: 1000, y: 650 });
});
test("smooths hand jitter without changing the pinch decision", () => {
  const g = getHandGesture(hand(), false, { x: 600, y: 200 });
  assert.equal(g.point.x, 655);
  assert.equal(g.point.y, 197.25);
  assert.equal(g.pinched, true);
});
