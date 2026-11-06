# Starwoven

A full-window, private world of floating islands. No quests, scores, accounts, API keys, or paid services. Built with Next.js, React, TypeScript, locally bundled fantasy artwork, SVG/CSS, Web Audio, and browser-local MediaPipe hand tracking.

## The islands

- **Home** — “Hi Nancy, welcome to your calm spot.” A carousel with a large central island and two soft neighboring previews. Switch with arrows, previews, horizontal wheel/trackpad gestures, or a swipe across the island. Optional drifting, parallax, and dusk lighting remain available.
- **Starlit Observatory** — one real sky and one writing system. The bundled catalog contains 5,044 measured Hipparcos/XHIP stars and all 88 constellation patterns. Search by proper name or Hipparcos number, click a star, write beside it, and connect two actual stars. A location/time panel changes the geometric sky reference; **Your sky now** returns to the current overhead sky. Default location is explicitly New Delhi until you choose another city or opt into location access. The selected location is stored on this device. There is no separate atlas/journal view or invented-star placement.
- **Whisperwood** — draw directly into a full-screen forest clearing with a mouse, touch, or local camera-based hand tracking. Pinch thumb + index to draw; release to move. Colors, brush sizes, undo, clear, and saved sketches remain available.
- **Moonwell** — writing and open water occupy separate layout regions. New lanterns travel toward the water. **Let it go** makes a saved lantern drift away before removing it; **Bring it back** recalls it during the departure. Reduced-motion users get a short, quieter transition. Collections page in groups of 24 on desktop or 12 on mobile, preserving access to all 100 supported thoughts without covering the composer.
- **Everbloom** — a full-background conservatory with 24 planting locations, nine realistic flower species, musical notes, tempo/playback, and moonlight/first-light lighting. Earlier eight-patch gardens migrate automatically.

**Aster**, a small celestial dragon spirit, welcomes Nancy to each island. Drag Aster with a mouse or touch, or focus the companion and use arrow keys to move. Click to chat, say hello, or start an optional stroll. Home resets the focused companion’s position. Drag positions persist on this device, adapt to viewport changes, and stay clear of the header and bottom navigation. Welcome messages close as you begin interacting. The navigation is styled as an engraved portal rail with orbiting accents.

All export, download, and import controls have been removed at the user's request. Content stays in browser storage.

## The real sky

Catalog data is bundled in `data/sky-catalog.json`, derived from d3-celestial's XHIP compilation and constellation data. Mean J2000 coordinates are precessed to the chosen date, projected onto a rotatable celestial hemisphere, and used for hit-testing. The Milky Way band follows the galactic equator. Sidereal time and observer latitude/longitude determine the overhead reference and above/below-horizon facts. Proper motion, atmospheric refraction, weather, daylight brightness, and solar-system bodies are not modeled. This is a real-coordinate star explorer, not a telescope photograph or precision observing tool.

Earlier invented-star journal entries remain under **Your saved thoughts → Earlier thoughts, kept safe**. Choose one and then a real star to attach it to; the earlier copy stays safe. Existing writing on a destination star is replaced only after confirmation. New notes and connections use stable Hipparcos IDs and save in `starwoven-real-sky-v1`; the old `starwoven-sky-v1` data remains intact.

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

If the live site still shows an older version, check the deployment’s **Source** commit against the latest commit on `main`. Confirm the Vercel project connects to `Nancy20052020/storyboard`, production branch `main`, and that the latest successful deployment is assigned to the production domain. The current homepage greets Nancy, shows the island carousel, and includes Aster, the draggable celestial companion.

Camera access requires HTTPS (provided by Vercel) or localhost, a camera, and a browser supporting WebAssembly and WebGL. Enable hand drawing from the grove, allow camera permission, keep your hand in good light, and pinch thumb + index finger. If camera permission is declined or tracking isn't supported, mouse and touch drawing remain available. The camera stops when you turn it off, leave the grove, or hide the tab. Camera frames are processed locally; they are never uploaded or recorded.

The optional immersive fullscreen button depends on browser support. On mobile, pages fill the screen width and scroll to keep all controls accessible. Reduced-motion settings are respected.

## Validation

```sh
npm test
npm run typecheck
npm run test:e2e
```

`npm test` checks astronomy reference values, catalog integrity, projection/precession/horizon geometry, and hand gesture recognition. Browser tests exercise real-star selection and writing, legacy thought attachment, current-sky settings, star connections, Nancy’s carousel, Aster’s dragging/welcomes, botanical garden persistence, lantern layout/release, and hand drawing/camera cleanup. The browser suite builds and starts a production server on port 3100. Desktop and phone workflows are included.

For the browser suite, first install Chromium with `npx playwright install chromium`, or point to an existing installation:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Actual MediaPipe model/WASM initialization was also checked in Chromium with a simulated camera feed, including local-only asset requests and stream shutdown when leaving the grove. Physical-camera gesture accuracy depends on lighting and device performance and should be checked on your own device.

## Your writing and drawings

Everything saves in this browser's localStorage, separately for each device/browser. Nothing syncs to a server. Clearing browser data removes saved writing and drawings. Storage restrictions or quota limits can prevent persistence; each scene reports a warning. There are no export/import controls. Keep anything irreplaceable separately; clearing browser storage removes saved content.

Sound is synthesized in the browser and starts only after you enable it. The page optionally loads Google Fonts and uses system fallbacks if unavailable. See `THIRD_PARTY_NOTICES.md` for MediaPipe licensing.
