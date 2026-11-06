# Starwoven

A personal constellation journal: place stars, write inside them, drag them around, and connect your thoughts. Built with Next.js, React, TypeScript, and CSS. Ambient audio is synthesized locally with Web Audio; no API keys or paid services are required.

## Develop

Use Node.js 20.9 or newer (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the development server in your browser. To validate a production build:

```sh
npm run build
npm start
```

`npm run typecheck` checks TypeScript independently. There is no automated test suite yet.

## Deploy on Vercel

Push this directory to your own GitHub repository, import it into Vercel, and choose the **Next.js** framework preset. Use the repository root as the root directory. The default build command (`npm run build`) and output settings work. No environment variables are needed. Vercel provides HTTPS, which also enables the browser's UUID API used for new stars.

## Using your sky

- Choose **Add a star**, then click an empty spot in the sky.
- Click a star to edit its title, writing, or color. Drag stars in Explore mode to reposition them.
- Choose **Connect**, then click two stars. Repeat a pair to remove its connection.
- Use the speaker button to enable ambient tones and star chimes. Sound starts only after user interaction.
- Rename the sky using its title above the canvas.
- **Export sky** downloads a JSON backup. **Import a sky** replaces the current sky after confirmation.

Writing stays in browser localStorage, not on a server. Different browsers/devices have separate skies. Clearing browser data removes saved writing. Export valuable writing regularly. Private browsing or storage restrictions may prevent persistence; the app shows a warning in that case. Imported files are validated before use. The page optionally loads fonts from Google Fonts and falls back to system fonts if unavailable. Reduced-motion preferences are respected.

