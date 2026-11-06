# Starwoven

A full-window, private world of floating islands. No quests, scores, accounts, API keys, or paid services. Built with Next.js, React, TypeScript, locally bundled fantasy artwork, SVG/CSS, Web Audio, and browser-local MediaPipe hand tracking.

## The islands

- **Home** — “Hi Nancy, welcome to your calm spot.” A carousel with a large central island and two soft neighboring previews. Switch with arrows, previews, horizontal wheel/trackpad gestures, or a swipe across the island. Optional drifting, parallax, and dusk lighting remain available.
- **Starlit Observatory** — one real sky and one writing system. The bundled catalog contains 5,044 measured Hipparcos/XHIP stars and all 88 constellation patterns. Search by proper name or Hipparcos number, click a star, write beside it, and connect two actual stars. A location/time panel changes the geometric sky reference; **Your sky now** returns to the current overhead sky. Default location is explicitly New Delhi until you choose another city or opt into location access. The selected location is stored on this device. There is no separate atlas/journal view or invented-star placement.
- **Whisperwood** — draw directly into a full-screen forest clearing with a mouse, touch, or local camera-based hand tracking. Pinch thumb + index to draw; release to move. Colors, brush sizes, undo, clear, and saved sketches remain available.
- **Moonwell** — writing and open water occupy separate layout regions. New lanterns travel toward the water. **Let it go** makes a saved lantern drift away before removing it; **Bring it back** recalls it during the departure. Reduced-motion users get a short, quieter transition. Collections page in groups of 24 on desktop or 12 on mobile, preserving access to all 100 supported thoughts without covering the composer.
- **Everbloom** — a full-background conservatory with free planting anywhere you click, nine realistic flower species, draggable positions, individual flower sizes, musical notes, tempo/playback, and moonlight/first-light lighting. Earlier eight- and twenty-four-patch gardens migrate automatically to foreground soil.
- **Postscript** — a garden letter atelier with a large clickable brass postbox and photographic pavilion in the scene. Three papers and inks, four writing styles (literary serif, locally bundled Caveat handwriting, Dancing Script, and typewriter), draggable/resizable/rotatable pressed flowers, wax seals, ribbons, stamps, and moon charms. Fold letters into a personal postbox and reopen or delete them. Deletion has an inline confirmation and also removes unshared photo keepsakes. The ethereal photo booth offers Moon silver, Rose haze, and Aurora mist themes, local camera capture or photo selection, four actual composition templates (strip, instant memories, herbarium, postcard), captions, and draggable/resizable/rotatable celestial and botanical stickers. The saved photo composition matches the preview and attaches to your letter. The postbox is private storage, not email delivery.
- **Stillroom** — one panoramic café/library room map with four clickable seating hotspots. Drag/pan the room on a phone or use the café/library side controls. Choose a spot to enter it, switch rain/sunlit/night atmosphere, add a study intention and desk notes, and choose a honeycomb, rose-glass, or moonstone candle, or a melting ice crystal. A foreground oak table supports the object and an open notebook for timer controls. All four rituals share pause/resume/reset and preserve the remaining time when switching style. The clock continues when you leave the island or browser tab and reconciles when you return. Background readers are illustrated company, not live users. Optional synthesized room sound is local. Island sounds, individual flower notes, the garden melody, and personal songs switch off the main ambient drone instead of playing over it.

**Aster**, a small celestial dragon spirit, welcomes Nancy to each island. Drag Aster with a mouse or touch, or focus the companion and use arrow keys to move. Click to chat, say hello, or start an optional stroll. Home resets the focused companion’s position. Drag positions persist on this device, adapt to viewport changes, and stay clear of the header and bottom navigation. Welcome messages close as you begin interacting. The navigation is styled as an engraved portal rail with orbiting accents.

No export or download controls. The personal record shelf accepts up to twelve audio files (40 MB each), plays/pauses/seeks/loops with volume control, and continues between islands. Songs, letters, and photo strips stay in IndexedDB on this device; other island writing stays in localStorage. Only explicitly selected music/photos are imported. Clearing site data removes saved content. Private browsing or storage limits may prevent persistence. Media is never uploaded.

## The real sky

Catalog data is bundled in `data/sky-catalog.json`, derived from d3-celestial's XHIP compilation and constellation data. Mean J2000 coordinates are precessed to the chosen date, projected onto a rotatable celestial hemisphere, and used for hit-testing. The Milky Way band follows the galactic equator. Sidereal time and observer latitude/longitude determine the overhead reference and above/below-horizon facts. Proper motion, atmospheric refraction, weather, daylight brightness, and solar-system bodies are not modeled. This is a real-coordinate star explorer, not a telescope photograph or precision observing tool.

Earlier invented-star journal entries remain under **Your saved thoughts → Earlier thoughts, kept safe**. Choose one and then a real star to attach it to; the earlier copy stays safe. Existing writing on a destination star is replaced only after confirmation. New notes and connections use stable Hipparcos IDs and save in `starwoven-real-sky-v1`; the old `starwoven-sky-v1` data remains intact.

## Visual direction

The redesign uses spacious, scene-first navigation, interaction at the edges, layered atmosphere, and progressive reveal. Bruno Simon’s [public portfolio source](https://github.com/brunosimon/folio-2019), including its world/reveal/control structure, was reviewed as an interaction reference. Live access to bruno-simon.com, neal.fun, and littleworkshop.fr was blocked by the setup environment’s network policy; no live-site inspection is claimed. Gardenletters was requested as a reference, but gardenletters.com was blocked by the environment’s network policy, so no live inspection is claimed. The atelier and study rooms are original implementations. Botanical specimens and landscape artwork are bundled locally, with reduced-motion fallbacks for animation.

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

`npm test` checks astronomy reference values, catalog integrity, projection/precession/horizon geometry, and hand gesture recognition. Browser tests exercise real-star selection and writing, legacy thought attachment, current-sky settings, star connections, Nancy’s carousel, Aster’s dragging/welcomes, free planting/resizing/dragging and migration, instrument/navigation separation, home copy layout, letter stationery/postbox persistence, photo templates/sticker composition, local photos/camera cleanup, letter deletion/font persistence, interactive map seats, melting-ice progress, room sound arbitration, personal song playback/persistence, candle timer/seat/notes persistence, lantern layout/release, and hand drawing/camera cleanup. The browser suite builds and starts a production server on port 3100. Desktop and phone workflows are included.

For the browser suite, first install Chromium with `npx playwright install chromium`, or point to an existing installation:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

Actual MediaPipe model/WASM initialization was also checked in Chromium with a simulated camera feed, including local-only asset requests and stream shutdown when leaving the grove. Physical-camera gesture accuracy depends on lighting and device performance and should be checked on your own device.

## Your writing and drawings

Stars, drawings, garden arrangements, lanterns, and study settings save in localStorage. Letters, photographs, and personal songs save in IndexedDB; a small localStorage recovery copy protects the latest letter draft during reloads. Storage is separate for each browser/device. Nothing syncs to a server. Clearing browser data removes saved content. Storage restrictions or quota limits can prevent persistence; scenes report save failures. There are no export/download controls. Only explicitly chosen music and photo files are imported, locally.

Main ambience is opt-in. Flower notes, the garden melody, room sounds, and personal music start from their controls and mute the main ambience. Pausing a local sound leaves the main ambience off. Synthesized audio and uploaded songs play locally. Caveat and Dancing Script are bundled for the writing styles; the rest of the page optionally loads Google Fonts with system fallbacks. See `THIRD_PARTY_NOTICES.md` for licenses.
