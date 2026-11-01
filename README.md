# SoulsBorne TCG — Deck Builder

Deck Builder Web : https://souls-tcg-deck.pages.dev/

Web deck builder for SoulsBorne TCG: browse the card collection, build decks and share them with a link.

Vue 3 + Vite + Tailwind, fully static (no backend). Decks are saved in the browser's `localStorage` and shared as `?deck=<base64url JSON>` links, which the game can import.

## Development

Requires Node 24.22.1+.

```sh
npm install
npm run dev
```

```sh
npm run build        # type-check + production build to dist/
npm run lint
```

## Data

Card data and art (`public/data/`, `public/assets/`, `src/data/*.json`) are generated from the game's Unity project. Don't edit them by hand.

## Deployment

Hosted on Cloudflare Pages: build command `npm run build`, output directory `dist`. Headers live in `public/_headers`.
