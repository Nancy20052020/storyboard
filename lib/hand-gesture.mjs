/**
 * Convert MediaPipe's unmirrored landmarks into our mirrored drawing space.
 * Pinch distance is relative to palm size, so moving closer to the camera
 * doesn't change the gesture. Separate close/open thresholds prevent flicker.
 * @param {Array<{x:number,y:number}> | undefined} landmarks
 * @param {boolean} wasPinched
 * @param {{x:number,y:number} | null} previous
 * @returns {{point:{x:number,y:number},pinched:boolean} | null}
 */
export function getHandGesture(landmarks, wasPinched, previous = null) {
  if (
    !landmarks ||
    landmarks.length < 21 ||
    ![0, 4, 8, 9].every(
      (i) =>
        Number.isFinite(landmarks[i]?.x) && Number.isFinite(landmarks[i]?.y),
    )
  )
    return null;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const palm = Math.max(distance(landmarks[0], landmarks[9]), 0.01);
  const ratio = distance(landmarks[4], landmarks[8]) / palm;
  const raw = {
    x: Math.max(0, Math.min(1000, (1 - landmarks[8].x) * 1000)),
    y: Math.max(0, Math.min(650, landmarks[8].y * 650)),
  };
  const point = previous
    ? {
        x: previous.x * 0.45 + raw.x * 0.55,
        y: previous.y * 0.45 + raw.y * 0.55,
      }
    : raw;
  return { point, pinched: ratio < (wasPinched ? 0.55 : 0.38) };
}
