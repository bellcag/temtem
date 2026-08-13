# Temtem Dex

A small, modern web app for browsing a collection of Temtem-style creatures. Search
by name, filter by type, and favorite the ones you want on your squad (favorites
persist in `localStorage`).

Built with [Vite](https://vite.dev), [React](https://react.dev), and TypeScript.

## Prerequisites

- Node.js 20+ (developed on Node 22)
- npm 10+

## Getting started

```bash
npm ci        # install dependencies (uses the committed lockfile)
npm run dev   # start the dev server on http://localhost:5173
```

## Scripts

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Start the Vite dev server (host `0.0.0.0:5173`). |
| `npm run build`   | Type-check and build the production bundle.       |
| `npm run preview` | Preview the production build on port `4173`.      |
| `npm run lint`    | Run ESLint over the project.                      |

## Project structure

```
src/
  data/temtem.ts        # creature data + type colors
  components/TemCard.tsx # single creature card
  App.tsx               # search / filter / favorites UI
  index.css, App.css    # styling
```

## Cloud Agent environment

`.cursor/environment.json` configures the Cursor Cloud Agent environment: `npm ci`
installs dependencies and a `dev` terminal runs `npm run dev` so the app is available
on port `5173`.
