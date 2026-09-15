---
name: tempo-runway-atom-map
description: >-
  Inventory live TeMPo UI against TeMPo _Atoms/_Components and connected
  CAG/Runway libraries, then produce a tickable mapping checklist. Use when
  prepping this prototype so every in-scope control can be swapped onto
  library components, or when the user mentions atom map, Runway swap,
  _Atoms, FilterButton, Tooltip & Coachmark, or the TeMPo Components page.
  Do not restyle, change IA, copy, routes, or quiz.
---

# TeMPo ↔ Runway atom mapping

This pass is inventory + mapping + atom-spec only. Read [checklist.md](checklist.md) for the corrected in-scope table.

## Do not

- Restyle the app
- Change copy, routes, IA, or quiz logic
- Touch `/process-v16`–`/process-v23`
- Touch Works quiz product, Jira, or stakeholder video
- Map or restyle **Documents**, **Useful Links / Apps**, **Contacts**, or **Application Screener** pages (other designers own those modules)
- Invent `_Atoms/Tooltip` — use ➗ Components `Tooltip & Coachmark`
- Invent `_Atoms/FilterIconButton` — use TeMPo `_Atoms/FilterButton` (labelled)
- Invent `_Atoms/DocumentTextButton` — use `_Atoms/Process/LinkRow` + `_Atoms/JSIDetail`
- Flatten a `_Components/` into an atom
- Use Lucide / emoji / custom SVGs when 👻 Iconography has the glyph
- Use Material 3 or iOS/iPadOS kits as product UI (device chrome only: `_Atoms/iOS_StatusBar`, `_Atoms/Safari_iOS_Footer`)
- Invent tokens (no new hex, no new type sizes)
- Treat `#ff4333` as a match — use `Colors/Red Error/400` or `/500`
- Treat `Background overlay` (`621:913`) as the full overlay — it is only the dimmed scrim

## Sources of truth (in this order)

1. **TeMPo Designs — Components**
   https://www.figma.com/design/4BLwttsXSn0qbNt1i0L9AL/TeMPo-Designs?node-id=5-4
   fileKey `4BLwttsXSn0qbNt1i0L9AL` · node `5:4` (`🧩 Components`)
   Match `_Atoms/...` then `_Components/...` here first. That naming is what later AI/dev work must pick up.

2. **Libraries connected to that file** (`get_libraries` + `search_design_system` with `includeLibraryKeys`). Prefer team libraries.

   | Library | Use for |
   |---|---|
   | 🍎 Foundational Library | Type styles, colour styles / variables, spacing, radius, effects |
   | 👻 Iconography | All icons |
   | ⚙️ Runway Components | Published Runway / CAG components |
   | 🔵 Buttons | Button types, sizes, icon buttons, text buttons |
   | 📥 Inputs & Selections | Search, text field, select, checkbox, radio, chips-as-input |
   | 🍟 Chips (Playground) | Chip variants if Runway has no match |
   | ⬛️ Overlay (Playground) | Sheets, dialogs, dropdowns, tooltips — search first; ➗ Components may already publish the match |
   | 📃 Templates | Page / section templates only if a screen is a template |
   | ➗ Components | Shared CAG components not in Runway (e.g. `Tooltip & Coachmark`, `Modal`, `modal bottom sheet`, `Background overlay`) |

3. Repo / personal skill `cag-dls` and tokens in `src/index.css`. Tokens must stay Foundational / Runway names (`Colors/Purple Primary/600`, Lato, `radius-sm`, `shadow-light-bg`).

## How to match

For every visible control, row, chip, icon, text style, and surface in the **live** in-scope prototype:

1. Search TeMPo `_Atoms/` then `_Components/` on node `5:4`.
2. If none, search the connected libraries above.
3. If still none, specify a **new** TeMPo atom. Do not freehand it.

New components must be built the same way as TeMPo file atoms (`_Atoms/...` sets with variants).

Example — document text button:

