# Starwoven

A full-window, private world of floating islands. No quests, scores, accounts, API keys, or paid services. Built with Next.js, React, TypeScript, locally bundled fantasy artwork, SVG/CSS, Web Audio, and browser-local MediaPipe hand tracking.

## The islands

- **The in-between** — a spacious landing with one large island preview at a time. Choose among four destinations, use previous/next, enable optional slow drifting, move the pointer for gentle parallax, or switch between midnight and golden-hour tones. The character widget has been removed. The island dock appears inside destinations; direct `/#sky`, `/#forest`, `/#lake`, and `/#garden` links and browser history still work.
- **Starlit Observatory** — a full-background illustrated universe with all twelve zodiac constellations, plus Orion, Cassiopeia, Ursa Major, and Cygnus. Pan, zoom, select constellations, and toggle lines/names. This is an illustrated atlas, not a live local sky chart. **My stars & writing** opens the original journal in the same immersive format, preserving saved stars, writing, connections, and JSON import/export.
- **Whisperwood** — draw directly into a full-screen forest clearing with a mouse, touch, or camera-based hand tracking. Pinch thumb + index to draw; release to move. Color, stroke size, undo, clear, saved sketches, and PNG export remain available. PNG exports include the forest backdrop.
- **Moonwell** — a full-scene lake with separate layout regions for open water and writing. Lanterns never share the composer’s space. Collections page in groups of 24 on desktop or 12 on mobile, so all 100 supported thoughts remain reachable without piling underneath the form. Old saved lantern positions are preserved in storage and displayed in the safe layout. Write, reread, remove, export, or pause for a breathing exercise.
- **Everbloom** — a full-background Victorian conservatory with 24 planting locations and nine realistic botanical species: bluebell, stargazer lily, golden dahlia, English rose, peony, lavender, iris, foxglove, and tulip. Open **Plant flowers**, choose a specimen, and select an open patch. Tune flowers, adjust tempo, play/pause the composition, and switch moonlight/first light. Gardens save, export, and import JSON. Older eight-patch gardens migrate automatically without losing their original flowers or notes.

## Visual direction

The redesign uses spacious, scene-first navigation, interaction at the edges, layered atmosphere, and progressive reveal. Bruno Simon’s [public portfolio source](https://github.com/brunosimon/folio-2019), including its world/reveal/control structure, was reviewed as an interaction reference. Live access to bruno-simon.com, neal.fun, and littleworkshop.fr was blocked by the setup environment’s network policy; no live-site inspection is claimed. Botanical specimens and landscape artwork are bundled locally, with reduced-motion fallbacks for animation.

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

If the live site still shows an older version, check the deployment’s **Source** commit against the latest commit on `main`. Confirm the Vercel project connects to `Nancy20052020/storyboard`, production branch `main`, and that the latest successful deployment is assigned to the production domain. The current homepage shows one large island preview at a time, with four destination selectors and no bunny.

Camera access requires HTTPS (provided by Vercel) or localhost, a camera, and a browser supporting WebAssembly and WebGL. Enable hand drawing from the grove, allow camera permission, keep your hand in good light, and pinch thumb + index finger. If camera permission is declined or tracking isn't supported, mouse and touch drawing remain available. The camera stops when you turn it off, leave the grove, or hide the tab. Camera frames are processed locally; they are never uploaded or recorded.

The optional immersive fullscreen button depends on browser support. On mobile, pages fill the screen width and scroll to keep all controls accessible. Reduced-motion settings are respected.

## Validation

```sh
npm test
npm run typecheck
npm run test:e2e
```

`npm test` runs five unit tests for pinch recognition, palm-relative thresholds, hysteresis, coordinate mapping, invalid input, and smoothing. Ten browser tests exercise island previews, the full-screen atlas, botanical garden planting/tuning/playback/export/import and migration, existing-sky preservation, drawing/PNG export/persistence/undo, lanterns, breathing controls, camera denial, and a deterministic pinch-to-stroke/camera-cleanup pipeline. A regression test seeds 100 legacy lanterns at formerly overlapping coordinates and checks that the visible lanterns stay above the composer and that all thoughts remain reachable on desktop and mobile. The browser suite builds and starts its own production server on port 3100.

For the browser suite, first install Chromium with `npx playwright install chromium`, or point to an existing installation:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Actual MediaPipe model/WASM initialization was also checked in Chromium with a simulated camera feed, including local-only asset requests and stream shutdown when leaving the grove. Physical-camera gesture accuracy depends on lighting and device performance and should be checked on your own device.

## Your writing and drawings

Everything saves in this browser's localStorage, separately for each device/browser. Nothing syncs to a server. Clearing browser data removes saved writing and drawings. Storage restrictions or quota limits can prevent persistence; each scene reports a warning. Export valuable skies, drawings, and lantern writing regularly. Sky and musical garden JSON files support import. PNG drawings and lantern JSON exports are keepsakes/backups for viewing outside the app.

Sound is synthesized in the browser and starts only after you enable it. The page optionally loads Google Fonts and uses system fallbacks if unavailable. See `THIRD_PARTY_NOTICES.md` for MediaPipe licensing.
