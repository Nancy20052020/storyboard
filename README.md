# Starwoven

A full-window, private world of floating islands. No quests, scores, accounts, API keys, or paid services. Built with Next.js, React, TypeScript, SVG/CSS illustrations, Web Audio, and browser-local MediaPipe hand tracking.

## The islands

- **The in-between** — an animated island map, a little star companion named Mote, optional ambient sound, and a fullscreen control. The dock takes you between islands; browser back/forward and direct `/#sky`, `/#forest`, and `/#lake` links work too.
- **Starlit Observatory** — the original constellation journal. Place and drag stars, write inside them, change colors, connect/disconnect pairs, and export/import JSON backups. Existing saved skies are preserved using the original storage key.
- **Whisperwood** — a glowing drawing grove. Drag with a mouse or finger, or enable your camera and pinch your thumb and index finger to draw in the air. Release to move without drawing. Choose ink colors and brush sizes, undo, clear, and export a PNG. The sketch restores when you return. Fern, a tiny forest spirit, keeps you company.
- **Moonwell** — write a thought and set it afloat as a lantern. Tap a lantern to reread or remove it; export your lantern writing as JSON. A gentle 4-second inhale, 4-second hold, and 6-second exhale exercise can be started and paused. Lumi, the moonkeeper, floats nearby.

## Develop

Use Node.js 20.9+ (Node 24 was validated).

```sh
npm ci
npm run dev
```

`postinstall` copies the pinned MediaPipe assets into `public/hand-tracking/`. That directory is generated and ignored by Git. No external model/CDN fetch is required at runtime. Keep lifecycle scripts enabled during installation. If assets need refreshing independently, run `npm run postinstall`.

To run a production build:

```sh
npm run build
npm start
```

## Deploy on Vercel

Import this repository into Vercel and use the **Next.js** framework preset, repository root, and default build/output settings. No environment variables or backend services are needed. The standard dependency installation runs `postinstall` and includes the local hand-tracking assets in the deployment. Do not override installation with `--ignore-scripts`.

Camera access requires HTTPS (provided by Vercel) or localhost, a camera, and a browser supporting WebAssembly and WebGL. Enable hand drawing from the grove, allow camera permission, keep your hand in good light, and pinch thumb + index finger. If camera permission is declined or tracking isn't supported, mouse and touch drawing remain available. The camera stops when you turn it off, leave the grove, or hide the tab. Camera frames are processed locally; they are never uploaded or recorded.

The optional immersive fullscreen button depends on browser support. On mobile, pages fill the screen width and scroll to keep all controls accessible. Reduced-motion settings are respected.

## Validation

```sh
npm test
npm run typecheck
npm run test:e2e
```

`npm test` runs five unit tests for pinch recognition, palm-relative thresholds, hysteresis, coordinate mapping, invalid input, and smoothing. Browser tests exercise existing-sky preservation, drawing/export/persistence/undo, lanterns, breathing controls, camera denial, and a deterministic pinch-to-stroke/camera-cleanup pipeline. The browser suite builds and starts its own production server on port 3100.

For the browser suite, first install Chromium with `npx playwright install chromium`, or point to an existing installation:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Actual MediaPipe model/WASM initialization was also checked in Chromium with a simulated camera feed, including local-only asset requests and stream shutdown when leaving the grove. Physical-camera gesture accuracy depends on lighting and device performance and should be checked on your own device.

## Your writing and drawings

Everything saves in this browser's localStorage, separately for each device/browser. Nothing syncs to a server. Clearing browser data removes saved writing and drawings. Storage restrictions or quota limits can prevent persistence; each scene reports a warning. Export valuable skies, drawings, and lantern writing regularly. Only sky JSON files support import; PNG drawings and lantern JSON exports are keepsakes/backups for viewing outside the app.

Sound is synthesized in the browser and starts only after you enable it. The page optionally loads Google Fonts and uses system fallbacks if unavailable. See `THIRD_PARTY_NOTICES.md` for MediaPipe licensing.