- Type: Foundational text style (Body S / Body L / Bold as in the Figma atom)
- Icon: 👻 Iconography (`File` / `Link` / `External-Link`), not a custom SVG
- Colour: Foundational colour style (`Purple Primary/600` for interactive text, Grey scale for rest)
- States: Default / Hover / Focus / Disabled from Buttons or the closest Runway text-button
- **Name already in TeMPo:** `_Atoms/Process/LinkRow` and `_Atoms/JSIDetail` Type=Link | Type=Text — do not invent `_Atoms/DocumentTextButton`
- Variants: same Figma format (`Type=Link|Text`, `Format=Desktop|Mobile` when needed)

Code later maps 1:1:

- Figma `_Atoms/ToTopButton` → `src/components/atoms/ToTopButton.tsx` (or keep `src/components/Button/Button.tsx` and alias the Figma name)
- Figma `_Components/Process/StepCard` → molecule that **uses** atoms
- Never flatten a `_Components/` into an atom

## Live prototype scope

**In**

- Shell: `AppShell`, `SideNav`, header unit selector (on Process), demo role switcher, page title, ToTop. Nav may still show Documents / Useful Links / Contacts / Permit Screener — map those **rows only**, not their pages.
- `/login` `Login.tsx`
- `/home` `Dashboard.tsx`
- `/process` → `ProcessV24.tsx` (current guide): search, filter, Topics rail + mobile Topics, step cards, Your Steps, doc/system rows, banners, sheets that Process opens, chips

**Out** (do not inventory, map, or restyle)

- `/documents`, document detail
- `/apps` (Useful Links)
- `/contacts`
- `/screener`, `/screener/drafts`, `/screener/history`
- `/process-v16`–`/process-v23`
- Works quiz product changes (`showQuiz === false` on Process V24). PlannedWorks / OfficerConfirm / CheckRow sheets stay out unless explicitly re-opened.

## Existing code you must map, not ignore

`src/components/dls/*` (`SearchField`, `TextField`, `ActionButton`, `Chip`, `DocRow`, `SearchHitRow`, `StepCardShell`, `PhaseCard`, `ContextStrip`)
`src/components/Button/Button.tsx` (ToTop)
`src/components/AppShell.tsx`, `SideNav.tsx`
Inline UI in `ProcessV24.tsx` (`FindHitButton`, `Banner`, `FilterIconButton`, `PhaseTabs`, `WhenChip`, `DocFileRow`, `DlsTooltip`, etc.)

Each of these is a checklist row, not “already done”.

Do **not** map `Secondary.tsx` Documents/Apps/Contacts surfaces or `Screener.tsx` as product pages.

## Deliverable — one checklist

Use the table in [checklist.md](checklist.md). In chat is fine for a fresh inventory; only write a file if asked.

| # | Surface / page | Element (what the user sees) | Code today (file + component or “inline in X”) | Figma match (`_Atoms/...` or `_Components/...` + node id) | Library source (Foundational / Iconography / Buttons / Runway / TeMPo / ➗ Components / none) | Tokens used (type style, colour, icon name) | Status: Reuse · Wrap · New atom · No match | Notes |

Rules:

- One row per distinct element, not per occurrence. Say where it repeats.
- Group by surface: **Shell, Login, Home, Process** only.
- Process must be complete: search field, search overlay rows, filter button, Topics rail, mobile Topics, card closed, card open, Your Steps text, document text button / file row, system row, chips, banner, ToTop, empty search, result titles.
- If an element is already a library instance in Figma, Status = **Reuse** and name the exact component + variant.
- If code exists but is not the library component, Status = **Wrap** (keep API, restyle to the atom later).
- If Figma has no atom and libraries have parts only, Status = **New atom** and propose `_Atoms/Name` plus Foundational type + Iconography icon + colour.
- If nothing exists, Status = **No match** and still propose the `_Atoms/` name and the three foundations.
- Do not mark “close enough”. Purple hex without a Foundational colour style is not a match.

## Method

1. Figma MCP: `get_metadata` on `5:4`, then `get_design_context` / `get_screenshot` on each atom you map. `search_design_system` scoped with `includeLibraryKeys` from `get_libraries` on `4BLwttsXSn0qbNt1i0L9AL`.
2. Walk the live app in the browser (`/login`, `/home`, `/process` → V24) including empty / open / filter / search-results states. Do not walk Documents, Apps, Contacts, or Screener.
3. Produce the checklist first. **Stop and wait** for ticks / corrections before writing new components or restyling pages.

