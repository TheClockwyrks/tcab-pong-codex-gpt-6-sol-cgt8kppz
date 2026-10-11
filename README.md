# Carom

Carom is a top-down paddle duel for the browser. Curve the ball by moving your paddle at impact, then use two fixed obstacles to turn rallies into bank shots. Play against an AI opponent or share a keyboard with a friend. The first player to reach 11 points with a two-point lead wins.

## Run locally

```sh
npm ci
npm run dev
```

Open the URL Vite prints. To create the standalone static site, run `npm run build` and serve `dist/` from the root of any static file server. `npm run preview` serves that production build locally.

## Controls

| Action | Keys |
| --- | --- |
| Left paddle | W / S |
| Right paddle in Versus | Up / Down arrows |
| Paddle in Solo | W / S or Up / Down arrows |
| Select menu item | Enter or Space |
| Pause or resume | P or Escape |
| Mute | M |

Use W / S or the arrow keys to move through menus. Mouse and touch can select menu items. On touchscreens, the engine shows on-screen controls. Press the backtick key to view the debug overlay.

## Development

The game is written in TypeScript on the Simple 2D engine. `npm run typecheck`, `npm run lint`, `npm run format`, and `npm test` run the repository checks. The debug API is returned from the engine's `debug` property and documented in `specs/instrumentation.md`.
