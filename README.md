# TeMPo prototype

Standalone copy of the Tenant Management Portal prototype (Vite + React + Tailwind + Runway tokens). Process v4 lives at `/process-v4` (Storybook DLS components, v3 kept to compare).

## Run as its own app

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173/process-v4

## Bring into another repo

**Option A — keep it as a folder inside the other repo** (fastest)

```bash
# from the other repo
unzip ~/tempo-prototype.zip
# or
cp -R ~/tempo-prototype ./tempo-prototype
cd tempo-prototype && npm install && npm run dev
```

**Option B — merge into an existing Vite + React app**

1. Copy `src/` into the other app (resolve name clashes).
2. Copy `public/docs/`, `public/favicon.svg`, and `public/icons.svg`.
3. Merge Runway tokens from `src/index.css` into the other app’s CSS.
4. Add the `@` alias (`@/*` → `src/*`) in Vite + tsconfig, matching `vite.config.ts` and `tsconfig.app.json`.
5. Install deps: `react-router-dom`, `lucide-react`, `clsx`, `tailwind-merge`, plus Tailwind 4 (`tailwindcss`, `@tailwindcss/vite`).
6. Mount the route:

```tsx
<Route path="process-v4" element={<ProcessV4Page />} />
```

Process nav currently points at `/process-v4` (`src/components/SideNav.tsx`). Wrap with `AppStateProvider` from `src/lib/app-state.tsx` if the shell is not copied.

## Process v4 core files

Playbook rebuilt with local Storybook-matched DLS (`src/dls/`), Runway tokens as fallback:

- `src/pages/ProcessV4.tsx`
- `src/dls/` (Button, Text, chips, Field/Dropdown, Tabs, Drawer, Alert, Badge)
- `src/components/DocumentPreviewDrawerV4.tsx`
- `src/lib/tenancy-data.ts`
- `src/lib/process-guide.ts`
- `src/lib/app-state.tsx`
- `src/index.css` (tokens)

v1–v3 stay at `/process`, `/process-v2`, `/process-v3` so you can compare.

## Notes

- Demo role switcher is in the side nav. Production would use the signed-in account.
- Document previews use PDFs under `public/docs/`.
- Cursor Runway rule: `.cursor/rules/runway-dls.mdc`.