## Locked corrections (do not re-open)

1. **Tooltip** — ➗ Components `Tooltip & Coachmark` Type=Tooltip (file `3su4ZawztoMfpioxXkgZP8`, set `199:16201`, Light Top Center `199:16222`). Wrap `DlsTooltip` / `WhenTip`. Prefer Mode=Light on Grey/50. Coach Mark is a different type. No `_Atoms/Tooltip`.
2. **Filter** — TeMPo `_Atoms/FilterButton` Format=Desktop `136:8273` (103×44, Filter-Off + word “Filter”) / Format=Mobile `152:23368`. Wrap `FilterIconButton` onto that labelled control. No icon-only variant. No `_Atoms/FilterIconButton`.
3. **Background overlay** `621:913` — scrim only (`#121212` 60% + `backdrop-blur-md`). Not the modal/sheet panel. Ignore as a stand-in for “overlay chrome”.
4. **Modules out** — Documents, Apps, Contacts, Application Screener (pages and their new atoms).
5. **Document text button** — `_Atoms/Process/LinkRow` `1261:65427` + `_Atoms/JSIDetail` Type=Link `138:5351` / Type=Text `152:11758`.

## New atoms still allowed (only these)

Compose from Foundational type + Iconography + colour. Same variant syntax as TeMPo sets.

| Name | Built from | Variants |
|---|---|---|
| `_Atoms/SearchField` | `Input Fields` + `Search` or `Sparkles` | `Type=Guides\|Assistant`, `Format=Desktop\|Mobile` |
| `_Atoms/SearchHitRow` | Body S Bold + icon + `Grey/500` hint | `Type=Ask\|File\|System\|Step` |
| `_Atoms/SearchSuggestRow` | Body S + selected Purple/100 | — |
| `_Atoms/ContextChip` | Small Bold + `Grey/200` + `Grey/700` | `Type=Neutral\|Who` |
| `_Atoms/Process/WhenChip` | Small Bold + `Colors/Blue/600` + `Blue/100` | — |
| `_Atoms/FindLane` | Body L / H6 + count Small + white surface | — |
| `_Atoms/PasswordToggle` | Icon button + `Eye` / `Eye-Hide` | `State=Hidden\|Shown` |
| `_Atoms/PhaseCard` | Subheading + Body S + `radius-2xl` | `Format=Desktop\|Mobile` |
| `_Atoms/DemoRoleMenu` | Overlay / Dropdown list + All Caps | prototype only |
| `_Atoms/AuthCard` | White + `radius-2xl` + `shadow-light-bg` | — |
| `_Atoms/OrDivider` | `Grey/100` + Body S `Grey/400` | — |
| `_Atoms/WorksPromo` | H6 + Body S + text link | — |
| `_Atoms/ContextStrip` | only if `_Atoms/Detail` is not the Home band | — |
| `_Atoms/AssistantPanel` | only if ➗ Modal does not fit | — |
| `_Atoms/DocListCard` | Home document lists | — |

**Do not create:** `_Atoms/Tooltip`, `_Atoms/FilterIconButton`, `_Atoms/DocumentTextButton`, `_Atoms/PdfFrame`, `_Atoms/ContactRow`, `_Atoms/Screener/PageTabs`, `_Atoms/Sheet` until ➗ `Modal` / `modal bottom sheet` are ruled out.

## Iconography replacements (in-scope code)

| Today | Use |
|---|---|
| Lucide `Menu` / `X` | `Menu-Hamburger` / `Close` |
| Lucide `Eye` / `EyeOff` | `Eye` / `Eye-Hide` |
| Lucide `FileText` / `Search` / `Sparkles` / `ArrowRight` | `File` / `Search` / `Sparkles` / `Caret-Right` |
| Custom `SearchGlyph` | `Icons/Black/Search` |
| Process local SVGs (`file`, `filter-off`, `arrow-top`, `link`, `write-forms`, `info`) | `File`, `Filter-Off`, `Arrow-Top`, `Link`, `Write-Forms`, `Information` |
| Filter pip `#ff4333` | `Colors/Red Error/400` or `/500` |

## After the checklist

Stop. Wait for ticks. Do not write components or restyle pages until asked.
