# TeMPo prototype

Standalone copy of the Tenant Management Portal prototype (Vite + React + Tailwind + Runway tokens). Latest Process guide: **`/process-v16`**.

## Run as its own app

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173/process-v16?phase=setup

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
<Route path="process-v3" element={<ProcessV3Page />} />
```

Process nav currently points at `/process-v3` (`src/components/SideNav.tsx`). Wrap with `AppStateProvider` from `src/lib/app-state.tsx` if the shell is not copied.

## Process v3 core files

If you only need the playbook page:

- `src/pages/ProcessV3.tsx`
- `src/lib/tenancy-data.ts`
- `src/lib/process-guide.ts`
- `src/lib/app-state.tsx`
- `src/lib/utils.ts`
- `src/components/DocumentPreviewDrawer.tsx`
- `src/index.css` (tokens)

v1 and v2 are included (`/process`, `/process-v2`) so you can still compare.

## Notes

- Demo role switcher is in the side nav. Production would use the signed-in account.
- Document previews use PDFs under `public/docs/`.
- Cursor Runway rule: `.cursor/rules/runway-dls.mdc`.
