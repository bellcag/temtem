# Process v16 pack

Paste this file into a new chat. Work only from this pack and `/process-v16`.

## Open this, only this

- URL: `http://127.0.0.1:5173/process-v16?phase=setup`
- Repo: `github.com/bellcag/temtem`
- Branch: `cursor/process-v16-setup-7ab4`
- Base for this pass: `cursor/contractor-pass-43b8` (Process v4)
- Run: `npm run dev` then open `/process-v16?phase=setup`

Vite must bind IPv4 `0.0.0.0:5173` (`vite.config.ts` + `package.json` `dev` script).

In a Cloud Agent, desktop Simple Browser `127.0.0.1` is the laptop, not the VM. Use the agent **Ports** preview for `5173`.

## Hard rules

- Latest version only. Do not open `/process`, `/process-v2`, `/process-v3`, `/process-v4`, or any previous-version control.
- Do not review the whole file. Edit the latest screens and the path files named below.
- Do not invent process facts, fees, or rules.
- If a merge is unclear, skip it and list it. Then stop.
- Documents / templates / guides / system links sit on the step they belong to. If a URL is missing, still show `Open {system}` or `Download {form}`.

## What changed in v16 (Setup pass)

- New route `/process-v16` — nav and dashboard point here.
- `?phase=` stays in the URL when you switch phases (shareable Setup link).
- Condensed Setup rail uses phase-local numbers (1…N in Get set up), not Excel numbers.
- Cards show **N of M in Get set up** plus path step.
- Continue names the next step.
- Removed the **Guide only** chip.

## What this prototype is

One route. Role switcher: Tenant / Contractor / Officer.

- Tenant: condensed 20-step path. Title: **Follow your renovation**. Setup = 8 steps.
- Contractor: condensed 21-step workbench. Title: **Your permit workbench**. Setup = early access → permits block.
- Officer: still the uncondensed Excel cards. Not started.

## Files to use

| File | Role |
|---|---|
| `src/pages/ProcessV16.tsx` | Latest page. |
| `src/lib/tenant-path.ts` | Tenant 20-step path. |
| `src/components/TenantStepCard.tsx` | Tenant card. |
| `src/lib/contractor-path.ts` | Contractor 21-step path. |
| `src/components/ContractorStepCard.tsx` | Contractor card. |
| `src/lib/journey-cards.ts` / `.json` | Source facts. Look up a step number only. |
| `src/lib/journey-voice.ts` | You-voice helpers. |
| `src/App.tsx` | Route `/process-v16`. |

## Not started

- Officer condensed path
- Real OneCalendar / ACSS / JSI booking URLs
- Skipped merges `69+70`, `106+107` (leave unless the user decides)

## Starter prompt for the next chat

```
This URL is the latest prototype. Do not open previous versions. Work only on what this link shows.

http://127.0.0.1:5173/process-v16?phase=setup

Use PROCESS-V16-PACK.md as the handoff. Branch: cursor/process-v16-setup-7ab4.

Do not review the whole file. Do not open previous versions.

[Say what to do next.]
```
