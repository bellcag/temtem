# Process v4 pack

Paste this file into a new chat. Work only from this pack and `/process-v4`.

## Open this, only this

- URL: `http://127.0.0.1:5173/process-v4`
- Repo: `github.com/bellcag/temtem`
- Branch: `cursor/contractor-pass-43b8`
- Base for this pass: `cursor/journey-card-prototype`
- Run: `npm run dev` then open `/process-v4`

Vite must bind IPv4 `0.0.0.0:5173` (`vite.config.ts` + `package.json` `dev` script). `vite --host` alone can listen on IPv6 `:::5173` and Cursor preview then shows `ERR_CONNECTION_REFUSED` on `127.0.0.1`.

In a Cloud Agent, desktop Simple Browser `127.0.0.1` is the laptop, not the VM. Use the agent **Ports** preview for `5173`.

## Hard rules

- Latest version only. Do not open `/process`, `/process-v2`, `/process-v3`, or any previous-version control.
- Do not review the whole file. Edit the latest screens and the path files named below.
- Tenant path is done. Do not touch `src/lib/tenant-path.ts` or `src/components/TenantStepCard.tsx` unless the user asks.
- Do not invent process facts, fees, or rules.
- If a merge is unclear, skip it and list it. Then stop.
- Documents / templates / guides / system links sit on the step they belong to. If a URL is missing, still show `Open {system}` or `Download {form}`.

## What this prototype is

One route. Role switcher: Tenant / Contractor / Officer.

- Tenant: condensed 20-step path. Title: **Follow your renovation**.
- Contractor: condensed 21-step workbench. Title: **Your permit workbench**.
- Officer: still the uncondensed Excel cards. Not started.

Contractor critical path: access → pick work type → fill only the permits that apply → one PTW submit → inspect / hoard / work → as-builts / defects → reinstatement PTW.

They should not see tenant QSM, WebEpic, sales, or servicing.

## Files to use

| File | Role |
|---|---|
| `src/pages/ProcessV4.tsx` | Latest page. `tenantMode` / `contractorMode`. Do not rewrite the whole file. |
| `src/lib/tenant-path.ts` | Tenant 20-step path. Done. Do not touch. |
| `src/components/TenantStepCard.tsx` | Tenant card. Done. Do not touch. |
| `src/lib/contractor-path.ts` | Contractor 21-step path. |
| `src/components/ContractorStepCard.tsx` | Contractor card. |
| `src/lib/journey-cards.ts` | Types, `isMyCard`, `cardVisible`. |
| `src/lib/journey-cards.json` | Source facts. Do not scroll the whole file. Look up a step number only. |
| `src/lib/journey-voice.ts` | You-voice helpers. |
| `src/App.tsx` | Route `/process-v4`. |
| `vite.config.ts` | `host: "0.0.0.0"`, `port: 5173`, `strictPort: true`. |

Card shape (tenant and contractor):

`id`, `phase`, `stage`, `title`, `when`, `what`, `how`, `needs[]`, `links[{label}]`, `done`, `wait?`, `onlyIf[]`, `rules[]`, `source[]`

## Tenant path (done — 20 steps)

Do not edit unless asked.

1. Approve contractor unit access — `[6]`
2. Register staff for QSM training — `[7]`
3. Apply for your WebEpic account — `[9]`
4. Attend kick-off: present your plan and measure the unit — `[28, 32]`
5. Submit your design pack — `[49, 50, 51, 52, 53, 54]`
6. Submit a sample board — `[58]`
7. Revise the design — `[61]`
8. Wait while permits are applied and endorsed — wait
9. Walk the unit with IFM and sign handover — `[99, 102]`
10. Submit the fire safety certificate or TFP — `[128]`
11. Submit opening files in OneCalendar — `[140, 141]`
12. Submit the Certificate of Fitness — `[142]`
13. Send the renovation invoice — `[148]`
14. Fix outstanding defects — `[151]`
15. Submit this period's servicing reports — `[153–165]`
16. Complete fire safety training — `[167]`
17. Submit monthly sales — `[171]`
18. Fix reinstatement defects if found — `[200]`
19. Hand back the unit — `[202]`
20. Settle utility charges — `[207]`

## Contractor path (done — 21 steps)

1. Get OneCalendar access — `[2, 3, 5, 44]` (ACSS if loading-bay)
2. Wait for the tenant to approve unit access — wait
3. Start the Tenancy Project in OneCalendar — `[65, 66]` (airport-risk line from 64)
4. Fill the permits that apply, then submit as 1 Permit To Work — `[67, 68, 72–80, 81]`
5. Book a joint site inspection with BMC — `[69]`
6. Identify fire isolation on site with BMC — `[70]`
7. Email the Qualified Person letter of undertaking — `[82]`
8. Revise and resubmit if CAG asks — `[87, 90, 93]`
9. Submit permissions that sit outside OneCalendar — `[96]`
10. Engage a Qualified Person or Professional Engineer — `[83]`
11. Get airport passes for the work team — `[105]`
12. Install hoarding — `[106]`
13. Request temporary power — `[107]`
14. Submit the FSSD Notice of Approval — `[109]`
15. Do the renovation works — `[110]`
16. Submit the aircon balancing test report — `[122]`
17. Upload as-built drawings — `[126]`
18. Rectify defects — `[127]`
19. Submit the reinstatement Permit to Work — `[186]`
20. Install hoarding before reinstatement works — `[195]`
21. Do the reinstatement works — `[196]`

Merged: `2+3+5`, `65+66`, `67+68+72–80+81`, `87+90+93`. Wait after access.

## Skipped merges (leave unless the user decides)

- `69 + 70` — only merge if booking and the site walk are one appointment
- `106 + 107` — only if hoarding and temporary power happen at mobilisation

## Not started

- Officer condensed path
- Real URLs for T1/T3 JSI booking (buttons exist: Open T1 booking, Open T3 booking)
- Real OneCalendar / ACSS URLs (buttons say Open {system})

## Starter prompt for the next chat

```
This URL is the latest prototype. Do not open previous versions. Work only on what this link shows.

http://127.0.0.1:5173/process-v4

Use PROCESS-V4-PACK.md as the handoff. Branch: cursor/contractor-pass-43b8.

The tenant path is already updated. Do not touch tenants. Do not review the whole file. Do not open previous versions.

[Say what to do next. Officer only / contractor tweak / copy / etc.]
```
